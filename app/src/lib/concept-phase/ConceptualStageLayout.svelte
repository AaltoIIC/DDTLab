<script lang="ts">
    import { createBubbler, stopPropagation } from 'svelte/legacy';

    const bubble = createBubbler();
    import ConceptualStageEditor from './ConceptualStageEditor.svelte';
    import ConceptualStageSidebar from './ConceptualStageSidebar.svelte';
    import PackageBreadcrumb from './PackageBreadcrumb.svelte';
    import {
        currentSystemMeta,
        currentNodes,
        currentEdges,
        analysisReports,
        convertToDesign as convertConceptToDesign,
        markAnalysisReportShared,
        removeOtherSystems,
        type ConceptFmuBinding
    } from '$lib/stores/stores.svelte';
    import { currentPackageView, packageViewStack, navigateToRoot, navigateToPackage } from './packageStore';
    import type { PackageView } from './packageStore';
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import { Save, CircleQuestionMark, Repeat, Send } from '@lucide/svelte';
    import { saveTemplate } from '$lib/stores/stores.svelte';
    import {
        createAnalysisRequest,
        fetchAnalysisRequestStatuses,
        shareAnalysisReport,
        type AnalysisRequestStatusView,
        type AnalysisRequestParameter,
        type AnalysisRequestPartPayload,
        type CreateAnalysisRequestPayload
    } from '$lib/analysis/analysisRequestApi';
    import { base64ToBytes, downloadPdfBytes } from '$lib/analysis/analysisReportFiles';
    import type { AnalysisReportRecord } from '$lib/types/types';
    import Tour from '$lib/Tour.svelte';
    import { type Driver, type DriveStep } from "driver.js";
    import _ from 'lodash';
    
    let conceptEditor: ConceptualStageEditor | undefined = $state();
    let showSaveDialog = $state(false);
    let templateName = $state('');
    let templateDescription = $state('');
    let previousViewStack: PackageView[] = [];
    let showAnalysisRequestDialog = $state(false);
    let analysisRequesterOrg = $state('RMC');
    let analysisRequesterName = $state('RMC');
    let analysisTitle = $state('');
    let analysisNotes = $state('');
    let analysisTargetOems = $state<string[]>(['ABB', 'KM']);
    let analysisRequestBusy = $state(false);
    let analysisRequestError = $state('');
    let analysisStatuses = $state<AnalysisRequestStatusView[]>([]);
    let analysisStatusLoading = $state(false);
    let analysisStatusError = $state('');
    let analysisStatusPoll: ReturnType<typeof setInterval> | undefined;
    let analysisStatusSystemId = $state('');
    let sharingReportId = $state('');
    let shareReportError = $state('');

    type AnalysisPartTracking = AnalysisRequestStatusView['parts'][number] & {
        request_id: string;
        request_title: string;
        target_label: string;
        request_updated_at: string;
    };

    const analysisAggregate = $derived(buildAnalysisAggregate(analysisStatuses));
    const missingAnalysisParts = $derived(analysisAggregate.missingParts);
    const analysisConversionBlocked = $derived(Boolean(analysisStatuses.length && !analysisAggregate.complete));
    const conceptAnalysisReports = $derived(
        $analysisReports
            .filter((report) => report.sourceConceptSystemId === $currentSystemMeta.id)
            .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
    );

    const analysisOemOptions = [
        { label: 'ABB', value: 'ABB' },
        { label: 'Kongsberg', value: 'KM' }
    ];

    let driver: Driver | undefined = $state();
    let startTour = $state(false);
    
    let firstTimeOpen = $state(false);

    const tourSteps: DriveStep[] = [
        {
            element: '.concept-stage-layout',  // Target the main layout to center the welcome message
            popover: {
                title: 'Welcome to the Concept Stage tour!',
                description:
                    `<p>The <strong>concept stage</strong> is where the <em>initial, rough design</em> of a system takes shape. Our Concept Stage Editor is built on the <strong>SysML v2</strong> modeling language standard. </p>
                    <p>In this tour, you'll learn the essentials of SysML modeling and discover how to use our interface to create your own system concept.</p>`,
                side: "over",  // Use 'over' to center the popover
                align: 'center'
            }
        },
        { 
            element: '#pkgBtn', 
            popover: { 
                title: 'Packages', 
                description: 
                    `<p>The <strong>sidebar</strong> is home to all your key system design elements, starting with <strong>packages</strong>.</p>
                    <p>Click this button to add a package node to the editor. Think of a package as a <em>folder</em> or <em>directory</em> used purely to organize your model elements, like keeping all your mechanical drawings separate from your electrical schematics.</p>
                    <p>Once added to the editing stage, packages can be resized and dragged to neatly wrap around other components.</p>
                    <p>Packages can be saved and reused from the package slider, and everything wrapped inside of a package gets preserved.</p>`, 
                side: "right", 
                align:  "start"
            }
        },
        { 
            element: '#partBtn', 
            popover: { 
                title: 'Part Definitions', 
                description: 
                    `<p>Click this button to access the <strong>part definitions</strong> menu.</p>
                    <p>A <strong>part</strong> is the active, functional building block of your system, like a pump, circuit board, or software module. Parts are the components that <em>perform actions</em>.</p>`, 
                side: "right", 

                onNextClick: () => {
                    (document.querySelector('#partBtn') as HTMLElement).click();
                    setTimeout(() => driver?.moveNext(), 300);
                }
            }
        },
        { 
            element: '#defBtn', 
            popover: { 
                title: 'Creating a Part Definition', 
                description: 
                    `<p>Once inside the menu, you will see this button - click it to create a new part <strong>definition.</strong></p>
                    <p>In SysML, a <em>definition</em> is like a reusable blueprint for an element (e.g., the general design for a pump).</p>
                    <p>Later, you can create <em>usages</em> from that definition - these are specific applications in context (e.g., the <code>main_coolant_pump</code> in your cooling system).</p>`, 
                side: "right", 
                align: "start",
                onPrevClick: () => {
                    (document.querySelector('#closeDefSliderBtn') as HTMLElement)?.click();
                    driver?.movePrevious();
                },
                onNextClick: () => {
                    (document.querySelector('#defBtn') as HTMLElement)?.click();
                    setTimeout(() => driver?.moveNext(), 10);
                }
            }
        },
        { 
            element: '#def-editor', 
            popover: { 
                title: 'Definition Editor', 
                description: 
                    `<p>We are now in the <strong>definition editor</strong> - here you can specify a unique <em>name</em>, <em>description</em>, and <em>attributes</em> pertaining to your definition (mass, length etc...).</p> 
                    <p>You can also add <em>references</em> to other existing part or item definitions, which will show up in the stage editor as <strong>usages</strong> connected to the original part through a <em>Flow connection</em>.</p>`, 
                side: "right", 
                align: "start",
                onPrevClick: () => {
                    (document.querySelector('#cancelDefEditBtn') as HTMLElement)?.click();
                    setTimeout(() => driver?.movePrevious(), 10);
                },
                onNextClick: () => {
                    (document.querySelector('#allDefsBtn') as HTMLElement)?.click();
                    setTimeout(() => driver?.moveNext(), 10);
                }
            }
        },
        { 
            element: '#allDefsSection', 
            popover: { 
                title: 'Definition List', 
                description: 
                    `<p>Once you add a new part definition, it appears in this list, alongside all other part definitions defined in this system.</p>
                    <p>You can then create <strong>usages</strong> by dragging a definition into the stage editor.</p>`, 
                side: "right", 
                align: "center",
                onPrevClick: () => {
                    (document.querySelector('#allDefsBtn') as HTMLElement)?.click();
                    driver?.movePrevious();
                },
                onNextClick: () => {
                    (document.querySelector('#closeDefSliderBtn') as HTMLElement)?.click();
                    driver?.moveNext();
                }
            }
        },
        { 
            element: '#itemBtn', 
            popover: { 
                title: 'Item Definitions', 
                description: 
                    `<p>Click this button to access the <strong>item definitions</strong> menu.</p>
                    <p>An <strong>item</strong> is a passive entity that is acted upon, flows through, or is stored by your system, such as fuel, data packets, or electrical signals.</p>`, 
                side: "right", 
                align: "center",
                onPrevClick: () => {
                    (document.querySelector('#partBtn') as HTMLElement)?.click();
                    setTimeout(() => {
                        (document.querySelector('#defBtn') as HTMLElement)?.click();
                        (document.querySelector('#allDefsBtn') as HTMLElement)?.click();
                        driver?.movePrevious();
                    }, 300);
                },
                onNextClick: () => {
                    (document.querySelector('#itemBtn') as HTMLElement)?.click();
                    setTimeout(() => {
                        (document.querySelector('#defBtn') as HTMLElement)?.click();
                        driver?.moveNext();
                    }, 300);
                }
            }
        },
        { 
            element: '#def-slider', 
            popover: { 
                title: 'Item Definition Editor', 
                description: 
                    `<p>The item definitions menu (and editor) looks pretty much the same as the part definitions menu.</p> 
                    <p>The only difference is that item definitions <strong>cannot</strong> contain part references - only other item references.</p>`, 
                side: "right", 
                align: "center",
                onPrevClick: () => {
                    (document.querySelector('#closeDefSliderBtn') as HTMLElement)?.click();
                    driver?.movePrevious();
                },
                onNextClick: () => {
                    (document.querySelector('#closeDefSliderBtn') as HTMLElement)?.click();
                    driver?.moveNext();                    
                }
            }
        },
        { 
            element: '#conLibBtn', 
            popover: { 
                title: 'Concept Library', 
                description: `<em>(This section is being reworked — more details coming soon!)</em>`, 
                side: "right", 
                align: "center",
                onPrevClick: () => {
                    (document.querySelector('#itemBtn') as HTMLElement)?.click();
                    setTimeout(() => {
                        (document.querySelector('#defBtn') as HTMLElement)?.click();
                        driver?.movePrevious();
                    }, 300);
                }
            }
        },
        { 
            element: '#templateBtn', 
            popover: { 
                title: 'Templates', 
                description: 
                    `<p>Click this button to open your <strong>templates</strong> list.</p>
                    <p>Templates are saved system designs you’ve created before. You can drag them straight into the stage editor - just like part and item definitions - to reuse and build on your past work.</p>`, 
                side: "right", 
                align: "center",
            }
        },
        { 
            element: '#save-template-btn', 
            popover: { 
                title: 'Save template button', 
                description: `<p>Click here to save your current stage editor state as a <strong>template</strong>.</p>`, 
                side: "bottom", 
                align: "center",
            }
        },
        { 
            element: '#conceptual-editor', 
            popover: { 
                title: 'Stage Editor', 
                description: 
                    `<p>This is where the magic happens - the <strong>stage editor</strong> is where your system's concept design comes to life.</p>
                    <p>Part and item usages live here. You can:
                        <ul> 
                            <li>Link parts and items structurally through <strong>Containment</strong> (nest other parts/items) by double-clicking a usage.</li> 
                            <li>Use <strong>ports</strong> to connect parts and items together.</li> 
                            <li>Create <strong>Flow Connections</strong> to transfer items (like fuel) between parts.</li> 
                            <li>Use a <strong>Binding Connection</strong> to show that two usages represent the same instance.</li> 
                        </ul>
                    </p> `, 
                side: "over", 
                align: "center",
            }
        },
        { 
            element: '#help-btn', 
            popover: { 
                title: 'Help button', 
                description: 
                    `<p><em>Congratulations</em> - you've reached the end of the tour! 🎉</p>
                    <p>If you need a refresher, just click this button and watch the tour again.</p>`, 
                side: "bottom", 
                align: "center",
                onNextClick: () => {
                    stopAutoTour();
                    driver?.destroy();
                }
            }
        }
    ];
    
    // Notification system
    let notification = $state({
        show: false,
        message: '',
        type: 'info' // 'info', 'success', 'error'
    });
    
    function showNotification(message: string, type = 'info') {
        notification = { show: true, message, type };
        setTimeout(() => {
            notification.show = false;
        }, 3000);
    }

    async function loadAnalysisStatuses(systemId = $currentSystemMeta.id) {
        if (!systemId) {
            analysisStatuses = [];
            return;
        }

        analysisStatusLoading = true;
        analysisStatusError = '';
        try {
            analysisStatuses = await fetchAnalysisRequestStatuses(systemId);
        } catch (error) {
            analysisStatusError = error instanceof Error ? error.message : 'Failed to load OEM response status';
        } finally {
            analysisStatusLoading = false;
        }
    }

    function buildAnalysisAggregate(statuses: AnalysisRequestStatusView[]) {
        const partEntries: AnalysisPartTracking[] = statuses.flatMap((status) => {
            const targetLabel = status.targets
                .map((target) => target.oem?.short_code || target.oem?.name || 'OEM')
                .join(', ') || 'OEM';

            return status.parts.map((part) => ({
                ...part,
                request_id: status.id,
                request_title: status.title,
                target_label: targetLabel,
                request_updated_at: status.updated_at
            }));
        });

        const respondedPartCount = partEntries.filter((part) => part.responded).length;
        return {
            partEntries,
            requestedPartCount: partEntries.length,
            respondedPartCount,
            complete: partEntries.length > 0 && respondedPartCount === partEntries.length,
            missingParts: partEntries.filter((part) => !part.responded)
        };
    }

    function handleConvertToDesign() {
        if (analysisConversionBlocked) {
            const missingNames = missingAnalysisParts.map((part) => `${part.name} (${part.target_label})`).slice(0, 3).join(', ');
            const suffix = missingAnalysisParts.length > 3 ? ` and ${missingAnalysisParts.length - 3} more` : '';
            showNotification(`Waiting for OEM responses: ${missingNames}${suffix}`, 'error');
            return;
        }

        convertConceptToDesign(analysisStatuses.length ? fmuBindingsFromStatuses(analysisStatuses) : {});
        if (analysisAggregate.complete) {
            showNotification('Design stage created with OEM FMU links', 'success');
        }
    }

    function fmuBindingsFromStatuses(statuses: AnalysisRequestStatusView[]): Record<string, ConceptFmuBinding> {
        const bindings: Record<string, ConceptFmuBinding> = {};

        for (const status of [...statuses].reverse()) {
            for (const part of status.parts) {
                const response = part.responses[0];
                if (!response) continue;
                bindings[part.source_node_id] = {
                    sourceNodeId: part.source_node_id,
                    requestId: status.id,
                    responseId: response.id,
                    fmuId: response.fmu_id,
                    fmuName: response.fmu_name,
                    oemName: response.oem_name,
                    oemShortCode: response.oem_short_code,
                    partName: part.name
                };
            }
        }

        return bindings;
    }

    function downloadConceptReport(report: AnalysisReportRecord) {
        downloadPdfBytes(base64ToBytes(report.pdfBase64), report.filename);
    }

    async function shareConceptReport(report: AnalysisReportRecord) {
        const requestIds = reportRequestIds(report);
        if (!requestIds.length) {
            shareReportError = 'No OEM request is linked to this report.';
            showNotification(shareReportError, 'error');
            return;
        }
        const sharedIds = new Set(report.sharedRequestIds ?? []);
        const targetRequestIds = requestIds.filter((requestId) => !sharedIds.has(requestId));
        if (!targetRequestIds.length) {
            showNotification('Analysis report is already shared with all linked OEMs', 'success');
            return;
        }

        sharingReportId = report.id;
        shareReportError = '';
        try {
            const pdfBytes = base64ToBytes(report.pdfBase64);
            await Promise.all(targetRequestIds.map((requestId) => shareAnalysisReport(requestId, {
                title: report.title,
                filename: report.filename,
                pdfBytes,
                message: `Integrator shared ${report.title} from ${report.designSystemName}.`,
                analysisType: report.analysisType,
                generatedAt: report.generatedAt,
                sourceSystemId: report.sourceConceptSystemId,
                sourceSystemName: report.sourceConceptSystemName,
                designSystemId: report.designSystemId,
                designSystemName: report.designSystemName
            })));
            markAnalysisReportShared(report.id, targetRequestIds);
            showNotification('Analysis report shared with OEMs', 'success');
            await loadAnalysisStatuses();
        } catch (error) {
            shareReportError = error instanceof Error ? error.message : 'Failed to share analysis report';
            showNotification(shareReportError, 'error');
        } finally {
            sharingReportId = '';
        }
    }

    function reportRequestIds(report: AnalysisReportRecord) {
        const ids = [...report.requestIds, ...analysisStatuses.map((status) => status.id)];
        return Array.from(new Set(ids.filter(Boolean)));
    }

    function reportSharedWithAllLinkedRequests(report: AnalysisReportRecord) {
        const requestIds = reportRequestIds(report);
        if (!requestIds.length) return false;
        const sharedIds = new Set(report.sharedRequestIds ?? []);
        return requestIds.every((id) => sharedIds.has(id));
    }

    function formatReportDate(value: string | null | undefined) {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    }
    
    // Clear the package view stack when component mounts (start at root)
    onMount(() => {
        // If we have a stack, save current state and go to root
        if (get(packageViewStack).length > 0) {
            navigateToRoot();
        }
        packageViewStack.set([]);

        // Start the tour only if it's the first time and hasn't been shown
        if (typeof localStorage !== 'undefined' && localStorage.getItem("showedFirstTour") !== "true") {
            firstTimeOpen = true;
            startTour = true;
        } else {
            firstTimeOpen = false;
            startTour = false;
        }

        void loadAnalysisStatuses();
        analysisStatusPoll = setInterval(() => {
            void loadAnalysisStatuses();
        }, 5000);
    });

    $effect(() => {
        const systemId = $currentSystemMeta.id;
        if (systemId && systemId !== analysisStatusSystemId) {
            analysisStatusSystemId = systemId;
            void loadAnalysisStatuses(systemId);
        }
    });
    
    // Clean up when leaving the editor
    onDestroy(() => {
        // Save current state if needed
        const stack = get(packageViewStack);
        if (stack.length > 0) {
            // Save any pending changes
            navigateToRoot();
        }

        // Ensure tour is properly destroyed
        if (driver) {
            driver.destroy();
            driver = undefined;
        }
        if (analysisStatusPoll) {
            clearInterval(analysisStatusPoll);
        }
        startTour = false;
        firstTimeOpen = false;
    });

    const stopAutoTour = () => {
        if (firstTimeOpen) {
            localStorage.setItem("showedFirstTour", "true");
            firstTimeOpen = false;
        }
    }
    
    function handleSaveAsTemplate() {
        // Store current view stack before navigating to root
        const stack = get(packageViewStack);
        const isInNestedView = stack.length > 0;
        
        if (isInNestedView) {
            // Save the current stack to restore later
            previousViewStack = [...stack];
            // Navigate to root to capture full hierarchy
            navigateToRoot();
        }
        
        // Now get the root-level nodes and edges (full hierarchy)
        const nodes = get(currentNodes);
        const edges = get(currentEdges);
        
        if (nodes.length === 0) {
            showNotification('No content to save as template', 'error');
            // Restore view if we navigated away
            if (isInNestedView && previousViewStack.length > 0) {
                restorePreviousView();
            }
            return;
        }
        
        showSaveDialog = true;
        templateName = '';
        templateDescription = '';
    }
    
    function confirmSaveTemplate() {
        if (!templateName.trim()) {
            showNotification('Please enter a template name', 'error');
            return;
        }
        
        const nodes = get(currentNodes);
        const edges = get(currentEdges);
        
        saveTemplate({
            name: templateName,
            description: templateDescription,
            data: {
                nodes,
                edges
            }
        });
        
        showSaveDialog = false;
        showNotification('Template saved successfully!', 'success');
        
        // Restore previous view if we navigated away
        if (previousViewStack.length > 0) {
            restorePreviousView();
        }
    }
    
    function cancelSaveTemplate() {
        showSaveDialog = false;
        templateName = '';
        templateDescription = '';
        
        // Restore previous view if we navigated away
        if (previousViewStack.length > 0) {
            restorePreviousView();
        }
    }
    
    function restorePreviousView() {
        if (previousViewStack.length === 0) return;
        
        // Rebuild the navigation stack
        const stackToRestore = [...previousViewStack];
        packageViewStack.set([]);
        
        // Navigate through each level to restore the view
        for (let i = 0; i < stackToRestore.length; i++) {
            const view = stackToRestore[i];
            if (i === 0 && view.packageId === 'root') {
                // Skip root restoration, just set the stack
                packageViewStack.update(s => [view]);
            } else {
                // For nested views, we need to navigate into them
                const parentNodes = i === 0 ? view.nodes : stackToRestore[i-1].nodes;
                const packageNode = parentNodes.find(n => n.id === view.packageId);
                if (packageNode) {
                    navigateToPackage(view.packageId, view.packageName, view.parentId);
                }
            }
        }
        
        // Clear the stored stack
        previousViewStack = [];
    }

    function openAnalysisRequestDialog() {
        const parts = collectAnalysisParts();
        analysisTitle = `${$currentSystemMeta.name || 'System'} torsional vibration analysis`;
        analysisNotes = parts.length
            ? `${parts.length} selected concept item${parts.length === 1 ? '' : 's'} included.`
            : '';
        analysisRequestError = '';
        showAnalysisRequestDialog = true;
    }

    function closeAnalysisRequestDialogFromOverlay(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            showAnalysisRequestDialog = false;
        }
    }

    async function submitAnalysisRequest() {
        const parts = collectAnalysisParts();
        if (parts.length === 0) {
            analysisRequestError = 'Add or select at least one concept part before requesting analysis.';
            return;
        }
        if (analysisTargetOems.length === 0) {
            analysisRequestError = 'Select at least one OEM.';
            return;
        }

        const payload: CreateAnalysisRequestPayload = {
            requester_name: analysisRequesterName,
            requester_org: analysisRequesterOrg,
            title: analysisTitle || `${$currentSystemMeta.name || 'System'} torsional vibration analysis`,
            analysis_type: 'torsional_vibration',
            target_oem_short_codes: analysisTargetOems,
            source_system_id: $currentSystemMeta.id,
            source_system_name: $currentSystemMeta.name,
            source_stage: 'concept',
            source_snapshot_json: {
                system: $currentSystemMeta,
                packageView: get(currentPackageView),
                nodes: get(currentNodes),
                edges: get(currentEdges)
            },
            parts,
            notes: analysisNotes
        };

        analysisRequestBusy = true;
        analysisRequestError = '';
        try {
            const created = await createAnalysisRequest(payload);
            showAnalysisRequestDialog = false;
            showNotification(`Analysis request ${created.id.slice(0, 8)} sent`, 'success');
            await loadAnalysisStatuses();
        } catch (error) {
            analysisRequestError = error instanceof Error ? error.message : 'Failed to send analysis request';
        } finally {
            analysisRequestBusy = false;
        }
    }

    function collectAnalysisParts(): AnalysisRequestPartPayload[] {
        const conceptNodes = get(currentNodes).filter((node) => ['part', 'item'].includes(String(node.type)));
        const selectedNodes = conceptNodes.filter((node) => node.selected);
        const nodes = selectedNodes.length > 0 ? selectedNodes : conceptNodes;

        return nodes.map((node) => {
            const data = node.data as Record<string, any>;
            return {
                id: String(node.id),
                source_node_id: String(node.id),
                name: String(data.declaredName || data.name || node.id),
                role: String(node.type || 'part'),
                sysml_type: String(node.type || 'part'),
                definition: typeof data.definition === 'string' && data.definition ? data.definition : null,
                comment: typeof data.comment === 'string' && data.comment ? data.comment : null,
                parameters: nodeParameters(data),
                interfaces: [
                    ...nodePorts(data.inputs, 'input'),
                    ...nodePorts(data.outputs, 'output')
                ]
            };
        });
    }

    function nodeParameters(data: Record<string, any>): AnalysisRequestParameter[] {
        const parameters: AnalysisRequestParameter[] = [];
        if (typeof data.mass === 'number' && Number.isFinite(data.mass)) {
            parameters.push({ name: 'mass', value: data.mass, unit: 'kg', source: 'mass' });
        }

        if (Array.isArray(data.metadata)) {
            for (const item of data.metadata) {
                if (!item?.key) continue;
                parameters.push({
                    name: String(item.key),
                    value: item.value ?? null,
                    unit: null,
                    source: 'metadata'
                });
            }
        }

        return parameters;
    }

    function nodePorts(value: unknown, type: 'input' | 'output') {
        if (!Array.isArray(value)) return [];
        return value.map((port) => ({
            name: String(port?.name || 'port'),
            interfaceType: typeof port?.interfaceType === 'string' ? port.interfaceType : null,
            type
        }));
    }
