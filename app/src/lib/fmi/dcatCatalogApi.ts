import type { FMIComponentType, FMIVariableType } from '$lib/types/types';

// ─── DCAT Title Parsing & Physical Parameter Extraction ───

export interface DcatSimulationMetadata {
	/** Parsed component type from the DCAT title */
	componentType: 'turbine' | 'shaft' | 'rotor' | 'gearbox' | 'generator' | 'motor' | 'propeller' | 'engine' | 'unknown';
	/** Primary physical parameter parsed from the title (e.g., torsional stiffness, inertia) */
	parameterValue: number | null;
	/** Human-readable label for the parameter (e.g., 'Torsional Stiffness', 'Rotor Inertia') */
	parameterLabel: string;
	/** Unit for the parameter */
	parameterUnit: string;
	/** Power rating if present in the title (e.g., 250.0kW) */
	powerRating: number | null;
	/** Extra title tokens (e.g., 'exc' for excitation, 'm' for shaft length) */
	extraTokens: string[];
	/** Drivetrain sort order: lower = closer to the prime mover */
	drivetrainOrder: number;
	/** Whether this component is considered 'rotary' by OpenTorsion */
	isRotary: boolean;
}

const COMPONENT_TYPE_KEYWORDS: Record<string, DcatSimulationMetadata['componentType']> = {
	turbine: 'turbine',
	shaft: 'shaft',
	rotor: 'rotor',
	gearbox: 'gearbox',
	generator: 'generator',
	motor: 'motor',
	propeller: 'propeller',
	engine: 'engine'
};

/** Drivetrain ordering: components closer to prime mover get lower values */
const DRIVETRAIN_ORDER: Record<DcatSimulationMetadata['componentType'], number> = {
	engine: 0,
	motor: 0,
	generator: 0,
	turbine: 1,
	rotor: 1,
	gearbox: 2,
	shaft: 3,
	propeller: 4,
	unknown: 5
};

/** Maps component type to the appropriate OpenTorsion metadata key */
function parameterKeyForType(componentType: DcatSimulationMetadata['componentType']): string {
	switch (componentType) {
		case 'turbine':
		case 'rotor':
		case 'motor':
		case 'generator':
		case 'engine':
			return 'rotorInertia';
		case 'propeller':
			return 'propellerInertia';
		case 'shaft':
			return 'torsionalStiffness';
		case 'gearbox':
			return 'torsionalStiffness';
		default:
			return 'inertia';
	}
}

function parameterLabelForKey(metadataKey: string): string {
	switch (metadataKey) {
		case 'rotorInertia': return 'Rotor Inertia';
		case 'propellerInertia': return 'Propeller Inertia';
		case 'shaftInertia': return 'Shaft Inertia';
		case 'torsionalStiffness': return 'Torsional Stiffness';
		case 'inertia': return 'Inertia';
		default: return 'Parameter';
	}
}

function parameterUnitForKey(metadataKey: string): string {
	switch (metadataKey) {
		case 'rotorInertia':
		case 'propellerInertia':
		case 'shaftInertia':
		case 'inertia':
			return 'kg·m²';
		case 'torsionalStiffness':
			return 'N·m/rad';
		default:
			return '';
	}
}

/**
 * Parses a DCAT title like "Windmill Turbine 250.0kW 3.75e+07" into structured
 * simulation metadata.
 *
 * Title format (convention):
 *   [Domain] [ComponentType] [PowerRating] [ExtraTokens...] [ParameterValue]
 *
 * The last number in the title is always the primary physical parameter.
 * Power ratings include a unit suffix (kW, MW, etc.).
 */
