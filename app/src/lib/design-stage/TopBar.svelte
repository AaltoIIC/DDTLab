<script lang="ts">
    import Button from "$lib/Button.svelte";
    import DialogBox from "$lib/DialogBox.svelte";
    import {
        currentSystemMeta,
        systems,
        saveCurrentSystem,
        removeSystem,
        history,
        undoHistory,
        redoHistory
    } from "$lib/stores/stores.svelte";
    import { isNameValid, MAX_NAME_LENGTH, truncateName } from "$lib/helpers";
    import { goto } from "$app/navigation";
    import { CircleQuestionMark } from '@lucide/svelte';

    interface Props {
        stage: 'concept' | 'design';
    }

    let { stage }: Props = $props();

    let currentName = $state($currentSystemMeta.name);
    let isNameError = $state(false);
    let nameInput: HTMLInputElement | undefined = $state();

    // The current system record (has the stage + concept/design linkage fields).
    const currentSystem = $derived($systems.find(s => s.id === $currentSystemMeta.id));

    // Design stage: the concept system this design was created from (if any).
    const conceptParentId = $derived(
        stage === 'design' ? (currentSystem?.sourceConceptSystemId ?? null) : null
    );

    // Concept stage: the design system that was converted from this concept (if any).
    const designChild = $derived(
        stage === 'concept'
            ? $systems.find(s => s.stage === 'design' && s.sourceConceptSystemId === currentSystem?.id)
            : undefined
    );

    // The concept segment is only usable if the linked concept system still exists.
    const canGoToConcept = $derived(
        stage === 'design' && Boolean(conceptParentId) && $systems.some(s => s.id === conceptParentId)
    );
    const canGoToDesign = $derived(Boolean(designChild));

    // Design-stage subsystems (systems nested inside another system) cannot be
    // deleted from the editor — remove them from their parent instead.
    const isDesignSubsystem = $derived(stage === 'design' && Boolean(currentSystem?.parentSystemId));
    const canDelete = $derived(!isDesignSubsystem);

    let deleteDialog: DialogBox | undefined = $state();

    async function handleDeleteSystem() {
        if (!canDelete || !currentSystem) return;
        const systemName = $currentSystemMeta.name;
        // When deleting a concept system, its linked design child is cascade-deleted too.
        const linkedDesignNote = designChild
            ? ` This will also delete its linked design stage system ("${designChild.name}").`
            : '';
        const confirmed = await deleteDialog?.openDialog(
            `Are you sure you want to delete "${systemName}"?${linkedDesignNote} This cannot be undone.`,
            'Delete',
            'Cancel'
        );
        if (!confirmed) return;
        removeSystem($currentSystemMeta.id);
        void goto('/');
    }

    function switchToConcept() {
        if (!conceptParentId) return;
        void goto(`/editor/${conceptParentId}?stage=concept`);
    }

    function switchToDesign() {
        if (!designChild) return;
        void goto(`/editor/${designChild.id}`);
    }

    $effect(() => {
        currentName = $currentSystemMeta.name;
    });

    const updateSystemName = () => {
        // Cap the system name at MAX_NAME_LENGTH characters
        currentName = truncateName(currentName);
        const isNameTaken = $systems.filter(s => s.id !== $currentSystemMeta.id)
            .map(s => s.name.replace(/\s+/g, '').toLowerCase())
            .includes(currentName.replace(/\s+/g, '').toLowerCase());
    
        if (!isNameTaken && isNameValid(currentName)) {
            isNameError = false;
            currentSystemMeta.update(meta => {
                meta.name = currentName;
                return meta;
            });
        } else {
            isNameError = true;
        }
    }
    const handleNameBlur = () => {
        if (isNameError) {
            currentName = $currentSystemMeta.name;
            isNameError = false;
        }
        // When unfocused, show the beginning of the name again if it was scrolled
        if (nameInput) nameInput.scrollLeft = 0;
    }

