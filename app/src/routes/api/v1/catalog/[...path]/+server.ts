import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const trailingSlash = 'ignore';

// The UI only reads these three list endpoints. Keeping the allowlist tight
// also prevents `..` traversal to other routes on the catalog API.
const ALLOWED_PATHS = new Set(['fmus', 'components', 'fmu-groups']);

const forward: RequestHandler = async ({ params, url, fetch }) => {
	const baseUrl = env.CATALOG_API_URL?.trim();
	if (!baseUrl) {
		console.error('Missing required environment variable CATALOG_API_URL');
		return json({ message: 'Catalog API is not configured (missing CATALOG_API_URL)' }, { status: 500 });
	}

	// `params.path` is decoded, so only accept the known list endpoints instead
	// of interpolating the value into the upstream URL.
	const path = params.path.replace(/\/+$/, '');
	if (!ALLOWED_PATHS.has(path)) {
		return json({ message: 'Unknown catalog endpoint' }, { status: 404 });
	}

	const target = new URL(`api/v1/catalog/${path}`, `${baseUrl.replace(/\/+$/, '')}/`);
	target.search = url.search;

	const headers = new Headers();
	const apiKey = env.CATALOG_API_KEY?.trim();
	if (apiKey) headers.set('X-API-Key', apiKey);

	let response: Response;
	try {
		response = await fetch(target, {
			method: 'GET',
			headers
		});
	} catch (cause) {
		console.error('Catalog API upstream request failed:', cause);
		return json({ message: 'Catalog API upstream request failed' }, { status: 502 });
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
};

// Read-only: the app never writes through this proxy.
export const GET = forward;