export function parseDcatTitle(title: string): DcatSimulationMetadata {
	const tokens = title.trim().split(/\s+/);
	const lowerTokens = tokens.map((t) => t.toLowerCase());

	// Detect component type
	let componentType: DcatSimulationMetadata['componentType'] = 'unknown';
	for (const token of lowerTokens) {
		for (const [keyword, type] of Object.entries(COMPONENT_TYPE_KEYWORDS)) {
			if (token.includes(keyword)) {
				componentType = type;
				break;
			}
		}
		if (componentType !== 'unknown') break;
	}

	// Extract power rating (e.g., "250.0kW", "1.5MW")
	let powerRating: number | null = null;
	for (const token of tokens) {
		const powerMatch = token.match(/([\d.]+(?:e[+\-]?\d+)?)\s*(kw|mw|gw)/i);
		if (powerMatch) {
			let value = parseFloat(powerMatch[1]);
			const unit = powerMatch[2].toLowerCase();
			if (unit === 'mw') value *= 1000;
			if (unit === 'gw') value *= 1_000_000;
			powerRating = value;
			break;
		}
	}

	// Extract the last number in the title — this is the primary physical parameter
	let parameterValue: number | null = null;
	const numberPattern = /[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi;
	let match: RegExpExecArray | null;
	while ((match = numberPattern.exec(title)) !== null) {
		// Skip if this number is part of a power rating (already parsed)
		const surrounding = title.substring(Math.max(0, match.index - 2), match.index + match[0].length + 3);
		if (/\d\s*(kw|mw|gw)/i.test(surrounding)) continue;
		const parsed = parseFloat(match[0]);
		if (!isNaN(parsed)) {
			parameterValue = parsed;
		}
	}

	// Extra tokens (e.g., "exc" for excitation, "m" for length)
	const extraTokens: string[] = [];
	for (const token of lowerTokens) {
		if (token === 'exc' || token === 'excitation') extraTokens.push('excitation');
		if (/^\d+\.?\d*m$/.test(token) && !token.match(/kw|mw|gw/i)) extraTokens.push('length');
	}

	const metadataKey = parameterKeyForType(componentType);

	return {
		componentType,
		parameterValue,
		parameterLabel: parameterLabelForKey(metadataKey),
		parameterUnit: parameterUnitForKey(metadataKey),
		powerRating,
		extraTokens,
		drivetrainOrder: DRIVETRAIN_ORDER[componentType],
		isRotary: ['turbine', 'rotor', 'motor', 'generator', 'engine', 'propeller', 'shaft', 'gearbox'].includes(componentType)
	};
}

/**
 * Generates synthetic FMU-like variables from DCAT simulation metadata.
 * These variables mirror what a real FMU modelDescription.xml would expose,
 * making the component interactable in the same way as OEM FMU components.
 */
function generateSyntheticVariables(
	simMeta: DcatSimulationMetadata,
	title: string
): FMIVariableType[] {
	const variables: FMIVariableType[] = [];
	const metadataKey = parameterKeyForType(simMeta.componentType);

	// Always add the primary physical parameter as a parameter variable
	if (simMeta.parameterValue !== null) {
		variables.push({
			name: metadataKey,
			type: 'Real',
			unit: simMeta.parameterUnit,
			description: `${simMeta.parameterLabel} for ${title}`,
			causality: 'parameter'
		});
	}

	// Add power rating as a parameter if present
	if (simMeta.powerRating !== null) {
		variables.push({
			name: 'ratedPower',
			type: 'Real',
			unit: 'kW',
			description: `Rated power for ${title}`,
			causality: 'parameter'
		});
	}

	// Component-type-specific input/output variables
	if (['turbine', 'rotor', 'motor', 'generator', 'engine'].includes(simMeta.componentType)) {
		variables.push(
			{
				name: 'angularVelocity',
				type: 'Real',
				unit: 'rad/s',
				description: 'Shaft angular velocity',
				causality: 'output'
			},
			{
				name: 'torque',
				type: 'Real',
				unit: 'N·m',
				description: 'Shaft torque output',
				causality: 'output'
			},
			{
				name: 'loadTorque',
				type: 'Real',
				unit: 'N·m',
				description: 'Applied load torque',
				causality: 'input'
			}
		);
	}

	if (simMeta.componentType === 'shaft') {
		variables.push(
			{
				name: 'torsionalStiffness',
				type: 'Real',
				unit: 'N·m/rad',
				description: 'Shaft torsional stiffness',
				causality: 'parameter'
			},
			{
				name: 'angularDisplacement',
				type: 'Real',
				unit: 'rad',
				description: 'Shaft twist angle',
				causality: 'output'
			}
		);
	}

	if (simMeta.componentType === 'propeller') {
		variables.push(
			{
				name: 'propellerInertia',
				type: 'Real',
				unit: 'kg·m²',
				description: 'Propeller moment of inertia',
				causality: 'parameter'
			},
			{
				name: 'thrust',
				type: 'Real',
				unit: 'N',
				description: 'Propeller thrust output',
				causality: 'output'
			},
			{
				name: 'hydrodynamicDamping',
				type: 'Real',
				unit: 'N·m·s/rad',
				description: 'Hydrodynamic damping coefficient',
				causality: 'parameter'
			}
		);
	}

	// Damping is always relevant
	if (!variables.some((v) => v.name === 'damping' || v.name === 'hydrodynamicDamping')) {
		variables.push({
			name: 'damping',
			type: 'Real',
			unit: 'N·m·s/rad',
			description: 'Rotational damping coefficient',
			causality: 'parameter'
		});
	}

	return variables;
}

/**
 * Builds the OpenTorsion-compatible metadata array from DCAT simulation metadata.
 * These key-value pairs are what opentorsion_tva.py reads via metadata_number().
 */
export function buildDcatOpenTorsionMetadata(
	simMeta: DcatSimulationMetadata
): Array<{ key: string; value: string }> {
	const metadata: Array<{ key: string; value: string }> = [];
	const metadataKey = parameterKeyForType(simMeta.componentType);

	if (simMeta.parameterValue !== null) {
		metadata.push({ key: metadataKey, value: String(simMeta.parameterValue) });
	}

	if (simMeta.powerRating !== null) {
		metadata.push({ key: 'ratedPower', value: String(simMeta.powerRating) });
	}

	// Add default damping based on component type
	if (simMeta.componentType === 'propeller') {
		if (!metadata.some((m) => m.key === 'hydrodynamicDamping')) {
			metadata.push({ key: 'hydrodynamicDamping', value: '260' });
		}
	} else if (simMeta.componentType === 'shaft') {
		if (!metadata.some((m) => m.key === 'shaftDamping')) {
			metadata.push({ key: 'shaftDamping', value: '45' });
		}
	}

	return metadata;
}


export interface CkanSite {
	id: string;
	name: string;
	baseUrl: string;
	catalogUrl: string;
}

export const CKAN_SITES: CkanSite[] = [
	{
		id: 'securedigitaltwins',
		name: 'securedigitaltwins.com',
		baseUrl: 'https://securedigitaltwins.com',
		catalogUrl: 'https://securedigitaltwins.com/catalog.jsonld'
	},
	{
		id: 'trustedtwincatalog',
		name: 'trustedtwincatalog.com',
		baseUrl: 'https://trustedtwincatalog.com',
		catalogUrl: 'https://trustedtwincatalog.com/catalog.jsonld'
	}
];

// Expanded (full-URI) property keys used by some CKAN instances
const EXPANDED = {
	dcatDataset: 'http://www.w3.org/ns/dcat#Dataset',
	dctTitle: 'http://purl.org/dc/terms/title',
	dctDescription: 'http://purl.org/dc/terms/description',
	dctIdentifier: 'http://purl.org/dc/terms/identifier',
	dctModified: 'http://purl.org/dc/terms/modified',
	dctPublisher: 'http://purl.org/dc/terms/publisher',
	dcatKeyword: 'http://www.w3.org/ns/dcat#keyword',
	dcatLandingPage: 'http://www.w3.org/ns/dcat#landingPage',
	foafName: 'http://xmlns.com/foaf/0.1/name'
} as const;

interface JsonLdEntity {
	'@id': string;
	'@type': string | string[];
	[key: string]: unknown;
}

function isDataset(entity: JsonLdEntity): boolean {
	const type = entity['@type'];
	const types: string[] = Array.isArray(type) ? type : [type];
	return types.includes('dcat:Dataset') || types.includes(EXPANDED.dcatDataset);
}

function getEntityValue(entity: JsonLdEntity, keys: string | string[]): unknown {
	const keyArray = Array.isArray(keys) ? keys : [keys];
	let value: unknown = undefined;

	for (const key of keyArray) {
		const v = entity[key];
		if (v !== undefined && v !== null) {
			value = v;
			break;
		}
	}
	if (value === undefined) return undefined;

	// Unwrap from array if the value is an array (common in expanded JSON-LD)
	let unwrapped = value;
	if (Array.isArray(unwrapped)) {
		unwrapped = unwrapped[0];
	}

	// Unwrap @value or @id
	if (typeof unwrapped === 'object' && unwrapped !== null) {
		if ('@value' in unwrapped) return (unwrapped as { '@value': unknown })['@value'];
		if ('@id' in unwrapped) return (unwrapped as { '@id': string })['@id'];
	}

	return unwrapped;
}

function getEntityString(entity: JsonLdEntity, keys: string | string[]): string | undefined {
	const value = getEntityValue(entity, keys);
	return typeof value === 'string' ? value : undefined;
}

function getEntityArray(entity: JsonLdEntity, keys: string | string[]): unknown[] {
	const keyArray = Array.isArray(keys) ? keys : [keys];
	let value: unknown = undefined;

	for (const key of keyArray) {
		const v = entity[key];
		if (v !== undefined && v !== null) {
			value = v;
			break;
		}
	}
	if (!value) return [];

	const arr = Array.isArray(value) ? value : [value];
	return arr.map((item) => {
		if (typeof item === 'object' && item !== null) {
			if ('@value' in item) return (item as { '@value': unknown })['@value'];
			if ('@id' in item) return (item as { '@id': string })['@id'];
		}
		return item;
	});
}

function getEntityId(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && '@id' in value) {
		return (value as { '@id': string })['@id'];
	}
	return undefined;
}

