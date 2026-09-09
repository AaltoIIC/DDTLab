# SysML v2 Support — Concept Stage Compliance Statement

**Applies to:** the *Concept Stage* of DDT Lab (`app/src/lib/concept-stage`), and only to content
that enters the semantic SysML model through the concept-stage authoring path.

**Claim:** *SysML v2 Abstract Syntax Conformance — supported subset*, plus *Model Interchange
Conformance* for **export** (`.kpar`, KerML Clause 10). This tool does **not** claim full SysML v2
conformance: it supports the documented metaclass subset below, validates it against the normative
well-formedness constraints it implements, and exports it as a syntactically conformant project
archive. **Import is not implemented** (export-only milestone, plan decision 3).

## 1. Normative version

| Item | Value |
|---|---|
| Specification | OMG SysML v2.0 — formal **September 2025** OMG release (KerML included by reference) |
| Release / artifact version id | `20250201` |
| SysML metamodel URI (`.kpar` metadata) | `https://www.omg.org/spec/SysML/20250201` |
| KerML metamodel URI | `https://www.omg.org/spec/KerML/20250201` |
| Machine-readable authority | `docs/normative/sysml-v2-20250201/` — `SysML.xmi`, `SysML.json`, `KerML.xmi`, `KerML.json`, plus the official `.kpar` libraries (`Systems-Library.kpar`, …) |
| Textual-notation reference | Concrete syntax as observed in the official `Systems-Library.kpar` and the SysML v2 language introduction / Pilot checker documentation |

The implementation is table-driven from the pinned artifacts: the metaclass registry
(`sysml/model/metaclassRegistry.ts`) and the normative configuration
(`sysml/model/normativeConfig.ts`) quote `xmi:id`s, generalization refs, `ownedRule` names and
`specializesFromLibrary(...)` arguments verbatim from `SysML.xmi`/`KerML.xmi`; JSON serialization
authority is `SysML.json` (`serializesAs`).

## 2. Supported metaclasses

Source = the artifact that pins the element (`S.xmi` = `SysML.xmi`, `K.xmi` = `KerML.xmi`).
"Serializes as" notes the JSON abstract-syntax form used on interchange when it differs from the
metaclass name. Registry: `sysml/model/metaclassRegistry.ts`.

| Metaclass key | SysML/KerML metaclass | Category | Source | Notes |
|---|---|---|---|---|
| `package` | `Package` | namespace | K.xmi | root-owned package; `Definitions` container for synthesized library definitions |
| `partDefinition` | `PartDefinition` | definition | S.xmi | constraint `checkPartDefinitionSpecialization` (`Parts::Part`) |
| `partUsage` | `PartUsage` | usage | S.xmi | constraints incl. `validatePartUsagePartDefinition` (typing) |
| `itemDefinition` | `ItemDefinition` | definition | S.xmi | |
| `itemUsage` | `ItemUsage` | usage | S.xmi | constraints incl. `deriveItemUsageItemDefinition` |
| `attributeDefinition` | `AttributeDefinition` | definition | S.xmi | constraint `validateAttributeDefinitionFeatures` |
| `attributeUsage` | `AttributeUsage` | usage | S.xmi | mass values are literal attribute usages (decisions 4, 26) |
| `portDefinition` | `PortDefinition` | definition | S.xmi | |
| `portUsage` | `PortUsage` | usage | S.xmi | `checkPortUsageOwnedPortSpecialization` (`Parts::Part::ownedPorts`); UI direction kept on the element as tool data, never emitted (decision 21) |
| `connectionDefinition` | `ConnectionDefinition` | definition | S.xmi | |
| `connectionUsage` | `ConnectionUsage` | relationship | S.xmi | `checkConnectionUsageBinarySpecialization` (`Connections::binaryConnections`) |
| `bindingConnectorAsUsage` | `BindingConnectorAsUsage` | relationship | S.xmi | `validateBindingConnectorIsBinary`; emitted as anonymous `bind a = b;` (decision 27) |
| `successionAsUsage` | `SuccessionAsUsage` | relationship | S.xmi | registry entry; not currently authored by the UI |
| `connectorAsUsage` | `ConnectorAsUsage` | relationship | S.xmi | **abstract** — cannot be instantiated in a model (verbatim XMI comment); documented as the concrete-connector base |
| `flowDefinition` | `FlowDefinition` | definition | S.xmi | `checkFlowDefinitionBinarySpecialization` (`Flows::Message`) |
| `flowUsage` | `FlowUsage` | usage | S.xmi | serialized form of the plan's flow connections |
| `successionFlowUsage` | `SuccessionFlowUsage` | usage | S.xmi | |
| `flowConnectionUsage` | `FlowConnectionUsage` | relationship | S.xmi (comments only) | **no JSON `@type` in `SysML.json` 20250201**; serializes as `flowUsage` (`serializesAs`), emitted as `flow <n> from <a> to <b>;` (decision 27) |
| `interfaceDefinition` | `InterfaceDefinition` | definition | S.xmi | registry entry; interface catalog labels stay presentation-only (decision 21) |
| `interfaceUsage` | `InterfaceUsage` | usage | S.xmi | `checkInterfaceUsageBinarySpecialization` |
| `variantMembership` | `VariantMembership` | membership | S.xmi | registry entry; variants are out of the v1 editing subset |
| `membership` | `Membership` | membership | K.xmi | name uniqueness via `Membership.isDistinguishableFrom` |
| `owningMembership` | `OwningMembership` | membership | K.xmi | |
| `comment` | `Comment` | annotation | K.xmi | element `documentation`, emitted as `doc` blocks |

