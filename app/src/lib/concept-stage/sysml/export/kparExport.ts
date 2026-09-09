/**
 * `.kpar` export (plan §5 Phase 6) — model → KerML Clause 10 project archive.
 *
 * The export is gated on the WF001–WF008 rule engine: a document with
 * error-severity diagnostics cannot be exported (invalid models are not
 * created through the repository API and invalid `.kpar` exports are blocked —
 * plan §9). Heuristic warnings never block.
 *
 * Output is deterministic: the same document + options produce identical text
 * and (with a fixed `created` date) identical zip bytes. Presentation-only
 * data (positions, colors, interface labels, tool metadata) never reaches the
 * semantic files (decisions 13/21/25/26).
 */
import JSZip from 'jszip';
import { validateDocument } from '../validate';
import type { Diagnostic } from '../repo/diagnostics';
import type { SysmlDocument } from '../model/elements';
import { emitDocumentTexts, sanitizeFileName } from './textualEmitter';
import { buildMetaJson, buildProjectJson, META_FILE, PROJECT_FILE, sanitizeFolderName } from './archiveLayout';

export interface KparExportOptions {
  /** `.project.json` name (default: the model root name). */
  projectName?: string;
  /** `.project.json` version (default `1.0.0`). */
  version?: string;
  /**
   * ISO timestamp for `.meta.json` `created` (default: now). Injectable so
   * tests (and CI) can pin deterministic archives.
   */
  created?: string;
  /**
   * Dependency archives with version constraints (default `[]` — the emitted
   * subset is self-contained: it declares no imports, so no library
   * dependencies are claimed; decision 27).
   */
  usage?: Array<{ resource: string; versionConstraint: string }>;
}

export interface KparArchive {
  /** Project folder name inside the zip (named after the model). */
  folderName: string;
  /**
   * Path (relative to the archive root) -> UTF-8 text content. Keys are
   * `<folderName>/<fileName>`; the folder entry itself is implicit (jszip
   * `folder()` creates it on zipping).
   */
  files: Record<string, string>;
  /** Top-level namespace name -> file name (the `.meta.json` index). */
  index: Record<string, string>;
  projectName: string;
  created: string;
}

export type KparExportResult =
  | { ok: true; archive: KparArchive }
  | { ok: false; diagnostics: Diagnostic[] };

/**
 * Export a document to the Clause 10 archive file map. Blocked (returns
 * `ok: false` with diagnostics) when the document has error-severity WF
 * diagnostics; warnings pass.
 */
export function exportDocumentToKpar(document: SysmlDocument, options: KparExportOptions = {}): KparExportResult {
  const diagnostics = validateDocument(document);
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { ok: false, diagnostics };
  }

  const projectName = options.projectName ?? document.root.name;
  const folderName = sanitizeFolderName(projectName);
  const created = options.created ?? new Date().toISOString();

  const files: Record<string, string> = {};
  const index: Record<string, string> = {};

  for (const file of emitDocumentTexts(document)) {
    const path = `${folderName}/${file.fileName}`;
    files[path] = file.text;
    index[file.namespaceName] = file.fileName;
  }

  files[`${folderName}/${PROJECT_FILE}`] = buildProjectJson({
    name: projectName,
    version: options.version,
    usage: options.usage
  });
  files[`${folderName}/${META_FILE}`] = buildMetaJson({
    index,
    created,
    metamodel: undefined // defaults to the normative SysML 20250201 URI
  });

  return {
    ok: true,
    archive: { folderName, files, index, projectName, created }
  };
}

/**
 * Zip the file map into a `.kpar` Blob (jszip — the archive keeps a directory
 * entry for the project folder). Pass the same `date` used for `created` to
 * get byte-deterministic archives.
 */
export async function zipKparArchive(archive: KparArchive, date?: Date): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(archive.folderName);
  if (!folder) throw new Error('kparExport: cannot create project folder');
  for (const [path, content] of Object.entries(archive.files)) {
    const relative = path.slice(archive.folderName.length + 1);
    folder.file(relative, content, { date: date ?? new Date(archive.created) });
  }
  return zip.generateAsync({ type: 'blob', platform: 'UNIX' });
}

/** Trigger a browser download for the generated archive (mirrors the design-stage zip pattern). */
export function downloadKparArchive(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.endsWith('.kpar') ? fileName : `${fileName}.kpar`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Default download file name for an exported archive. */
export function kparFileName(archive: KparArchive): string {
  return `${sanitizeFileName(archive.projectName)}.kpar`;
}