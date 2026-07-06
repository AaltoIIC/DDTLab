import { json, type RequestHandler } from '@sveltejs/kit';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';


// Use environment variable for Python executable, defaults to 'python3'
const DEFAULT_PYTHON = process.platform === 'win32' ? 'python' : 'python3';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json().catch(() => null);
	if (!payload || typeof payload !== 'object') {
		return json({ ok: false, message: 'Request body is required' }, { status: 400 });
	}

	const pythonPath = process.env.PYTHON_EXECUTABLE || DEFAULT_PYTHON;
	const scriptPath = join(process.cwd(), 'scripts', 'opentorsion_tva.py');

	const result = await runOpenTorsion(pythonPath, scriptPath, payload);
	return json(result, { status: result.ok ? 200 : 500 });
};

function runOpenTorsion(pythonPath: string, scriptPath: string, payload: unknown): Promise<Record<string, unknown>> {
	return new Promise((resolve) => {
		const env = { ...process.env };

		const child = execFile(
			pythonPath,
			[scriptPath],
			{
				timeout: 15000,
				env: {
					...env,
					MPLCONFIGDIR: process.env.MPLCONFIGDIR || join(tmpdir(), 'matplotlib')
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
