<script lang="ts">
    import Button from "$lib/Button.svelte";
</script>
<div class="main-top-bar">
    <span class="undo-redo-cont">
        <button class="top-btn undo" aria-label="Undo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
        </button>
        <button class="top-btn redo" aria-label="Redo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
            </svg>              
        </button> 
    </span>
    <div class="main-name-cont">
        System: <input type="text" />
    </div>
    <Button>Save</Button>
</div>
<style>
    .main-top-bar {
        position: fixed;
        top: 15px;
        right: 15px;
        height: 68px;
        width: fit-content;
        display: flex;
        gap: 20px;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        box-sizing: border-box;
        background: var(--main-dark-color);
        z-index: 100;
        border: var(--main-border);
        border-radius: var(--main-border-radius);
    }
    .undo-redo-cont {
        display: flex;
        gap: 8px;
    }
    .top-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: white;
    }
    .top-btn svg {
        width: 16px;
        height: 16px;
        opacity: 0.9;
        display: inline;
        margin-bottom: 4px;
    }
    .main-name-cont {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-family: Inter, sans-serif;
    }
    .main-name-cont input {
        line-height: 1;
        padding: 8px;
        background-color: #ffffff0d;
        border-radius: 5px;
        border: solid 2px rgba(255, 255, 255, .1);
        color: #ffffffe6;
        font-family: Inter, sans-serif;
        font-weight: 600;
        margin-left: 8px;
        width: 18ch;
    }
</style>