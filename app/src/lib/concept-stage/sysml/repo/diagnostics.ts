import type { ElementId } from '../model';

export type DiagnosticSeverity = 'error' | 'warning';

export interface Diagnostic {
  severity: DiagnosticSeverity;
  ruleId: string;
  elementId?: ElementId;
  message: string;
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
