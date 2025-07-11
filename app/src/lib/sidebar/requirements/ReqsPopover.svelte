<script lang="ts">
    import { run } from 'svelte/legacy';

    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select";
    import { Textarea } from "$lib/components/ui/textarea";
    import LogicalExpressionField from "./LogicalExpressionField.svelte";
    import type { LogicalExpressionType, RequirementType } from "$lib/types/types";
    import { generateName, isNameValid } from "$lib/helpers";
    import { currentReqs, addToHistory } from "$lib/stores/stores.svelte";
    import { useSvelteFlow } from "@xyflow/svelte";
    import ReqTile from "./ReqTile.svelte";

    interface Props {
        isOpen?: boolean;
    }

    let { isOpen = $bindable(false) }: Props = $props();

    let isAddingNewReq = $state(false);

    // handle change of viewport when opening or closing popover
    const { setViewport, getViewport } = useSvelteFlow();
    const popoverWidth = 340;
    run(() => {
        if (isOpen) {
            const currentViewport = getViewport();
            setViewport({
                ...currentViewport,
                x: currentViewport.x + popoverWidth
            });
        } else {
            const currentViewport = getViewport();
            setViewport({
                ...currentViewport,
                x: currentViewport.x - popoverWidth
            });
        }
    });

    let newReqName = $state(generateName('Requirement', $currentReqs.map(r => r.name)));
    let newReqDescription = $state('');
    let newReqOperator = $state({value: 'Globally', label: 'Globally'});
    let newReqLeftHandSide: LogicalExpressionType | undefined = $state(undefined);
    let newReqRightHandSide: LogicalExpressionType = $state({
        leftHandSide: '',
        rightHandSide: '',
        operator: '='
    });
    let newReqInterval: number[] | undefined = $state(undefined);

    export const tempOpArgs: Record<string, string[]> = {
        'Until': ['leftHandSide', 'rightHandSide'],
        'Globally': ['rightHandSide'],
        'Eventually': ['rightHandSide'],
        'Next': ['rightHandSide'],
        'Since': ['leftHandSide', 'rightHandSide'],
        'Release': ['leftHandSide', 'rightHandSide']
    }
    run(() => {
        if (tempOpArgs[newReqOperator.value].includes('leftHandSide')) {
            newReqLeftHandSide = newReqLeftHandSide || {
                leftHandSide: '',
                rightHandSide: '',
                operator: '='
            };
        } else {
            newReqLeftHandSide = undefined;
        }
    });

    let isNameError = $state(false);
    const validateName = () => {
        const isNameTaken = $currentReqs.map(r => r.name.replace(/\s+/g, '').toLowerCase())
                                .includes(newReqName.replace(/\s+/g, '').toLowerCase());
        isNameError = !isNameValid(newReqName) || isNameTaken;
    }

    const addNewReq = () => {
        if (isNameError) return;

        currentReqs.update(reqs => {
            return [...reqs, {
                name: newReqName,
                description: newReqDescription,
                temporalOperator: newReqOperator.value,
                leftHandSide: newReqLeftHandSide,
                rightHandSide: newReqRightHandSide,
                interval: newReqInterval
            } as RequirementType];
        });
        addToHistory();

        isAddingNewReq = false;
        newReqName = generateName('Requirement', $currentReqs.map(r => r.name));
        newReqDescription = '';
        newReqOperator = {value: 'Globally', label: 'Globally'};
        newReqLeftHandSide = undefined;
        newReqRightHandSide = {
            leftHandSide: '',
            rightHandSide: '',
            operator: '='
        };
        newReqInterval = undefined;
    }
