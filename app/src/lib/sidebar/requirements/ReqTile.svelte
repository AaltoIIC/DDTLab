<script lang="ts">
    import type { RequirementType } from "$lib/types/types";
    import DialogBox from "$lib/DialogBox.svelte";
    import type { SvelteComponent } from "svelte";
    import { currentReqs, addToHistory } from "$lib/stores/stores.svelte";

    interface Props {
        requirement: RequirementType;
        onEdit?: (requirement: RequirementType) => void;
    }

    let { requirement, onEdit }: Props = $props();

    let dialogBox: SvelteComponent | undefined = $state();

    const handleDelete = () => {
        dialogBox?.openDialog("Are you sure you want to delete requirement?", "Yes", "No")
            .then((result: boolean) => {
                if (result) {
                    currentReqs.update((reqs) => {
                        return reqs.filter((req) => req.name !== requirement.name);
                    });
                    addToHistory();
                }
            });
    }

    const handleEdit = () => {
        onEdit?.(requirement);
    }
</script>
<div class="main-tile">
    <div class="btn-group">
        <button class="btn-edit" aria-label="Edit Requirement"
            onclick={handleEdit}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
        </button>
        <button class="btn-remove" aria-label="Remove Requirement"
            onclick={handleDelete}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
    <h4>{requirement.name}</h4>
    {#if requirement.id}
        <p class="req-id">ID: {requirement.id}</p>
    {/if}
    <p>{requirement.description}</p>
    <div class="formula">
        {#if requirement.leftHandSide}
            <div class="logical-exp">
                <span>{requirement.leftHandSide.leftHandSide}</span>
                <span>{requirement.leftHandSide.operator}</span>
                <span>{requirement.leftHandSide.rightHandSide}</span>
            </div>
        {/if}
        <div class="temp-op-container">
            <span class="temp-op">{requirement.temporalOperator}</span>
            {#if requirement.interval}
                <span class="interval">
                    [{Array.isArray(requirement.interval) ? `${requirement.interval[0]},${requirement.interval[1]}` : `${requirement.interval.lowerBound},${requirement.interval.upperBound}`}]
                </span>
            {/if}
        </div>
        <div class="logical-exp">
            <span>{requirement.rightHandSide.leftHandSide}</span>
            <span>{requirement.rightHandSide.operator}</span>
            <span>{requirement.rightHandSide.rightHandSide}</span>
        </div>
    </div>
</div>
<DialogBox bind:this={dialogBox} />

<style>
    .temp-op-container {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 4px;
    }
    .temp-op {
        font-size: 12px;
        border-radius: var(--main-border-radius);
        border: solid 1px rgba(0, 0, 0, 0.7);
        padding: 2px 4px;
        color: rgba(0, 0, 0, 0.7);
    }
    .interval {
        font-size: 11px;
        color: rgba(0, 0, 0, 0.6);
        font-weight: 500;
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
    .btn-group {
        position: absolute;
        top: 7px;
        right: 6px;
        display: flex;
        gap: 4px;
    }
    .btn-edit svg,
    .btn-remove svg {
        width: 16px;
        height: 16px;
        color: rgba(0, 0, 0, 0.45);
    }
    .btn-edit svg:hover,
    .btn-remove svg:hover {
        color: rgba(0, 0, 0, 0.9);
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
    .req-id {
        font-size: 11px;
        color: rgba(0, 0, 0, 0.6);
        font-weight: 500;
        margin: 2px 0 4px 0;
        font-family: 'Roboto Mono', monospace;
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