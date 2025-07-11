<script lang="ts">
    import NewSystemTile from "$lib/dashboard/NewSystemTile.svelte";
    import SystemTile from "$lib/dashboard/SystemTile.svelte";
    import {
        notification,
        systems
    } from "$lib/stores/stores.svelte";
    import ResourceTile from "$lib/dashboard/ResourceTile.svelte";
    import Header from "$lib/Header.svelte";

    setTimeout(() => {
        notification.set(null);
    }, 1000);
</script>
<svelte:head>
    <title>Dashboard | DDT Lab</title>
</svelte:head>
<main class="main-page-outer">
    <Header />
    <div class="main-page-content">
        <div class="systems-outer">
            <div class="title-cont">
                <h2>Your Systems:</h2>
            </div>
            <div class="ddt-cont">
                {#each (Array.isArray($systems) ? $systems : []).filter(s => !s.parentSystemId).slice() as system}
                    {#key system.id}
                        <SystemTile {system} />
                    {/key}
                {/each}
                <NewSystemTile />
            </div>
        </div>
        <div class="resources-cont">
            <div class="title-cont">
                <span class="title">
                    <h2>Resources:</h2>
                    <p class="sub-title">
                        Here you can find the resources to help you get started with DDT Lab.
                    </p>
                </span>
            </div>
            <div class="resources-list">
                <ResourceTile
                    name="User Guide"
                    texts={["Guide"]}
                    links={["https://github.com/AaltoIIC/DDTLab/wiki/User-Guide"]}
                    icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.3" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>`}>
                    The user guide contains detailed instructions on how to use the editor and its features.
                </ResourceTile>
                <ResourceTile
                    name="Developer Docs"
                    texts={["Docs"]}
                    links={["https://github.com/AaltoIIC/DDTLab/wiki/Developer-Docs"]}
                    icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.3" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>`}>
                    The developer docs contains information on how to contribute to the project and extend its functionality.
                </ResourceTile>
                <ResourceTile
                    name="GitHub"
                    texts={["GitHub"]}
                    links={["https://github.com/AaltoIIC/DDTLab"]}
                    icon={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 22.0268V19.1568C16.0375 18.68 15.9731 18.2006 15.811 17.7506C15.6489 17.3006 15.3929 16.8902 15.06 16.5468C18.2 16.1968 21.5 15.0068 21.5 9.54679C21.4997 8.15062 20.9627 6.80799 20 5.79679C20.4558 4.5753 20.4236 3.22514 19.91 2.02679C19.91 2.02679 18.73 1.67679 16 3.50679C13.708 2.88561 11.292 2.88561 8.99999 3.50679C6.26999 1.67679 5.08999 2.02679 5.08999 2.02679C4.57636 3.22514 4.54413 4.5753 4.99999 5.79679C4.03011 6.81549 3.49251 8.17026 3.49999 9.57679C3.49999 14.9968 6.79998 16.1868 9.93998 16.5768C9.61098 16.9168 9.35725 17.3222 9.19529 17.7667C9.03334 18.2112 8.96679 18.6849 8.99999 19.1568V22.0268" stroke="currentColor" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 20.0267C6 20.9999 3.5 20.0267 2 17.0267" stroke="currentColor" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`}>
                        The GitHub repository contains the source code of the editor and its documentation.
                </ResourceTile>
                <ResourceTile
                    name="About"
                    icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.3" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
                    </svg>`}
                    links={['https://www.aalto.fi/en/aiic/digitwin',
                        'https://www.aalto.fi/en/department-of-energy-and-mechanical-engineering/aalto-arotor-lab']}
                    texts={['DigiTwin Lab', 'Arotor Lab']}
                >
                    The editor is developed by the DigiTwin lab and ARotor at Aalto University.
                </ResourceTile>
            </div>
        </div>
    </div>
    <footer>
        <div class="footer-logo-cont">
            <img class="footer-logo" src="./../icon.svg" alt="DDT Lab Logo">
            <h4>DDT Lab</h4>
        </div>
        <div>
            <b>Docs</b>
            <a href="https://github.com/">User Guide</a>
            <a href="https://github.com/">Developer Docs</a>
        </div>
        <div>
            <b>Maintainers</b>
            <a href="https://github.com/">DigiTwin Lab</a>
            <a href="https://github.com/">Arotor Lab</a>
        </div>
        <div>
            <b>Copyright</b>
            <p>{(new Date().getFullYear())}, Aalto IIC</p>
            <a href="https://github.com/">Released under MIT license</a>
        </div>
    </footer>
</main>
<style>
    /*:global(body) {
        height: fit-content !important;
        overflow-y: scroll !important;
        position: relative !important;
    }*/
    .main-page-outer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        box-sizing: border-box;
        overflow-y: scroll;
    }
    .resources-cont {
        margin: 26px 0;
    }
    .resources-list {
        padding: 24px 0;
        display: flex;
        flex-wrap: wrap;
    }
    .title p {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        margin: -2px 0 6px 0;
    }
    footer {
        height: fit-content;
        width: 100%;
        border-top: var(--main-border);
        display: flex;
        justify-content: space-between;
        padding: 32px 108px 48px 108px;
        box-sizing: border-box;
        backdrop-filter: var(--main-backdrop);
    }
    footer div {
        display: flex;
        flex-direction: column;
    }
    .footer-logo-cont {
        display: flex;
        flex-direction: row;
        font-weight: 450;
        gap: 8px;
    }
    .footer-logo-cont h4 {
        font-size: 18px;
        margin-top: 4px;
    }
    footer div p, footer div a {
        color: rgba(0, 0, 0, 0.7);
        font-size: 14px;
    }
    .footer-logo {
        width: 36px;
        height: 36px;
    }
    .main-page-content {
        margin: 38px auto 38px auto;
        width: 80%;
        max-width: 975px;
        min-height: calc(100vh - 214px);
    }
    .title-cont {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .title-cont h2 {
        font-size: 26px;
        font-weight: 600;
    }
    .systems-outer {
        width: 100%;
        margin: 0 auto;
    }
    .ddt-cont {
        display: flex;
        justify-content: start;
        flex-wrap: wrap;
        height: fit-content;
        padding: 24px 0;
    }

    @media (max-width: 775px) {
        footer {
                flex-direction: column;
                gap: 32px;
        }
    }

    @media (max-width: 492px) {
        .ddt-cont {
                flex-direction: column;
                align-items: center;
        }
    }
</style>
