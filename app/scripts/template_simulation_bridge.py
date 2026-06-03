#!/usr/bin/env python3
import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import pika
import requests
import urllib3


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ROOT = Path(__file__).resolve().parents[1]
PYTHON_CLIENT_DIR = ROOT / "python-client"
TEMPLATE_MODEL = PYTHON_CLIENT_DIR / "templates" / "model.ssp"
TEMPLATE_SCRIPT = PYTHON_CLIENT_DIR / "templates" / "test.scl"
STATE_FILE = Path(os.environ.get("DDTLAB_TEMPLATE_SIM_STATE", "/tmp/ddtlab_template_simulation_jobs.json"))

LAUNCH_QUEUE_NAME = "launch_requests"
JOB_STATUS_EXCHANGE = "job_status_exchange"
TIME_FORMAT = "%d/%m/%Y %H:%M:%S.%f"
MAX_PRIORITY = 10
TERMINAL_STATUSES = {"SUCCESS", "ERROR", "TERMINATED"}

PRODUCT_NAME = "Simantics SSP Studio"
PRODUCT_VERSION = "0.0.7"


def main():
    parser = argparse.ArgumentParser(description="Launch and inspect the fixed python-client template simulation.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("launch")

    status_parser = subparsers.add_parser("status")
    status_parser.add_argument("--job-id", required=True)
    status_parser.add_argument("--series-id", action="append", default=[])

    args = parser.parse_args()

    try:
        if args.command == "launch":
            emit(launch_template_job())
        elif args.command == "status":
            emit(read_template_job(args.job_id, args.series_id))
    except Exception as exc:
        emit({"ok": False, "message": str(exc)}, status=1)


def launch_template_job():
    require_file(TEMPLATE_MODEL)
    require_file(TEMPLATE_SCRIPT)

    job_id = "RUN-" + str(uuid.uuid4())
    script = TEMPLATE_SCRIPT.read_text(encoding="utf-8")
    model_id = upload_model(TEMPLATE_MODEL)
    model_url = f"{file_service_base_url()}/pull/resource/{model_id}.zip"
    creation_time = get_time_now()

    job = {
        "uuid": job_id,
        "user": os.environ.get("TEMPLATE_SIM_USER", "user1"),
        "model_url": model_url,
        "script": script,
        "product_name": parse_product_name(PRODUCT_NAME),
        "product_version": PRODUCT_VERSION,
        "run_info_json": {
            "runInfo": {
                "productName": PRODUCT_NAME,
                "productVersion": PRODUCT_VERSION,
                "username": os.environ.get("TEMPLATE_SIM_RUN_USERNAME", "meklund"),
            },
            "testDescription": [],
        },
        "deployed_by": "ddtlab_design_stage_template_run",
        "time": creation_time,
    }

    connection = create_rabbitmq_connection()
    try:
        channel = connection.channel()
        set_status(
            channel,
            create_status_message(
                uuid=job_id,
                deployed_by=job["deployed_by"],
                launcher_id="<pending>",
                status="PENDING",
                creation_time=creation_time,
                msg="Template simulation submitted from DDTLab design stage.",
            ),
        )
        publish_launch_job(channel, job)
    finally:
        connection.close()

    record = {
        "ok": True,
        "jobId": job_id,
        "status": "PENDING",
        "launcherStatus": "PENDING",
        "message": "Template simulation submitted.",
        "modelId": model_id,
        "modelUrl": model_url,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "files": [],
        "hdf5Files": [],
        "variables": [],
        "simpleVariables": [],
        "series": [],
    }
    update_job_record(job_id, record)
    return record


def read_template_job(job_id, requested_series_ids=None):
    drain_status_history()
    state = load_state()
    record = state.get(job_id, {
        "ok": True,
        "jobId": job_id,
        "status": "UNKNOWN",
        "message": "No local status has been observed for this job yet.",
        "files": [],
        "hdf5Files": [],
        "variables": [],
        "simpleVariables": [],
        "series": [],
    })

    result_info = read_result_info(job_id, requested_series_ids=requested_series_ids or None)
    record.update(result_info)
    record["ok"] = True
    record["jobId"] = job_id
    record["updatedAt"] = datetime.now(timezone.utc).isoformat()

    if record.get("status") not in TERMINAL_STATUSES and has_result_payload(result_info):
        record["status"] = "RESULTS_AVAILABLE"
        record["message"] = record.get("message") or "Result files are available."
    elif record.get("status") == "RESULTS_AVAILABLE" and not has_result_payload(result_info):
        record["status"] = record.get("launcherStatus") or "UNKNOWN"

    update_job_record(job_id, record)
    return record


def upload_model(path):
    response = requests.put(
        f"{file_service_base_url()}/push/resource",
        data=path.read_bytes(),
        auth=file_service_auth(),
        verify=False,
        timeout=60,
        headers={"Content-Type": "application/zip"},
    )
    response.raise_for_status()
    return response.text.strip().strip('"')


def publish_launch_job(channel, job):
    channel.queue_declare(
        queue=LAUNCH_QUEUE_NAME,
        durable=True,
        arguments={"x-max-priority": MAX_PRIORITY},
    )
    channel.basic_publish(
        exchange="",
        routing_key=LAUNCH_QUEUE_NAME,
        body=json.dumps(job),
        properties=pika.BasicProperties(delivery_mode=2, priority=1),
    )


def drain_status_history():
    connection = create_rabbitmq_connection()
    try:
        channel = connection.channel()
        queue_name = history_queue_name()
        channel.queue_declare(
            queue=queue_name,
            durable=True,
            arguments={"x-max-length": 5000},
        )

        messages_to_restore = []
        while True:
            method_frame, _header_frame, body = channel.basic_get(queue=queue_name, auto_ack=False)
            if not method_frame:
                break
            messages_to_restore.append(body)
            try:
                message = json.loads(body)
            except json.JSONDecodeError:
                pass
            else:
                apply_status_message(message)
            channel.basic_ack(delivery_tag=method_frame.delivery_tag)

        for body in messages_to_restore:
            channel.basic_publish(
                exchange="",
                routing_key=queue_name,
                body=body,
                properties=pika.BasicProperties(delivery_mode=2),
            )
    finally:
        connection.close()


def apply_status_message(message):
    job_id = message.get("uuid")
    if not job_id:
        return

    state = load_state()
    existing = state.get(job_id, {})
    if existing.get("time") and message.get("time"):
        if message["time"] <= existing["time"]:
            return

    record = {
        **existing,
        "ok": True,
        "jobId": job_id,
        "status": message.get("status") or existing.get("status") or "UNKNOWN",
        "launcherStatus": message.get("status") or existing.get("launcherStatus") or "UNKNOWN",
        "message": message.get("msg") or existing.get("message") or "",
        "time": message.get("time"),
        "creationTime": message.get("creationTime") or existing.get("creationTime"),
        "deployedBy": message.get("deployed_by") or existing.get("deployedBy"),
        "acceptedBy": message.get("accepted_by") or existing.get("acceptedBy"),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    update_job_record(job_id, record)


def read_result_info(job_id, requested_series_ids=None):
    files = list_result_files(job_id)
    hdf5_files = [file for file in files if file.lower().endswith((".hdf5", ".h5"))]
    candidates = unique(hdf5_files + ["result.hdf5", "results.hdf5"])

    variables_by_file = {}
    for filename in candidates:
        variables = read_variable_names(job_id, filename)
        if variables:
            variables_by_file[filename] = variables

    primary_hdf5 = next(iter(variables_by_file), hdf5_files[0] if hdf5_files else "")
    primary_variables = variables_by_file.get(primary_hdf5, [])
    simple_variables = read_simple_variable_metadata(job_id, primary_hdf5) if primary_hdf5 else []
    series_ids = requested_series_ids or select_template_series(simple_variables)
    series = read_timeseries_sample(job_id, series_ids) if simple_variables and series_ids else []

    return {
        "files": files,
        "hdf5Files": hdf5_files,
        "resultFile": primary_hdf5,
        "variables": primary_variables,
        "simpleVariables": simple_variables,
        "variablesByFile": variables_by_file,
        "series": series,
    }


def has_result_payload(result_info):
    files = result_info.get("files") or []
    output_files = [file for file in files if Path(str(file)).name.lower() != "run-info.json"]
    return bool(result_info.get("hdf5Files") or result_info.get("variables") or output_files)


def list_result_files(job_id):
    response = requests.get(
        f"{file_service_base_url()}/listfiles/result/{quote(job_id, safe='')}",
        auth=file_service_auth(),
        verify=False,
        timeout=15,
    )
    if response.status_code in (400, 404):
        return []
    response.raise_for_status()
    return normalize_string_list(read_response_value(response))


def read_variable_names(job_id, filename):
    if not filename:
        return []
    response = requests.get(
        f"{timeseries_service_base_url()}/pull/timeseries/variablenames/{quote(job_id, safe='')}/{quote(filename, safe='')}",
        auth=file_service_auth(),
        verify=False,
        timeout=20,
    )
    if response.status_code in (400, 404):
        return []
    response.raise_for_status()
    return normalize_string_list(read_response_value(response))


def read_simple_variable_metadata(job_id, filename):
    response = requests.get(
        f"{timeseries_service_base_url()}/pull/simple/timeseries/variablenames/{quote(job_id, safe='')}/{quote(filename, safe='')}",
        auth=file_service_auth(),
        verify=False,
        timeout=20,
    )
    if response.status_code in (400, 404):
        return []
    response.raise_for_status()
    value = read_response_value(response)
    if not isinstance(value, dict) or not isinstance(value.get("variables"), list):
        return []
    return [item for item in value["variables"] if isinstance(item, dict) and item.get("id")]


def select_template_series(simple_variables):
    preferred_suffixes = (
        "Codes_MotorWithFlexibleShaft2_FMU.w",
        "Codes_MotorWithFlexibleShaft2_FMU.tau",
        "Codes_Load2_FMU.w",
        "Codes_Drivetrain2_FMU.w_out",
        "Codes_Drivetrain2_FMU.tau_out",
    )
    selected = []
    seen = set()

    for suffix in preferred_suffixes:
        for variable in simple_variables:
            name = str(variable.get("name") or "")
            variable_id = variable.get("id")
            if variable_id and name.endswith(suffix) and variable_id not in seen:
                selected.append(str(variable_id))
                seen.add(variable_id)
                break

    if len(selected) < 3:
        for variable in simple_variables:
            name = str(variable.get("name") or "")
            variable_id = variable.get("id")
            if not variable_id or variable_id in seen:
                continue
            if name.endswith((".w", ".tau", ".w_out", ".tau_out")):
                selected.append(str(variable_id))
                seen.add(variable_id)
            if len(selected) >= 3:
                break

    return selected[:3]


def read_timeseries_sample(job_id, variable_ids):
    if not variable_ids:
        return []
    response = requests.post(
        f"{timeseries_service_base_url()}/pull/simple/timeseries/data/{quote(job_id, safe='')}/0/3/40",
        auth=file_service_auth(),
        verify=False,
        timeout=20,
        json={"variables": variable_ids},
    )
    if response.status_code in (400, 404, 405):
        return []
    response.raise_for_status()
    value = read_response_value(response)
    if not isinstance(value, dict) or not isinstance(value.get("variables"), list):
        return []
    return [summarize_series(item) for item in value["variables"] if isinstance(item, dict)]


def summarize_series(item):
    values = [float(value) for value in item.get("value", []) if isinstance(value, (int, float))]
    times = [float(value) for value in item.get("t", []) if isinstance(value, (int, float))]
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "type": item.get("type"),
        "t": times,
        "value": values,
        "first": values[0] if values else None,
        "last": values[-1] if values else None,
        "min": min(values) if values else None,
        "max": max(values) if values else None,
    }


def read_response_value(response):
    text = response.text.strip()
    if not text:
        return []
    try:
        return response.json()
    except ValueError:
        return text


def normalize_string_list(value):
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, dict):
        for key in ("files", "items", "variables", "names", "data"):
            if isinstance(value.get(key), list):
                return [str(item) for item in value[key]]
        nested_values = []
        for nested in value.values():
            if isinstance(nested, dict) and isinstance(nested.get("variables"), list):
                nested_values.extend(str(item) for item in nested["variables"])
        if nested_values:
            return nested_values
        return [json.dumps(value)]
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return []
        try:
            parsed = json.loads(stripped)
            if parsed is not value:
                return normalize_string_list(parsed)
        except ValueError:
            pass
        return [line.strip().strip('"') for line in stripped.splitlines() if line.strip()]
    return []