**Deliberately out of subset (v1):** `Specialization`/generalization editing, redefinition,
abstract-class authoring, variants, concern/viewpoint metaclasses, calculation/expression
semantics beyond literals, occurrence/thread semantics, and requirements (requirements live in the
Design stage — decision 6).

## 3. Well-formedness validation (WF001–WF008)

Rules are stable for tooling (`ruleId`). Labels per the Phase 4 review correction: **normative**
rules trace to constraints in the pinned `SysML.xmi`/`KerML.xmi`; **tool-integrity** rules enforce
repository/serialization invariants and are never presented as SysML validation;
**warning/heuristic** guidance is emitted at `warning` severity with the message labeled
heuristic. Implementation: `sysml/validate/rules.ts`, runner `sysml/validate/validateDocument.ts`;
fixture set (positive + negative per rule) in `sysml/validate/fixtures.ts`.

| Rule | Constraint | Label | Normative trace |
|---|---|---|---|
| `WF001-name-uniqueness` | member names unique within an owning namespace | normative | `Membership.isDistinguishableFrom` (KerML.xmi) |
| `WF002-type-exists` | a usage's definition resolves and its metaclass matches (PartUsage↔PartDefinition, ItemUsage↔ItemDefinition, PortUsage↔PortDefinition) | normative; untyped part/item usages → warning (heuristic) | `PartUsage.validatePartUsagePartDefinition`, `ItemUsage.deriveItemUsageItemDefinition`, `PortUsage` typing constraints (SysML.xmi) |
| `WF003-ownership` | owner exists; containment respects metaclass rules (ports owned by part/item types and usages) | normative | `PortUsage.checkPortUsageOwnedPortSpecialization` (`Parts::Part::ownedPorts`) |
| `WF004-connection-ends` | relationship ends resolve to the correct semantic features/ports; flow direction follows normative flow semantics, never canvas handle strings | normative | `ConnectionUsage.checkConnectionUsageBinarySpecialization` (`Connections::binaryConnections`), `FlowUsage.checkFlowUsageFlowSpecialization` (`Flows::flows`) |
| `WF005-binding-ends` | binding ends reference resolvable, type-compatible features/usages | normative; compatibility check is subset-limited → warning (heuristic) | `BindingConnector.validateBindingConnectorIsBinary` |
| `WF006-no-dangling-refs` | every stored id reference resolves | tool-integrity | — (repository/serialization invariant) |
| `WF007-namespace-root` | exactly one root namespace per system model | tool-integrity | — (serialization invariant) |
| `WF008-empty-name` | names non-empty where required (definitions, usages) | tool-integrity | — (name-based handle scheme, decision 19) |

Behavior: the rule engine runs on **every repository mutation** and on model load. Error-severity
diagnostics reject the mutation (invalid models are never committed — decision 8); warnings never
block. The sidebar shows a passive, non-blocking model-health badge (green/amber/red) driven by the
live diagnostic set.

