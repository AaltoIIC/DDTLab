import type {
  AnySysmlElement,
  BindingConnectorAsUsageElement,
  ConnectionUsageElement,
  ElementId,
  FlowUsageElement,
  ItemUsageElement,
  PackageElement,
  PartUsageElement,
  PortUsageElement,
  SysmlDocument
} from './elements';
import { getOwnedIds } from './namespaces';

/**
 * View scoping — which elements belong to one canvas level.
 *
 * The legacy canvas is flat per level: entering a part usage swaps the whole
 * node/edge list to that usage's own content, and packages are non-navigable
 * overlays whose members render on the *same* level as the package itself.
 * This module mirrors that exactly over the semantic ownership tree:
 *
 * - scope 'root' (or the root namespace id): members of the root, plus members
 *   of any root-owned packages flattened into the same level.
 * - scope = a part/item usage: the usage's owned child usages (drill-down
 *   content) plus that usage's own port usages, which become boundary
 *   artifacts in the drill-down view.
 *
 * Relationships (flow/connection/binding) belong to the level of their owning
 * container: a relationship owned by the root or by a package flattened into
 * the view renders there; a relationship owned by a usage renders only in
 * that usage's drill-down view.
 */
export type ViewScopeId = ElementId | 'root';

export interface CollectedViewElements {
  /** Usages/packages rendered as nodes at this level (packages flattened in). */
  nodes: Array<PackageElement | PartUsageElement | ItemUsageElement>;
  /** Relationships rendered as edges at this level. */
  relationships: Array<FlowUsageElement | ConnectionUsageElement | BindingConnectorAsUsageElement>;
  /** The scope usage's own ports — boundary artifacts when scope is a usage. */
  boundaryPorts: PortUsageElement[];
}

const NODE_METACLASSES = new Set(['package', 'partUsage', 'itemUsage']);
const EDGE_METACLASSES = new Set(['flowUsage', 'connectionUsage', 'bindingConnectorAsUsage']);

export function collectViewElements(
  document: SysmlDocument,
  scopeId: ViewScopeId
): CollectedViewElements {
  const scope: ElementId | null = scopeId === 'root' ? null : scopeId;
  const owner = scope === null ? null : document.elements[scope];
  if (scope !== null && !owner) return { nodes: [], relationships: [], boundaryPorts: [] };

  const nodes: CollectedViewElements['nodes'] = [];
  const relationships: CollectedViewElements['relationships'] = [];
  const boundaryPorts: PortUsageElement[] = [];
  const visited = new Set<ElementId>();

  // Boundary artifacts: only a part/item usage scope has its own ports, and
  // they render as internal-port nodes when that usage is being viewed.
  if (owner && (owner.metaclass === 'partUsage' || owner.metaclass === 'itemUsage')) {
    for (const id of getOwnedIds(document, owner.id)) {
      const child = document.elements[id];
      if (child?.metaclass === 'portUsage') boundaryPorts.push(child);
    }
  }

  // Packages flatten: their members are drawn on the same level, so descend
  // through package ownership but never into a usage's owned content (that is
  // the next drill-down level).
  const visit = (containerId: ElementId | null): void => {
    for (const id of getOwnedIds(document, containerId)) {
      if (visited.has(id)) continue;
      const child = document.elements[id];
      if (!child) continue;
      if (child.metaclass === 'package') {
        visited.add(id);
        nodes.push(child);
        visit(child.id);
      } else if (NODE_METACLASSES.has(child.metaclass)) {
        visited.add(id);
        nodes.push(child as CollectedViewElements['nodes'][number]);
      } else if (EDGE_METACLASSES.has(child.metaclass)) {
        visited.add(id);
        relationships.push(child as CollectedViewElements['relationships'][number]);
      }
    }
  };

  visit(scope);
  return { nodes, relationships, boundaryPorts };
}