def set_status(channel, message):
    publish_to_history(channel, message)
    channel.exchange_declare(exchange=JOB_STATUS_EXCHANGE, exchange_type="fanout", durable=True)
    channel.basic_publish(
        exchange=JOB_STATUS_EXCHANGE,
        routing_key="",
        body=message,
        properties=pika.BasicProperties(delivery_mode=2),
    )


def publish_to_history(channel, message):
    queue_name = history_queue_name()
    channel.queue_declare(queue=queue_name, durable=True, arguments={"x-max-length": 5000})
    channel.basic_publish(
        exchange="",
        routing_key=queue_name,
        body=message,
        properties=pika.BasicProperties(delivery_mode=2),
    )


def create_status_message(uuid, deployed_by, launcher_id, status, creation_time, msg=""):
    return json.dumps({
        "creationTime": creation_time,
        "uuid": uuid,
        "time": get_time_now(),
        "status": status,
        "deployed_by": deployed_by,
        "accepted_by": launcher_id,
        "msg": msg,
    })


def create_rabbitmq_connection():
    return pika.BlockingConnection(pika.ConnectionParameters(
        host=os.environ.get("RABBITMQ_DEFAULT_HOST", "localhost"),
        port=int(os.environ.get("RABBITMQ_DEFAULT_PORT", "5672")),
        credentials=pika.PlainCredentials(
            os.environ.get("RABBITMQ_DEFAULT_USER", "myuser"),
            os.environ.get("RABBITMQ_DEFAULT_PASS", "mypassword"),
        ),
    ))


