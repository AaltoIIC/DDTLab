import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_OPENTORSION_ROOT = '/home/haith/openTorsion';
const DEFAULT_OPENTORSION_PYTHON = `${DEFAULT_OPENTORSION_ROOT}/venv/bin/python`;

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json().catch(() => null);
	if (!payload || typeof payload !== 'object') {
		return json({ ok: false, message: 'Request body is required' }, { status: 400 });
	}

	const pythonPath = process.env.OPENTORSION_PYTHON || DEFAULT_OPENTORSION_PYTHON;
	const openTorsionRoot = process.env.OPENTORSION_ROOT || DEFAULT_OPENTORSION_ROOT;
	const scriptPath = join(process.cwd(), 'scripts', 'opentorsion_tva.py');

	if (!existsSync(pythonPath)) {
		return json({ ok: false, message: `OpenTorsion Python not found at ${pythonPath}` }, { status: 500 });
	}

	const result = await runOpenTorsion(pythonPath, scriptPath, openTorsionRoot, payload);
	return json(result, { status: result.ok ? 200 : 500 });
};

function runOpenTorsion(pythonPath: string, scriptPath: string, openTorsionRoot: string, payload: unknown): Promise<Record<string, unknown>> {
	return new Promise((resolve) => {
		const child = execFile(
			pythonPath,
			[scriptPath],
			{
				timeout: 15000,
				env: {
					...process.env,
					PYTHONPATH: [openTorsionRoot, process.env.PYTHONPATH].filter(Boolean).join(':'),
					MPLCONFIGDIR: process.env.MPLCONFIGDIR || '/tmp/matplotlib'
				}
			},
			(error, stdout, stderr) => {
				if (error) {
					resolve({
						ok: false,
						message: error.message,
						stderr: stderr.trim()
					});
					return;
				}

				try {
					resolve(JSON.parse(stdout));
				} catch {
					resolve({
						ok: false,
						message: 'OpenTorsion returned invalid JSON',
						stdout: stdout.trim(),
						stderr: stderr.trim()
					});
				}
			}
		);

		child.stdin?.end(JSON.stringify(payload));
	});
}