function inferCategory(title: string, keywords: string[]): FMIComponentType['category'] {
	const text = [title, ...keywords].join(' ').toLowerCase();
	if (text.includes('motor') || text.includes('generator')) return 'motors';
	if (text.includes('rotor')) return 'engines';
	if (text.includes('propeller') || text.includes('thruster')) return 'propellers';
	if (text.includes('engine') || text.includes('turbine')) return 'engines';
	if (text.includes('sensor')) return 'sensors';
	if (text.includes('controller') || text.includes('converter')) return 'controllers';
	if (text.includes('gearbox')) return 'other';
	if (text.includes('shaft')) return 'other';
	return 'other';
}

function inferDomain(keywords: string[], description: string): string {
	const text = [description, ...keywords].join(' ').toLowerCase();
	if (text.includes('wind')) return 'Wind Energy';
	if (text.includes('marine')) return 'Marine';
	return 'Other';
}

function mapDatasetToComponent(
	dataset: JsonLdEntity,
	site: CkanSite,
	entityMap: Map<string, JsonLdEntity>
): FMIComponentType | null {
	if (!isDataset(dataset)) return null;

	const id = getEntityString(dataset, ['dct:identifier', EXPANDED.dctIdentifier]) || dataset['@id'];
	const title = getEntityString(dataset, ['dct:title', EXPANDED.dctTitle]) || 'Untitled Dataset';
	const description = getEntityString(dataset, ['dct:description', EXPANDED.dctDescription]) || '';
	const keywords = getEntityArray(dataset, ['dcat:keyword', EXPANDED.dcatKeyword])
		.map((k) => (typeof k === 'string' ? k : ''))
		.filter(Boolean) as string[];
	const landingPage = getEntityId(
		getEntityValue(dataset, ['dcat:landingPage', EXPANDED.dcatLandingPage])
	);
	const modified =
		getEntityString(dataset, ['dct:modified', EXPANDED.dctModified]) || new Date().toISOString();

	const publisherRef = getEntityId(
		getEntityValue(dataset, ['dct:publisher', EXPANDED.dctPublisher])
	);
	let publisherName = site.name;
	if (publisherRef && entityMap.has(publisherRef)) {
		const publisher = entityMap.get(publisherRef)!;
		const name = getEntityString(publisher, ['foaf:name', EXPANDED.foafName]);
		if (name) publisherName = name;
	}

	const category = inferCategory(title, keywords);
	const domain = inferDomain(keywords, description);

	// Parse physical parameters from the DCAT title and generate FMU-like metadata
	const simMeta = parseDcatTitle(title);
	const variables = generateSyntheticVariables(simMeta, title);
	const otMetadata = buildDcatOpenTorsionMetadata(simMeta);
	const inputCount = variables.filter((v) => v.causality === 'input').length;
	const outputCount = variables.filter((v) => v.causality === 'output').length;
	const parameterCount = variables.filter((v) => v.causality === 'parameter').length;

	return {
		id: `ckan-${site.id}-${id}`,
		name: title,
		category,
		description,
		modelIdentifier: id,
		fmiVersion: 'N/A',
			fmiType: 'Digital Twin (Synthetic)',
		linkedElements: [],
		uploadDate: modified,
		isUserUploaded: false,
		filename: undefined,
		domain,
		oemName: publisherName,
		oemShortCode: site.id.slice(0, 3).toUpperCase(),
		downloadUrl: landingPage,
		downloadAssets: landingPage ? [landingPage] : [],
		variableCount: variables.length,
		inputCount,
		outputCount,
		parameterCount,
		variables,
		catalogSource: 'digitalTwin',
		dcatOpenTorsionMetadata: otMetadata
	} as FMIComponentType;
}

