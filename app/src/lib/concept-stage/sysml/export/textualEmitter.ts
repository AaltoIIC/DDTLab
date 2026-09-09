/**
 * SysML v2 textual emitter for the supported subset (plan §5 Phase 6).
 *
 * Emits one `.sysml` file per top-level namespace (the model root plus each
 * root-owned package), in the textual notation of the pinned 20250201
 * release. Syntax is grounded in the official `Systems-Library.kpar`
 * (`docs/normative/sysml-v2-20250201/`): `package`, `part def`/`item def`/
 * `port def`/`attribute def`/`connection def`, `part`/`item`/`port`/
 * `attribute` usages with literal values, `flow <n> from <a> to <b>;`,
 * `connection <n> : <T> connect <a> to <b>;`, `bind <a> = <b>;`, and `doc`
 * comment blocks. Cross-file type references use qualified names from the
 * outermost namespace (`Definitions::Motor`), matching how the official
 * library files reference their imports.
 *
 * Boundaries honored (decisions 13/21/25/26): presentation-only data
 * (positions, colors, interface labels, tool metadata) is NEVER emitted, and
 * port UI direction is not emitted — normative direction lives on flow ends.
 */
import type {
  AnySysmlElement,
  ElementId,
  SysmlDocument
} from '../model/elements';
import { getOwnedIds } from '../model/namespaces';

/** One emitted `.sysml` file. `namespaceName` is the top-level namespace it represents. */
export interface EmittedSysmlFile {
  namespaceName: string;
  fileName: string;
  text: string;
}

/** Keywords cannot be used as plain basic names; wrap them like any non-basic name. */
const KERML_KEYWORDS = new Set([
  'package', 'import', 'alias', 'ref', 'feature', 'part', 'item', 'port', 'attribute',
  'connection', 'flow', 'bind', 'connect', 'def', 'end', 'doc', 'abstract', 'derived',
  'in', 'out', 'inout', 'event', 'action', 'state', 'requirement', 'interface',
  'from', 'to', 'of', 'about', 'true', 'false', 'then', 'else', 'if', 'for',
  'specializes', 'redefines', 'subsets', 'ordered', 'nonunique', 'sufficient'
]);

/** Basic name: letters/digits/underscore, starting with a letter or underscore. */
const BASIC_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * KerML name notation: basic names are emitted verbatim; everything else is a
 * restricted name in single quotes with `\` and `'` escaped (plan: names like
 * "Permanent Magnet Motor" carry spaces). Keywords are quoted too, so a usage
 * named `part` stays distinguishable.
 */
