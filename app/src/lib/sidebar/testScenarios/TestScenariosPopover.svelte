  <script lang="ts">
      import { onDestroy } from 'svelte';
      import { bytesToBase64 } from '$lib/analysis/analysisReportFiles';
      import { buildTorsionalAnalysisPdf, defaultTorsionalAnalysisFilename, downloadTorsionalAnalysisPdf } from '$lib/analysis/torsionalAnalysisReportPdf';
      import {
          currentEdges,
          currentNodes,
          componentLinks,
          fmiComponents,
          systems,
          currentSystemMeta,
          upsertAnalysisReport,
          toTemplateSimulationResultRecord,
          upsertTemplateSimulationResult
      } from '$lib/stores/stores.svelte';
      import type { AnalysisReportRecord } from '$lib/types/types';

      interface Props {
          onclose: () => void;
      }

      let { onclose }: Props = $props();

      let activeTab: 'standard' | 'custom' = $state('standard');
      let selectedStandardTests = $state<Set<string>>(new Set());
      let customScenarios = $state<Array<{id: string, name: string, actions: Array<{time: string, action:
  string}>}>>([]);
      let isRunningAnalysis = $state(false);
      let analysisError = $state('');
      let analysisResult = $state<any>(null);
      let isRunningTemplateSimulation = $state(false);
      let templateSimulationError = $state('');
      let templateSimulationResult = $state<any>(null);
      let templateSimulationPoll: ReturnType<typeof setInterval> | undefined;
      let templateSimulationDesignContext = $state<{ id: string; name: string } | null>(null);
      const templateSimulationId = 'simantics-ssp-cloud-template';

      // Mock data for standard test scenarios
      const standardTestCategories = [
          {
              name: "Mechanical Tests",
              tests: [
                  { id: "torsional-vibration", name: "Torsional Vibration Analysis", description: "OpenTorsion modal analysis of the linked propulsion drivetrain" },
                  { id: "ssp-template-cloud", name: "SSP Template Cloud Simulation", description: "Runs the fixed python-client template SSP on the Simantics cloud launcher" },
                  { id: "vib-2", name: "Shock Test (IEC 60068-2-27)", description: "Mechanical shock resistance test" },
                  { id: "vib-3", name: "Random Vibration (MIL-STD-810)", description: "Environmental vibration testing" }
              ]
          },
          {
              name: "Marine Systems",
              tests: [
                  { id: "mar-1", name: "Standard Ship Engine Operation", description: "Full operational cycle test for marine engines" },
                  { id: "mar-2", name: "Emergency Stop Procedure", description: "Emergency shutdown sequence validation" },
                  { id: "mar-3", name: "Load Acceptance Test", description: "Sudden load change response test" }
              ]
          },
          {
              name: "Environmental Tests",
              tests: [
                  { id: "env-1", name: "Temperature Cycling (IEC 60068-2-14)", description: "Thermal stress testing" },
                  { id: "env-2", name: "Humidity Test (IEC 60068-2-78)", description: "Damp heat steady state test" }
              ]
          }
      ];

      function toggleStandardTest(testId: string) {
          if (selectedStandardTests.has(testId)) {
              selectedStandardTests.delete(testId);
          } else {
              selectedStandardTests.add(testId);
          }
          selectedStandardTests = selectedStandardTests;
      }

      function addCustomScenario() {
          customScenarios.push({
              id: Date.now().toString(),
              name: "New Test Scenario",
              actions: [{ time: "0", action: "" }]
          });
          customScenarios = customScenarios;
      }

      function addAction(scenarioId: string) {
          const scenario = customScenarios.find(s => s.id === scenarioId);
          if (scenario) {
              scenario.actions.push({ time: "", action: "" });
              customScenarios = customScenarios;
          }
      }

      async function applySelectedTests() {
          analysisError = '';
          templateSimulationError = '';
          if (selectedStandardTests.has('ssp-template-cloud')) {
              await runTemplateSimulation();
              return;
          }
          if (selectedStandardTests.has('torsional-vibration')) {
              await runTorsionalVibrationAnalysis();
              return;
          }
          analysisError = 'Select a runnable test scenario.';
      }

      async function runTorsionalVibrationAnalysis() {
          isRunningAnalysis = true;
          analysisError = '';
          analysisResult = null;
          try {
              const analysisNodes = collectAnalysisNodes();
              const response = await fetch('/api/analysis/torsional-vibration', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                      nodes: analysisNodes,
                      edges: $currentEdges.map(edge => ({
                          id: edge.id,
                          source: edge.source,
                          target: edge.target,
                          sourceHandle: edge.sourceHandle,
                          targetHandle: edge.targetHandle
                      }))
                  })
              });
              const body = await response.json();
              if (!response.ok || body.ok === false) {
                  throw new Error(body.message || 'Torsional vibration analysis failed');
              }
              analysisResult = {
                  ...body,
                  generatedAt: new Date().toISOString(),
                  sourceSystemName: $currentSystemMeta.name || 'Design Stage'
              };
              saveCompletedAnalysisReport(analysisResult, analysisNodes);
          } catch (error) {
              analysisError = error instanceof Error ? error.message : 'Torsional vibration analysis failed';
          } finally {
              isRunningAnalysis = false;
          }
      }

      async function runTemplateSimulation() {
          isRunningTemplateSimulation = true;
          templateSimulationError = '';
          templateSimulationResult = null;
          clearTemplateSimulationPoll();

          try {
              if (!hasTemplateSimulationBinding()) {
                  templateSimulationError = 'This design model is not linked to python-client/templates/model.ssp. Start from the Motor System example in the concept library, then convert to design.';
                  return;
              }

              templateSimulationDesignContext = {
                  id: $currentSystemMeta.id,
                  name: $currentSystemMeta.name || 'Design Stage'
              };

              const response = await fetch('/api/simulation/template-run', { method: 'POST' });
              const body = await response.json();
              if (!response.ok || body.ok === false) {
                  throw new Error(body.message || 'Failed to launch SSP template simulation');
              }
              templateSimulationResult = body;
              saveTemplateSimulationResult(body, templateSimulationDesignContext);
              if (body.jobId) {
                  startTemplateSimulationPoll(body.jobId, templateSimulationDesignContext);
              }
          } catch (error) {
              templateSimulationError = error instanceof Error ? error.message : 'Failed to launch SSP template simulation';
          } finally {
              isRunningTemplateSimulation = false;
          }
      }

      function startTemplateSimulationPoll(jobId: string, context = templateSimulationDesignContext) {
          clearTemplateSimulationPoll();
          refreshTemplateSimulation(jobId, context);
          templateSimulationPoll = setInterval(() => refreshTemplateSimulation(jobId, context), 4000);
      }

      async function refreshTemplateSimulation(jobId = templateSimulationResult?.jobId, context = templateSimulationDesignContext) {
          if (!jobId) return;

          try {
              const response = await fetch(`/api/simulation/template-run?jobId=${encodeURIComponent(jobId)}`);
              const body = await response.json();
              if (!response.ok || body.ok === false) {
                  throw new Error(body.message || 'Failed to refresh SSP template simulation');
              }
              templateSimulationResult = body;
              saveTemplateSimulationResult(body, context);

              if (isTemplateSimulationComplete(body)) {
                  clearTemplateSimulationPoll();
              }
          } catch (error) {
              templateSimulationError = error instanceof Error ? error.message : 'Failed to refresh SSP template simulation';
              clearTemplateSimulationPoll();
          }
      }

      function saveTemplateSimulationResult(body: Record<string, any>, context = templateSimulationDesignContext) {
          if (!body?.jobId) return;
          const designContext = context || {
              id: $currentSystemMeta.id,
              name: $currentSystemMeta.name || 'Design Stage'
          };
          upsertTemplateSimulationResult(
              toTemplateSimulationResultRecord(body, designContext.id, designContext.name)
          );
      }

      function clearTemplateSimulationPoll() {
          if (templateSimulationPoll) {
              clearInterval(templateSimulationPoll);
              templateSimulationPoll = undefined;
          }
      }

      function isTemplateSimulationComplete(result: any) {
          const status = String(result?.status || '').toUpperCase();
          return ['SUCCESS', 'ERROR', 'TERMINATED', 'RESULTS_AVAILABLE'].includes(status);
      }

      function formatListCount(values: unknown[] | undefined, singular: string) {
          const count = Array.isArray(values) ? values.length : 0;
          return `${count} ${singular}${count === 1 ? '' : 's'}`;
      }

      function formatMetric(value: unknown) {
          return typeof value === 'number' && Number.isFinite(value)
              ? value.toLocaleString(undefined, { maximumFractionDigits: Math.abs(value) >= 100 ? 1 : 3 })
              : 'n/a';
      }

      function hasTemplateSimulationBinding(nodes = $currentNodes, seenSubsystems = new Set<string>()): boolean {
          for (const node of nodes) {
              const metadata = [
                  ...(((node.data as any)?.metadata || []) as Array<{ key?: string; value?: string }>),
                  ...((((node.data as any)?.element?.metadata || []) as Array<{ key?: string; value?: string }>))
              ];

              if (metadata.some(entry =>
                  String(entry.key || '').toLowerCase() === 'templatesimulation' &&
                  String(entry.value || '') === templateSimulationId
              )) {
                  return true;
              }

              const subsystemId = (node.data as any)?.element?.subsystemId;
              if (subsystemId && !seenSubsystems.has(subsystemId)) {
                  seenSubsystems.add(subsystemId);
                  const subsystem = $systems.find(system => system.id === subsystemId);
                  if (subsystem && hasTemplateSimulationBinding(subsystem.nodes, seenSubsystems)) {
                      return true;
                  }
              }
          }
          return false;
      }

      function downloadAnalysisReport() {
          if (!analysisResult) return;
          try {
              downloadTorsionalAnalysisPdf(analysisResult, {
                  systemName: $currentSystemMeta.name || 'Design Stage',
                  generatedAt: analysisResult.generatedAt
              });
          } catch (error) {
              analysisError = error instanceof Error ? error.message : 'Failed to generate PDF report';
          }
      }

      function saveCompletedAnalysisReport(result: any, analysisNodes: any[]) {
          const designSystem = $systems.find(system => system.id === $currentSystemMeta.id);
          const sourceConceptSystemId = designSystem?.sourceConceptSystemId || designSystem?.parentSystemId || '';
          if (!sourceConceptSystemId || designSystem?.stage !== 'design') return;

          const sourceConceptSystemName = designSystem.sourceConceptSystemName || $systems.find(system => system.id === sourceConceptSystemId)?.name || 'Concept Stage';
          const generatedAt = result.generatedAt || new Date().toISOString();
          const filename = defaultTorsionalAnalysisFilename($currentSystemMeta.name || 'design-stage');
          const pdfBytes = buildTorsionalAnalysisPdf(result, {
              systemName: $currentSystemMeta.name || 'Design Stage',
              generatedAt,
              filename
          });
          const report: AnalysisReportRecord = {
              id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              analysisType: 'torsional_vibration',
              title: 'Torsional Vibration Analysis',
              summary: String(result.summary || 'Computed torsional vibration analysis.'),
              engine: String(result.engine || 'OpenTorsion'),
              filename,
              pdfBase64: bytesToBase64(pdfBytes),
              fileSizeBytes: pdfBytes.byteLength,
              generatedAt,
              sourceConceptSystemId,
              sourceConceptSystemName,
              designSystemId: $currentSystemMeta.id,
              designSystemName: $currentSystemMeta.name || 'Design Stage',
              requestIds: uniqueStrings([...(designSystem.sourceAnalysisRequestIds ?? []), ...analysisNodes.map(node => node.requestId)]),
              oemNames: uniqueStrings(analysisNodes.map(node => node.oemName)),
              oemShortCodes: uniqueStrings(analysisNodes.map(node => node.oemShortCode)),
              sharedRequestIds: [],
              sharedAt: null
          };
          upsertAnalysisReport(report);
      }

      function uniqueStrings(values: unknown[]): string[] {
          return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map(value => value.trim())));
      }

      function collectAnalysisNodes(nodes?: any[], seenSubsystems = new Set<string>()): any[] {
          const collected: any[] = [];
          const sourceNodes = nodes ?? $currentNodes;
          for (const node of sourceNodes) {
              if (node.id === 'root') continue;
              const element = (node.data as any)?.element;
              if (element?.type === 'system' && element.subsystemId && !seenSubsystems.has(element.subsystemId)) {
                  seenSubsystems.add(element.subsystemId);
                  const subsystem = $systems.find(system => system.id === element.subsystemId);
                  if (subsystem) {
                      collected.push(...collectAnalysisNodes(subsystem.nodes, seenSubsystems));
                  }
                  continue;
              }

              if (node.type !== 'Element') continue;
              const fmuId = $componentLinks[node.id] || element?.fmiComponentId || '';
              const fmu = fmuId ? $fmiComponents.find(component => component.id === fmuId) : null;
              collected.push({
                  id: node.id,
                  name: String((node.data as any)?.name || ''),
                  position: node.position,
                  mass: element?.mass ?? (node.data as any)?.mass ?? null,
                  metadata: element?.metadata || (node.data as any)?.metadata || [],
                  fmuId,
                  fmuName: fmu?.name || element?.fmiBinding?.fmuName || '',
                  oemName: fmu?.oemName || element?.fmiBinding?.oemName || '',
                  oemShortCode: fmu?.oemShortCode || element?.fmiBinding?.oemShortCode || '',
                  partName: element?.fmiBinding?.partName || '',
                  requestId: element?.fmiBinding?.requestId || '',
                  responseId: element?.fmiBinding?.responseId || ''
              });
          }
          return collected;
      }

      onDestroy(() => {
          clearTemplateSimulationPoll();
      });
  </script>

  <div class="popover-wrapper" onclick={onclose}>
      <div class="popover-content test-scenarios-popover" onclick={(e) => e.stopPropagation()}>
          <div class="popover-header">
              <h3>Test Scenarios</h3>
              <button class="close-button" onclick={onclose} aria-label="Close test scenarios">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
              </button>
          </div>

          <div class="tabs">
              <button
                  class="tab {activeTab === 'standard' ? 'active' : ''}"
                  onclick={() => activeTab = 'standard'}>
                  Standard Tests
              </button>
              <button
                  class="tab {activeTab === 'custom' ? 'active' : ''}"
                  onclick={() => activeTab = 'custom'}>
                  Custom Scenarios
              </button>
          </div>

          <div class="popover-body">
              {#if activeTab === 'standard'}
                  <div class="standard-tests">
                      <p class="description">Select predefined test scenarios from industry standards</p>

                      {#each standardTestCategories as category}
                          <div class="test-category">
                              <h4>{category.name}</h4>
                              {#each category.tests as test}
                                  <div class="test-item">
                                      <label>
                                          <input
                                              type="checkbox"
                                              checked={selectedStandardTests.has(test.id)}
                                              onchange={() => toggleStandardTest(test.id)}
                                          />
                                          <div class="test-info">
                                              <span class="test-name">{test.name}</span>
                                              <span class="test-description">{test.description}</span>
                                          </div>
                                      </label>
                                  </div>
                              {/each}
                          </div>
                      {/each}
                  </div>
                  {#if analysisError}
                      <div class="analysis-message error">{analysisError}</div>
                  {/if}
                  {#if analysisResult}
                      <div class="analysis-result">
                          <div class="analysis-result-header">
                              <div>
                                  <h4>Torsional Vibration Analysis</h4>
                                  <p>{analysisResult.summary}</p>
                              </div>
                              <div class="analysis-header-actions">
                                  <span class="analysis-engine">{analysisResult.engine}</span>
                                  <button class="report-btn" onclick={downloadAnalysisReport}>Download PDF</button>
                              </div>
                          </div>
                          <div class="analysis-grid">
                              <div>
                                  <span>Components</span>
                                  <strong>{analysisResult.model.component_count}</strong>
                              </div>
                              <div>
                                  <span>Shafts</span>
                                  <strong>{analysisResult.model.shaft_count}</strong>
                              </div>
                              <div>
                                  <span>First mode</span>
                                  <strong>{analysisResult.natural_frequencies_hz[0] ?? 'n/a'} Hz</strong>
                              </div>
                          </div>
                          <div class="analysis-table">
                              <div class="analysis-table-row head">
                                  <span>Mode</span>
                                  <span>Frequency</span>
                                  <span>Critical speed</span>
                              </div>
                              {#each analysisResult.natural_frequencies_hz as frequency, index}
                                  <div class="analysis-table-row">
                                      <span>{index + 1}</span>
                                      <span>{frequency} Hz</span>
                                      <span>{analysisResult.critical_speeds_rpm[index]} rpm</span>
                                  </div>
                              {/each}
                          </div>
                          <div class="analysis-components">
                              {#each analysisResult.model.components as component}
                                  <span>{component.name}{component.oem ? ` (${component.oem})` : ''}</span>
                              {/each}
                          </div>
                          {#if analysisResult.warnings?.length}
                              <div class="analysis-message warn">{analysisResult.warnings.join(' ')}</div>
                          {/if}
                      </div>
                  {/if}
                  {#if templateSimulationError}
                      <div class="analysis-message error">{templateSimulationError}</div>
                  {/if}
                  {#if templateSimulationResult}
                      <div class="analysis-result">
                          <div class="analysis-result-header">
                              <div>
                                  <h4>SSP Template Cloud Simulation</h4>
                                  <p>{templateSimulationResult.message || 'Template simulation job submitted.'}</p>
                              </div>
                              <div class="analysis-header-actions">
                                  <span class="analysis-engine">{templateSimulationResult.status || 'PENDING'}</span>
                                  <button class="report-btn" onclick={() => refreshTemplateSimulation()}>Refresh</button>
                              </div>
                          </div>
                          <div class="analysis-grid">
                              <div>
                                  <span>Job</span>
                                  <strong>{templateSimulationResult.jobId?.slice(0, 12) || 'n/a'}</strong>
                              </div>
                              <div>
                                  <span>Result files</span>
                                  <strong>{formatListCount(templateSimulationResult.files, 'file')}</strong>
                              </div>
                              <div>
                                  <span>Variables</span>
                                  <strong>{formatListCount(templateSimulationResult.variables, 'variable')}</strong>
                              </div>
                              <div>
                                  <span>Series sample</span>
                                  <strong>{formatListCount(templateSimulationResult.series, 'trace')}</strong>
                              </div>
                          </div>
                          {#if templateSimulationResult.files?.length}
                              <div class="analysis-components">
                                  {#each templateSimulationResult.files as file}
                                      <span>{file}</span>
                                  {/each}
                              </div>
                          {/if}
                          {#if templateSimulationResult.variables?.length}
                              <div class="template-variable-list">
                                  {#each templateSimulationResult.variables.slice(0, 80) as variable}
                                      <span>{variable}</span>
                                  {/each}
                              </div>
                          {/if}
                          {#if templateSimulationResult.series?.length}
                              <div class="template-series-table">
                                  <div class="template-series-row head">
                                      <span>Variable</span>
                                      <span>First</span>
                                      <span>Last</span>
                                      <span>Min</span>
                                      <span>Max</span>
                                  </div>
                                  {#each templateSimulationResult.series as series}
                                      <div class="template-series-row">
                                          <span>{series.name}</span>
                                          <span>{formatMetric(series.first)}</span>
                                          <span>{formatMetric(series.last)}</span>
                                          <span>{formatMetric(series.min)}</span>
                                          <span>{formatMetric(series.max)}</span>
                                      </div>
                                  {/each}
                              </div>
                          {/if}
                      </div>
                  {/if}
              {:else}
                  <div class="custom-scenarios">
                      <div class="custom-header">
                          <p class="description">Define custom test scenarios with timed actions</p>
                          <button class="add-scenario-btn" onclick={addCustomScenario}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                              Add Scenario
                          </button>
                      </div>

                      {#each customScenarios as scenario}
                          <div class="scenario-card">
                              <input
                                  class="scenario-name"
                                  type="text"
                                  bind:value={scenario.name}
                                  placeholder="Scenario name"
                              />

                              <div class="actions-list">
                                  {#each scenario.actions as action, index}
                                      <div class="action-row">
                                          <span class="time-label">t =</span>
                                          <input
                                              class="time-input"
                                              type="text"
                                              bind:value={action.time}
                                              placeholder="0"
                                          />
                                          <span class="time-unit">s</span>
                                          <input
                                              class="action-input"
                                              type="text"
                                              bind:value={action.action}
                                              placeholder="Define action..."
                                          />
                                      </div>
                                  {/each}
                                  <button class="add-action-btn" onclick={() => addAction(scenario.id)}>
                                      + Add Action
                                  </button>
                              </div>
                          </div>
                      {/each}

                      {#if customScenarios.length === 0}
                          <div class="empty-state">
                              <p>No custom scenarios defined yet</p>
                          </div>
                      {/if}
                  </div>
              {/if}
          </div>

          <div class="popover-footer">
              <button class="cancel-btn" onclick={onclose}>Cancel</button>
              <button class="apply-btn" disabled={isRunningAnalysis || isRunningTemplateSimulation} onclick={applySelectedTests}>
                  {isRunningAnalysis || isRunningTemplateSimulation ? 'Running...' : 'Run Selected'}
              </button>
          </div>
      </div>
  </div>

  <style>
      .popover-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
      }

      .popover-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
      }

      .test-scenarios-popover {
          width: 700px;
          max-height: 80vh;
      }

      .popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      .popover-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
      }

      .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
      }

      .close-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
      }

      .tabs {
          display: flex;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0 20px;
      }

      .tab {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.6);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
      }

      .tab:hover {
          color: rgba(0, 0, 0, 0.8);
      }

      .tab.active {
          color: var(--main-dark-color);
          border-bottom-color: var(--main-dark-color);
      }

      .popover-body {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
      }

      .description {
          color: rgba(0, 0, 0, 0.6);
          font-size: 14px;
          margin-bottom: 20px;
      }

      .test-category {
          margin-bottom: 24px;
      }

      .test-category h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
          color: rgba(0, 0, 0, 0.8);
      }

      .test-item {
          margin-bottom: 8px;
      }

      .test-item label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
      }

      .test-item label:hover {
          background-color: rgba(0, 0, 0, 0.02);
      }

      .test-item input[type="checkbox"] {
          margin-right: 12px;
          margin-top: 2px;
      }

      .test-info {
          display: flex;
          flex-direction: column;
      }

      .test-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.9);
      }

      .test-description {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.5);
          margin-top: 2px;
      }

      .analysis-result {
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 8px;
          background: #f8fbff;
          padding: 14px;
          margin-top: 16px;
      }

      .analysis-result-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
      }

      .analysis-result-header h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
      }

      .analysis-result-header p {
          margin: 0;
          color: rgba(0, 0, 0, 0.6);
          font-size: 13px;
      }

      .analysis-header-actions {
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 150px;
      }

      .analysis-engine {
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          height: fit-content;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
      }

      .report-btn {
          border: 1px solid #bfdbfe;
          background: #ffffff;
          color: #1d4ed8;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
      }

      .report-btn:hover {
          background: #eff6ff;
      }

      .analysis-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 12px;
      }

      .analysis-grid div {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          background: white;
          padding: 8px;
      }

      .analysis-grid span {
          display: block;
          color: rgba(0, 0, 0, 0.55);
          font-size: 12px;
          margin-bottom: 3px;
      }

      .analysis-grid strong {
          font-size: 15px;
      }

      .analysis-table {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          background: white;
          overflow: hidden;
      }

      .analysis-table-row {
          display: grid;
          grid-template-columns: 0.6fr 1fr 1fr;
          gap: 8px;
          padding: 7px 9px;
          font-size: 13px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
      }

      .analysis-table-row.head {
          border-top: 0;
          background: rgba(0, 0, 0, 0.03);
          font-weight: 600;
      }

      .analysis-components {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
      }

      .analysis-components span {
          border-radius: 999px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 4px 8px;
          font-size: 12px;
      }

      .template-variable-list {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          background: white;
          display: grid;
          gap: 4px;
          max-height: 180px;
          margin-top: 10px;
          overflow-y: auto;
          padding: 8px;
      }

      .template-variable-list span {
          color: rgba(0, 0, 0, 0.72);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 12px;
          overflow-wrap: anywhere;
      }

      .template-series-table {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          background: white;
          margin-top: 10px;
          overflow: hidden;
      }

      .template-series-row {
          display: grid;
          grid-template-columns: minmax(190px, 1fr) repeat(4, 70px);
          gap: 8px;
          padding: 7px 9px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          font-size: 12px;
      }

      .template-series-row:first-child {
          border-top: 0;
      }

      .template-series-row.head {
          background: rgba(0, 0, 0, 0.03);
          font-weight: 600;
      }

      .template-series-row span:first-child {
          overflow-wrap: anywhere;
      }

      .analysis-message {
          border-radius: 6px;
          padding: 9px 10px;
          font-size: 13px;
          margin-top: 12px;
      }

      .analysis-message.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
      }

      .analysis-message.warn {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
      }

      .custom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
      }

      .add-scenario-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background-color: var(--main-dark-color);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: opacity 0.2s;
      }

      .add-scenario-btn:hover {
          opacity: 0.9;
      }

      .scenario-card {
          background-color: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
      }

      .scenario-name {
          width: 100%;
          padding: 8px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
      }

      .actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }

      .action-row {
          display: flex;
          align-items: center;
          gap: 8px;
      }

      .time-label {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
      }

      .time-input {
          width: 60px;
          padding: 6px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          font-size: 14px;
      }

      .time-unit {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
          margin-right: 8px;
      }

      .action-input {
          flex: 1;
          padding: 6px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          font-size: 14px;
      }

      .add-action-btn {
          align-self: flex-start;
          padding: 4px 8px;
          background: none;
          border: 1px dashed rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          transition: all 0.2s;
      }

      .add-action-btn:hover {
          border-color: rgba(0, 0, 0, 0.5);
          color: rgba(0, 0, 0, 0.8);
      }

      .empty-state {
          text-align: center;
          padding: 40px;
          color: rgba(0, 0, 0, 0.4);
      }

      .popover-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
      }

      .cancel-btn, .apply-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
      }

      .cancel-btn {
          background: none;
          border: 1px solid rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.7);
      }

      .cancel-btn:hover {
          background-color: rgba(0, 0, 0, 0.05);
      }

      .apply-btn {
          background-color: var(--main-dark-color);
          border: none;
          color: white;
      }

      .apply-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
      }

      .apply-btn:hover {
          opacity: 0.9;
      }
  </style>
