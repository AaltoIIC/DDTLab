<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select";
    import { onMount } from "svelte";
    import type { LogicalExpressionType } from "$lib/types/types";

    export let value: LogicalExpressionType = {
        leftHandSide: '',
        rightHandSide: '',
        operator: '='
    };

    let operator = {value: '=', label: '='};
    $: value.operator = operator.value as typeof value.operator;

    // Fill input fields with connector name on click
    let leftInFocus = false;
    let rightInFocus = false;
    let inputOnHover = false;
    onMount(() => {
        document.addEventListener('click', () => {
            if (inputOnHover) return;
            leftInFocus = false;
            rightInFocus = false;
        });

        document.addEventListener('connector-click', (e) => {
            if (leftInFocus) {
                value.leftHandSide = `sys:${(e as any).detail.connectorName}`;
            } else if (rightInFocus) {
                value.rightHandSide = `sys:${(e as any).detail.connectorName}`;
            }
        });
    });
</script>
<div class="field">
   <Input
        on:focus={() => {leftInFocus = true; rightInFocus = false;}}
        bind:value={value.leftHandSide}
        on:mouseenter={() => {inputOnHover = true;}}
        on:mouseleave={() => {inputOnHover = false;}}
        class="flex-grow h-8 px-2.5" />

   <Select.Root bind:selected={operator}>
        <Select.Trigger class="flex-shrink-0 w-16 h-8 px-2.5">
            <Select.Value />
        </Select.Trigger>
        <Select.Content>
            <Select.Item value="=">=</Select.Item>
            <Select.Item value="<">{'<'}</Select.Item>
            <Select.Item value=">">{'>'}</Select.Item>
        </Select.Content>
    </Select.Root>

   <Input
        on:focus={() => {rightInFocus = true; leftInFocus = false;}}
        bind:value={value.rightHandSide}
        on:mouseenter={() => {inputOnHover = true;}}
        on:mouseleave={() => {inputOnHover = false;}}
        class="flex-grow h-8 px-2.5" />
</div>
<style>
    .field {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px;
        border-radius: var(--main-border-radius);
        background-color: var(--list-dark-color);
    }
</style>