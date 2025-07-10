<script lang="ts">
    import { onMount } from 'svelte';
    
    interface Props {
        x: number;
        y: number;
        onSelect: (type: 'binding' | 'flow') => void;
        onCancel: () => void;
    }
    
    let { x, y, onSelect, onCancel }: Props = $props();
    
    let dropdownElement: HTMLDivElement | undefined = $state();
    
    // Handle clicks outside the dropdown
    onMount(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
                onCancel();
            }
        }
        
        // Add delay to prevent immediate closing
        setTimeout(() => {
            window.addEventListener('click', handleClickOutside);
        }, 10);
        
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div 
    class="connection-dropdown"
    style="left: {x}px; top: {y}px;"
    bind:this={dropdownElement}
>
    <button 
        class="dropdown-item"
        onclick={() => onSelect('binding')}
    >
        Binding
    </button>
    <button 
        class="dropdown-item"
        onclick={() => onSelect('flow')}
    >
        Flow Connection
    </button>
</div>

<style>
    .connection-dropdown {
        position: fixed;
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        z-index: 10000;
        min-width: 120px;
    }
    
    .dropdown-item {
        display: block;
        width: 100%;
        padding: 8px 12px;
        text-align: left;
        background: none;
        border: none;
        font-size: 13px;
        font-family: inherit;
        color: #374151;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    
    .dropdown-item:hover {
        background-color: #f5f5f5;
    }
    
    .dropdown-item:not(:last-child) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .dropdown-item:active {
        background-color: #e5e7eb;
    }
</style>