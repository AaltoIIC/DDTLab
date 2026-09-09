# Plan: Abstract SysML v2 Compliance for the Concept Stage

**Scope:** `app/src/lib/concept-stage` only.
**Constraint:** keep the existing UI (XYFlow canvas, sidebar definition lists, sliders, editors) as-is.
**Target:** SysML v2 **Abstract Syntax Conformance** + **Model Interchange Conformance** for a documented subset.
**Spec:** `sysmlv2_spec.pdf` (local copy: `~/Desktop/Work/sysmlv2_spec.pdf`) — OMG SysML v2.0, Part 1 (KerML included by reference).

> **Decision record:** the initial claim is a **documented, verified subset**, not full language coverage. The supplied document is the formal September 2025 SysML 2.0 release listed by OMG. OMG’s 2.0 page identifies the associated normative machine-readable artifacts: `SysML/20250201/SysML.xmi` (abstract syntax), `SysML/20250201/SysML.json` (JSON abstract-syntax schema), and the Systems Library `.kpar`. These artifacts, rather than the PDF alone, are the implementation authority. Do not substitute beta artifacts.
>
> **Artifact status:** the artifacts are **publicly downloadable** from `omg.org` (no member gate). They have been
> downloaded and pinned in the repo at `docs/normative/sysml-v2-20250201/`:
> `SysML.xmi`, `SysML.json`, `KerML.xmi`, `KerML.json`, `Systems-Library.kpar`, `Semantic-Library.kpar`,
> `Data-Type-Library.kpar`, `Function-Library.kpar`, `Analysis-Domain-Library.kpar`. The `.kpar` layout has been
> confirmed empirically: the archive is a zip with a top-level project folder, per-package `.sysml` files, a
> `.project.json` (name/version/usage dependencies), and a `.meta.json` (index of packages → files, `created`,
> `metamodel` URI).

> **Review status (2026-08-28):** Reviewed against the current concept-stage code and Clause 2 of the supplied specification. The original plan is directionally sound, but the annotations below are implementation gates: do not claim conformance until the model is actually canonical, the supported metaclasses/constraints are justified from the normative machine-readable model, and exported archives are checked against the exact KerML interchange layout.

> **Implementation status (2026-09-09):** Phases 0–7 are **implemented** (module pointers and
> test suites under each phase in §5; Vitest green, `npm run check` clean, Playwright e2e green).
> `.kpar` **import** stays deferred (export-only interchange, per decision 3). Decisions made during
> implementation are recorded in §8 (18–29). Known boundary: the semantic document is session-scoped
> (decision 20) — content enters through the authoring path and the model graph is rebuilt from the
> durable canvas at session bind (decision 29), so save → reload → export yields the user's system;
> `.kpar` import is not implemented.

---

## 0. Implementation quick-start (fresh-session bootstrap)

This plan is the implementation authority; the planning conversation that produced it is **not** needed.
If a decision seems missing or ambiguous, check §8 before asking — 17 decisions are already recorded there.

- **Normative artifacts** (authority for metaclasses/constraints and the `.kpar` layout):
  `docs/normative/sysml-v2-20250201/` — `SysML.xmi`, `SysML.json`, `KerML.xmi`, `KerML.json`, plus five
  official `.kpar` libraries (incl. `Systems-Library.kpar`).
- **Spec (readable copy):** `~/Desktop/Work/sysmlv2_spec.pdf`.
- **Scope:** `app/src/lib/concept-stage/` only. Shared editor-core stores under
  `app/src/lib/domains/editor-core/` are touched only where the concept stage uses them. No design-stage
  file is modified (see §6).
- **Tests:** Vitest + Playwright already configured in `app/`.
- **Read order:** §1 (conformance target) → §2 (current state) → §3 (architecture) → §4 (metaclass
  mapping) → §5 (phases, in order) → §6 (non-goals) → §7 (risks) → §8 (decisions) → §9 (checklist).
- **First concrete step (Phase 0):** derive the metaclass registry for the supported subset
  (part/item/port/interface definitions & usages, connections, flows, bindings, packages) from the pinned
  `SysML.xmi` / `SysML.json`, and pin the exact member names/constraints the validator will check.

---

## 1. Conformance target (what the spec actually requires)

From Clause 2 (*Conformance*, pp. 3–4 of the spec):

> **1. Abstract Syntax Conformance.** A tool demonstrating Abstract Syntax Conformance provides a user
> interface and/or API that enables instances of SysML abstract syntax metaclasses to be created, read,
> updated, and deleted. The tool must also provide a way to validate the well-formedness of models that
> corresponds to the constraints defined in the SysML metamodel. … (See 8.3.)

> **4. Model Interchange Conformance.** A tool demonstrating model interchange conformance can import and/or
> export syntactically conformant SysML models … as a project interchange file as specified in [KerML, Clause 10],
> with the following further conditions:
> - The project interchange file shall use the standard **`.kpar`** (KerML Project Archive) extension.
> - All model interchange files in the project interchange file shall be SysML models. Textual notation files
>   shall use the extension **`.sysml`**.
> - The metadata for the project interchange file shall identify the metamodel using the normative SysML
>   metamodel URI (i.e. `https://www.omg.org/spec/SysML/yymmnn`, where `yymmnn` is the current date-based
>   version identifier).

> Every conformant SysML modeling tool **shall demonstrate at least Abstract Syntax Conformance and Model
> Interchange Conformance.**

Key relief clauses:

- A model *"may be represented directly in an abstract syntax form"* — **no textual or graphical notation is
  required** (Clause 2, p. 3).
- Interchange is *"import **and/or** export"* — export-only is acceptable initially.
- The UI counts as the CRUD API. No HTTP endpoints are needed.

> **Review correction — terminology:** “Abstract syntax model” does not mean that TypeScript classes have to
> reproduce every KerML implementation detail. It means that the persisted model must have the identity,
> ownership, typing, memberships, features, and relationships needed to represent the selected SysML abstract
> syntax metaclasses. Prefer a versioned serializable data model plus a repository over class instances as the
> persistence format. Classes/factories may be used as a convenience API.

**Consequence:** we need (a) a normalized, versioned abstract-syntax model with CRUD + validation, and
(b) a `.kpar` exporter that emits syntactically conformant SysML model files. We do **not** need a full textual
parser, the graphical notation, or semantic execution. However, “subset” must be defined against the normative
SysML/KerML metamodel and constraints, not only against the current UI vocabulary.

