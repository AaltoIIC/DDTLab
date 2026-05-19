import { env } from '$env/dynamic/public';

const DEFAULT_ANALYSIS_REQUEST_API_URL = '/oem-api';

export type AnalysisRequestParameter = {
	name: string;
	value: string | number | boolean | null;
	unit?: string | null;
	source?: string;
};

export type AnalysisRequestPartPayload = {
	id: string;
	source_node_id: string;
	name: string;
	role: string;
	sysml_type: string;
	definition: string | null;
	comment: string | null;
	parameters: AnalysisRequestParameter[];
	interfaces: Array<{
		name: string;
		interfaceType?: string | null;
		type: 'input' | 'output';
	}>;
};

export type CreateAnalysisRequestPayload = {
	requester_name: string;
	requester_org: string;
	title: string;
	analysis_type: string;
	target_oem_short_codes: string[];
	source_system_id: string;
	source_system_name: string;
	source_stage: 'concept' | 'design';
	source_snapshot_json: Record<string, unknown>;
	parts: AnalysisRequestPartPayload[];
	notes?: string | null;
};

export type AnalysisRequestPartResponseStatus = {
	id: string;
	status: string;
	oem_id: string;
	oem_name: string | null;
	oem_short_code: string | null;
	fmu_id: string;
	fmu_name: string | null;
	message: string | null;
	updated_at: string;
};

export type AnalysisRequestPartStatus = {
	id: string;
	source_node_id: string;
	name: string;
	definition: string | null;
	response_count: number;
	responded: boolean;
	responses: AnalysisRequestPartResponseStatus[];
};

export type AnalysisRequestStatusView = {
	id: string;
	title: string;
	status: string;
	source_system_id: string | null;
	source_system_name: string | null;
	source_stage: 'concept' | 'design';
	part_count: number;
	responded_part_count: number;
	complete: boolean;
	parts: AnalysisRequestPartStatus[];
	targets: Array<{
		id: string;
		status: string;
		oem_id: string;
		oem?: { id: string; name: string; short_code: string } | null;
	}>;
	created_at: string;
	updated_at: string;
};

export type ShareAnalysisReportPayload = {
	title: string;
	filename: string;
	pdfBytes: Uint8Array;
	message?: string | null;
	analysisType: string;
	generatedAt: string;
	sourceSystemId: string;
	sourceSystemName: string;
	designSystemId: string;
	designSystemName: string;
};

export function getAnalysisRequestApiBaseUrl(): string {
	return (env.PUBLIC_ANALYSIS_REQUEST_API_URL || DEFAULT_ANALYSIS_REQUEST_API_URL).replace(/\/+$/, '');
}

async function readErrorMessage(response: Response): Promise<string> {
	const fallback = `${response.status} ${response.statusText}`;
	const text = await response.text().catch(() => '');
	if (!text) return fallback;

	try {
		const body = JSON.parse(text);
		return body.detail ?? body.message ?? text;
	} catch {
		return text;
	}
}

export async function createAnalysisRequest(payload: CreateAnalysisRequestPayload): Promise<{ id: string }> {
	const response = await fetch(`${getAnalysisRequestApiBaseUrl()}/api/analysis-requests`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		throw new Error(await readErrorMessage(response));
	}

	return (await response.json()) as { id: string };
}

export async function fetchAnalysisRequestStatuses(sourceSystemId: string): Promise<AnalysisRequestStatusView[]> {
	if (!sourceSystemId) return [];
	const response = await fetch(`${getAnalysisRequestApiBaseUrl()}/api/analysis-requests/status?source_system_id=${encodeURIComponent(sourceSystemId)}`);

	if (!response.ok) {
		throw new Error(await readErrorMessage(response));
	}

	return (await response.json()) as AnalysisRequestStatusView[];
}

export async function shareAnalysisReport(requestId: string, payload: ShareAnalysisReportPayload): Promise<{ id: string }> {
	const form = new FormData();
	form.set('file', new Blob([payload.pdfBytes], { type: 'application/pdf' }), payload.filename);
	form.set('title', payload.title);
	form.set('filename', payload.filename);
	form.set('analysis_type', payload.analysisType);
	form.set('generated_at', payload.generatedAt);
	form.set('source_system_id', payload.sourceSystemId);
	form.set('source_system_name', payload.sourceSystemName);
	form.set('design_system_id', payload.designSystemId);
	form.set('design_system_name', payload.designSystemName);
	if (payload.message) form.set('message', payload.message);

	const response = await fetch(`${getAnalysisRequestApiBaseUrl()}/api/analysis-requests/${encodeURIComponent(requestId)}/reports`, {
		method: 'POST',
		body: form
	});

	if (!response.ok) {
		throw new Error(await readErrorMessage(response));
	}

	return (await response.json()) as { id: string };
}
