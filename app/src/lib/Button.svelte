<script lang="ts">
    export let icon: string = '';
    export let isActive: boolean = true;
    export let lightMode: boolean = false;
    export let color: string = 'var(--main-color)';
    export let textColor: string = 'rgba(255, 255, 255, 0.9)';
    export let border: boolean = false;
    export let onClick: () => void = () => {};
</script>

<button
    on:click={onClick}
    class={`btn ${lightMode ? "lightmode" : ""} ${isActive ? '' : 'disabled'} ${border ? 'border' : ''}`}
    style={`background-color: ${color}; color: ${textColor};`}>  
    <span class="main-text" style="{icon ? '' : 'padding-left: 14px !important;'}">
        {#if icon}
            <span class="main-icon">
                    {@html icon} 
            </span>             
        {/if}
        <slot></slot>
    </span>
</button>
<style>
    .btn {
        padding: 0;
        display: inline-flex;
        font-size: 14px;
    }
    .btn.border {
        border: var(--main-border);
    }
    .lightmode {
        box-shadow: var(--main-shadow);
    }
    .main-text {
        padding: 6.5px 12px 6.5px 10px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .main-icon {
        width: 18px;
        height: 18px;
        border-right: solid 2px rgba(0, 0, 0, 0.04);
        display: inline;
    }
    button {
        padding: 10px 12px;
        cursor: pointer;
        transition: .2s;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
        border-radius: 50px;
        border: none;
    }
    button:hover {
        filter: brightness(1.05);
    }
    .disabled {
        pointer-events: none !important;
        opacity: 0.7 !important;
    }
</style>