> **Selected scope decisions:** export-only is the first interchange milestone; persistence makes the semantic
> model authoritative after the hardcoded libraries are re-authored to the new structure (no sub-systems are
> auto-migrated); repository mutations that create invalid models are rejected; literal attributes/mass values are
> included; interface catalog entries are modeled explicitly as verified port types/definitions; concept-stage
> requirements are out of scope because requirements currently exist only in the Design stage.

**Honesty clause:** because we support a subset of the metamodel, the tool should be described as
*"SysML v2 Abstract Syntax Conformance — supported subset"* in any documentation, not as full SysML v2 conformance.

---

## 2. Current state of the concept stage (facts this plan builds on)

| Area | Today | Location |
|---|---|---|
| Canvas model | XYFlow `Node[]` / `Edge[]`, node types `part`, `item`, `package`, `internalPort` | `activeEditorSessionStore.ts`, `ConceptualStageEditor.svelte` |
| Persistence | `persistentStore` (localStorage) per system; `SystemType` = meta + nodes/edges/requirements/definitions/packages. History/autosave/session restoration also directly read/write these legacy stores | `types/types.ts`, `activeEditorSessionStore.ts`, `activeEditorActions.ts`, `editorHistoryNavigationStore.ts`, `editorAutosave.ts` |
| Definitions | `PartDefinition` / `ItemDefinition` extend `ConceptTemplate` — id, name, description, `data.attributes[]`, `data.partRefs/itemRefs`, nested `data.nodes/edges`; stored as **sidebar lists**, not canvas nodes | `types/types.ts`, `DefinitionEditor.svelte`, `DefinitionSlider.svelte` |
| Packages | `PackageTemplate` (nodes/edges + metadata) — visual containers on one level, not navigable | `ConceptLibrarySlider.svelte` |
| Ports | Per-node `data.inputs[]` / `data.outputs[]`; handle ids `<nodeId>-input-<port>` / `-output-<port>` | `portUtils.ts`, `PortHandles.svelte`, `InternalPortNode.svelte` |
| Port typing | `interfaceType` → `InterfaceDefinition` catalog (electrical/mechanical/fluid/data with `specifications`, `compatibleWith`) | `interfaces/types.ts`, `interfaces/definitions.ts` |
| Connections | Edge `data.connectionType: 'binding' \| 'flow'` + `compatibility: 'direct' \| 'adapter' \| 'incompatible'` | `ConnectionTypeDropdown.svelte`, `edges/RemovableEdge.svelte` |
| Nesting | Drill-down stack; nested content stored *inside node data* (`nodeData.nodes/edges`); internal port nodes synthesized on entry | `nodeViewStore.ts` |
| History | Undo/redo + navigation history over canvas state | `editorHistoryNavigationStore.ts` |
| Hardcoded example systems | Semantic `ComponentTemplate`s (canonical `SysmlDocument` + presentation map) authored with the library DSL; the canvas drag payload is projected from the document at drop time | `concept-stage/data/*`, `concept-stage/types/componentLibrary.ts`, `sysml/session/libraryAuthoring.ts` |

> **Scope footnote — SSD import:** `importers/ssdParser.ts` is used only by `sidebar/DesignStageSidebar.svelte`
> (design stage). It is **not** part of the concept stage, so routing it through the new SysML repository is out
> of scope here. It can be revisited separately if the design stage later requires SysML interchange.

**Review note:** the current architecture has more than a rendering gap. `stores.svelte.ts`, `activeEditorSessionStore.ts`, history, autosave, initialization, and several concept-stage components directly mutate the legacy arrays. Phase 3 must therefore include an explicit inventory and cutover plan, not only two projection functions.

> **Boundary note — shared vs. design-stage stores:** the stores referenced above (`stores.svelte.ts`,
> `activeEditorSessionStore.ts`, `editorHistoryNavigationStore.ts`, `editorAutosave.ts`, `editorSessionController.ts`)
> are shared **editor-core** infrastructure used by both stages, mounted at the editor route
> (`routes/editor/[[id]]/+page.svelte`). They are listed because the concept stage uses them, **not** because they
> are design-stage code. Their design-stage–specific fields (e.g. `customVSSoVariables` in the session store) are
> left untouched. No design-stage file (`design-stage/*`, `importers/ssdParser.ts`, VSSo/FMI pipeline) is modified
> by this plan.

**Structural gaps vs. the SysML metamodel:**

1. Canvas nodes are the source of truth — there is no normalized semantic model underneath.
2. The definition/usage distinction is implicit: `partDefinitions` entries carry nested nodes/edges, so
   definitions and usages are blended (a template that *behaves like* a definition).
3. Ports are data fields, not elements; connections connect *handles*, not port elements.
4. Ownership/namespace relationships are implied by nesting inside node data rather than explicit edges.
5. `connectionType: 'flow'` conflates `FlowConnectionUsage` with ordinary connections; `'binding'` is close to
   `BindingConnectorAsUsage` but not validated as such.
6. Positions, colors, compatibility status, mass metadata etc. are mixed into the same data as semantics.

---

## 3. Target architecture

```text
┌──────────────────────────────────────────────────────────┐
│ Existing UI (unchanged)                                  │
│ ConceptualStageEditor · sidebar lists · sliders/editors  │
└──────────────┬───────────────────────────▲───────────────┘
               │ user intent (create/update/delete)      │ read-only projection
               ▼                                          │
┌──────────────────────────────────────────────────────────┐
│ Projection layer (new)                                  │
│  model ↹ canvas nodes/edges    UI intent → model ops    │
└──────────────┬───────────────────────────▲───────────────┘
               │ mutates                   │ notifies
               ▼                           │
┌──────────────────────────────────────────────────────────┐
│ SysML abstract-syntax model layer (new, canonical)       │
│  elements · relationships · namespaces · CRUD repo       │
│  well-formedness validator · serialization               │
└──────────────┬───────────────────────────────────────────┘
               │ serialize / deserialize
┌──────────────▼───────────────────────────────────────────┐
│ Interchange (new): .kpar export/import (subset emitter)  │
│ Presentation metadata: positions/sizes keyed by elemId   │
└──────────────────────────────────────────────────────────┘
```

