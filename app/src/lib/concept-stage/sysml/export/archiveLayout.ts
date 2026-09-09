/**
 * KerML Clause 10 project-archive layout (plan §5 Phase 6).
 *
 * The layout is confirmed empirically from the official `Systems-Library.kpar`
 * pinned under `docs/normative/sysml-v2-20250201/`: a zip whose root holds a
 * project folder named after the model, containing one `.sysml` file per
 * top-level package, plus a `.project.json` (name, version, `usage[]`
 * dependency archives with version constraints) and a `.meta.json`
 * (package→file `index`, `created`, `metamodel` URI).
 */
export const PROJECT_FILE = '.project.json';
export const META_FILE = '.meta.json';

/** Normative metamodel URI for the pinned release (SysML 20250201). */
export const METAMODEL_URI = 'https://www.omg.org/spec/SysML/20250201';

export interface ProjectDependency {
  /** Resource of the dependency archive (e.g. the official Semantic-Library.kpar URL). */
  resource: string;
  versionConstraint: string;
}

export interface ProjectJson {
  name: string;
  version: string;
  usage: ProjectDependency[];
}

export interface MetaJson {
  /** Top-level namespace name -> `.sysml` file name. */
  index: Record<string, string>;
  created: string;
  metamodel: string;
}

/** Deterministic pretty JSON (2-space indent, stable key order, no trailing newline). */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function buildProjectJson(options: {
  name: string;
  version?: string;
  usage?: ProjectDependency[];
}): string {
  const project: ProjectJson = {
    name: options.name,
    version: options.version ?? '1.0.0',
    usage: options.usage ?? []
  };
  return formatJson(project);
}

export function buildMetaJson(options: {
  index: Record<string, string>;
  created: string;
  metamodel?: string;
}): string {
  const meta: MetaJson = {
    index: options.index,
    created: options.created,
    metamodel: options.metamodel ?? METAMODEL_URI
  };
  return formatJson(meta);
}

/** Strip characters that are illegal in folder/file names (shared with the emitter). */
export function sanitizeFolderName(name: string): string {
  const sanitized = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .trim();
  return sanitized.length > 0 ? sanitized : 'Model';
}