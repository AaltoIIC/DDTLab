<script lang="ts">
    import type { RequirementType } from "$lib/types/types";

    export let requirement: RequirementType;
</script>
<div class="main-tile">
    <button class="btn-remove" aria-label="Remove Requirement">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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

<style>
    .btn-remove svg {
        width: 18px;
        height: 18px;
        color: rgba(0, 0, 0, 0.7);
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
    p {
        font-size: 12px;
        margin: 0;
        line-height: 1.2;
    }
</style>