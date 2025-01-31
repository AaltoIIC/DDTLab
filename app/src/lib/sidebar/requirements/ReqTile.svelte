<script lang="ts">
    import type { RequirementType } from "$lib/types/types";
    import DialogBox from "$lib/DialogBox.svelte";
    import type { SvelteComponent } from "svelte";
    import { currentReqs, addToHistory } from "$lib/stores/stores";

    export let requirement: RequirementType;

    let dialogBox: SvelteComponent;

    const handleDelete = () => {
        dialogBox.openDialog("Are you sure you want to delete requirement?", "Yes", "No")
            .then((result: boolean) => {
                if (result) {
                    currentReqs.update((reqs) => {
                        return reqs.filter((req) => req.name !== requirement.name);
                    });
                    addToHistory();
                }
            });
    }
</script>
<div class="main-tile">
    <button class="btn-remove" aria-label="Remove Requirement"
        on:click={handleDelete}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>                   
    </button>
    <h4>{requirement.name}</h4>
    <p>{requirement.description}</p>
    <div class="formula">
        {#if requirement.leftHandSide}
            <div class="logical-exp">
                <span>{requirement.leftHandSide.leftHandSide}</span>
                <span>{requirement.leftHandSide.operator}</span>
                <span>{requirement.leftHandSide.rightHandSide}</span>
            </div>
        {/if}
        <span class="temp-op">{requirement.temporalOperator}</span>
        <div class="logical-exp">
            <span>{requirement.rightHandSide.leftHandSide}</span>
            <span>{requirement.rightHandSide.operator}</span>
            <span>{requirement.rightHandSide.rightHandSide}</span>
        </div>
    </div>
</div>
<DialogBox bind:this={dialogBox} />

<style>
    .temp-op {
        font-size: 12px;
        margin: 4px;
        border-radius: var(--main-border-radius);
        border: solid 1px rgba(0, 0, 0, 0.7);
        padding: 2px 4px;
        color: rgba(0, 0, 0, 0.7);
    }
    .formula {
        font-size: 14px;
        font-family: 'Roboto Mono', monospace;
        color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        margin: 10px 4px 4px 4px;
        flex-direction: column;
        border-radius: var(--main-border-radius);
        background-color: var(--list-dark-color);
        padding: 4px;
    }
    .btn-remove svg {
        width: 16px;
        height: 16px;
        color: rgba(0, 0, 0, 0.45);
    }
    .btn-remove svg:hover {
        color: rgba(0, 0, 0, 0.9);
    }
    .btn-remove {
        position: absolute;
        top: 7px;
        right: 6px;
    }

    .main-tile {
        padding: 8px;
        border-radius: var(--main-border-radius);
        border: var(--main-border);
        margin-bottom: 4px;
        position: relative;
    }
    h4 {
        font-size: 14px;
        margin: 0;
        line-height: 1.2;
        font-weight: 500;
    }
    .main-tile p {
        font-size: 12px;
        margin: 0;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;  
    }
</style>