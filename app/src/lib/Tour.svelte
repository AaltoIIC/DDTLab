<script lang="ts">
    import { driver, type Driver, type DriveStep } from "driver.js";
    import "driver.js/dist/driver.css";
    import { onMount } from "svelte";

    interface Props {
        driverObj: Driver | undefined;
        steps: DriveStep[];
        start: boolean;
        disableCancel?: boolean;
    }

    let { 
        steps = [], 
        start = $bindable(false), 
        driverObj = $bindable(),
        disableCancel
    }: Props = $props();

    
    function onClose() {
        if (document.querySelector('#sidebar')) {
            (document.querySelector('#closeDefSliderBtn') as HTMLElement)?.click()
        };
        driverObj?.destroy();
    }

    onMount(() => {
        driverObj = driver({
            popoverClass: 'tour-class',
            disableActiveInteraction: true,
            overlayOpacity: 0.35,
            overlayClickBehavior: undefined, // Makes clicking the backdrop not do anything
            onDestroyed: () => {start = false},
            onCloseClick: () => onClose(),
            steps,
            showButtons: ['next', 'previous', 'close'], // Show all buttons including close
            progressText: '{{current}} of {{total}}'
        });
    });

    $effect( () => {
        if (driverObj) {
            driverObj.setConfig({
                ...driverObj.getConfig(),
                allowClose: true, // Always allow close now that we have all buttons
                onPopoverRender: (popover: Element) => {
                    // Add skip button for first-time users
                    if (disableCancel) {
                        setTimeout(() => {
                            const footer = popover.querySelector('.driver-popover-footer');
                            if (footer && !footer.querySelector('.skip-tour-btn')) {
                                // Create skip button
                                const skipBtn = document.createElement('button');
                                skipBtn.className = 'driver-popover-btn skip-tour-btn';
                                skipBtn.textContent = 'Skip Tour';
                                skipBtn.onclick = () => {
                                    // Mark tour as seen
                                    if (typeof localStorage !== 'undefined') {
                                        localStorage.setItem("showedFirstTour", "true");
                                    }
                                    onClose();
                                };

                                // Insert before the first button (which should be Previous/Next)
                                const firstButton = footer.querySelector('button');
                                if (firstButton) {
                                    footer.insertBefore(skipBtn, firstButton);
                                } else {
                                    footer.appendChild(skipBtn);
                                }
                            }
                        }, 50)
                    }
                }
            });

            if (start) {
                driverObj.drive();
            }
            else {
                driverObj.destroy();
            }
        }
    });
</script>

<style>
    :global {
        .driver-popover.tour-class {
            min-width: 400px;
        }
        .driver-popover.tour-class .driver-popover-title {
            font-size: 20px;
            margin-bottom: 8px;
        }
        .driver-popover.tour-class .driver-popover-description p{
            margin-bottom: 12px;
        }
        .driver-popover.tour-class .driver-popover-description p:last-child{
            margin-bottom: 0px;
        }
        .driver-popover.tour-class li {
            margin-left: 16px;
            list-style-type: circle;
        }
        .driver-popover.tour-class .skip-tour-btn {
            background: #f5f5f5 !important;
            color: #666 !important;
            margin-right: auto !important;
            border: 1px solid #ddd !important;
        }
        .driver-popover.tour-class .skip-tour-btn:hover {
            background: #e5e5e5 !important;
            color: #333 !important;
            border-color: #ccc !important;
        }
        .driver-popover.tour-class .driver-popover-footer {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    }
</style>