import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const catalogUrl = url.searchParams.get('url');

	if (!catalogUrl) {
		throw error(400, 'Missing required "url" query parameter');
	}

	// Validate the URL is http/https
	let parsed: URL;
	try {
		parsed = new URL(catalogUrl);
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			throw error(400, 'Only http/https catalog URLs are accepted');
		}
	} catch {
		throw error(400, 'Invalid catalog URL');
	}

	// Only accept jsonld catalog endpoints
	if (!/\.jsonld$/i.test(parsed.pathname)) {
		throw error(400, 'Only catalog.jsonld endpoints are accepted');
	}

	// Forward ?page= parameter for pagination
	const page = url.searchParams.get('page');
	const fetchUrl = page ? `${catalogUrl}?page=${encodeURIComponent(page)}` : catalogUrl;

	try {
		const response = await fetch(fetchUrl, {
			headers: { Accept: 'application/ld+json' }
		});

		if (!response.ok) {
			throw error(response.status, `Failed to fetch CKAN catalog: ${response.statusText}`);
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, `Failed to fetch CKAN catalog: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};