Rules of the architecture:

- The **model layer is canonical**. The canvas is a projection; the sidebar lists are another projection.
- Force the UI (including drag/drop, context menu, and keyboard shortcuts) through the repository
  `canvasToModel` layer. There is no background legacy migration; legacy `localStorage` systems are not
  auto-converted. Systems authored in the new structure are saved to `localStorage` via the model serialization
  format, and we provide a small read-only handle for any pre-existing structures only to avoid a hard crash on
  load (no conversion).
- **Semantic IDs** are stable model IDs. Canvas node/edge ids remain but carry a `modelId` reference in
  their data; presentation data (position, size, color) lives in a separate presentation map keyed by model id
  (decision 13) — **never inside the semantic model**.
- All UI mutations go through the repository's CRUD API (which satisfies Abstract Syntax Conformance).
- Everything that is not SysML semantics (compatibility status, order status, mass metadata, viewpoints)
  stays as tool metadata attached to elements but excluded from interchange.

### New code location

```text
app/src/lib/concept-stage/sysml/
├── model/
│   ├── Element.ts          # base element: id, name, owner, metaclass
│   ├── Definitions.ts      # Part/Item/Port/Attribute/Enumeration Definition
│   ├── Usages.ts           # Part/Item/Port/Attribute Usage
│   ├── Relationships.ts    # ConnectionUsage, FlowConnectionUsage, BindingConnectorAsUsage, Comment, Membership
│   └── Namespaces.ts       # Package, root namespace, qualified-name helpers
├── repo/
│   └── ModelRepository.ts  # CRUD, lookup by id/qualifiedName, change events
├── validate/
│   ├── rules.ts            # one function per well-formedness rule
│   └── Diagnostic.ts       # { severity, ruleId, elementId, message }
├── projection/
│   ├── modelToCanvas.ts    # model → XYFlow nodes/edges (rendering)
│   └── canvasToModel.ts    # UI intents → repository calls (mutating)
├── presentation/
│   └── presentationMap.ts  # positions/sizes/colors keyed by element id, excluded from interchange
├── interchange/
│   ├── textualEmitter.ts   # model → .sysml textual subset (export)
│   ├── kparExport.ts       # archive layout + *.sysml + required metadata
│   ├── kparImport.ts       # deferred: zip → model (export-only milestone; round-trip subset when enabled)
│   └── archiveLayout.ts    # exact KerML Clause 10 paths/metadata rules
└── index.ts
```

Nothing in `nodes/*.svelte`, `edges/*.svelte`, `ConceptualStageEditor.svelte` etc. changes visually. Only
their *data plumbing* is re-routed through the adapter in later phases.

---

## 4. Metaclass mapping (supported subset)

| Concept-stage element | SysML v2 abstract syntax | Notes |
|---|---|---|
| Package node | `Package` | owns its members; membership explicit in model |
| `part` node | `PartUsage` | typed by a `PartDefinition`; owned by parent usage/package |
| `item` node | `ItemUsage` | typed by an `ItemDefinition` |
| Sidebar `partDefinitions` | `PartDefinition` | library element; may own nested `PartUsage`s (from `partRefs`) |
| Sidebar `itemDefinitions` | `ItemDefinition` | ditto for items |
| `data.inputs[]` / `data.outputs[]` entries | `PortUsage` / port feature usage | direction and typing must be represented using the normative port/feature relationships; do not assume the UI `input`/`output` labels alone are sufficient |
| `interfaceType` → interface catalog entry | A domain-specific port type/definition mapping to be confirmed | Do not automatically equate an `InterfaceDefinition` catalog record with SysML `PortDefinition`; verify the intended SysML port typing and flow-feature semantics against the normative metamodel |
| Edge `connectionType: 'flow'` | `FlowConnectionUsage` | directed: sourceEnd = output port, targetEnd = input port |
| Edge `connectionType: 'binding'` | `BindingConnectorAsUsage` | binds item/attribute references |
| Ordinary physical/logical connection (if introduced) | `ConnectionUsage` | currently flows/bindings only; keep for future |
| `data.attributes[]` (definitions), mass/value fields | `AttributeUsage` (+ literal value) | included — resolved in §8 (decision 4) |
| Metadata editor description text | `Comment` (about element) | body preserved on interchange |
| Canvas position/size, colors, `compatibility`, viewpoints | **Not SysML** — tool presentation metadata | keyed by model id; never emitted to `.sysml` |

Deliberately **out of subset** for v1: `Specialization`/generalization editing, redefinition, abstract classes,
variants, concern/viewpoint metaclasses, calculation/expression semantics, occurrence/thread semantics, and
requirements (excluded — resolved in §8, decision 6).

> **Review correction — metaclass completeness:** before implementation, replace this UI-derived list with a
> traceability table: each supported metaclass → normative SysML/KerML definition → required inherited
> metaclasses/features → implemented CRUD fields → implemented constraints → serialization form. A `Metaclass`
> TypeScript union alone cannot establish abstract-syntax conformance.

---

## 5. Phased implementation plan

Sizes: **S** ≤ 1 day, **M** ≤ 3 days, **L** ≤ 1 week (rough, single dev).

### Phase 0 — Groundwork & decisions (S) — **[DONE]**
- Create `concept-stage/sysml/` skeleton; use the existing `generateId` helper
  (`shared/identifiers.ts`, also exported from `$lib/helpers`) for element IDs. Decide only the prefix per
  metaclass (e.g. `pd-`, `pu-`, `pp-`, `ip-`), because the generated value is a fixed 6-character string.
- Pin the subset table (§4) into code as a `Metaclass` union type + registry, so unsupported metaclasses are
  rejected at the type level.
- Record the exact spec version and normative metamodel URI from the supplied specification/machine-readable
  artifacts. The selected OMG release uses the abstract-syntax artifact version identifier `20250201`; verify the
  exact URI expected by the selected KerML archive before coding. Keep the URI and archive metadata in one
  versioned configuration object.

**Accept:** directory exists, `Metaclass` union compiles, the pinned normative XMI/JSON artifacts at
`docs/normative/sysml-v2-20250201/` are used to seed the metaclass registry, archive metadata (`.project.json` /
`.meta.json` shape) is verified against the official `.kpar`, and `npm run check` passes.

