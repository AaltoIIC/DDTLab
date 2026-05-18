#!/usr/bin/env python3
import json
import math
import re
import sys

import numpy as np
import opentorsion as ot


ROTARY_KEYWORDS = ("motor", "shaft", "propeller", "engine", "gearbox", "generator", "turbine")


def main():
    payload = json.load(sys.stdin)
    nodes = payload.get("nodes") or []
    rotary_nodes = [node for node in nodes if is_rotary(node)]
    rotary_nodes.sort(key=lambda node: float((node.get("position") or {}).get("x") or 0))

    warnings = []
    if len(rotary_nodes) < 2:
        warnings.append("Fewer than two rotary components were found; using a built-in three-mass demo model.")
        rotary_nodes = demo_nodes()

    disks = []
    for index, node in enumerate(rotary_nodes):
        inertia = infer_inertia(node)
        damping = infer_damping(node)
        disks.append(ot.Disk(index, I=inertia, c=damping))

    shafts = []
    shaft_summaries = []
    for index in range(len(rotary_nodes) - 1):
        stiffness = infer_stiffness(rotary_nodes[index], rotary_nodes[index + 1])
        damping = infer_shaft_damping(rotary_nodes[index], rotary_nodes[index + 1])
        shafts.append(ot.Shaft(index, index + 1, L=None, odl=None, k=stiffness, c=damping))
        shaft_summaries.append(
            {
                "from": node_name(rotary_nodes[index]),
                "to": node_name(rotary_nodes[index + 1]),
                "stiffness_nm_per_rad": stiffness,
                "damping_nms_per_rad": damping,
            }
        )

    assembly = ot.Assembly(shaft_elements=shafts, disk_elements=disks)
    eigenvalues, _vectors = assembly.undamped_modal_analysis()

    frequencies_hz = []
    for eigenvalue in sorted(np.real(eigenvalues)):
        freq = math.sqrt(abs(float(eigenvalue))) / (2 * math.pi)
        if freq < 1e-3:
            continue
        if any(abs(freq - existing) < 1e-3 for existing in frequencies_hz):
            continue
        frequencies_hz.append(freq)

    frequencies_hz = frequencies_hz[:6]
    critical_speeds_rpm = [freq * 60 for freq in frequencies_hz]

    result = {
        "ok": True,
        "engine": "OpenTorsion",
        "summary": f"Computed {len(frequencies_hz)} torsional modes for {len(rotary_nodes)} rotary components.",
        "model": {
            "component_count": len(rotary_nodes),
            "shaft_count": len(shafts),
            "shafts": shaft_summaries,
            "components": [
                {
                    "id": node.get("id"),
                    "name": node_name(node),
                    "fmu_id": node.get("fmuId"),
                    "fmu_name": node.get("fmuName"),
                    "oem": node.get("oemShortCode") or node.get("oemName"),
                    "mass_kg": node.get("mass"),
                    "inertia_kgm2": infer_inertia(node),
                    "damping_nms_per_rad": infer_damping(node),
                    "metadata": metadata_pairs(node),
                }
                for node in rotary_nodes
            ],
        },
        "natural_frequencies_hz": [round(value, 3) for value in frequencies_hz],
        "critical_speeds_rpm": [round(value, 1) for value in critical_speeds_rpm],
        "damping_ratios": [0.02 for _ in frequencies_hz],
        "warnings": warnings,
    }
    print(json.dumps(result))


def demo_nodes():
    return [
        {"id": "demo-motor", "name": "Electric Motor", "position": {"x": 0}},
        {"id": "demo-shaft", "name": "Propeller Shaft", "position": {"x": 1}},
        {"id": "demo-propeller", "name": "Fixed Pitch Propeller", "position": {"x": 2}},
    ]


def is_rotary(node):
    text = searchable_text(node)
    return any(keyword in text for keyword in ROTARY_KEYWORDS)


def searchable_text(node):
    return " ".join(
        str(value or "")
        for value in (
            node.get("name"),
            node.get("fmuName"),
            node.get("partName"),
            node.get("modelIdentifier"),
        )
    ).lower()


def node_name(node):
    return str(node.get("name") or node.get("partName") or node.get("id") or "Component")


def infer_inertia(node):
    metadata_value = metadata_number(
        node,
        "rotorInertia",
        "propellerInertia",
        "shaftInertia",
        "inertia",
        "momentOfInertia",
    )
    if metadata_value is not None:
        return metadata_value

    text = searchable_text(node)
    if "shaft" in text:
        return 2.0
    if "propeller" in text:
        return 34.0
    if "motor" in text:
        return 18.0
    if "gearbox" in text:
        return 6.0
    if "generator" in text:
        return 20.0
    if "engine" in text or "turbine" in text:
        return 45.0
    return 5.0


def infer_damping(node):
    metadata_value = metadata_number(node, "hydrodynamicDamping", "shaftDamping", "damping")
    if metadata_value is not None:
        return metadata_value

    text = searchable_text(node)
    if "shaft" in text:
        return 45.0
    if "propeller" in text:
        return 260.0
    if "motor" in text:
        return 120.0
    return 25.0


def infer_stiffness(left, right):
    metadata_value = metadata_number(left, "torsionalStiffness", "stiffness") or metadata_number(
        right, "torsionalStiffness", "stiffness"
    )
    if metadata_value is not None:
        return metadata_value

    text = f"{searchable_text(left)} {searchable_text(right)}"
    if "shaft" in text:
        return 6.5e6
    if "gearbox" in text:
        return 8.0e6
    return 5.0e6


def infer_shaft_damping(left, right):
    metadata_value = metadata_number(left, "shaftDamping") or metadata_number(right, "shaftDamping")
    if metadata_value is None and "shaft" in searchable_text(left):
        metadata_value = metadata_number(left, "damping")
    if metadata_value is None and "shaft" in searchable_text(right):
        metadata_value = metadata_number(right, "damping")
    if metadata_value is not None:
        return metadata_value

    text = f"{searchable_text(left)} {searchable_text(right)}"
    if "shaft" in text:
        return 45.0
    return 30.0


def metadata_number(node, *keys):
    key_set = {key.lower() for key in keys}
    metadata = node.get("metadata") or []

    if isinstance(metadata, dict):
        items = metadata.items()
    else:
        items = []
        for entry in metadata:
            if isinstance(entry, dict):
                items.append((entry.get("key"), entry.get("value")))

    for key, value in items:
        if str(key or "").lower() in key_set:
            parsed = parse_number(value)
            if parsed is not None:
                return parsed
    return None


def metadata_pairs(node):
    metadata = node.get("metadata") or []

    if isinstance(metadata, dict):
        return [{"key": str(key), "value": str(value)} for key, value in metadata.items()]

    pairs = []
    for entry in metadata:
        if isinstance(entry, dict) and entry.get("key") is not None:
            pairs.append({"key": str(entry.get("key")), "value": str(entry.get("value", ""))})
    return pairs


def parse_number(value):
    match = re.search(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", str(value or ""))
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


if __name__ == "__main__":
    main()
