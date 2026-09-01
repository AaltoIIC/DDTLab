/**
 * Normative SysML v2 metamodel configuration — pinned release `20250201`.
 *
 * Authority: the machine-readable artifacts pinned at
 * `docs/normative/sysml-v2-20250201/` (`SysML.xmi`, `SysML.json`, `KerML.xmi`,
 * `KerML.json`, plus the official `.kpar` libraries). These correspond to the
 * formal September 2025 SysML 2.0 release identified by OMG.
 *
 * From `SysML.xmi`:
 *   <uml:Package xmi:id="SysML" URI="https://ww.omg.org/spec/SysML/20250201" name="SysML">
 * (the `ww.` spelling is verbatim in the artifact; the KerML import inside the
 * same file uses the canonical `www.` host — both are recorded below.)
 *
 * From Clause 2 of the specification: a `.kpar` archive's metadata shall
 * identify the metamodel using the normative URI
 * `https://www.omg.org/spec/SysML/yymmnn`.
 */

export const SYSML_NORMATIVE = {
	/** OMG release identifier (date-based version). */
	releaseId: '20250201' as const,

	/** Human-readable release designation. */
	releaseLabel: 'SysML v2.0 — formal September 2025 OMG release',

	/** Metamodel URI exactly as declared on the SysML package in SysML.xmi. */
	metamodelUriXmi: 'https://ww.omg.org/spec/SysML/20250201',

	/** Canonical metamodel URI used in `.kpar` metadata (Clause 2 requirement). */
	metamodelUri: 'https://www.omg.org/spec/SysML/20250201',

	/** KerML metamodel URI (imported by SysML.xmi). */
	kermlMetamodelUri: 'https://www.omg.org/spec/KerML/20250201',

	/** XMI import reference used inside SysML.xmi for the KerML kernel. */
	kermlImportHref: 'https://www.omg.org/spec/KerML/20250201/KerML.xmi#Kernel',

	/** Root package id in the normative XMI. */
	rootPackageXmiId: 'SysML',

	/** Root package name in the normative XMI. */
	rootPackageName: 'SysML',

	/** Project interchange file extension (KerML Clause 10). */
	archiveExtension: '.kpar' as const,

	/** Textual notation file extension for SysML models. */
	textualExtension: '.sysml' as const,

	/** Local pinned artifacts (relative to repo root). */
	artifacts: {
		sysmlXmi: 'docs/normative/sysml-v2-20250201/SysML.xmi',
		sysmlJson: 'docs/normative/sysml-v2-20250201/SysML.json',
		kermlXmi: 'docs/normative/sysml-v2-20250201/KerML.xmi',
		kermlJson: 'docs/normative/sysml-v2-20250201/KerML.json',
		systemsLibraryKpar: 'docs/normative/sysml-v2-20250201/Systems-Library.kpar'
	}
} as const;

export type SysmlNormativeConfig = typeof SYSML_NORMATIVE;