</script>
<div class="main-reqs-cont {isOpen ? 'open' : ''} shadow-sm" style:width={popoverWidth + 'px'}>
    <button class="btn-close" aria-label="Close" onclick={() => isOpen = false}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
    </button>
    <p>Requirements:</p>
    <div class="reqs-list">
        {#if $currentReqs.length === 0}
            <div class="empty-cont">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5">
                    <path d="M10 1V3.25M16.364 3.636L14.773 5.227M19 10H16.75M16.364 16.364L14.773 14.773M10 16.75V19M5.227 14.773L3.636 16.364M3.25 10H1M5.227 5.227L3.636 3.636" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No requirements have been set</p>
                <button class="add-req-btn" onclick={() => isAddingNewReq = true}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Requirement
                </button>
            </div>
        {:else}
            {#each $currentReqs as req (req.name)}
                <ReqTile requirement={req} />
            {/each}
        {/if}
    </div>
    <button class="btn-add" onclick={() => isAddingNewReq = true}>
        Add New Requirement
    </button>
    <div class="add-req-popover {isAddingNewReq ? 'open' : ''}">
        <button class="btn-close" aria-label="Close" onclick={() => isAddingNewReq = false}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>                      
        </button>
        <p class="new-req-txt">New Requirement</p>
        <div class="new-req-inner">
            <div class="area">
                <p>Name:</p>
                <Input class="h-8 {isNameError ? 'error-outline' : ''}"
                    bind:value={newReqName}
                    on:input={validateName}
                />
            </div>
            <div class="area">
                <p>Description:</p>
                <Textarea bind:value={newReqDescription} class="resize-none" />
            </div>

            <div class="area">
                <p>Formula:</p>
                <div class="info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>              
                    <p>Click on component inputs and outputs to use them in a formula</p>
                </div>

                {#if newReqLeftHandSide}
                    <LogicalExpressionField bind:value={newReqLeftHandSide} />
                {/if}

                <div class="field centered">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>              
                    <Select.Root bind:selected={newReqOperator}>
                        <Select.Trigger class="w-[142px] h-8 px-2.5">
                            <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="Globally">Globally</Select.Item>
                            <Select.Item value="Eventually">Eventually</Select.Item>
                            <Select.Item value="Until">Until</Select.Item>
                            <Select.Item value="Since">Since</Select.Item>
                            <Select.Item value="Next">Next</Select.Item>
                            <Select.Item value="Release">Release</Select.Item>
                        </Select.Content>
                    </Select.Root>
                </div>

                <LogicalExpressionField bind:value={newReqRightHandSide} />

                <div class="field time-interval">
                    {#if newReqInterval == undefined}
                        <button onclick={() => newReqInterval = [0, 0]}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>                      
                            Add Time Interval
                        </button>
                    {:else}
                        <p class="time-interval-txt">For Time Interval</p>
                        <div class="interval-inner">
                            <div class="interval-picker">
                                <Input type="number" bind:value={newReqInterval[0]} class="w-[64px] h-8" />
                                <p>s - </p>
                                <Input type="number" bind:value={newReqInterval[1]} class="w-[64px] h-8" />
                                <p>s</p>
                            </div>
                            <button class="rm-interval" aria-label="Remove Time Interval" onclick={() => newReqInterval = undefined}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>                      
                            </button>
                        </div>
                    {/if}
                </div>
            </div>      
        </div>

        <button class="btn-add {isNameError ? 'inactive' : ''}"
            onclick={addNewReq}>
            Add
        </button>
    </div>
</div>
<style>
    .new-req-inner {
        max-height: 340px;
        overflow-y: scroll;
        overflow-x: visible;
        padding: 0 4px;
    }

    .area {
        margin-bottom: 12px;
    }

    .interval-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .rm-interval svg {
        width: 18px;
        height: 18px;
        color: rgba(0, 0, 0, 0.45);
    }
    .interval-picker {
        display: flex;
        align-items: center;
    }
    .interval-picker p {
        margin: 0 4px;
    }

    .time-interval-txt {
        font-size: 12px;
        margin-bottom: 4px;
    }
    .time-interval {
        font-size: 12px;
    }
    .time-interval svg {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        margin-bottom: -0.5px;
    }
    .time-interval button {
        display: flex;
    }

    .field {
        padding: 8px;
    }
    .field.centered {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2px;
    }
    .field.centered svg {
        width: 18px;
        height: 18px;
        color: rgba(0, 0, 0, 0.45);
    }

    .info {
        width: 100%;
        display: flex;
        align-items: center;
        vertical-align: middle;
        gap: 6px;
        padding: 8px;
        border-radius: var(--main-border-radius);
        background-color: var(--list-dark-color);
        margin: 4px 0;
    }
    .info p {
        font-size: 12px;
        margin: 0;
        line-height: 1.2;
    }

    .add-req-popover {
        box-sizing: border-box;
        width: 100%;
        position: absolute;
        left: 0;
        bottom: 0;
        background-color: white;
        border-radius: var(--main-border-radius);
        border-top: none;
        overflow: hidden;
        height: fit-content;
        padding: 0 10px;
        max-height: 0;
        transition: 0.3s;
    }
    .add-req-popover.open {
        max-height: 1000px;
        padding: 14px;
        border-top: var(--main-border);
    }
    .new-req-txt {
        font-weight: 550;
        margin-bottom: 8px;
    }

    .empty-cont {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-top: calc(50vh - 180px);
    }
    .empty-cont svg {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        stroke-width: 0.5;
        color: rgba(0, 0, 0, 0.9);
    }
    .empty-cont p {
        color: rgba(0, 0, 0, 0.7);
    }
    .add-req-btn {
        width: 100%;
        display: flex;
        justify-content: center;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.7);
    }
    .add-req-btn svg {
        width: 18px;
        height: 18px;
        margin-top: 1px;
        margin-right: 2px;
        stroke-width: 1.5;
    }
    .add-req-btn:hover {
        color: black;
    }

    p {
        font-size: 14px;
    }
    .reqs-list {
        width: 100%;
        flex-grow: 1;
        position: relative;
        max-height: 100%;
        overflow-y: scroll;
        padding-right: 4px;
    }

    .main-reqs-cont {
        position: fixed;
        top: 15px;
        left: 93px;
        height: calc(100vh - 30px);
        background-color: white;
        border: var(--main-border);
        border-radius: var(--main-border-radius);
        z-index: 100;
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.2s;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .main-reqs-cont.open {
        visibility: visible;
        opacity: 1;
    }
    .btn-close {
        position: absolute;
        top: 8px;
        right: 8px;
    }
    .btn-close svg {
        width: 16px;
        height: 16px;
        color: rgba(0, 0, 0, 0.6);
    }
    .btn-add{
        width: 100%;
        padding: 8px;
        background-color: var(--main-dark-color);
        border: var(--main-border);
        color: rgba(255, 255, 255, 0.9);
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 50px;
    }
    .btn-add.inactive {
        cursor: initial;
        opacity: 0.8;
        pointer-events: none;
    }
</style>