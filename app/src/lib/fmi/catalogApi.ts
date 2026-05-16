import { env } from '$env/dynamic/public';
import type { FMIComponentType, FMIVariableType } from '$lib/types/types';

const DEFAULT_CATALOG_API_URL = '';
const CATALOG_PAGE_LIMIT = 500;

type FMIComponentCategory = FMIComponentType['category'];

interface CatalogPage<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

interface CatalogOem {
    id: string;
    name: string;
    short_code: string;
}

interface CatalogFmuVariable {
    name: string;
    type?: string;
    unit?: string | null;
    description?: string | null;
    causality?: string;
}

interface CatalogFmu {
    id: string;
    name: string;
    description?: string | null;
    domain: string;
    filename: string;
    fmi_version: string;
    model_kinds?: string[];
    model_name: string;
    variables?: CatalogFmuVariable[];
    variable_count?: number;
    input_count?: number;
    output_count?: number;
    parameter_count?: number;
    created_at: string;
    updated_at: string;
    oem?: CatalogOem | null;
    download_assets?: string[];
    download_url?: string | null;
}

interface CatalogComponent {
    parts?: CatalogFmu[];
}

interface CatalogFmuGroup {
    subtypes?: CatalogFmu[];
}

export function getCatalogApiBaseUrl(): string {
    return (env.PUBLIC_CATALOG_API_URL || DEFAULT_CATALOG_API_URL).replace(/\/+$/, '');
}

function getCatalogApiHeaders(): HeadersInit {
    const apiKey = env.PUBLIC_CATALOG_API_KEY;
    return {
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
    };
}

function buildCatalogUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
    const baseUrl = getCatalogApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
        ? new URL(normalizedPath, `${baseUrl}/`)
        : new URL(`${baseUrl}${normalizedPath}`, window.location.origin);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}

async function fetchCatalogPage<T>(
    path: string,
    params: Record<string, string | number | undefined> = {}
): Promise<CatalogPage<T>> {
    const response = await fetch(buildCatalogUrl(path, params), {
        headers: getCatalogApiHeaders(),
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Catalog API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json() as CatalogPage<T>;
}

async function fetchAllCatalogPages<T>(
    path: string,
    params: Record<string, string | number | undefined> = {}
): Promise<T[]> {
    const items: T[] = [];
    let offset = 0;
    let total = 0;

    do {
        const page = await fetchCatalogPage<T>(path, {
            ...params,
            limit: CATALOG_PAGE_LIMIT,
            offset
        });

        items.push(...page.items);
        total = page.total;
        offset += page.limit;
    } while (items.length < total);

    return items;
}

function mapCatalogFmuToCategory(fmu: CatalogFmu): FMIComponentCategory {
    const normalizedText = [
        fmu.domain,
        fmu.name,
        fmu.model_name,
        fmu.filename,
        fmu.description || ''
    ].join(' ').toLowerCase();
    const normalizedOemText = [
        fmu.oem?.name || '',
        fmu.oem?.short_code || ''
    ].join(' ').toLowerCase();
    const isAbb = normalizedOemText.includes('abb');
    const hasGenericPropulsionSignal = normalizedText.includes('propulsion');

    if (normalizedText.includes('sensor')) {
        return 'sensors';
    }

    if (normalizedText.includes('control') || normalizedText.includes('controller') || normalizedText.includes('automation')) {
        return 'controllers';
    }

    if (normalizedText.includes('engine')) {
        return 'engines';
    }

    if (normalizedText.includes('motor') || normalizedText.includes('drive')) {
        return 'motors';
    }

    if (normalizedText.includes('propeller') || normalizedText.includes('thruster') || normalizedText.includes('propulsor')) {
        return 'propellers';
    }

    if (isAbb && hasGenericPropulsionSignal) {
        return 'motors';
    }

    return 'other';
}

function mapModelKindsToFMIType(modelKinds: string[] = []): string {
    const normalizedKinds = modelKinds.map(kind => kind.replace(/[-_\s]/g, '').toLowerCase());
    const hasCoSimulation = normalizedKinds.some(kind => kind === 'cosimulation');
    const hasModelExchange = normalizedKinds.some(kind => kind === 'modelexchange');

    if (hasCoSimulation && hasModelExchange) {
        return 'Co-Simulation & Model Exchange';
    }

    if (hasModelExchange) {
        return 'Model Exchange';
    }

    if (hasCoSimulation) {
        return 'Co-Simulation';
    }

    return modelKinds.join(', ') || 'FMU';
}

function mapCatalogVariable(variable: CatalogFmuVariable): FMIVariableType | null {
    const normalizedType = variable.type || 'Real';
    const normalizedCausality = variable.causality?.toLowerCase();

    if (!['input', 'output', 'parameter'].includes(normalizedCausality || '')) {
        return null;
    }

    return {
        name: variable.name,
        type: ['Real', 'Integer', 'Boolean', 'String'].includes(normalizedType)
            ? normalizedType as FMIVariableType['type']
            : 'Real',
        unit: variable.unit || undefined,
        description: variable.description || undefined,
        causality: normalizedCausality as FMIVariableType['causality']
    };
}

function buildDownloadUrl(downloadUrl?: string | null): string | undefined {
    if (!downloadUrl) {
        return undefined;
    }

    if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        return downloadUrl;
    }

    const baseUrl = getCatalogApiBaseUrl();

    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        return new URL(downloadUrl, `${baseUrl}/`).toString();
    }

    const normalizedDownloadUrl = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
    return `${baseUrl}${normalizedDownloadUrl}`;
}