</script>
<div id="design-topbar" class="main-top-bar shadow-md">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span class="undo-redo-cont">
        <button class="top-btn undo {($history.currentIndex === 0 || $history.data.length === 1) ? "inactive" : "active"}" aria-label="Undo"
            onclick={undoHistory}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
        </button>
        <button class="top-btn redo {($history.currentIndex === -1 || $history.data.length === 1) ? "inactive" : "active"}"
            aria-label="Redo" onclick={redoHistory}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
            </svg>              
        </button> 
    </span>
    <div class="stage-switcher" role="group" aria-label="Editor stage">
        <button
            type="button"
            class="stage-segment"
            class:active={stage === 'concept'}
            class:unavailable={stage === 'design' && !canGoToConcept}
            onclick={switchToConcept}
            disabled={stage === 'concept' || !canGoToConcept}
            title={stage === 'concept'
                ? 'You are in the concept stage'
                : canGoToConcept
                    ? 'Go to the concept stage for this system'
                    : 'This design system was not created from a concept system'}
        >
            Concept
        </button>
        <button
            type="button"
            class="stage-segment"
            class:active={stage === 'design'}
            class:unavailable={stage === 'concept' && !canGoToDesign}
            onclick={switchToDesign}
            disabled={stage === 'design' || !canGoToDesign}
            title={stage === 'design'
                ? 'You are in the design stage'
                : canGoToDesign
                    ? 'Go to the design stage for this system'
                    : 'Convert this concept to design first'}
        >
            Design
        </button>
    </div>
    <div class="main-name-cont {isNameError ? 'error' : ''}">
        System: <input type="text"
            bind:value={currentName}
            bind:this={nameInput}
            spellcheck={false}
            maxlength={MAX_NAME_LENGTH}
            oninput={updateSystemName}
            onblur={handleNameBlur}
            aria-label="System name"
            title={currentName}
            />
    </div>
    <Button onClick={() => {goto('/');}}>Save</Button>
    <button
        id="stage-help-btn"
        type="button"
        class="help-btn"
        aria-label={`Start ${stage} stage tutorial tour`}
        title={`Start ${stage} stage tutorial tour`}
        onclick={() => { window.dispatchEvent(new CustomEvent('editor-tour-request', { detail: { stage } })); }}
    >
        <CircleQuestionMark size={17} />
    </button>
    <button
        type="button"
        class="delete-btn"
        aria-label="Delete system"
        onclick={handleDeleteSystem}
        disabled={!canDelete}
        title={isDesignSubsystem
            ? 'Subsystems cannot be deleted from the editor — remove them from their parent instead'
            : 'Delete this system'}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
    </button>
</div>

<DialogBox bind:this={deleteDialog} />
<style>
    .main-top-bar {
        position: fixed;
        top: 15px;
        right: 15px;
        height: 66px;
        width: fit-content;
        display: flex;
        gap: 20px;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        box-sizing: border-box;
        background: var(--main-dark-color);
        z-index: 1000;
        border-radius: var(--main-border-radius);
    }
    .undo-redo-cont {
        display: flex;
        gap: 8px;
    }
    .stage-switcher {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: solid 1px rgba(255, 255, 255, 0.12);
    }
    .stage-segment {
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.55);
        font-size: 13px;
        font-weight: 600;
        line-height: 1;
        padding: 9px 16px;
        border-radius: 999px;
        cursor: pointer;
        font-family: Inter, sans-serif;
        transition: all 0.2s;
    }
    .stage-segment:hover:not(:disabled) {
        color: white;
        background: rgba(255, 255, 255, 0.1);
    }
    .stage-segment.active {
        background: var(--main-color);
        color: white;
        cursor: default;
    }
    .stage-segment:disabled {
        cursor: not-allowed;
    }
    .stage-segment.active:disabled {
        cursor: default;
    }
    .stage-segment.unavailable {
        opacity: 0.35;
    }
    .top-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: white;
    }
    .top-btn.inactive {
        opacity: 0.5;
        cursor: initial;
        pointer-events: none;
    }
    .top-btn svg {
        width: 16px;
        height: 16px;
        opacity: 0.9;
        display: inline;
        margin-bottom: 4px;
    }
    .help-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.2s;
    }
    .help-btn:hover {
        color: white;
        background: rgba(255, 255, 255, 0.12);
        transform: translateY(-1px);
    }
    .delete-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.75);
        padding: 7px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    .delete-btn svg {
        width: 18px;
        height: 18px;
    }
    .delete-btn:hover:not(:disabled) {
        background: rgba(244, 108, 108, 0.15);
        color: var(--main-error-color);
    }
    .delete-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }
    .main-name-cont {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-family: Inter, sans-serif;
    }
    .main-name-cont input {
        line-height: 1;
        padding: 8px;
        background-color: #ffffff0d;
        border-radius: 5px;
        border: solid 2px rgba(255, 255, 255, .1);
        color: #ffffffe6;
        font-family: Inter, sans-serif;
        font-weight: 600;
        margin-left: 8px;
        width: 18ch;
    }
    .main-name-cont.error input {
        outline: solid 2px var(--main-error-color);
    }
</style>