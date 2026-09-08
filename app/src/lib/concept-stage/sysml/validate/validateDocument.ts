/**
 * Well-formedness validation runner (plan §5 Phase 4).
 *
 * Runs every rule in the WF001–WF008 registry over a document and returns the
 * aggregated diagnostics in stable rule order. Diagnostics carry the rule's
 * classification (`ruleLabel`) so tooling never mistakes heuristic guidance
 * for SysML validation.
 */
import type { Diagnostic } from '../repo/diagnostics';
import type { SysmlDocument } from '../model';
import { RULES } from './rules';

export interface ValidationReport {
  diagnostics: Diagnostic[];
  errorCount: number;
  warningCount: number;
}

export function validateDocument(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const rule of RULES) {
    for (const diagnostic of rule.check(document)) {
      diagnostics.push({ ...diagnostic, ruleLabel: rule.label });
    }
  }
  return diagnostics;
}

export function summarizeDiagnostics(diagnostics: Diagnostic[]): ValidationReport {
  return {
    diagnostics,
    errorCount: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
    warningCount: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
  };
}