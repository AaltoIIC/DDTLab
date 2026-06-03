<script lang="ts">
    import {
        currentSystemMeta,
        templateSimulationResults,
        toTemplateSimulationResultRecord,
        upsertTemplateSimulationResult
    } from '$lib/stores/stores.svelte';
    import type {
        TemplateSimulationResultRecord,
        TemplateSimulationSeries,
        TemplateSimulationSimpleVariable
    } from '$lib/types/types';

    interface Props {
        isOpen: boolean;
    }

    let { isOpen = $bindable(false) }: Props = $props();

    let selectedRunId = $state('');
    let selectedVariableId = $state('');
    let selectedSeriesIds = $state<string[]>([]);
    let isLoadingSeries = $state(false);
    let seriesError = $state('');

    const lineColors = ['#2563eb', '#dc2626', '#047857', '#7c3aed', '#c2410c', '#0891b2'];
    const chart = { width: 760, height: 280, left: 46, right: 18, top: 18, bottom: 34 };

    const currentResults = $derived(
        ($templateSimulationResults || [])
            .filter((result) => result.designSystemId === $currentSystemMeta.id)
            .sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt))
    );
    const selectedRun = $derived(
        currentResults.find((result) => result.id === selectedRunId) || currentResults[0] || null
    );
    const availableVariables = $derived(getAvailableVariables(selectedRun));
    const plottedSeries = $derived(
        (selectedRun?.series || []).filter((series) =>
            selectedSeriesIds.includes(seriesIdFor(series, availableVariables)) &&
            Array.isArray(series.t) &&
            Array.isArray(series.value) &&
            series.t.length > 1 &&
            series.value.length > 1
        )
    );
    const chartDomain = $derived(calculateDomain(plottedSeries));
    const missingSeriesCount = $derived(
        selectedSeriesIds.filter((seriesId) => !findSeriesById(selectedRun?.series || [], seriesId, availableVariables)).length
    );

    $effect(() => {
        if (!isOpen) return;
        const firstRun = currentResults[0];
        if (!firstRun) {
            selectedRunId = '';
            selectedVariableId = '';
            selectedSeriesIds = [];
            return;
        }
        if (!currentResults.some((result) => result.id === selectedRunId)) {
            selectedRunId = firstRun.id;
            selectedVariableId = '';
            selectedSeriesIds = [];
        }
    });

    $effect(() => {
        if (!isOpen || !selectedRun) return;

        if (availableVariables.length && !availableVariables.some((variable) => variable.id === selectedVariableId)) {
            selectedVariableId = availableVariables[0].id;
        } else if (!availableVariables.length && selectedVariableId) {
            selectedVariableId = '';
        }

        const validVariableIds = new Set(availableVariables.map((variable) => variable.id));
        const nextSelectedIds = selectedSeriesIds.filter((seriesId) =>
            validVariableIds.has(seriesId) || Boolean(findSeriesById(selectedRun.series, seriesId, availableVariables))
        );
        if (!sameArray(nextSelectedIds, selectedSeriesIds)) {
            selectedSeriesIds = nextSelectedIds;
            return;
        }

        if (selectedSeriesIds.length === 0 && selectedRun.series?.length) {
            const defaultIds = selectedRun.series
                .map((series) => seriesIdFor(series, availableVariables))
                .filter(Boolean)
                .slice(0, 3);
            if (defaultIds.length) selectedSeriesIds = defaultIds;
        }
    });

    function close() {
        isOpen = false;
    }

    function handleRunChange() {
        selectedVariableId = '';
        selectedSeriesIds = [];
        seriesError = '';
    }

    async function addSelectedVariable() {
        if (!selectedVariableId || selectedSeriesIds.includes(selectedVariableId)) return;
        const nextIds = [...selectedSeriesIds, selectedVariableId].slice(-6);
        selectedSeriesIds = nextIds;
        await fetchSeries(nextIds);
    }

    function removeSelectedVariable(seriesId: string) {
        selectedSeriesIds = selectedSeriesIds.filter((id) => id !== seriesId);
    }

    async function refreshRun() {
        await fetchSeries(selectedSeriesIds);
    }

    async function fetchSeries(seriesIds = selectedSeriesIds) {
        if (!selectedRun?.jobId) return;

        isLoadingSeries = true;
        seriesError = '';
        try {
            const params = new URLSearchParams({ jobId: selectedRun.jobId });
            for (const seriesId of seriesIds) {
                params.append('seriesId', seriesId);
            }

            const response = await fetch(`/api/simulation/template-run?${params.toString()}`);
            const body = await response.json();
            if (!response.ok || body.ok === false) {
                throw new Error(body.message || 'Failed to load simulation results');
            }

            upsertTemplateSimulationResult(
                toTemplateSimulationResultRecord(
                    body,
                    selectedRun.designSystemId,
                    selectedRun.designSystemName,
                    selectedRun
                )
            );
        } catch (error) {
            seriesError = error instanceof Error ? error.message : 'Failed to load simulation results';
        } finally {
            isLoadingSeries = false;
        }
    }

    function getAvailableVariables(result: TemplateSimulationResultRecord | null): TemplateSimulationSimpleVariable[] {
        if (!result) return [];
        const sourceVariables = result.simpleVariables?.length
            ? result.simpleVariables
            : (result.variables || []).map((name) => ({ id: name, name }));
        const seen = new Set<string>();
        return sourceVariables
            .filter((variable) => variable?.id && variable?.name)
            .filter((variable) => {
                if (seen.has(variable.id)) return false;
                seen.add(variable.id);
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    function findSeriesById(
        series: TemplateSimulationSeries[],
        seriesId: string,
        variables: TemplateSimulationSimpleVariable[]
    ) {
        return series.find((item) => seriesIdFor(item, variables) === seriesId);
    }

    function seriesIdFor(series: TemplateSimulationSeries, variables: TemplateSimulationSimpleVariable[]) {
        if (series.id) return String(series.id);
        const match = variables.find((variable) => variable.name === series.name);
        return String(match?.id || series.name || '');
    }

    function variableLabel(seriesId: string) {
        const variable = availableVariables.find((item) => item.id === seriesId);
        return shortenVariableName(variable?.name || seriesId);
    }

    function shortenVariableName(name: string | undefined) {
        if (!name) return 'Unnamed variable';
        return name.replace(/^Demo\.Root\./, '');
    }

    function formatRunLabel(result: TemplateSimulationResultRecord) {
        const time = formatDate(result.updatedAt || result.createdAt);
        return `${result.status || 'UNKNOWN'} - ${String(result.jobId || 'n/a').slice(0, 12)} - ${time}`;
    }

    function formatDate(value: string | undefined) {
        if (!value) return 'n/a';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function statusClass(status: string | undefined) {
        const normalized = String(status || '').toUpperCase();
        if (['SUCCESS', 'RESULTS_AVAILABLE'].includes(normalized)) return 'success';
        if (['ERROR', 'TERMINATED'].includes(normalized)) return 'error';
        return 'running';
    }

    function formatMetric(value: unknown) {
        return typeof value === 'number' && Number.isFinite(value)
            ? value.toLocaleString(undefined, { maximumFractionDigits: Math.abs(value) >= 100 ? 1 : 3 })
            : 'n/a';
    }

    function calculateDomain(series: TemplateSimulationSeries[]) {
        const times = series.flatMap((item) => item.t);
        const values = series.flatMap((item) => item.value);
        const xMin = Math.min(...times);
        const xMax = Math.max(...times);
        const yMin = Math.min(...values);
        const yMax = Math.max(...values);
        return {
            xMin: Number.isFinite(xMin) ? xMin : 0,
            xMax: Number.isFinite(xMax) && xMax !== xMin ? xMax : 1,
            yMin: Number.isFinite(yMin) ? yMin : 0,
            yMax: Number.isFinite(yMax) && yMax !== yMin ? yMax : 1
        };
    }

    function pointsFor(series: TemplateSimulationSeries) {
        const plotWidth = chart.width - chart.left - chart.right;
        const plotHeight = chart.height - chart.top - chart.bottom;
        const xSpan = chartDomain.xMax - chartDomain.xMin || 1;
        const ySpan = chartDomain.yMax - chartDomain.yMin || 1;

        return series.t
            .map((time, index) => {
                const value = series.value[index];
                if (!Number.isFinite(time) || !Number.isFinite(value)) return '';
                const x = chart.left + ((time - chartDomain.xMin) / xSpan) * plotWidth;
                const y = chart.top + plotHeight - ((value - chartDomain.yMin) / ySpan) * plotHeight;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .filter(Boolean)
            .join(' ');
    }

    function sameArray(a: string[], b: string[]) {
        return a.length === b.length && a.every((value, index) => value === b[index]);
    }
</script>

{#if isOpen}
    <div class="popover-wrapper">
        <div class="popover-content results-popover">
            <div class="popover-header">
                <div>
                    <h3>Simulation Results</h3>
                    <p>{$currentSystemMeta.name || 'Current design stage'}</p>
                </div>
                <button class="close-button" onclick={close} aria-label="Close results">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div class="popover-body">
                {#if !currentResults.length}
                    <div class="empty-state">
                        <h4>No simulation runs for this design</h4>
                        <p>Run the SSP Template Cloud Simulation from Test Scenarios, then return here to inspect variables and plots.</p>
                    </div>
                {:else if selectedRun}
                    <div class="result-toolbar">
                        <label>
                            <span>Run</span>
                            <select bind:value={selectedRunId} onchange={handleRunChange}>
                                {#each currentResults as result}
                                    <option value={result.id}>{formatRunLabel(result)}</option>
                                {/each}
                            </select>
                        </label>
                        <button class="secondary-btn" disabled={isLoadingSeries} onclick={refreshRun}>
                            {isLoadingSeries ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    <div class="summary-grid">
                        <div>
                            <span>Status</span>
                            <strong class={statusClass(selectedRun.status)}>{selectedRun.status || 'UNKNOWN'}</strong>
                        </div>
                        <div>
                            <span>Job</span>
                            <strong>{String(selectedRun.jobId || 'n/a').slice(0, 18)}</strong>
                        </div>
                        <div>
                            <span>Result file</span>
                            <strong>{selectedRun.resultFile || (selectedRun.hdf5Files || [])[0] || 'n/a'}</strong>
                        </div>
                        <div>
                            <span>Variables</span>
                            <strong>{availableVariables.length}</strong>
                        </div>
                    </div>

                    <div class="variable-toolbar">
                        <label>
                            <span>Variable</span>
                            <select bind:value={selectedVariableId} disabled={!availableVariables.length}>
                                {#each availableVariables as variable}
                                    <option value={variable.id}>{shortenVariableName(variable.name)}</option>
                                {/each}
                            </select>
                        </label>
                        <button class="primary-btn" disabled={!selectedVariableId || selectedSeriesIds.includes(selectedVariableId) || isLoadingSeries} onclick={addSelectedVariable}>
                            Add Plot
                        </button>
                    </div>

                    {#if selectedSeriesIds.length}
                        <div class="selected-variables">
                            {#each selectedSeriesIds as seriesId}
                                <button class="variable-chip" onclick={() => removeSelectedVariable(seriesId)}>
                                    <span>{variableLabel(seriesId)}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            {/each}
                        </div>
                    {/if}

                    {#if seriesError}
                        <div class="result-message error">{seriesError}</div>
                    {/if}
                    {#if missingSeriesCount > 0 && !isLoadingSeries}
                        <div class="result-message warn">Some selected variables do not have loaded samples yet. Refresh to request them from the result service.</div>
                    {/if}

                    <div class="plot-panel">
                        {#if plottedSeries.length}
                            <svg class="series-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Selected simulation variables plot">
                                <line x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.height - chart.bottom} class="axis" />
                                <line x1={chart.left} y1={chart.height - chart.bottom} x2={chart.width - chart.right} y2={chart.height - chart.bottom} class="axis" />
                                <text x={chart.left - 8} y={chart.top + 4} text-anchor="end" class="axis-label">{formatMetric(chartDomain.yMax)}</text>
                                <text x={chart.left - 8} y={chart.height - chart.bottom} text-anchor="end" class="axis-label">{formatMetric(chartDomain.yMin)}</text>
                                <text x={chart.left} y={chart.height - 9} text-anchor="middle" class="axis-label">{formatMetric(chartDomain.xMin)}s</text>
                                <text x={chart.width - chart.right} y={chart.height - 9} text-anchor="middle" class="axis-label">{formatMetric(chartDomain.xMax)}s</text>
                                {#each plottedSeries as series, index}
                                    <polyline points={pointsFor(series)} fill="none" stroke={lineColors[index % lineColors.length]} stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />
                                {/each}
                            </svg>
                            <div class="legend">
                                {#each plottedSeries as series, index}
                                    <span>
                                        <i style={`background: ${lineColors[index % lineColors.length]}`}></i>
                                        {shortenVariableName(series.name)}
                                    </span>
                                {/each}
                            </div>
                        {:else}
                            <div class="plot-empty">
                                <h4>No plotted variables</h4>
                                <p>Select a variable and add it to the plot.</p>
                            </div>
                        {/if}
                    </div>

                    {#if plottedSeries.length}
                        <div class="series-table">
                            <div class="series-row head">
                                <span>Variable</span>
                                <span>First</span>
                                <span>Last</span>
                                <span>Min</span>
                                <span>Max</span>
                            </div>
                            {#each plottedSeries as series}
                                <div class="series-row">
                                    <span>{shortenVariableName(series.name)}</span>
                                    <span>{formatMetric(series.first)}</span>
                                    <span>{formatMetric(series.last)}</span>
                                    <span>{formatMetric(series.min)}</span>
                                    <span>{formatMetric(series.max)}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .popover-wrapper {
        position: fixed;
        inset: 0;
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
        max-width: 92vw;
        max-height: 88vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .results-popover {
        width: 860px;
    }

    .popover-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .popover-header h3 {
        margin: 0 0 3px 0;
        font-size: 18px;
        font-weight: 600;
    }

    .popover-header p {
        margin: 0;
        color: rgba(0, 0, 0, 0.55);
        font-size: 13px;
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
    }

    .close-button:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .popover-body {
        padding: 18px 20px 20px;
        overflow-y: auto;
    }

    .empty-state,
    .plot-empty {
        text-align: center;
        color: rgba(0, 0, 0, 0.55);
        padding: 34px 20px;
    }

    .empty-state h4,
    .plot-empty h4 {
        color: rgba(0, 0, 0, 0.82);
        margin: 0 0 6px 0;
        font-size: 15px;
    }

    .empty-state p,
    .plot-empty p {
        margin: 0;
        font-size: 13px;
    }

    .result-toolbar,
    .variable-toolbar {
        display: flex;
        align-items: flex-end;
        gap: 10px;
        margin-bottom: 12px;
    }

    .result-toolbar label,
    .variable-toolbar label {
        display: grid;
        gap: 5px;
        flex: 1;
    }

    label span {
        color: rgba(0, 0, 0, 0.58);
        font-size: 12px;
        font-weight: 600;
    }

    select {
        width: 100%;
        border: 1px solid rgba(0, 0, 0, 0.16);
        border-radius: 4px;
        background: white;
        color: rgba(0, 0, 0, 0.85);
        height: 34px;
        padding: 0 9px;
        font-size: 13px;
    }

    .primary-btn,
    .secondary-btn {
        height: 34px;
        border-radius: 4px;
        padding: 0 12px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
    }

    .primary-btn {
        border: none;
        background: var(--main-dark-color);
        color: white;
    }

    .secondary-btn {
        border: 1px solid #bfdbfe;
        background: #ffffff;
        color: #1d4ed8;
    }

    .primary-btn:disabled,
    .secondary-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 14px;
    }

    .summary-grid div {
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 6px;
        background: #f8fbff;
        padding: 8px;
        min-width: 0;
    }

    .summary-grid span {
        display: block;
        color: rgba(0, 0, 0, 0.55);
        font-size: 12px;
        margin-bottom: 3px;
    }

    .summary-grid strong {
        display: block;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .summary-grid strong.success {
        color: #047857;
    }

    .summary-grid strong.error {
        color: #b91c1c;
    }

    .summary-grid strong.running {
        color: #1d4ed8;
    }

    .selected-variables {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 4px 0 12px;
    }

    .variable-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 260px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 999px;
        background: #ffffff;
        color: rgba(0, 0, 0, 0.78);
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
    }

    .variable-chip span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .result-message {
        border-radius: 6px;
        padding: 9px 10px;
        font-size: 13px;
        margin-bottom: 12px;
    }

    .result-message.error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }

    .result-message.warn {
        background: #fffbeb;
        color: #92400e;
        border: 1px solid #fde68a;
    }

    .plot-panel {
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 8px;
        background: white;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .series-chart {
        width: 100%;
        height: 315px;
        display: block;
        background: linear-gradient(#ffffff, #fbfdff);
    }

    .axis {
        stroke: rgba(0, 0, 0, 0.25);
        stroke-width: 1;
    }

    .axis-label {
        fill: rgba(0, 0, 0, 0.52);
        font-size: 11px;
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        padding: 8px 10px;
        font-size: 12px;
    }

    .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .legend i {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex: 0 0 auto;
    }

    .series-table {
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 6px;
        background: white;
        overflow: hidden;
    }

    .series-row {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) repeat(4, 76px);
        gap: 8px;
        padding: 7px 9px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        font-size: 12px;
    }

    .series-row:first-child {
        border-top: 0;
    }

    .series-row.head {
        background: rgba(0, 0, 0, 0.03);
        font-weight: 600;
    }

    .series-row span:first-child {
        overflow-wrap: anywhere;
    }

    @media (max-width: 760px) {
        .results-popover {
            width: calc(100vw - 24px);
        }

        .result-toolbar,
        .variable-toolbar {
            align-items: stretch;
            flex-direction: column;
        }

        .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .series-row {
            grid-template-columns: minmax(140px, 1fr) repeat(4, 58px);
        }
    }
</style>
