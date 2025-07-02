<script lang="ts">
    import type { SystemType } from "$lib/types/types";
    import { goto } from "$app/navigation";
    import DialogBox from "$lib/DialogBox.svelte";
    import DropdownMenu from "$lib/DropdownMenu.svelte";
    import { formatDate } from "$lib/helpers";
    import SystemIllustration from "./SystemIllustration.svelte";
    import { cloneSystem, removeSystem } from "$lib/stores/stores";

    interface Props {
        system: SystemType;
    }

    let { system }: Props = $props();
    let dialogBox: DialogBox | undefined = $state();

    const stageParam = system.stage === 'concept' ? '?stage=concept' : '';

    const handleMenu = (option: string) => {
        if (option === "Duplicate") {
            cloneSystem(system.id);
        } else if (option === "Edit") {
            goto(`/editor/${system.id}${stageParam}`);
        } else if (option === "Delete") {
            dialogBox?.openDialog("Are you sure you want to delete this system?", "Delete", "Cancel")
            .then((result: boolean) => {
                if (result) {
                    removeSystem(system.id);
                }
            });
        }
    }
</script>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="tile shadow"
      onclick={() => {
      goto(`/editor/${system.id}${stageParam}`);
  }}>
    <div class="stage-type system-info">
        {system.stage?.toUpperCase()}
    </div>
    <div class="illustration-cont">
        <SystemIllustration {system} />
    </div>
    <div class="system-info">
        <div class="system-name-cont">
            <h4>{system.name}</h4>
            <DropdownMenu
                options={["Duplicate", "Edit", "Delete"]}
                optionIcons={[
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" /></svg>',
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>',
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>']}
                onClick={handleMenu}
            />
        </div>
        <span>
            {formatDate(system.date)}
        </span>
    </div>
</div>
<DialogBox bind:this={dialogBox} />
<style>
    .illustration-cont {
        width: 175px;
        height: 175px;
        mask-image: linear-gradient(rgba(0,0,0,1) 86%, rgba(0,0,0,0) 100%);
        position: relative;
        margin: auto;
    }
    span {
        margin: 0;
        display: block;
        font-size: 12px;
    }
    .tile {
        width: 175px;
        height: 248px;
        margin: 0 0 15px 15px;
        box-sizing: border-box;
        color: rgba(0, 0, 0, 0.9);
        cursor: pointer;
        border-radius: var(--main-border-radius);
        border: var(--main-border);
        background-color: white;
    }
    .tile:hover {
        background-color: var(--main-hover-color);
    }
    .tile h4 {
        margin: 0;
        font-weight: 550;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .system-name-cont {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .system-info {
        padding: 0 14px 14px 14px;
        color: rgba(0, 0, 0, 0.45);
    }
    @media (max-width: 492px) {
        .tile {
            width: 100%;
            margin: 0 0 15px 0;
        }
    }
    .stage-type {
        height: 20px;
        width: 175px;
        text-align: center;
    }
</style>