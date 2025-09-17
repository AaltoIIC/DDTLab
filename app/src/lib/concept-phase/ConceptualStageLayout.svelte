<script lang="ts">
    import { createBubbler, stopPropagation } from 'svelte/legacy';

    const bubble = createBubbler();
    import ConceptualStageEditor from './ConceptualStageEditor.svelte';
    import ConceptualStageSidebar from './ConceptualStageSidebar.svelte';
    import PackageBreadcrumb from './PackageBreadcrumb.svelte';
    import { currentSystemMeta, currentNodes, currentEdges } from '$lib/stores/stores.svelte';
    import { currentPackageView, packageViewStack, navigateToRoot, navigateToPackage } from './packageStore';
    import type { PackageView } from './packageStore';
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import { Save, CircleQuestionMark } from '@lucide/svelte';
    import { saveTemplate } from '$lib/stores/stores.svelte';
    import Tour from '$lib/Tour.svelte';
    import { type Driver, type DriveStep } from "driver.js";
    import _ from 'lodash';
    
    let conceptEditor: ConceptualStageEditor | undefined = $state();
    let showSaveDialog = $state(false);
    let templateName = $state('');
    let templateDescription = $state('');
    let previousViewStack: PackageView[] = [];

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
                    <p>Once added to the editing stage, packages can be resized and dragged to neatly wrap around other components.</p>`, 
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
    
    // Clear the package view stack when component mounts (start at root)
    onMount(() => {
        // If we have a stack, save current state and go to root
        if (get(packageViewStack).length > 0) {
            navigateToRoot();
        }
        packageViewStack.set([]);

        // Start the tour if it is the first time opening the concept stage
        if (localStorage.getItem("showedFirstTour") !== "true") {
            startTour = firstTimeOpen = true;
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
</script>

<div class="conceptual-layout">
    <ConceptualStageSidebar />
    
    <div class="main-content">
        <div class="top-bar">
            <div class="left-section">
                <span class="system-name">{$currentSystemMeta.name}</span>
                <button id="save-template-btn" onclick={handleSaveAsTemplate}>
                    <Save size={16} />
                    Save as Template
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
                    onclick={() => {startTour = true}}
                >
                    <CircleQuestionMark size={16} />
                </button>
            </div>
        </div>
        
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
        width: 100vw;
        height: 100vh;
        display: flex;
        overflow: hidden;
        position: relative;
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
    
    #save-template-btn {
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
    
    #save-template-btn:hover {
        background: #374151;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    
    .dialog h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
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