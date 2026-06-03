import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_PYTHON = 'python-client/python_venv/bin/python';

export const POST: RequestHandler = async () => {
	const result = await runBridge(['launch'], 90000);
	return json(result.body, { status: result.status });
};

export const GET: RequestHandler = async ({ url }) => {
	const jobId = url.searchParams.get('jobId')?.trim();
	if (!jobId) {
		return json({ ok: false, message: 'jobId is required' }, { status: 400 });
	}

	const seriesArgs = url.searchParams
		.getAll('seriesId')
		.map((seriesId) => seriesId.trim())
		.filter(Boolean)
		.flatMap((seriesId) => ['--series-id', seriesId]);

	const result = await runBridge(['status', '--job-id', jobId, ...seriesArgs], 45000);
	return json(result.body, { status: result.status });
};

function getPythonPath(): string {
	const configured = process.env.TEMPLATE_SIM_PYTHON;
	if (configured) return configured;

	const defaultPath = join(process.cwd(), DEFAULT_PYTHON);
	return existsSync(defaultPath) ? defaultPath : 'python3';
}

function runBridge(args: string[], timeout: number): Promise<{ status: number; body: Record<string, unknown> }> {
	return new Promise((resolve) => {
		const scriptPath = join(process.cwd(), 'scripts', 'template_simulation_bridge.py');
		const pythonPath = getPythonPath();

		execFile(
			pythonPath,
			[scriptPath, ...args],
			{
				timeout,
				env: {
					...process.env,
					PYTHONUNBUFFERED: '1'
				}
			},
			(error, stdout, stderr) => {
				const body = parseBridgeOutput(stdout, stderr);
				if (error) {
					resolve({
						status: 500,
						body: {
							ok: false,
							message: body.message || error.message,
							stderr: stderr.trim(),
							...body
						}
					});
					return;
				}

				resolve({ status: body.ok === false ? 500 : 200, body });
			}
		);
	});
}

function parseBridgeOutput(stdout: string, stderr: string): Record<string, unknown> {
	const text = stdout.trim();
	if (!text) {
		return {
			ok: false,
			message: 'Template simulation bridge returned no output',
			stderr: stderr.trim()
		};
	}

	try {
		return JSON.parse(text) as Record<string, unknown>;
	} catch {
		return {
			ok: false,
			message: 'Template simulation bridge returned invalid JSON',
			stdout: text,
			stderr: stderr.trim()
		};
	}
}