export function escapeName(name: string): string {
  if (BASIC_NAME.test(name) && !KERML_KEYWORDS.has(name)) return name;
  return `'${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const INDENT = '    ';

function indent(level: number): string {
  return INDENT.repeat(level);
}

/* ── Feature reference resolution ────────────────────────────────────────── */

/**
 * Textual reference to a feature (port/usage end of a flow/connection/binding):
 * the dotted path of the owning feature chain, e.g. `motor.shaft`, optionally
 * prefixed with the qualified name of the enclosing namespace when the end
 * lives outside the referencing namespace (`Pkg::motor.shaft`). The path
 * starts at the first feature ancestor whose owner is a namespace (root or
 * package), mirroring KerML feature-reference resolution.
 */
export function featureReferencePath(document: SysmlDocument, featureId: ElementId, fromNamespaceId: ElementId | null): string {
  const element = document.elements[featureId];
  if (!element) return escapeName('?unknown?');

  const segments: string[] = [element.name];
  let ownerId = element.ownerId;
  let topFeatureId = featureId;

  while (ownerId !== null) {
    const owner = document.elements[ownerId];
    if (!owner) break;
    if (isFeature(owner)) {
      segments.unshift(owner.name);
      topFeatureId = owner.id;
    }
    ownerId = owner.ownerId;
  }

  const enclosingNamespace = enclosingNamespaceId(document, topFeatureId);
  const path = segments.map(escapeName).join('.');
  // KerML name resolution: a reference needs no qualifier when the feature is
  // in the referencing namespace, in one of its ancestor namespaces (walk-up
  // resolution), or in the root (globally visible). Sibling-package members
  // need a qualified name: `::` between namespace and top feature, then `.`
  // for the feature path.
  if (enclosingNamespace === fromNamespaceId || enclosingNamespace === null) return path;
  if (isAncestorNamespace(document, enclosingNamespace, fromNamespaceId)) return path;
  const prefix = qualifiedNamespaceName(document, enclosingNamespace);
  return prefix ? `${prefix}::${path}` : path;
}

/** Metaclasses whose elements are features (usable as connection ends). */
const FEATURE_METACLASSES = new Set([
  'partDefinition', 'itemDefinition', 'portDefinition', 'attributeDefinition',
  'connectionDefinition', 'partUsage', 'itemUsage', 'portUsage', 'attributeUsage'
]);

function isFeature(element: AnySysmlElement): boolean {
  return FEATURE_METACLASSES.has(element.metaclass);
}

/** Nearest owning namespace (root or package) of an element. */
function enclosingNamespaceId(document: SysmlDocument, id: ElementId): ElementId | null {
  let ownerId = document.elements[id]?.ownerId ?? null;
  while (ownerId !== null) {
    const owner = document.elements[ownerId];
    if (!owner) return null;
    if (owner.metaclass === 'package') return owner.id;
    ownerId = owner.ownerId;
  }
  return null;
}

/** Whether `ancestorId` is an owning-package ancestor of `namespaceId`. */
function isAncestorNamespace(document: SysmlDocument, ancestorId: ElementId, namespaceId: ElementId | null): boolean {
  if (namespaceId === null) return false;
  let ownerId = document.elements[namespaceId]?.ownerId ?? null;
  while (ownerId !== null) {
    const owner = document.elements[ownerId];
    if (!owner) return false;
    if (owner.id === ancestorId) return true;
    ownerId = owner.ownerId;
  }
  return false;
}

/** `::`-qualified name of a namespace relative to the model root. */
function qualifiedNamespaceName(document: SysmlDocument, namespaceId: ElementId | null): string {
  if (namespaceId === null) return '';
  const element = document.elements[namespaceId];
  if (!element || element.metaclass !== 'package') return '';
  const names: string[] = [element.name];
  let ownerId = element.ownerId;
  while (ownerId !== null) {
    const owner = document.elements[ownerId];
    if (!owner) break;
    if (owner.metaclass === 'package') names.unshift(owner.name);
    ownerId = owner.ownerId;
  }
  return names.map(escapeName).join('::');
}

/** Qualified type reference (`Definitions::Motor`) from the outermost namespace. */
export function qualifiedTypeReference(document: SysmlDocument, id: ElementId): string {
  const element = document.elements[id];
  if (!element) return escapeName('?unknown?');
  const names: string[] = [element.name];
  let ownerId = element.ownerId;
  while (ownerId !== null) {
    const owner = document.elements[ownerId];
    if (!owner) break;
    if (owner.metaclass === 'package') names.unshift(owner.name);
    ownerId = owner.ownerId;
  }
  return names.map(escapeName).join('::');
}

/* ── Literal values ──────────────────────────────────────────────────────── */

function emitLiteral(literal: string | number | boolean): string {
  if (typeof literal === 'number') return String(literal);
  if (typeof literal === 'boolean') return literal ? 'true' : 'false';
  return `"${literal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/* ── Doc comments ────────────────────────────────────────────────────────── */

/**
 * `doc` comment block (KerML textual comment). Emitted from the element's
 * `documentation` field and from `Comment` elements about the element.
 */
function emitDoc(document: SysmlDocument, element: AnySysmlElement, level: number): string {
  const bodies: string[] = [];
  if (element.documentation !== undefined && element.documentation.trim().length > 0) {
    bodies.push(element.documentation);
  }
  for (const other of Object.values(document.elements)) {
    if (other.metaclass === 'comment' && other.aboutIds.includes(element.id) && other.body.trim().length > 0) {
      bodies.push(other.body);
    }
  }
  if (bodies.length === 0) return '';

  const lines = bodies.flatMap((body) => body.split('\n'));
  const pad = indent(level);
  const body = lines
    .map((line) => `${pad} *${line.length > 0 ? ` ${line}` : ''}`)
    .join('\n');
  return `${pad}doc\n${pad}/*\n${body}\n${pad} */\n`;
}

/* ── Element emission ────────────────────────────────────────────────────── */

function emitElement(document: SysmlDocument, element: AnySysmlElement, level: number): string {
  switch (element.metaclass) {
    case 'package':
      return emitPackageInline(document, element, level);
    case 'partDefinition':
      return emitDefinition(document, element, 'part def', level);
    case 'itemDefinition':
      return emitDefinition(document, element, 'item def', level);
    case 'portDefinition':
      return emitPortDefinition(document, element, level);
    case 'attributeDefinition':
      return emitAttributeDefinition(document, element, level);
    case 'connectionDefinition':
      return emitConnectionDefinition(document, element, level);
    case 'partUsage':
      return emitUsage(document, element, 'part', level);
    case 'itemUsage':
      return emitUsage(document, element, 'item', level);
    case 'portUsage':
      return emitPortUsage(document, element, level);
    case 'attributeUsage':
      return emitAttributeUsage(document, element, level);
    case 'flowUsage':
      return emitFlowUsage(document, element, level);
    case 'connectionUsage':
      return emitConnectionUsage(document, element, level);
    case 'bindingConnectorAsUsage':
      return emitBinding(document, element, level);
    case 'comment':
      // Standalone comments annotate their first about-target (emitted with
      // it via emitDoc); an orphan body attaches to the enclosing namespace.
      return '';
    default:
      return '';
  }
}

/** Members emitted inside a definition/usage body. */
function emitOwnedMembers(document: SysmlDocument, ownerId: ElementId, level: number): string {
  const owner = document.elements[ownerId];
  if (!owner) return '';
  const ids = getOwnedIds(document, ownerId);
  if ('attributeIds' in owner && Array.isArray(owner.attributeIds)) {
    for (const attributeId of owner.attributeIds) {
      if (!ids.includes(attributeId)) ids.push(attributeId);
    }
  }
  if ('flowFeatureIds' in owner && Array.isArray(owner.flowFeatureIds)) {
    for (const featureId of owner.flowFeatureIds) {
      if (!ids.includes(featureId)) ids.push(featureId);
    }
  }
  return ids
    .map((id) => document.elements[id])
    .filter((member): member is AnySysmlElement => member !== undefined)
    .map((member) => emitElement(document, member, level))
    .filter((text) => text.length > 0)
    .join('');
}

/** Emit an element plus its body as `keyword name { body }` (or `keyword name;` when empty). */
function emitWithBody(
  document: SysmlDocument,
  element: AnySysmlElement,
  header: string,
  body: string,
  level: number
): string {
  const pad = indent(level);
  const doc = emitDoc(document, element, level);
  if (body.length === 0) return `${doc}${pad}${header};\n`;
  return `${doc}${pad}${header} {\n${body}${pad}}\n`;
}

function emitDefinition(
  document: SysmlDocument,
  element: Extract<AnySysmlElement, { category: 'definition' }>,
  keyword: string,
  level: number
): string {
  const header = `${keyword} ${escapeName(element.name)}`;
  const body = emitOwnedMembers(document, element.id, level + 1);
  return emitWithBody(document, element, header, body, level);
}

function emitPortDefinition(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'portDefinition' }>, level: number): string {
  const header = `port def ${escapeName(element.name)}`;
  const body = emitOwnedMembers(document, element.id, level + 1);
  return emitWithBody(document, element, header, body, level);
}

