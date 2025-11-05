<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select";
    import { onMount } from "svelte";
    import type { LogicalExpressionType } from "$lib/types/types";
    import { currentNodes, navigationContext } from "$lib/stores/stores.svelte";
    import { get } from "svelte/store";

   interface Props {
      value?: LogicalExpressionType;
   }

   let { value = $bindable({
        leftHandSide: '',
        rightHandSide: '',
        operator: '='
    }) }: Props = $props();


    let operator = $state({value: '=', label: '='});
    const updateOperator = (e: any) => {
        value.operator = e.value;
    };

    // Fill input fields with connector name on click
    let leftInFocus = $state(false);
    let rightInFocus = $state(false);
    let inputOnHover = $state(false);
    onMount(() => {
        document.addEventListener('click', () => {
            if (inputOnHover) return;
            leftInFocus = false;
            rightInFocus = false;
        });

        document.addEventListener('connector-click', (e) => {
            const detail = (e as any).detail;
            const elementName = detail.elementName;
            const connectorName = detail.connectorName;

            // Find the node to get its actual name (not ID)
            const nodes = get(currentNodes);
            const node = nodes.find(n => n.id === elementName);
            const nodeName = node?.data?.name || elementName;

            // Find the connector to get its VSSoClass (custom variable) if available
            const connector = (node?.data?.element as any)?.connectors?.find(
                (c: any) => c.name === connectorName
            );
            // Use VSSoClass if available, otherwise use connector name
            const displayName = connector?.class || connectorName;

            // Build full hierarchical path including subsystem navigation
            const navContext = get(navigationContext);
            const pathNames: string[] = [];

            // Add all parent system names from navigation path
            if (navContext.path && navContext.path.length > 0) {
                navContext.path.forEach(parent => {
                    pathNames.push(parent.name);
                });
            }

            // Add the component name and connector variable/name
            pathNames.push(nodeName);
            pathNames.push(displayName);

            // Create hierarchical path: parent1.parent2.component.variable
            const hierarchicalPath = pathNames.join('.');

            if (leftInFocus) {
                value.leftHandSide = hierarchicalPath;
            } else if (rightInFocus) {
                value.rightHandSide = hierarchicalPath;
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

   <Select.Root bind:selected={operator}
    onSelectedChange={updateOperator}>
        <Select.Trigger class="flex-shrink-0 w-16 h-8 px-2.5">
            <Select.Value />
        </Select.Trigger>
        <Select.Content>
            <Select.Item value="=">=</Select.Item>
            <Select.Item value="<">{'<'}</Select.Item>
            <Select.Item value=">">{'>'}</Select.Item>
            <Select.Item value="<=">{'<='}</Select.Item>
            <Select.Item value=">=">{'>='}</Select.Item>
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