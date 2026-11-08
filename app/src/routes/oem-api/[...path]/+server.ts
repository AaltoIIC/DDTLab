import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const trailingSlash = 'ignore';

// The app only talks to the analysis-request endpoints. Everything else on the
// OEM interface origin stays unreachable through this proxy.
const ALLOWED_PATH_PREFIX = 'api/analysis-requests';

const forward: RequestHandler = async ({ request, params, url, fetch }) => {
	const baseUrl = env.OEM_INTERFACE_URL?.trim();
	if (!baseUrl) {
		console.error('Missing required environment variable OEM_INTERFACE_URL');
		return json({ message: 'OEM interface is not configured (missing OEM_INTERFACE_URL)' }, { status: 500 });
	}

	const base = new URL(`${baseUrl.replace(/\/+$/, '')}/`);
	const path = params.path;

	// `params.path` is decoded. A value like `//attacker.example/x` would make
	// `new URL` switch hosts, so reject protocol-relative and absolute paths and
	// any `..` segments before resolving.
	if (!path || path.startsWith('/') || path.split(/[/\\]/).includes('..')) {
		return json({ message: 'Invalid OEM interface path' }, { status: 400 });
	}

	let target: URL;
	try {
		target = new URL(path, base);
	} catch {
		return json({ message: 'Invalid OEM interface path' }, { status: 400 });
	}

	// Re-check the normalized result: percent-encoded dot segments can still
	// escape, and the resolved origin must stay the configured one.
	const allowedPrefix = `${base.pathname.replace(/\/+$/, '')}/${ALLOWED_PATH_PREFIX}`;
	const normalizedPath = target.pathname.replace(/\/+$/, '') || '/';
	if (
		target.origin !== base.origin ||
		!(normalizedPath === allowedPrefix || normalizedPath.startsWith(`${allowedPrefix}/`))
	) {
		return json({ message: 'Invalid OEM interface path' }, { status: 400 });
	}

	target.search = url.search;

	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	const apiKey = env.OEM_INTERFACE_API_KEY?.trim();
	if (apiKey) headers.set('X-API-Key', apiKey);

	const body = request.method === 'GET' || request.method === 'HEAD'
		? undefined
		: await request.arrayBuffer();
	let response: Response;
	try {
		response = await fetch(target, {
			method: request.method,
			headers,
			body
		});
	} catch (cause) {
		console.error('OEM interface upstream request failed:', cause);
		return json({ message: 'OEM interface upstream request failed' }, { status: 502 });
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
};

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
export const PATCH = forward;