function emitAttributeDefinition(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'attributeDefinition' }>, level: number): string {
  const type = element.attributeType ? ` : ${qualifiedTypeReference(document, element.attributeType)}` : '';
  return emitWithBody(document, element, `attribute def ${escapeName(element.name)}${type}`, '', level);
}

function emitConnectionDefinition(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'connectionDefinition' }>, level: number): string {
  const ends = (element.endIds ?? [])
    .map((endId) => document.elements[endId])
    .filter((end): end is AnySysmlElement => end !== undefined)
    .map((end) => {
      const type = 'definitionId' in end && end.definitionId
        ? ` : ${qualifiedTypeReference(document, end.definitionId)}`
        : '';
      return `${indent(level + 1)}end ${escapeName(end.name)}${type};\n`;
    })
    .join('');
  return emitWithBody(document, element, `connection def ${escapeName(element.name)}`, ends, level);
}

function emitUsage(
  document: SysmlDocument,
  element: Extract<AnySysmlElement, { metaclass: 'partUsage' | 'itemUsage' }>,
  keyword: string,
  level: number
): string {
  const type = element.definitionId ? ` : ${qualifiedTypeReference(document, element.definitionId)}` : '';
  const header = `${keyword} ${escapeName(element.name)}${type}`;
  const body = emitOwnedMembers(document, element.id, level + 1);
  return emitWithBody(document, element, header, body, level);
}

function emitPortUsage(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'portUsage' }>, level: number): string {
  const type = element.definitionId ? ` : ${qualifiedTypeReference(document, element.definitionId)}` : '';
  return emitWithBody(document, element, `port ${escapeName(element.name)}${type}`, '', level);
}

function emitAttributeUsage(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'attributeUsage' }>, level: number): string {
  const ref = element.isReference ? 'ref ' : '';
  const type = element.definitionId ? ` : ${qualifiedTypeReference(document, element.definitionId)}` : '';
  const value = element.literal !== undefined ? ` = ${emitLiteral(element.literal)}` : '';
  return emitWithBody(document, element, `${ref}attribute ${escapeName(element.name)}${type}${value}`, '', level);
}