async function fetchSiteCatalog(site: CkanSite): Promise<FMIComponentType[]> {
	const components: FMIComponentType[] = [];
	let page = 1;
	let pageSize = 0;

	while (true) {
		const response = await fetch(`/api/ckan-catalog/${site.id}?page=${page}`, {
			headers: { Accept: 'application/ld+json' }
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch ${site.catalogUrl}: ${response.status} ${response.statusText}`
			);
		}

		const raw = await response.json();
		// DCAT JSON-LD may be either a root array of entities or {"@graph": [...]}
		const entities: JsonLdEntity[] = Array.isArray(raw) ? raw : raw['@graph'] ?? [];

		// Build entity map from ALL entities (needed for publisher resolution across pages)
		const entityMap = new Map(entities.map((e) => [e['@id'], e]));

		const datasets = entities.filter((entity) => isDataset(entity));

		if (page === 1) {
			pageSize = datasets.length;
		}

		if (datasets.length === 0) break;

		components.push(
			...datasets
				.map((dataset) => mapDatasetToComponent(dataset, site, entityMap))
				.filter((component): component is FMIComponentType => component !== null)
		);

		// If this page had fewer datasets than the first page, it's the last page
		if (datasets.length < pageSize) break;

		page++;
	}

	return components;
}

export async function fetchCkanDigitalTwins(): Promise<FMIComponentType[]> {
	const results = await Promise.allSettled(
		CKAN_SITES.map((site) => fetchSiteCatalog(site))
	);

	const components: FMIComponentType[] = [];
	for (const result of results) {
		if (result.status === 'fulfilled') {
			components.push(...result.value);
		} else {
			console.warn('Failed to fetch CKAN catalog:', result.reason);
		}
	}

	return components;
}
