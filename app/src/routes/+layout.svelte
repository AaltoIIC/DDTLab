<script lang="ts">
    import "../app.css";
    import Notification from "$lib/Notification.svelte";
    import CookieNotice from "$lib/CookieNotice.svelte";
    import { onMount } from "svelte";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
    
    let showCookieNotice = $state(false);
    
    onMount(() => {
        if (localStorage.getItem("cookieNotice") !== "true") {
            showCookieNotice = true;
        }
    });
    
    const closeNotice = () => {
        localStorage.setItem("cookieNotice", "true");
        showCookieNotice = false;
    };
</script>
{@render children?.()}
<Notification />
{#if showCookieNotice}
    <CookieNotice onClick={closeNotice} />
{/if}
