<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { ChevronDown } from "@lucide/svelte";
	import type { Snippet } from 'svelte';
	import { cn } from "$lib/utils.js";

	export type $$Props = SelectPrimitive.TriggerProps;
	export type $$Events = SelectPrimitive.TriggerEvents;

	let { class: className = undefined, children, ...rest }: {
		class?: string;
		children?: Snippet<[any]>;
		[k: string]: unknown;
	} = $props();

	const children_render = $derived(children);
	const triggerClass = $derived(cn(
		"border-input bg-background ring-offset-background focus-visible:ring-ring aria-[invalid]:border-destructive data-[placeholder]:[&>span]:text-muted-foreground flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
		className
	));
	const mergedProps = $derived({ ...rest, class: triggerClass } as Record<string, unknown>);
</script>

<SelectPrimitive.Trigger
	{...mergedProps}
	
	on:click
	on:keydown
>
	{#snippet children()} 
		{@render children_render?.({ builder: {} as any })}
		<div>
			<ChevronDown class="h-4 w-4 opacity-50" />
		</div>
	{/snippet}
</SelectPrimitive.Trigger>
