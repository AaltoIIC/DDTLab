import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const CKAN_CATALOG_URLS: Record<string, string> = {
	securedigitaltwins: 'https://securedigitaltwins.com/catalog.jsonld',
	trustedtwincatalog: 'https://trustedtwincatalog.com/catalog.jsonld'
};

export const GET: RequestHandler = async ({ params, url }) => {
	const catalogUrl = CKAN_CATALOG_URLS[params.siteId];

	if (!catalogUrl) {
		throw error(400, `Unknown CKAN site: ${params.siteId}`);
	}

	// Forward DCAT ?page= parameter for pagination
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
