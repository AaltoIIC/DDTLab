<script lang="ts">
    import Input from '$lib/components/ui/input/input.svelte';
    import type { Keyboard } from 'lucide-svelte';
    import { onMount } from 'svelte';

    interface Props {
        type: 'part' | 'item';
        inputElement: HTMLInputElement;
        options: string[];
    }

    let {type, inputElement=$bindable(), options=[] }: Props = $props();

    let list: string[] = $state([]);
    let isListOpen = $state(false);
    let selectedOption: string | undefined = $state();

    const filter = (text: string) => {
        const sanitized = text.trim().toLowerCase();
        
        return options.filter(o => o.toLowerCase().includes(sanitized));
    }

    function showList(inputValue: string) {
        list = inputValue === '' ? options : filter(inputValue);
        isListOpen = true;
    }

    function hideList() {
        if (!isListOpen) return

        if (selectedOption) {
            inputElement.value = selectedOption;
        }

        isListOpen = false;
    }

    function onInputClick(event: MouseEvent) {
        if ((event.target) instanceof HTMLInputElement) {
            showList(event.target.value);
        }
    }

    function onOptionClick(event: MouseEvent) {
        if ((event.target) instanceof HTMLElement) {
            selectedOption = event.target.dataset.value;
            hideList();
        }
    }

    const handleOutsideClick = (event: MouseEvent) => {
        if (!(event.target as HTMLElement).closest(".dropdown-list")) {
            hideList();
        }
    }

    function onInputKey(event: KeyboardEvent) {
        if((event.target) instanceof HTMLInputElement) {
            switch (event.key) {
                case "Escape":
                case "ArrowUp":
                case "ArrowLeft":
                case "ArrowRight":
                case "Enter":
                case "Tab":
                case "Shift":
                    break;  
                case "ArrowDown":
                    showList(event.target.value);
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                default:
                    showList(event.target.value);
            }
        }
    }

    onMount(() => {
        document.addEventListener('mousedown', handleOutsideClick);

        if (inputElement) {
            inputElement.addEventListener('click', onInputClick);
            inputElement.addEventListener('keyup', onInputKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            if (inputElement) {
                inputElement.removeEventListener('click', onInputClick);
                inputElement.removeEventListener('keyup', onInputKey);
            }
        }
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div>
    <ul
        class="dropdown-list"
        onclick={onOptionClick}
        hidden={!isListOpen}
    >
        {#each list as option (option)}
            <li class="list-option"  data-value={option}>
                {option}
            </li>
        {:else}
            <li class="list-no-results">
                No results available
            </li>
        {/each}
    </ul>
</div>

<style>
    .dropdown-list {
        position: absolute;
        left: 0;
        inset-block-start: calc(100% + 0.05rem);
        z-index: 1000;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        width: 82%;
        max-height: 150px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .list-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 0.2rem solid transparent;
        font-size: 11px;
        color: #51555c;
    }
    .list-option:hover {
        cursor: pointer;
        background-color: rgba(0, 204, 255, 0.1);
    }
</style>