<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Textarea } from "$lib/components/ui/textarea";

    export let isOpen: boolean = false;

    let isAddingNewReq = false;

    let newReqName = '';

</script>
<div class="main-reqs-cont {isOpen ? 'open' : ''} shadow-sm">
    <button class="btn-close" aria-label="Close" on:click={() => isOpen = false}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
    </button>
    <p>Requirements:</p>
    <div class="reqs-list">
        <div class="empty-cont">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5">
                <path d="M10 1V3.25M16.364 3.636L14.773 5.227M19 10H16.75M16.364 16.364L14.773 14.773M10 16.75V19M5.227 14.773L3.636 16.364M3.25 10H1M5.227 5.227L3.636 3.636" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>No requirements have been set</p>
            <button class="add-req-btn" on:click={() => isAddingNewReq = true}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Requirement
            </button>
        </div>
    </div>
    <button class="btn-add" on:click={() => isAddingNewReq = true}>
        Add New Requirement
    </button>
    <div class="add-req-popover {isAddingNewReq ? 'open' : ''}">
        <button class="btn-close" aria-label="Close" on:click={() => isAddingNewReq = false}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>                      
        </button>
        <p class="new-req-txt">New Requirement</p>

        <div class="field">
            <p>Name:</p>
            <Input class="w-[142px] h-8"
                bind:value={newReqName}
            />
        </div>
        <div class="field">
            <p>Description:</p>
            <Textarea />
        </div>

        <p>Formula:</p>
        <div class="info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>              
            <p>Click on component inputs and outputs to use them in a formula</p>
        </div>


        <button class="btn-add" on:click={() => isAddingNewReq = false}>
            Add
        </button>
    </div>
</div>
<style>
    .info {
        width: 100%;
        display: flex;
        align-items: center;
        vertical-align: middle;
        gap: 6px;
        margin: 8px;
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
        padding: 0 14px;
        max-height: 0;
        transition: 0.3s;
    }
    .add-req-popover.open {
        max-height: 1000px;
        padding: 14px;
        border-top: var(--main-border);
    }
    .new-req-txt {
        position: absolute;
        top: 14px;
        left: 14px;
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
    }

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
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
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
</style>