> **Status (2026-09-08):** implemented — `concept-stage/sysml/model/metaclassRegistry.ts` +
> `normativeConfig.ts` (subset registry seeded from the pinned XMI/JSON, `isSupportedMetaclass` gate),
> `elements.ts` / `factories.ts`; tests `tests/unit/concept-stage-sysml-phase0.test.ts`.

### Phase 1 — Abstract-syntax core (M) — **[DONE]**
- `Element` base: `id`, `metaclass`, `name`, `ownerId`, `declaredShortName?`, `documentation?`.
- `Namespaces`: `Package`, root namespace; qualified-name resolution (`Motor::motorA`).
- `Definitions` + `Usages` classes per §4; `Membership`-style ownership links (owner→owned, typed by definition).
- Immutability discipline: elements are plain data + repository-owned mutation (no setters), so undo/redo and
  serialization stay trivial.

**Accept:** can construct: package → part definition (Motor) → two part usages typed by it → port usages;
ownership graph resolves; qualified names unique per namespace by construction.

> **Status (2026-09-08):** implemented — `model/ownership.ts`, `namespaces.ts`, `relationships.ts`, `immutable.ts`
> (plain-data elements, repository-owned mutation, WF001 name uniqueness); tests
> `tests/unit/concept-stage-sysml-phase1*.test.ts`.

### Phase 2 — Model repository + CRUD API (M) — **[DONE]**
- `ModelRepository`: `create/read/update/delete` per metaclass, `list(namespace)`, `getElement(id)`,
  `getByQualifiedName`, referential integrity on delete (cascade or reject — decide: **reject with diagnostic**,
  cascade is a UI choice layered on top), change-event emitter (`subscribe`), and atomic transactions so a
  connection + required memberships cannot be partially created.
- Svelte glue: one writable store mirroring repository state; components subscribe read-only, mutations go
  through repository only. Inventory and replace direct writes in `stores.svelte.ts`, initialization, autosave,
  history, definition editors, node components, and edge handlers.

> **Review gate:** CRUD must include read-back of the exact serialized element and transaction rollback on
> validation failure. “Create an object in memory” is not enough if it cannot be persisted and read back.

**Accept:** unit tests (Vitest) for CRUD, referential-integrity rejection, change notifications. This store
*is* the Abstract-Syntax-Conformance API surface.

> **Status (2026-09-08):** implemented — `repo/ModelRepository.ts` + `repo/diagnostics.ts` (CRUD, structured
> `Diagnostic` errors, referential integrity, change-event emitter, transactions, `move`/`reown` re-ownership);
> tests `tests/unit/concept-stage-sysml-phase2-repository.test.ts`.

### Phase 3 — Projection layer: keep the UI pixel-identical (L) — **[DONE]**
- `modelToCanvas`: derive `Node[]`/`Edge[]` from the model (node id = stable `n_<modelId>`, port handles derived
  from port usage **names** to match the live `PortHandles`/`portUtils.ts` scheme — decision 19).
- `canvasToModel`: map every current UI intent to repository calls — add node, rename, connect
  (`connectionType: 'flow'` → create the selected flow-related metaclass only after confirming the exact mapping;
  `'binding'` → create the appropriate binding relationship), delete edge, delete node, drag-into-package,
  drill-down save-back.
- Add a stable endpoint-resolution table from XYFlow `(nodeId, handleId)` to semantic `PortUsage` IDs. Never
  serialize handle strings as SysML relationship ends.