def file_service_base_url():
    return os.environ.get("TEMPLATE_SIM_FILE_SERVICE_URL", "https://localhost:5000").rstrip("/")


def timeseries_service_base_url():
    return os.environ.get("TEMPLATE_SIM_TIMESERIES_URL", "https://localhost:5002").rstrip("/")


def file_service_auth():
    return (
        os.environ.get("TEMPLATE_SIM_FILE_SERVICE_USER", "cloud"),
        os.environ.get("TEMPLATE_SIM_FILE_SERVICE_PASSWORD", "My4360006"),
    )


def history_queue_name():
    return f"job_status_history-{int(os.environ.get('TS3_LAUNCHER_STATUS_HISTORY_QUEUE_COUNT', '1'))}"


def parse_product_name(product_name):
    return product_name.replace(" ", "-").lower()


def get_time_now():
    return datetime.now(timezone.utc).strftime(TIME_FORMAT)


def require_file(path):
    if not path.exists():
        raise FileNotFoundError(f"Required template file was not found: {path}")


def load_state():
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")


def update_job_record(job_id, record):
    state = load_state()
    state[job_id] = {**state.get(job_id, {}), **record}
    save_state(state)


def unique(values):
    result = []
    seen = set()
    for value in values:
        if value and value not in seen:
            result.append(value)
            seen.add(value)
    return result


def emit(payload, status=0):
    sys.stdout.write(json.dumps(payload))
    sys.stdout.write("\n")
    raise SystemExit(status)


if __name__ == "__main__":
    main()
