import type { ElementId } from '../model';

export type DiagnosticSeverity = 'error' | 'warning';

/**
 * Rule classification required by the plan §5 Phase 4 review correction:
 * - `normative` — the check traces to a constraint in the pinned SysML/KerML
 *   metamodel artifacts (well-formedness, Clause 2 / 8.3).
 * - `tool-integrity` — keeps the repository/serialization consistent (id
 *   resolution, single root); not presented as SysML validation.
 * - `warning-heuristic` — UI/UX guidance that must not be presented as SysML
 *   validation (e.g. untyped usages, subset-limited type compatibility).
 */
export type RuleLabel = 'normative' | 'tool-integrity' | 'warning-heuristic';

export interface Diagnostic {
  severity: DiagnosticSeverity;
  ruleId: string;
  elementId?: ElementId;
  message: string;
  /** Classification of the rule that produced this diagnostic (Phase 4). */
  ruleLabel?: RuleLabel;
}

export interface MutationResult<T> {
  ok: boolean;
  value?: T;
  diagnostics: Diagnostic[];
}

export const errorDiagnostic = (
  ruleId: string,
  message: string,
  elementId?: ElementId
): Diagnostic => ({
  severity: 'error',
  ruleId,
  ...(elementId ? { elementId } : {}),
  message
});

export const warningDiagnostic = (
  ruleId: string,
  message: string,
  elementId?: ElementId
): Diagnostic => ({
  severity: 'warning',
  ruleId,
  ...(elementId ? { elementId } : {}),
  message
});
