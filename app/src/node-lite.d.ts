declare module 'node:child_process' {
	export interface ExecFileOptions {
		timeout?: number;
		env?: Record<string, string | undefined>;
	}

	export interface ChildProcess {
		stdin?: {
			end(input?: string): void;
		};
	}

	export function execFile(
		file: string,
		args: readonly string[],
		options: ExecFileOptions,
		callback: (error: Error | null, stdout: string, stderr: string) => void
	): ChildProcess;
}

declare module 'node:fs' {
	export function existsSync(path: string): boolean;
}

declare module 'node:path' {
	export function join(...paths: string[]): string;
}

declare const process: {
	cwd(): string;
	env: Record<string, string | undefined>;
	platform: string;
};

declare module 'node:os' {
	export function tmpdir(): string;
}