## 4. Model interchange (`.kpar` export)

- Archive layout confirmed from the official `Systems-Library.kpar` (KerML Clause 10): a zip whose
  root holds a project folder named after the model, containing one `.sysml` file per top-level
  namespace, a `.project.json` (`name`, `version`, `usage[]` — `[]` for the self-contained subset)
  and a `.meta.json` (namespace→file `index`, `created`, `metamodel` URI). Implementation:
  `sysml/export/archiveLayout.ts`, `kparExport.ts`, `textualEmitter.ts`.
- Emitted syntax (grounded in the official archive + language docs, decision 27): `part def` /
  `item def` / `port def` / `attribute def` / `connection def`, usages with literal attribute
  values, `flow <n> [:<T>] from <a> to <b>;`, `connection <n> [:<T>] connect <a> to <b>;`,
  `bind <a> = <b>;` (anonymous — KerML textual bindings have no name), `doc` comment blocks.
  KerML name escaping: non-basic names and keyword collisions (e.g. a port named `out`) are emitted
  as single-quoted restricted names.
- Export is **validation-gated**: WF error severity blocks the archive entirely; heuristic warnings
  never block. Deterministic: injectable `created` and stable ordering produce byte-identical
  archives for identical input.
- **Never emitted:** presentation data (positions, sizes, colors, `compatibility`), port UI
  direction, interface labels, and per-usage metadata key/value pairs — all tool metadata keyed by
  element id in the presentation map (decisions 13, 21, 25, 26).

## 5. Known limitations

1. **Session-scoped document, no importer (decisions 3, 20).** The semantic model is rebuilt
   in-session from the durable canvas: on bind, the persisted root canvas is re-mirrored into the
   model via the same add-only, idempotent authoring path every drop/connect uses (decision 29).
   `.kpar` **import** is not implemented; export-only interchange. Old-format persisted data
   (definitions, templates, requirements, nested legacy views) is never converted.
2. **Port interface labels are presentation-only (decision 21).** Setting a port's interface to
   *None* is canvas-only; interface labels and UI in/out direction never reach interchange.
3. **Metadata pairs are tool metadata (decision 26).** Per-usage key/value metadata stays in the
   presentation map (excluded from interchange); only mass (and other literal attributes) are
   model `AttributeUsage`s.
4. **Untyped usages are allowed (decision 23).** SysML permits anonymous types; untyped part/item
   usages surface as WF002 *warnings* only.
5. **No editing of generalization, variants, expressions, requirements** (plan §4, §6; decision 6).
6. **Bindings are anonymous in textual form (decision 27)** — binding names are not representable
   in the `bind` shorthand and are not emitted.
7. **Name-based canvas handles (decision 19).** Canvas port handles derive from port usage names;
   handle strings are presentation-only and never serialized as SysML relationship ends.
8. **FlowConnectionUsage has no JSON `@type` in this release** — flows serialize as `FlowUsage`
   (registry `serializesAs`), per the pinned `SysML.json`.
9. **External checker not yet run in CI.** Generated archives follow the layout and syntax verified
   against the official artifacts, but an external reference checker (e.g. the SysML v2 Pilot/Jupyter
   reference implementation) is not available in CI; validating our exports against one remains the
   last open interoperability item before claiming external round-trip.

## 6. Verification status

- **Unit (Vitest, `app/tests/unit/concept-stage-sysml-phase*.test.ts`):** metaclass registry and
  normative config (phase 0), abstract-syntax core + namespaces (phase 1), repository CRUD and
  referential integrity (phase 2), projection/authoring/live wiring (phase 3), WF001–WF008 fixture
  matrix incl. repository + health-store integration (phase 4), semantic library templates and
  instantiation (phase 5), exporter golden emission + deterministic archives + invalid-export gate
  (phase 6).
- **E2E (Playwright, `app/tests/e2e/concept-export.spec.ts`):** build a two-part system with a flow
  connection through the UI, persist, reload (session rebuild), export `.kpar`, and verify the
  archive contents (metadata files, `.sysml` content, no presentation data).
- `npm run check` clean; full Vitest suite green.