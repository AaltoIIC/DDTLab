<script lang="ts">
    import { version } from '$app/environment'
    import { goto } from '$app/navigation';
    import DropdownMenu from './DropdownMenu.svelte';

    interface Props {
        noTap?: boolean;
    }

    let { noTap = false }: Props = $props();

    const menuItems = [
        {
            name: 'User Guide',
            link: 'https://github.com/AaltoIIC/DDTLab/wiki/User-Guide'
        },
        {
            name: 'Docs',
            link: 'https://github.com/AaltoIIC/DDTLab/wiki/Developer-Docs'
        }
    ];

</script>
<div class="main-header {noTap ? 'no-tap' : ''}">
    <div class="header-content">
        <a href="/" class="logo-cont">
            <span class="main-logo">
                <img class="logo-icon" src="./../header-logo.svg" alt="DDT Lab Logo">
            </span>
            DDT Lab
        </a>
        <p class="links-desktop">
            {#each menuItems as item}
                <a href={item.link}>
                    {item.name}
                </a>
            {/each}
        </p>
        <div class="menu-break"></div>
        <a href="https://github.com/AaltoIIC/DDTLab" target="_blank" class="gh-btn" aria-label="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
            </svg>
        </a>
        <a href="./editor" class="header-btn create-sys-btn">
            Create System
            <svg class="icon-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
        </a>

        <div class="links-mobile">
            <DropdownMenu
                options={menuItems.map(item => item.name)}
                onClick={(option) => {
                    const item = menuItems.find(item => item.name === option);
                    if (item) {
                        goto(item.link);
                    }
                }}
            />
        </div>
    </div>
</div>
<style>
    .menu-break {
        flex-grow: 1;
    }
    .gh-btn {
        width: 20px;
        height: 20px;
        color: rgba(0, 0, 0, 0.8);
    }
    .icon-arrow {
        width: 16px;
        height: 16px;
        margin-top: 2px;
    }
    .header-btn {
        width: fit-content;
        border: var(--main-border);
        border-radius: 50px;
        padding: 6.5px 14px;
        backdrop-filter: var(--main-backdrop);
        font-size: 14px;
        color: rgba(0, 0, 0, 0.7);
        display: flex;
        gap: 4px;
        background-color: transparent;
        transition: background-color 0.2s;
    }
    .header-btn:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }
    .main-header {
        position: sticky;
        top: 0;
        left: 0;
        width: 100%;
        height: 68px;
        z-index: 10000;
        backdrop-filter: var(--main-backdrop);
        border-bottom: var(--main-border);
    }
    .header-content {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        height: 100%;
        width: 100%;
        max-width: 1300px;
        margin: 0 auto;
        gap: 14px;
    }
    .main-header.no-tap {
        pointer-events: none;
    }
    .main-logo {
        width: 38px;
        height: 38px;
        display: block;
        margin-right: 6px;
        border-radius: var(--main-border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .logo-icon {
        width: 34px;
        height: 34px;
        opacity: 0.94;
    }

    .logo-cont {
        display: flex;
        align-items: center;
        height: 100%;
        margin-left: 24px;
        text-decoration: none;
        font-weight: 550;
        color: rgba(0, 0, 0, 0.8);
    }
    .links-desktop {
        display: flex;
        gap: 20px;
        margin: 0 24px;
        align-items: center;
    }
    .links-desktop a {
        text-decoration: none;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.7)
    }
    .links-mobile {
        display: none;
    }

    @media (max-width: 1100px) {
        .links-desktop {
            display: none;
        }
        .links-mobile {
            display: block;
            height: 100%;
            display: flex;
            align-items: center;
            margin-right: 12px;
        }
        .create-sys-btn {
            display: none;
        }
    }
</style>