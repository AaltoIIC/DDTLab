<script lang="ts">
    import { run } from 'svelte/legacy';

    import { onMount } from 'svelte';
    interface Props {
        text: string;
        value: string | undefined;
        isError?: boolean;
        onInput: (text: string) => void;
    }

    let {
        text,
        value = $bindable(),
        isError = false,
        onInput
    }: Props = $props();
    let spanWidth = $state(0);
    let inputElement: HTMLInputElement | undefined = $state();

    const measureWidth = () => {
        if (!inputElement) return;
        spanWidth = (inputElement.nextElementSibling as HTMLSpanElement).offsetWidth;
    }

    run(() => {
        if (value) {
            setTimeout(() => {
                measureWidth();
            }, 0);
        }
    });

    onMount(() => {
        measureWidth();
    });
</script>
<div class="component-name-cont">
    {text}:
    <input
        class="input"
        name="DDT-name"
        type="text"
        bind:value={value}
        bind:this={inputElement}
        oninput={() => {onInput(value || '');}}
        style={
            `${isError ? "outline: solid 2px var(--main-error-color-dark);" : ""} width: ${spanWidth}px;`
        } />
    <span class="hidden-span">{value}</span>
</div>
<style>
    .hidden-span {
        visibility: hidden;
        white-space: pre;
        position: absolute;
        font-size: 14px;
        font-family: 'Inter', sans-serif;  
    }
    /* component name field */
    .component-name-cont {
        color: rgba(255, 255, 255, 0.9);
        display: inline-block;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        height: fit-content;
        margin-left: -48px;
        height: fit-content;
        align-self: center;
    }
    .component-name-cont .input {
        line-height: 1;
        padding: 8px;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 5px;
        border: solid 2px rgba(255, 255, 255, 0.1);
        color:rgba(255, 255, 255, 0.9);
        font-family: 'Inter', sans-serif;
        width: fit-content;
        font-weight: 600;
        margin-left: 8px;
        max-width: 24ch;
    }
</style>