function mapCatalogFmuToComponent(fmu: CatalogFmu): FMIComponentType {
    const oemSuffix = fmu.oem?.short_code ? ` - ${fmu.oem.short_code}` : '';

    return {
        id: fmu.id,
        name: `${fmu.name}${oemSuffix}`,
        category: mapCatalogFmuToCategory(fmu),
        description: fmu.description || fmu.filename || fmu.model_name,
        filePath: buildDownloadUrl(fmu.download_url),
        modelIdentifier: fmu.model_name || fmu.name,
        fmiVersion: fmu.fmi_version,
        fmiType: mapModelKindsToFMIType(fmu.model_kinds),
        linkedElements: [],
        uploadDate: fmu.updated_at || fmu.created_at,
        isUserUploaded: false,
        filename: fmu.filename,
        domain: fmu.domain,
        oemName: fmu.oem?.name,
        oemShortCode: fmu.oem?.short_code,
        downloadUrl: buildDownloadUrl(fmu.download_url),
        downloadAssets: fmu.download_assets || [],
        variableCount: fmu.variable_count,
        inputCount: fmu.input_count,
        outputCount: fmu.output_count,
        parameterCount: fmu.parameter_count,
        variables: (fmu.variables || []).map(mapCatalogVariable).filter(Boolean) as FMIVariableType[],
        catalogSource: 'api'
    };
}

function dedupeCatalogFmus(fmus: CatalogFmu[]): CatalogFmu[] {
    const fmusById = new Map<string, CatalogFmu>();

    for (const fmu of fmus) {
        if (!fmusById.has(fmu.id)) {
            fmusById.set(fmu.id, fmu);
        }
    }

    return Array.from(fmusById.values());
}

export async function fetchCatalogFmuComponents(query = ''): Promise<FMIComponentType[]> {
    const params = {
        q: query || undefined,
        _: Date.now()
    };

    const [fmus, components, fmuGroups] = await Promise.all([
        fetchAllCatalogPages<CatalogFmu>('/api/v1/catalog/fmus', params),
        fetchAllCatalogPages<CatalogComponent>('/api/v1/catalog/components', params),
        fetchAllCatalogPages<CatalogFmuGroup>('/api/v1/catalog/fmu-groups', params)
    ]);

    const componentParts = components.flatMap(component => component.parts || []);
    const groupSubtypes = fmuGroups.flatMap(group => group.subtypes || []);
    const catalogFmus = dedupeCatalogFmus([
        ...fmus,
        ...componentParts,
        ...groupSubtypes
    ]);

    return catalogFmus.map(mapCatalogFmuToComponent);
}