function emitFlowUsage(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'flowUsage' }>, level: number): string {
  const type = element.flowDefinitionId ? ` : ${qualifiedTypeReference(document, element.flowDefinitionId)}` : '';
  const source = featureReferencePath(document, element.sourceEnd, element.ownerId);
  const target = featureReferencePath(document, element.targetEnd, element.ownerId);
  return emitWithBody(
    document,
    element,
    `flow ${escapeName(element.name)}${type} from ${source} to ${target}`,
    '',
    level
  );
}

function emitConnectionUsage(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'connectionUsage' }>, level: number): string {
  const type = element.connectionDefinitionId ? ` : ${qualifiedTypeReference(document, element.connectionDefinitionId)}` : '';
  const endA = featureReferencePath(document, element.endA, element.ownerId);
  const endB = featureReferencePath(document, element.endB, element.ownerId);
  return emitWithBody(
    document,
    element,
    `connection ${escapeName(element.name)}${type} connect ${endA} to ${endB}`,
    '',
    level
  );
}

function emitBinding(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'bindingConnectorAsUsage' }>, level: number): string {
  // KerML textual bindings are anonymous: `bind <a> = <b>;` (the name field is
  // not representable in the connector shorthand — decision 27).
  const endA = featureReferencePath(document, element.endA, element.ownerId);
  const endB = featureReferencePath(document, element.endB, element.ownerId);
  return emitWithBody(document, element, `bind ${endA} = ${endB}`, '', level);
}

/* ── Namespace files ─────────────────────────────────────────────────────── */

function emitPackageInline(document: SysmlDocument, element: Extract<AnySysmlElement, { metaclass: 'package' }>, level: number): string {
  const body = element.memberIds
    .map((id) => document.elements[id])
    .filter((member): member is AnySysmlElement => member !== undefined)
    .map((member) => emitElement(document, member, level + 1))
    .filter((text) => text.length > 0)
    .join('');
  return emitWithBody(document, element, `package ${escapeName(element.name)}`, body, level);
}

/** Emit the file for a namespace: the model root (namespaceId null) or a root-owned package. */
function emitNamespaceFile(document: SysmlDocument, namespaceId: ElementId | null): string {
  const isRoot = namespaceId === null;
  const packageElement = namespaceId === null ? undefined : document.elements[namespaceId];
  const name = isRoot
    ? document.root.name
    : packageElement?.metaclass === 'package'
      ? packageElement.name
      : 'Unnamed';
  const memberIds: ElementId[] = isRoot
    ? document.root.memberIds
    : packageElement?.metaclass === 'package'
      ? packageElement.memberIds
      : [];

  const body = memberIds
    .map((id) => document.elements[id])
    .filter((member): member is AnySysmlElement => member !== undefined)
    // Root-owned packages become their own files (one `.sysml` file per
    // top-level namespace); they are emitted inline only when nested.
    .filter((member) => !isRoot || member.metaclass !== 'package' || member.ownerId !== null)
    .map((member) => emitElement(document, member, 1))
    .filter((text) => text.length > 0)
    .join('');

  const doc = isRoot ? '' : emitDoc(document, packageElement as AnySysmlElement, 0);
  if (body.length === 0) return `${doc}package ${escapeName(name)};\n`;
  return `${doc}package ${escapeName(name)} {\n${body}}\n`;
}

/* ── Top-level entry point ───────────────────────────────────────────────── */

/**
 * Produce one `.sysml` text per top-level namespace: the model root plus each
 * root-owned package. File names are the sanitized namespace names; collisions
 * (two names sanitizing alike) get a numeric suffix so every file is unique.
 */
export function emitDocumentTexts(document: SysmlDocument): EmittedSysmlFile[] {
  const usedFileNames = new Set<string>();
  const files: EmittedSysmlFile[] = [];

  const add = (namespaceName: string, text: string): void => {
    let fileName = sanitizeFileName(namespaceName) + '.sysml';
    let suffix = 2;
    while (usedFileNames.has(fileName)) {
      fileName = `${sanitizeFileName(namespaceName)}-${suffix++}.sysml`;
    }
    usedFileNames.add(fileName);
    files.push({ namespaceName, fileName, text });
  };

  add(document.root.name, emitNamespaceFile(document, null));

  const rootOwnedPackages = document.root.memberIds
    .map((id) => document.elements[id])
    .filter((member): member is AnySysmlElement => member !== undefined && member.metaclass === 'package');
  for (const member of rootOwnedPackages) {
    add(member.name, emitNamespaceFile(document, member.id));
  }

  return files;
}

/** Strip characters that are illegal in file names and trim dots/spaces. */
export function sanitizeFileName(name: string): string {
  const sanitized = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .trim();
  return sanitized.length > 0 ? sanitized : 'Model';
}