</script>

<div class="conceptual-layout" class:has-analysis-panel={Boolean(analysisStatuses.length || conceptAnalysisReports.length || analysisStatusError)}>
    <ConceptualStageSidebar />
    
    <div class="main-content">
        <div class="top-bar">
            <div class="left-section">
                <span class="system-name">{$currentSystemMeta.name}</span>
                <button id="save-template-btn" class="stage-btn" onclick={handleSaveAsTemplate}>
                    <Save size={16} />
                    Save as Template
                </button>
                <button class="stage-btn" class:blocked={analysisConversionBlocked} onclick={handleConvertToDesign}>
                    <Repeat size={16} />
                    Convert to Design
                </button>
                <button class="stage-btn" onclick={openAnalysisRequestDialog}>
                    <Send size={16} />
                    Request Analysis
                </button>
                <div class="stage-indicator">
                    Conceptual Stage
                    {#if $currentPackageView}
                        - {$currentPackageView.packageName}
                    {/if}
                </div>
                <button 
                    id="help-btn" 
                    title="Start tutorial tour" 
                    onclick={() => {startTour = true} /* removeOtherSystems() FOR DEBUGGING PURPOSES */} 
                >
                    <CircleQuestionMark size={16} />
                </button>
            </div>
        </div>
        
        {#if analysisStatuses.length || conceptAnalysisReports.length || analysisStatusError}
            <div class="analysis-status {analysisAggregate.complete ? 'ready' : 'pending'}">
                {#if analysisStatuses.length}
                    <div class="analysis-status-header">
                        <strong>OEM responses</strong>
                        <span>{analysisAggregate.respondedPartCount}/{analysisAggregate.requestedPartCount} requested component responses ready</span>
                        <span>{analysisStatuses.length} request{analysisStatuses.length === 1 ? '' : 's'} tracked</span>
                        {#if analysisStatusLoading}<span>Refreshing...</span>{/if}
                    </div>
                    <div class="analysis-status-parts">
                        {#each analysisAggregate.partEntries as part (`${part.request_id}-${part.id}`)}
                            <span class="analysis-part {part.responded ? 'ready' : 'pending'}">
                                {part.name} ({part.target_label}): {part.responded ? `${part.responses.map((response) => response.oem_short_code ?? response.oem_name ?? 'OEM').join(', ')} responded` : 'waiting'}
                            </span>
                        {/each}
                    </div>
                {/if}
                {#if conceptAnalysisReports.length}
                    <div class="analysis-reports">
                        <div class="analysis-status-header">
                            <strong>Analysis reports</strong>
                            <span>{conceptAnalysisReports.length} PDF result{conceptAnalysisReports.length === 1 ? '' : 's'} from generated design stage models</span>
                        </div>
                        <div class="analysis-report-list">
                            {#each conceptAnalysisReports as report (report.id)}
                                <div class="analysis-report-row">
                                    <div class="analysis-report-main">
                                        <strong>{report.title}</strong>
                                        <span>{report.designSystemName} - {formatReportDate(report.generatedAt)}</span>
                                        <span>{report.oemShortCodes.length ? `Linked OEMs: ${report.oemShortCodes.join(', ')}` : 'No linked OEM request'}</span>
                                        {#if report.sharedAt}
                                            <span>Shared {formatReportDate(report.sharedAt)}</span>
                                        {/if}
                                    </div>
                                    <div class="analysis-report-actions">
                                        <button class="report-action-btn" onclick={() => downloadConceptReport(report)}>Download PDF</button>
                                        <button
                                            class="report-action-btn primary"
                                            disabled={sharingReportId === report.id || reportSharedWithAllLinkedRequests(report)}
                                            onclick={() => shareConceptReport(report)}
                                        >
                                            {sharingReportId === report.id ? 'Sharing...' : reportSharedWithAllLinkedRequests(report) ? 'Shared' : 'Share with OEMs'}
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                        {#if shareReportError}
                            <div class="analysis-status-error">{shareReportError}</div>
                        {/if}
                    </div>
                {/if}
                {#if analysisStatusError}
                    <div class="analysis-status-error">{analysisStatusError}</div>
                {/if}
            </div>
        {/if}

        <PackageBreadcrumb />
        
        <ConceptualStageEditor bind:this={conceptEditor} />
    </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events-->
<!-- svelte-ignore a11y_no_static_element_interactions-->
{#if showSaveDialog}
    <div class="dialog-overlay" onclick={cancelSaveTemplate}>
        <div class="dialog" onclick={stopPropagation(bubble('click'))}>
            <h3>Save as Template</h3>
            <div class="form-group">
                <label for="template-name">Template Name</label>
                <input 
                    id="template-name"
                    type="text" 
                    bind:value={templateName} 
                    placeholder="Enter template name"
                    onkeydown={(e) => e.key === 'Enter' && confirmSaveTemplate()}
                />
            </div>
            <div class="form-group">
                <label for="template-desc">Description (optional)</label>
                <textarea 
                    id="template-desc"
                    bind:value={templateDescription} 
                    placeholder="Enter template description"
                    rows="3"
                ></textarea>
            </div>
            <div class="dialog-buttons">
                <button class="cancel-btn" onclick={cancelSaveTemplate}>Cancel</button>
                <button class="save-btn" onclick={confirmSaveTemplate}>Save Template</button>
            </div>
        </div>
    </div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events-->
<!-- svelte-ignore a11y_no_static_element_interactions-->
{#if showAnalysisRequestDialog}
    <div class="dialog-overlay" onclick={closeAnalysisRequestDialogFromOverlay}>
        <form class="dialog analysis-dialog" onsubmit={(event) => { event.preventDefault(); submitAnalysisRequest(); }}>
            <h3>Request Analysis</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label for="analysis-requester-org">Requester Company</label>
                    <input id="analysis-requester-org" type="text" bind:value={analysisRequesterOrg} />
                </div>
                <div class="form-group">
                    <label for="analysis-requester-name">Requester Name</label>
                    <input id="analysis-requester-name" type="text" bind:value={analysisRequesterName} />
                </div>
            </div>
            <div class="form-group">
                <label for="analysis-title">Title</label>
                <input id="analysis-title" type="text" bind:value={analysisTitle} />
            </div>
            <div class="form-group">
                <div class="form-label">Companies</div>
                <div class="checkbox-row">
                    {#each analysisOemOptions as option}
                        <label class="checkbox-label">
                            <input type="checkbox" bind:group={analysisTargetOems} value={option.value} />
                            {option.label}
                        </label>
                    {/each}
                </div>
            </div>
            <div class="form-group">
                <label for="analysis-notes">Notes</label>
                <textarea id="analysis-notes" bind:value={analysisNotes} rows="3"></textarea>
            </div>
            <div class="request-summary">
                {collectAnalysisParts().length} component{collectAnalysisParts().length === 1 ? '' : 's'} will be sent with mass, metadata, and port interfaces.
            </div>
            {#if analysisRequestError}
                <div class="request-error">{analysisRequestError}</div>
            {/if}
            <div class="dialog-buttons">
                <button type="button" class="cancel-btn" onclick={() => (showAnalysisRequestDialog = false)}>Cancel</button>
                <button class="save-btn" disabled={analysisRequestBusy}>{analysisRequestBusy ? 'Sending...' : 'Send Request'}</button>
            </div>
        </form>
    </div>
{/if}

{#if notification.show}
    <div class="notification {notification.type}">
        {notification.message}
    </div>
{/if}

<Tour
    bind:driverObj={driver}
    bind:start={startTour}
    steps={tourSteps}
    disableCancel={firstTimeOpen}
/>

<style>
    .conceptual-layout {
        --concept-sidebar-top: 110px;
        width: 100vw;
        height: 100vh;
        display: flex;
        overflow: hidden;
        position: relative;
    }

    .conceptual-layout.has-analysis-panel {
        --concept-sidebar-top: 300px;
    }
    
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .top-bar {
        height: 60px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        /* justify-content: space-between; */
        padding: 0 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .left-section {
        display: flex;
        align-items: center;
        gap: 20px;
    }
    
    .system-name {
        font-weight: 500;
        color: #111827;
        font-size: 16px;
    }
    
    .stage-indicator {
        padding: 6px 12px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
    }
    
    .stage-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .stage-btn:hover {
        background: #374151;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);       
    }

    .stage-btn.blocked {
        background: #7f1d1d;
    }

    .stage-btn.blocked:hover {
        background: #991b1b;
    }

    .analysis-status {
        border-bottom: 1px solid #e5e7eb;
        padding: 10px 20px;
        background: #fff7ed;
    }

    .analysis-status.ready {
        background: #ecfdf5;
    }

    .analysis-status-header {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #111827;
        font-size: 13px;
        margin-bottom: 8px;
    }

    .analysis-status-parts {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .analysis-reports {
        margin-top: 10px;
    }

    .analysis-report-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .analysis-report-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        border: 1px solid #dbeafe;
        border-radius: 6px;
        background: #ffffff;
        padding: 9px 10px;
    }

    .analysis-report-main {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        min-width: 0;
        font-size: 12px;
        color: #4b5563;
    }

    .analysis-report-main strong {
        color: #111827;
        font-size: 13px;
    }

    .analysis-report-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }

    .report-action-btn {
        border: 1px solid #bfdbfe;
        border-radius: 4px;
        background: #ffffff;
        color: #1d4ed8;
        padding: 5px 9px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
    }

    .report-action-btn.primary {
        background: #1d4ed8;
        color: #ffffff;
    }

    .report-action-btn:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

    .analysis-part {
        border: 1px solid #fed7aa;
        border-radius: 999px;
        background: #ffedd5;
        color: #9a3412;
        padding: 4px 9px;
        font-size: 12px;
        font-weight: 500;
    }

    .analysis-part.ready {
        border-color: #bbf7d0;
        background: #dcfce7;
        color: #166534;
    }

    .analysis-status-error {
        color: #991b1b;
        font-size: 12px;
    }

    #help-btn {
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 15px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s;
        width: 25px;
        height: 25px;
    }

    #help-btn:hover {
        background-color: #e5edfc;
        transform: translateY(-1px);
    }

    .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .dialog {
        background: white;
        border-radius: 8px;
        padding: 24px;
        width: 400px;
        max-width: 90vw;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .analysis-dialog {
        width: 540px;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }
    
    .dialog h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label,
    .form-label {
        display: block;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
    }
    
    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #374151;
    }

    .checkbox-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }

    .checkbox-label {
        display: inline-flex !important;
        align-items: center;
        gap: 6px;
        margin: 0 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        color: #111827 !important;
    }

    .request-summary {
        border: 1px solid #dbeafe;
        border-radius: 6px;
        background: #eff6ff;
        color: #1e40af;
        padding: 10px 12px;
        font-size: 13px;
        margin-bottom: 16px;
    }

    .request-error {
        border: 1px solid #fecaca;
        border-radius: 6px;
        background: #fef2f2;
        color: #991b1b;
        padding: 10px 12px;
        font-size: 13px;
        margin-bottom: 16px;
    }
    
    .dialog-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
    }
    
    .cancel-btn,
    .save-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .cancel-btn {
        background: #f3f4f6;
        color: #374151;
    }
    
    .cancel-btn:hover {
        background: #e5e7eb;
    }
    
    .save-btn {
        background: #111827;
        color: white;
    }
    
    .save-btn:hover {
        background: #374151;
    }
    
    /* Notification styles */
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
        z-index: 1001;
    }
    
    .notification.info {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;
    }
    
    .notification.success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }
    
    .notification.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
</style>
