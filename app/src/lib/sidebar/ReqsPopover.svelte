<script lang="ts">
    export let isOpen: boolean = false;
</script>
<div class="main-reqs-cont {isOpen ? 'open' : ''} shadow">
    <button class="btn-close" aria-label="Close" on:click={() => isOpen = false}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
    </button>
    <p>Requirements:</p>

    <button class="btn-done" on:click={() => isOpen = false}>
        Done
    </button>
</div>
<style>
    .main-reqs-cont {
        position: fixed;
        top: 15px;
        left: 93px;
        width: 340px;
        height: calc(100vh - 30px);
        background-color: white;
        border: var(--main-border);
        border-radius: var(--main-border-radius);
        z-index: 100;
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .main-reqs-cont.open {
        visibility: visible;
        opacity: 1;
    }
    .btn-close svg {
        width: 16px;
        height: 16px;
        position: absolute;
        top: 8px;
        right: 8px;
        color: rgba(0, 0, 0, 0.6);
    }
    .btn-done{
        width: calc(100% - 12px);
        padding: 8px;
        background-color: var(--main-dark-color);
        border: var(--main-border);
        color: rgba(255, 255, 255, 0.9);
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 50px;
        margin: 10px 6px 6px 6px;
        position: absolute;
        bottom: 0;
    }
</style>