type MetadataPair = {
	key?: string | null;
	value?: string | number | boolean | null;
};

type ReportComponent = {
	name?: string | null;
	oem?: string | null;
	fmu_name?: string | null;
	mass_kg?: string | number | null;
	inertia_kgm2?: string | number | null;
	damping_nms_per_rad?: string | number | null;
	metadata?: MetadataPair[];
};

type ReportShaft = {
	from?: string | null;
	to?: string | null;
	stiffness_nm_per_rad?: string | number | null;
	damping_nms_per_rad?: string | number | null;
};

type TorsionalAnalysisResult = {
	engine?: string;
	summary?: string;
	generatedAt?: string;
	sourceSystemName?: string;
	model?: {
		component_count?: number;
		shaft_count?: number;
		components?: ReportComponent[];
		shafts?: ReportShaft[];
	};
	natural_frequencies_hz?: number[];
	critical_speeds_rpm?: number[];
	damping_ratios?: number[];
	warnings?: string[];
};

type ReportOptions = {
	systemName?: string;
	generatedAt?: string;
	filename?: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

export function downloadTorsionalAnalysisPdf(result: TorsionalAnalysisResult, options: ReportOptions = {}) {
	const bytes = buildTorsionalAnalysisPdf(result, options);
	const blob = new Blob([bytes], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = options.filename || defaultFilename(options.systemName || result.sourceSystemName);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildTorsionalAnalysisPdf(result: TorsionalAnalysisResult, options: ReportOptions = {}): Uint8Array {
	const report = new PdfReport();
	const systemName = clean(options.systemName || result.sourceSystemName || 'Design Stage');
	const generatedAt = clean(formatDate(options.generatedAt || result.generatedAt || new Date().toISOString()));
	const frequencies = asNumberArray(result.natural_frequencies_hz);
	const criticalSpeeds = asNumberArray(result.critical_speeds_rpm);

	report.text('Torsional Vibration Analysis Report', MARGIN, report.y, 19, 'bold');
	report.y -= 24;
	report.text(`System: ${systemName}`, MARGIN, report.y, 10, 'regular');
	report.y -= 14;
	report.text(`Generated: ${generatedAt}`, MARGIN, report.y, 10, 'regular');
	report.y -= 14;
	report.text(`Analysis engine: ${clean(result.engine || 'OpenTorsion')}`, MARGIN, report.y, 10, 'regular');
	report.y -= 22;

	report.section('Summary');
	report.paragraph(clean(result.summary || 'Computed torsional modal response for the selected drivetrain.'), 10);
	report.paragraph('This demo report includes modal frequencies, first-order critical speeds, component metadata, and a Campbell-style diagram using 1x-3x excitation order lines.', 9);
	report.y -= 4;

	report.section('Modal Results');
	report.tableHeader(['Mode', 'Frequency (Hz)', 'Critical speed (rpm)', 'Damping ratio'], [52, 142, 260, 400]);
	const rowCount = Math.max(frequencies.length, criticalSpeeds.length);
	for (let index = 0; index < rowCount; index += 1) {
		report.tableRow(
			[
				String(index + 1),
				formatNumber(frequencies[index]),
				formatNumber(criticalSpeeds[index], 1),
				formatNumber(result.damping_ratios?.[index], 3)
			],
			[52, 142, 260, 400]
		);
	}
	report.y -= 12;

	drawCampbellDiagram(report, frequencies, criticalSpeeds);
	report.y -= 16;

	report.section('Component Metadata');
	const components = result.model?.components || [];
	if (!components.length) {
		report.paragraph('No component metadata was returned by the analysis model.', 9);
	} else {
		for (const component of components) {
			report.ensure(74);
			report.text(clean(component.name || 'Component'), MARGIN, report.y, 11, 'bold');
			report.y -= 13;
			const line = [
				`OEM: ${clean(component.oem || 'n/a')}`,
				`FMU: ${clean(component.fmu_name || 'n/a')}`,
				`Mass: ${formatValue(component.mass_kg, 'kg')}`,
				`Inertia: ${formatValue(component.inertia_kgm2, 'kg m2')}`,
				`Damping: ${formatValue(component.damping_nms_per_rad, 'Nms/rad')}`
			].join(' | ');
			report.paragraph(line, 8.5, MARGIN + 10, 92);
			const metadata = formatMetadata(component.metadata);
			if (metadata) {
				report.paragraph(metadata, 8, MARGIN + 10, 100);
			}
			report.y -= 2;
		}
	}

	const shafts = result.model?.shafts || [];
	if (shafts.length) {
		report.section('Shaft Couplings');
		report.tableHeader(['Connection', 'Stiffness (Nm/rad)', 'Damping (Nms/rad)'], [52, 260, 410]);
		for (const shaft of shafts) {
			report.tableRow(
				[
					`${clean(shaft.from || 'left')} to ${clean(shaft.to || 'right')}`,
					formatNumber(shaft.stiffness_nm_per_rad),
					formatNumber(shaft.damping_nms_per_rad)
				],
				[52, 260, 410]
			);
		}
		report.y -= 8;
	}

	if (result.warnings?.length) {
		report.section('Warnings');
		for (const warning of result.warnings) {
			report.paragraph(clean(warning), 9);
		}
	}

	return report.finish();
}

class PdfReport {
	pages: string[] = [];
	content: string[] = [];
	y = PAGE_HEIGHT - MARGIN;

	text(value: string, x: number, y: number, size = 10, font: 'regular' | 'bold' = 'regular') {
		const fontName = font === 'bold' ? 'F2' : 'F1';
		this.content.push(`BT /${fontName} ${num(size)} Tf ${num(x)} ${num(y)} Td (${escapePdfText(value)}) Tj ET`);
	}

	paragraph(value: string, size = 9, x = MARGIN, maxChars = 96) {
		for (const line of wrap(value, maxChars)) {
			this.ensure(14);
			this.text(line, x, this.y, size);
			this.y -= size + 4;
		}
	}

	section(title: string) {
		this.ensure(34);
		this.y -= 4;
		this.text(title, MARGIN, this.y, 13, 'bold');
		this.y -= 15;
		this.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y, '0.75 0.80 0.88', 0.8);
		this.y -= 13;
	}

	tableHeader(values: string[], xs: number[]) {
		this.ensure(20);
		this.fillRect(MARGIN, this.y - 5, PAGE_WIDTH - MARGIN * 2, 16, '0.94 0.96 0.98');
		values.forEach((value, index) => this.text(value, xs[index], this.y, 8.5, 'bold'));
		this.y -= 18;
	}

	tableRow(values: string[], xs: number[]) {
		this.ensure(18);
		values.forEach((value, index) => this.text(clean(value), xs[index], this.y, 8.5));
		this.y -= 15;
	}

	line(x1: number, y1: number, x2: number, y2: number, color = '0 0 0', width = 1) {
		this.content.push(`${color} RG ${num(width)} w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`);
	}

	rect(x: number, y: number, width: number, height: number, color = '0 0 0', strokeWidth = 1) {
		this.content.push(`${color} RG ${num(strokeWidth)} w ${num(x)} ${num(y)} ${num(width)} ${num(height)} re S`);
	}

	fillRect(x: number, y: number, width: number, height: number, color = '0 0 0') {
		this.content.push(`${color} rg ${num(x)} ${num(y)} ${num(width)} ${num(height)} re f`);
	}

	ensure(height: number) {
		if (this.y - height < MARGIN) {
			this.newPage();
		}
	}

	newPage() {
		if (this.content.length) {
			this.pages.push(this.content.join('\n'));
		}
		this.content = [];
		this.y = PAGE_HEIGHT - MARGIN;
	}

	finish(): Uint8Array {
		if (this.content.length) {
			this.pages.push(this.content.join('\n'));
			this.content = [];
		}
		return createPdf(this.pages);
	}
}

function drawCampbellDiagram(report: PdfReport, frequencies: number[], criticalSpeeds: number[]) {
	report.ensure(250);
	report.text('Campbell-Style Diagram', MARGIN, report.y, 12, 'bold');
	report.y -= 14;

	const left = MARGIN + 18;
	const bottom = report.y - 205;
	const width = PAGE_WIDTH - MARGIN * 2 - 34;
	const height = 180;
	const maxFrequency = Math.max(100, ...frequencies) * 1.2;
	const maxSpeed = Math.max(1200, ...criticalSpeeds, maxFrequency * 60) * 1.1;

	report.rect(left, bottom, width, height, '0.35 0.39 0.45', 0.8);
	report.text('Frequency (Hz)', left, bottom + height + 8, 8);
	report.text('Speed (rpm)', left + width - 46, bottom - 18, 8);
	report.text('0', left - 8, bottom - 12, 7);
	report.text(formatNumber(maxSpeed, 0), left + width - 18, bottom - 12, 7);
	report.text(formatNumber(maxFrequency, 0), left - 28, bottom + height - 2, 7);

	const xForSpeed = (speed: number) => left + (speed / maxSpeed) * width;
	const yForFrequency = (frequency: number) => bottom + (frequency / maxFrequency) * height;

	for (const order of [1, 2, 3]) {
		const endSpeed = Math.min(maxSpeed, (maxFrequency * 60) / order);
		const x2 = xForSpeed(endSpeed);
		const y2 = yForFrequency((order * endSpeed) / 60);
		report.line(left, bottom, x2, y2, order === 1 ? '0.91 0.38 0.12' : '0.68 0.71 0.76', order === 1 ? 1.2 : 0.8);
		report.text(`${order}x`, Math.min(x2 + 4, left + width - 16), Math.min(y2 - 2, bottom + height - 8), 7);
	}

	frequencies.forEach((frequency, index) => {
		const y = yForFrequency(frequency);
		report.line(left, y, left + width, y, '0.10 0.36 0.72', 0.9);
		report.text(`M${index + 1} ${formatNumber(frequency)} Hz`, left + width - 76, y + 3, 7);
		const speed = frequency * 60;
		if (speed <= maxSpeed) {
			const x = xForSpeed(speed);
			report.fillRect(x - 2, y - 2, 4, 4, '0.05 0.05 0.05');
		}
	});

	report.y = bottom - 28;
	report.paragraph('Horizontal blue lines are natural frequencies. Sloped lines are excitation orders. Black markers show first-order critical speed crossings.', 8, MARGIN, 104);
}

function createPdf(pageContents: string[]): Uint8Array {
	const encoder = new TextEncoder();
	const objects: string[] = [];
	const pageIds: number[] = [];
	let nextObjectId = 5;

	objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
	objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
	objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

	for (const content of pageContents) {
		const pageId = nextObjectId++;
		const contentId = nextObjectId++;
		pageIds.push(pageId);
		objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(PAGE_WIDTH)} ${num(PAGE_HEIGHT)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
		objects[contentId] = `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`;
	}

	objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

	let pdf = '%PDF-1.4\n';
	const offsets = new Array(nextObjectId).fill(0);
	for (let id = 1; id < nextObjectId; id += 1) {
		offsets[id] = encoder.encode(pdf).length;
		pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
	}

	const xrefOffset = encoder.encode(pdf).length;
	pdf += `xref\n0 ${nextObjectId}\n0000000000 65535 f \n`;
	for (let id = 1; id < nextObjectId; id += 1) {
		pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
	}
	pdf += `trailer\n<< /Size ${nextObjectId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
	return encoder.encode(pdf);
}

function wrap(value: string, maxChars: number): string[] {
	const words = clean(value).split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';

	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (next.length > maxChars && line) {
			lines.push(line);
			line = word;
		} else {
			line = next;
		}
	}

	if (line) lines.push(line);
	return lines.length ? lines : [''];
}

function formatMetadata(metadata?: MetadataPair[]): string {
	if (!metadata?.length) return '';
	return metadata
		.slice(0, 8)
		.map((entry) => `${clean(entry.key || '')}: ${clean(String(entry.value ?? ''))}`)
		.filter((entry) => entry.length > 2)
		.join(' | ');
}

function defaultFilename(systemName?: string) {
	const prefix = clean(systemName || 'design-stage')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${prefix || 'design-stage'}-torsional-vibration-analysis.pdf`;
}

function formatDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function asNumberArray(value?: unknown[]): number[] {
	if (!Array.isArray(value)) return [];
	return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
}

function formatValue(value: unknown, unit: string) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 'n/a';
	return `${formatNumber(parsed)} ${unit}`;
}

function formatNumber(value: unknown, decimals = 3) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 'n/a';
	if (Math.abs(parsed) >= 1000) return parsed.toFixed(decimals === 3 ? 1 : decimals);
	return parsed.toFixed(decimals).replace(/\.?0+$/, '');
}

function clean(value: unknown): string {
	return String(value ?? '')
		.replace(/[^\x20-\x7E]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function escapePdfText(value: string): string {
	return clean(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function num(value: number): string {
	return Number(value.toFixed(3)).toString();
}
