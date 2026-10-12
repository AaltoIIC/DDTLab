import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const trailingSlash = 'ignore';

const forward: RequestHandler = async ({ request, params, url, fetch }) => {
	const baseUrl = env.CATALOG_API_URL?.trim();
	if (!baseUrl) {
		console.error('Missing required environment variable CATALOG_API_URL');
		return json({ message: 'Catalog API is not configured (missing CATALOG_API_URL)' }, { status: 500 });
	}

	const target = new URL(`api/v1/catalog/${params.path}`, `${baseUrl.replace(/\/+$/, '')}/`);
	target.search = url.search;

	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	const apiKey = env.CATALOG_API_KEY?.trim();
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
		console.error('Catalog API upstream request failed:', cause);
		return json({ message: 'Catalog API upstream request failed' }, { status: 502 });
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