- Drill-down: `nodeViewStore` keeps its stack UX, but nested content is read from
  `PartUsage.ownedUsages` instead of `nodeData.nodes`; internal port nodes stay a rendering artifact
  (synthesized from the usage's `PortUsage`s on entry, discarded on exit).
- Package nodes: wrapping = re-ownership in the model; un-wrapping = re-ownership to parent.

**Accept:** all existing user flows produce identical canvas output before/after (golden snapshot tests on the
projection); `nodeViewStore` round-trips nested content through the model.

> **Status (2026-09-08):** implemented — `projection/canvasToModel.ts`, `modelToCanvas.ts`, `projectView.ts`;
> `session/rootAuthoring.ts`, `packageAuthoring.ts`, `conceptStageSemanticSession.ts` (scope intents, package
> wrap/unwrap); UI wiring in `ConceptualStageEditor`, `ConceptNode`, `PackageNode`, `portUtils`, sliders. Tests
> `tests/unit/concept-stage-sysml-phase3-{projection,nested,authoring,live,packages,seams}.test.ts`.

### Phase 4 — Well-formedness validator (M) — **[DONE]**
`Diagnostic { severity: 'error'|'warning', ruleId, elementId, message }`. Rules (rule ids stable for tooling):

| Rule | Constraint |
|---|---|
| `WF001-name-uniqueness` | member names unique within owning namespace |
| `WF002-type-exists` | usage's `definitionId` resolves and metaclass matches (PartUsage↔PartDefinition, ItemUsage↔ItemDefinition, PortUsage↔PortDefinition) |
| `WF003-ownership` | owner exists; ownership respects metaclass containment (PortUsage owned by Part(Usage/Definition), etc.) |
| `WF004-connection-ends` | relationship ends resolve to the correct semantic feature/port elements; flow direction and feature compatibility follow the normative rules, not merely UI input/output labels |
| `WF005-binding-ends` | binding ends reference resolvable, type-compatible features/usages according to the normative binding constraints |
| `WF006-no-dangling-refs` | every stored id reference resolves |
| `WF007-namespace-root` | exactly one root package/namespace per system model |
| `WF008-empty-name` | names non-empty where required (definitions, usages) |

Wire into UI as a passive “model health” indicator first (no blocking) — e.g. badge in the sidebar. Saving is
not blocked by warnings; errors are surfaced but never destroy user data.

> **Review correction:** “corresponds to the constraints” requires traceable normative rules, not only convenient
> local checks. Label each rule as `normative`, `tool-integrity`, or `warning/heuristic`; do not present heuristic
> compatibility checks as SysML validation. Whether invalid models may be saved as drafts is **resolved**: decision 8
> rejects invalid mutations at the repository, so there is no draft-save path in v1; never export them as
> conformant interchange without an explicit override and diagnostic.

**Accept:** unit tests per rule (positive + negative fixture); validator runs on every repository mutation and
on load.

> **Status (2026-09-08):** implemented — `sysml/validate/` (rules.ts: WF001–WF008 registry with the
> `normative` / `tool-integrity` / `warning-heuristic` labels; validateDocument.ts runner; fixtures.ts:
> compliance fixture format with positive + negative fixtures per rule). `ModelRepository` runs the rule engine
> on every mutation (create/update/delete/move/transaction) and on construction; error-severity diagnostics
> reject mutations (decision 8), warnings never block. Passive non-blocking “model health” badge in the sidebar
> driven by a `modelHealth` svelte store refreshed on every repository change (session-scoped, reset on unbind).
> Tests `tests/unit/concept-stage-sysml-phase4-validator.test.ts` (fixture matrix + per-rule + repository
> integration + health-store). Decisions 22–24 recorded in §8.

### Phase 5 — Reworking the hardcoded libraries to the semantic structure (M)
- Convert the hardcoded example systems in `concept-stage/data/simpleComponentLibrary.ts` (e.g. `basicPowertrain`,
  `maritimeCoolingSystem`), `concept-stage/data/shipDesignLibrary.ts`, and `concept-stage/types/componentLibrary.ts`
  from raw `{ nodes, edges }`/`ComponentTemplate` payloads into semantic SysML model definitions written using the
  new definitions/usages DSL. Build the canonical `Definition`/`Usage`-typed structure, not raw XYFlow data.
- `hierarchicalComponentLibrary.ts` keeps its category/hierarchy vocabulary (`ComponentCategory`, `LibraryComponent`)
  but references the semantic model definitions instead of raw `template.data.nodes`.
- Remove `legacyToModel` migration and legacy dual-read: there is no persistent user DB, and `localStorage` content
  from prior versions is not auto-converted.
- No custom migration of arbitrary user-authored `SystemType` JSON is performed; previously-persisted systems are
  out of scope unless re-authored via the new DSL.

**Accept:** the shipped library examples are emitted from, and round-trip through, the semantic model. `npm run
check` and the projection tests render them identically to the current preview.

> **Status (2026-09-09):** implemented — `sysml/session/libraryAuthoring.ts` (definitions/usages DSL builder
> over the `ModelRepository`: root-owned `Definitions` package, typed usages, ports, mass attribute usages,
> flow relationships; every create is WF001–WF008-validated). `data/simpleComponentLibrary.ts` +
> `data/shipDesignLibrary.ts` re-authored as semantic `ComponentTemplate`s — no raw `{ nodes, edges }` payloads
> remain; `types/componentLibrary.ts` / `types/shipDesign.ts` template types reworked to
> `{ document, presentation }`. `utils/simpleInstantiation.ts` projects the semantic template to the legacy
> canvas payload at drag time (fresh ids, offsets, package sizing — the drop path and preview stay
> pixel-identical; the drag payload is plain JSON). `hierarchicalComponentLibrary.ts` keeps its
> category/hierarchy vocabulary and now references the semantic templates. No `legacyToModel` migration and no
> legacy dual-read exist: previously-persisted canvas content is never auto-converted (decisions 25–26). Tests
> `tests/unit/concept-stage-sysml-phase5-libraries.test.ts` (WF validity of every example, per-example
> projection snapshots against the legacy preview data, repository/JSON round-trips, instantiation behavior).

### Phase 6 — `.kpar` interchange (L)
- `textualEmitter`: emit our subset in SysML textual syntax — `package`, `part def/usage`, `item def/usage`,
  `port def/usage`, `attribute def/usage` + literal values, `connection usage`/`flow connection usage` with
  `connect` ends, `binding connector as usage`, `comment`. One `.sysml` file per top-level namespace.
- `kparExport`: produce the exact KerML Clause 10 project archive structure. The layout is confirmed from the
  official `Systems-Library.kpar` (pinned under `docs/normative/sysml-v2-20250201/`): a zip whose root holds a
  project folder named after the model, containing per-package `.sysml` files plus a `.project.json` (name,
  version, `usage[]` dependency archives with version constraints) and a `.meta.json` (package→file `index`,
  `created`, `metamodel` URI). Deterministic UTF-8 output; never emit presentation-only data in the semantic
  files.
- `kparImport`: deferred. Clause 2 permits import **and/or** export, and the selected first milestone is
  export-only. Revisit import only after the generated archive is externally validated.
- Export button in the sidebar outer menu (decision 17) — no other UI change. No upload/import button until
  the import milestone is enabled.

> **Implementation status (2026-09-09):** implemented as `sysml/export/` — `textualEmitter.ts` (one `.sysml`
> file per top-level namespace: the model root plus each root-owned package; `flow <n> from <a> to <b>;`,
> `connection <n> [:<T>] connect <a> to <b>;`, `bind <a> = <b>;` — syntax grounded in the official archive and
> decision 27), `archiveLayout.ts` (`.project.json`/`.meta.json` builders, `METAMODEL_URI`), `kparExport.ts`
> (validation-gated `exportDocumentToKpar`, deterministic `zipKparArchive` via jszip, browser
> `downloadKparArchive`). The sidebar outer-menu export control (decision 17) downloads `<Model>.kpar` with a
> success/blocked notification. Invalid documents are blocked before any archive is produced (WF error
> severity); heuristic warnings pass. Tests `tests/unit/concept-stage-sysml-phase6-export.test.ts` (golden
> emission, per-namespace files, exact `.project.json`/`.meta.json` shapes, byte-deterministic zips, no
> presentation-only data in semantic files, invalid-export gate). External-checker validation of generated
> exports remains the one open §9 item (no reference checker available in CI).

> **Review recommendation:** make export-only the first interchange milestone. Do not build an importer before
> an external SysML/KerML checker accepts the generated archive; importer work can otherwise hide invalid output.

**Accept:** `model → .kpar` export produces the expected archive structure and metadata; emitted `.sysml` text
parses in an external reference checker (e.g. the SysML v2 Pilot/Jupyter reference implementation) if available in
CI — recommended but optional. (Round-trip import tests are deferred until the importer milestone.)

### Phase 7 — Test strategy & compliance documentation (S) — **[DONE]**
- Vitest unit suites for model, repo, validators, emitter (all pure TS — no Svelte mocking needed).
- Golden/projection snapshot tests to lock UI-identical behavior (Phase 3).
- One Playwright e2e: build a two-part system with a flow connection, save, reload, export `.kpar` (and
  re-import only if the importer milestone is selected).
- Add deterministic archive-content tests: required files, paths, extension, metadata URI, stable ordering, and
  no presentation-only data in the semantic files.
- `docs/sysml-v2-concept-stage-subset.md`: the supported-metaclass table + validation rule list + known
  limitations + exact spec/metamodel version = the public “compliance statement” describing the tool as
  conformant on the documented subset.
- Add a compliance fixture set containing valid and intentionally invalid models with expected diagnostics.

> **Status (2026-09-09):** implemented — `docs/sysml-v2-concept-stage-subset.md` (the public compliance
> statement: supported-metaclass table traced to the pinned artifacts, WF001–WF008 rule list with the
> §5 review-correction labels, known limitations, exact spec/metamodel version). Playwright e2e
> `tests/e2e/concept-export.spec.ts`: builds a two-part system through the real UI (library drop + a
> user-drawn flow connection), persists, reloads (canvas restored, semantic session rebuilt at bind —
> decision 29), exports `.kpar` from the sidebar control, and verifies the archive (Clause 10 layout,
> metadata URIs, `.sysml` content carrying the parts and the flow, no presentation-only data). The
> compliance fixture set (valid + intentionally invalid models with expected diagnostics) landed with
> Phase 4 (`sysml/validate/fixtures.ts`). The one remaining open item is external-checker validation
> of generated exports (no reference checker available in CI).

**Overall acceptance (Definition of Done):**
1. CRUD over the subset metaclasses via UI and repository API — ✔ Abstract Syntax Conformance.
2. Well-formedness validation corresponding to metamodel constraints — ✔ (Clause 2 requirement 1).
3. `.kpar` export with normative metamodel URI metadata — ✔ Model Interchange Conformance (import deferred).
4. Zero visual changes to the concept stage — ✔ user constraint.

---

## 6. Non-goals (explicitly)

- Full textual notation parser (Concrete Syntax / Textual Notation Conformance).
- Graphical notation conformance — our canvas deliberately remains a *projection*, not SysML’s IBD notation.
- Semantic Conformance (execution/analysis of SysML semantics).
- Systems Model Library or Domain Libraries (Clause 9) authoring.
- Generalization/redefinition editing, variants, expressions beyond literals, requirements metamodeling
  (Phase-gated; see below).
- HTTP REST API (the UI + repository API satisfy the clause; endpoints can be added later if external tools
  need remote access).
- **Automatic migration of legacy persisted systems** — pre-existing `localStorage`/`SystemType` systems and any
  future user-authored models in the old canvas format are **not** auto-migrated to the semantic model. Only the
  hardcoded example libraries in `concept-stage/data/` are re-authored to the new structure. Older persisted data
  is out of scope; it may be read defensively to avoid a crash on load, but never converted.
- **Design-stage interchange or model changes** — no changes to the Design stage (its VSSo/FMI pipeline, SSD
  import/export, FMUs, digital twins). The Design stage is not part of the SysML concept-stage compliance work.

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Projection drift: canvas and model diverge | Single write path through `canvasToModel`; snapshot tests; validator on every mutation |
| Handle-id scheme breaks on rename | Handles derive from port usage **names** (matching the live canvas scheme); renames sync both canvas and model, WF001 keeps names unique per namespace, and the projection recomputes handles so edges re-snap (decision 19) |
| `.sysml` subset emitter produces non-conforming text | Keep emitter grammar table-driven from the same metaclass registry; round-trip + external checker tests |
| Scope creep into design stage | Everything lives under `concept-stage/sysml/`; design stage keeps its current (VSSo/FMI) pipeline |
| Undo/redo interplay | Repository emits inverse-able change records; reuse `editorHistoryNavigationStore` patterns |

## 8. Decisions & remaining questions

**Resolved decisions:**

1. **Compliance claim** — documented, verified SysML v2 subset (not full-language conformance).
2. **Normative authority** — the official machine-readable artifacts of the formal September 2025 SysML 2.0
   release (`SysML.xmi`, `SysML.json`, Systems Library `.kpar`), not the PDF alone. **Obtained** — pinned at
   `docs/normative/sysml-v2-20250201/`.
3. **Interchange** — export-only for the first `.kpar` milestone; importing deferred until the output is
   externally validated.
4. **Attribute/values** — supported attributes and literal mass values are included in the model and exported.
5. **Interface catalog** (`interfaces/definitions.ts`) — catalog entries are modeled explicitly as verified
   SysML port types/definitions; the exact metaclass per entry is confirmed against the normative model.
6. **Requirements** (`currentReqs`) — **out of scope** for the concept-stage subset, because requirements are
   currently modeled only in the Design stage, not the conceptual stage.
7. **Delete semantics** — repository rejects mutations that leave dangling references; the UI can layer a
   confirm-and-cascade flow on top.
8. **Invalid models** — repository mutations that create validation errors are rejected; invalid `.kpar` exports
   are blocked.

**Additional decisions (address naming, write path, undo, definition references, persistence, presentation):**

9. **Name uniqueness** — enforce name uniqueness within each namespace as required by the SysML v2
   specification. The existing `shared/validation/nameValidation.ts` helpers (`validateName`, `generateName`,
   `duplicateName`) already enforce uniqueness and the `(n)` suffix convention; WF001 will follow and interlock
   with those helpers so the UI naming logic does not clash with the repository rule.
10. **Definition references** — usages reference compiler definitions (`PartDefinition`/`ItemDefinition`) by
    **immutable definition ID**, not by name, so renames do not break references.
11. **Undo/redo** — keep the existing undo/redo/history mechanism built over canvas `Node`/`Edge` snapshots for
    now. The repository change records can feed history later, but do not gate on model-based history.
12. **Multi-subsystem persistence** — keep the current single-session structure: the semantic SysML model is
    per-system and stored with the system record; when navigating into a linked subsystem, it is loaded from that
    system's own model rather than stored inside the parent canvas.
13. **Presentation metadata** — store target positions, sizes, and colors in a **separate presentation map keyed**
    by model element ID, kept out of the semantic model and excluded from interchange.
14. **ID scheme** — reuse the existing `generateId` helper (`shared/identifiers.ts`, exposed at `$lib/helpers`),
    which produces a unique 6-character ID absent from the supplied list. No new ID library (uuid/cuid/nanoid) is
    introduced.
15. **Mutation error delivery** — rejected repository mutations surface as **structured `Diagnostic`** objects
    (`{ ruleId, elementId, severity, message }`), returned/emitted by the repository rather than thrown.
16. **Write-path cutover** — **full cutover**: all concept-stage components (canvas, sidebar, definition editors,
    drag/drop, context menu, keyboard shortcuts) route mutations through the repository. No “minimal bridge” pass.
17. **Export UI location** — the `.sysml`/`.kpar` export control is added to the **sidebar outer menu** (header /
    outer chrome), outside the canvas, to keep the canvas UI unchanged.

**Decisions recorded during implementation (2026-09-08):**

18. **Package binding semantics** — canvas package nodes are visual overlays; the saved-package list
    (`system.packages`, keyed by `canvasNodeId`) is the source of truth. Save = upsert exactly one entry per
    canvas node **and** re-own the mapped usages under a model `Package` element (root-owned "Packages"
    container). Deleting a list entry keeps the canvas node but reverts it to unsaved (gray/dashed) and unwraps
    its members back to the model root; deleting the canvas node also removes the list entry. Saved packages
    render blue/solid, unsaved gray/dashed. (Phase 3 "wrapping = re-ownership".)
19. **Handle-id scheme** — canvas port handles are **name-based** (`n_<usage>-<side>-<portName>`) to match the
    existing `PortHandles` rendering and the authoring endpoint parser; the projection emits the same strings so
    model-projected edges snap to live handles. Boundary artifacts keep id-stable anchors
    (`internal-port-…-source/-target`). Handle strings are presentation-only and are **never** serialized as
    SysML relationship ends. (Phase 3 bullet updated accordingly.)
20. **Session-scoped semantic document** — the semantic model is per-session: content enters through the
    authoring path (seed/mirror intents), and the durable canvas↔saved-package binding survives reloads via
    `system.packages`, but the model element graph is rebuilt in-session. Undo/redo restores canvas `Node`/`Edge`
    arrays only (extends decisions 11–12; model-based history deferred). Persistence to `.kpar` is Phase 6.
21. **Port-interface clearing** — setting a port's interface to *None* is canvas-only for now; the model keeps
    interfaces as display-only presentation. Canvas↔model divergence on this single field is a known boundary to
    resolve in the validator/emitter milestone (Phase 4/6), not silently claimed as conformance.
22. **Rule labeling** — WF001–WF005 are labeled **normative** (traceable to the pinned `SysML.xmi`/`KerML.xmi`
    constraints, e.g. `Membership.isDistinguishableFrom`, `PartUsage.validatePartUsagePartDefinition`,
    `ConnectionUsage.checkConnectionUsageBinarySpecialization`, `BindingConnector.validateBindingConnectorIsBinary`);
    WF006–WF008 are **tool-integrity** (repository/serialization invariants — dangling refs, single root,
    non-empty names — never presented as SysML validation). Heuristic guidance (untyped part/item usages under
    WF002, subset-limited binding type compatibility under WF005) is emitted at **warning** severity with the
    message labeled heuristic, per the §5 review correction.
23. **Create-path hardening** — `repository.create` now runs the full WF001–WF008 engine over the candidate
    document (previously only the incoming element was checked), so duplicate names (WF001), containment (WF003)
    and typing (WF002) violations are rejected at creation — the UI naming logic already interlocks via
    decision 9. Untyped part/item usages remain creatable (SysML permits anonymous types); they surface only as
    WF002 warnings.
24. **Passive model health** — the sidebar “model health” badge (plan §5 Phase 4) is non-blocking and driven by
    a `modelHealth` svelte store computed by `repository.validate()` on load and after every repository change.
    Because error-severity diagnostics cannot exist in a committed document (decision 8), the badge in practice
    reports the validator's heuristic warnings; it never gates saving or rendering.

**Decisions recorded during implementation (2026-09-09):**

25. **Semantic library templates** — the shipped example libraries are semantic `ComponentTemplate`s: a
    WF-valid `SysmlDocument` plus a presentation map keyed by element id. Definitions live in a root-owned
    `Definitions` package so definition names never collide with usage names in the root namespace (WF001;
    e.g. the `Permanent Magnet Motor` definition vs. usage of the same name in `motorShaftPropellerDemo`). The
    canvas drag payload is the serialized template; `instantiateSimpleComponent` projects it to the legacy
    canvas shape (fresh ids, offsets, package sizing, handle rewriting) so the drop path and preview are
    pixel-identical. Templates are independent and immutable; they JSON-round-trip through the drag `dataTransfer`
    unchanged. There is **no** `legacyToModel` migration and no legacy dual-read: previously-persisted canvas
    content is never auto-converted (plan §6), and user-authored systems keep entering the model through the
    session authoring path (decision 20).
26. **Metadata pairs are tool metadata; mass stays an attribute** — per-usage metadata key/value pairs (and
    order-status-like fields) are tool metadata stored in the presentation-map entry (excluded from
    interchange, plan §3), **not** attribute usages: a metadata key can collide with a port name inside the
    same usage namespace (WF001) — the commercial-vessel `Auxiliary Generator` has both a `power` metadata key
    and a `power` port. Mass values remain literal `AttributeUsage`s in the model (decision 4), and comments
    stay element `documentation` (emitted as `Comment` on interchange).
27. **Emitter syntax grounding** — the Phase 6 textual emitter uses the concrete syntax observed in the
    official `Systems-Library.kpar` plus the language introduction / Pilot checker documentation: `bind <a> =
    <b>;` and `connection [<name>] [:<T>] connect <a> to <b>;` match the official archive verbatim, and flow
    usages use the `flow [<name>] [:<T>] from <a> to <b>;` form (SysON/OpenSysML Pilot-verified; the plan's
    `FlowConnectionUsage` has no JSON `@type` in 20250201 and serializes as `FlowUsage`, per the registry
    `serializesAs`). Names are escaped per KerML name notation: non-basic names (spaces, keyword collisions
    like a port named `out`) are emitted as restricted names in single quotes with `\`/`'` escaped. KerML
    textual bindings are anonymous — the binding's `name` field is not representable in the `bind` shorthand
    and is not emitted. Port UI direction and interface labels are never emitted (decision 21). Exported
    archives declare `usage: []` in `.project.json`: the emitted subset is self-contained (no `import`
    statements), so no library dependencies are claimed.
28. **Deterministic Clause 10 archives** — `kparExport` emits the exact layout confirmed from the official
    `Systems-Library.kpar`: a project folder named after the model holding one `.sysml` file per top-level
    namespace (root + root-owned packages), `.meta.json` (`index` namespace→file, `created`, `metamodel` =
    `https://www.omg.org/spec/SysML/20250201`) and `.project.json` (`name`, `version`, `usage`). `created` is
    injectable and zip entries carry that date, so identical input produces byte-identical archives
    (deterministic UTF-8 output, stable membership ordering). The export is validation-gated: WF error
    severity blocks the archive entirely; heuristic warnings never block (decision 8).
29. **Bind-time canvas reseed** — when the concept-stage session binds for a system whose persisted root
    canvas already has content (reload, re-entry), the canvas is re-mirrored into the model via the same
    add-only, idempotent authoring path every drop/connect uses (`seedRootCanvasToModel` in
    `ConceptualStageLayout`'s onMount). This makes decision 20's "rebuilt in-session" concrete: the model
    graph is derived from the durable canvas on every session, so the plan's Phase 7 e2e (build → save →
    reload → export `.kpar`) exports the user's two-part system with its flow connection instead of an
    empty document. This is **not** a legacy-format migration (decisions 25–26): only the root canvas
    mirror is rebuilt — old-format definitions/templates/requirements and nested legacy views are never
    converted, and `.kpar` import remains out of scope.

These were raised earlier and are resolved by the decision record above (no action needed):

- normative metamodel source → resolved by decision 2;
- import breadth → resolved by decision 3;
- mutation error delivery → resolved by decision 15;
- write-path cutover → resolved by decision 16;
- ID scheme → resolved by decision 14;
- export UI location → resolved by decision 17.

**No pre-implementation blockers remain.** The §9 checklist items still open (interface-catalog / flow /
binding metaclass mapping against the normative model, compliance fixture format, legacy-field removal milestone,
external-checker validation of generated exports) are implementation-time tasks, not decisions blocking Phase 0.

## 9. Review checklist before implementation starts

- [x] Select documented-subset scope, export-only interchange, immediate semantic-model cutover of hardcoded
  libraries, mutation blocking, literal attributes, explicit port mapping, and no concept-stage requirements.
- [x] Confirm the supplied PDF is the formal September 2025 SysML 2.0 release.
- [x] Select and record the exact SysML/KerML normative version and metamodel URI (`20250201`).
- [x] Obtain/pin the machine-readable normative metamodel artifacts associated with the supplied spec; use them to
  build the metaclass/feature/constraint traceability table (pinned at `docs/normative/sysml-v2-20250201/`).
- [x] Confirm the exact KerML Clause 10 `.kpar` archive layout and metadata filenames/fields empirically from the
  official `Systems-Library.kpar` (`.project.json`, `.meta.json`, per-package `.sysml` files). Still to do:
  validate our own exports against a reference checker.
- [x] Decide the public claim is a **documented supported subset** (decision 1). External-checker validation of
  generated exports remains an implementation-time gate, not a pre-implementation decision.
- [x] Decide when the internal legacy node/edge store fields become redundant and set a removal milestone.
  Phase 5 removed them from the shipped library templates (semantic `ComponentTemplate`s project the canvas
  payload at drag time); the legacy canvas node/edge fields remain only for user-authored, session-scoped
  content (decision 20) and for the design-stage data contract.
- [x] Decide that no user-authored legacy systems are auto-migrated; only the hardcoded example libraries are
  re-authored to the semantic model.
- [x] Audit that all files/tools referenced by this plan are concept-stage or shared editor-core, and that no
  design-stage file is modified.
- [x] Decide that invalid mutations are blocked; invalid models are not created through the repository API and
  invalid `.kpar` exports are blocked.
- [x] Decide that definition references use immutable IDs and presentation metadata lives in a separate map keyed
  by element ID.
- [x] Decide to keep the existing undo/history mechanism and the single-session per-system persistence.
- [x] Decide to reuse the existing `generateId` helper for element IDs (no new ID library).
- [x] Decide rejected mutations return structured `Diagnostic` objects (no exceptions for validation failures).
- [x] Decide on full write-path cutover through the repository for all concept-stage components.
- [x] Decide the `.sysml`/`.kpar` export control lives in the sidebar outer menu (canvas unchanged).
- [x] Resolve the explicit interface-catalog mapping and flow/binding metaclass mappings against the normative
  model. Flow/binding serialization resolved in Phase 6: `FlowConnectionUsage` has no JSON `@type` in
  `SysML.json` 20250201 and serializes as `FlowUsage` (`serializesAs` in the metaclass registry), emitted as
  `flow <n> from <a> to <b>;`; binding connectors as `bind <a> = <b>;` (decision 27). The interface-catalog
  mapping remains open (port interface labels stay presentation-only, decision 21).
- [x] Add a compliance fixture format before implementing the validator (implemented as part of Phase 4:
  `sysml/validate/fixtures.ts` — positive + negative fixtures per WF rule, driven by the Vitest suite).
- [x] Phase 7 deliverables: `docs/sysml-v2-concept-stage-subset.md` (supported-metaclass table, WF001–WF008
  rule list, known limitations, exact spec/metamodel version) and the Playwright export e2e
  (`app/tests/e2e/concept-export.spec.ts` — build, save, reload, export `.kpar`, archive assertions).
  External-checker validation of generated exports remains the one open item (no reference checker in CI).

## 10. Spec references

- Clause 2 *Conformance*, pp. 3–4 — conformance categories, mandatory minimum, `.kpar` conditions.
- Clause 7.6, pp. 31–36 — definitions vs. usages.
- Clauses 7.10–7.13, pp. 56–72 — items, parts, ports, connections, connection ends, bindings.
- Clause 7.16, pp. 80–84 — flows / `FlowConnectionUsage` directionality.
- Clause 8.3 — abstract syntax / metamodel constraints (well-formedness rule source).
- [KerML] Clause 10 — project interchange file format (zip archive of textual model files).
- Local spec copy: `~/Desktop/Work/sysmlv2_spec.pdf`.
