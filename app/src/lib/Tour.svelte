<script lang="ts">
    import { driver, type Driver, type DriveStep } from "driver.js";
    import "driver.js/dist/driver.css";
    import { onMount, onDestroy } from "svelte";

    interface Props {
        driverObj: Driver | undefined;
        steps: DriveStep[];
        start: boolean;
        disableCancel?: boolean;
        storageKey?: string;
    }

    let { 
        steps = [], 
        start = $bindable(false), 
        driverObj = $bindable(),
        disableCancel,
        storageKey = 'showedFirstTour'
    }: Props = $props();

    
    function onClose() {
        if (document.querySelector('#sidebar')) {
            (document.querySelector('#closeDefSliderBtn') as HTMLElement)?.click()
        };
        driverObj?.destroy();
    }

    function createDriver() {
        // Add skip functionality to the first step
        const stepsWithSkip: DriveStep[] = steps.map((step, index) => {
            if (index === 0 && disableCancel) {
                return {
                    ...step,
                    popover: {
                        ...(step.popover || {}),
                        showButtons: ['next', 'close'], // First step gets next and close
                        onCloseClick: () => {
                            // Save that tour was skipped
                            if (typeof localStorage !== 'undefined') {
                                localStorage.setItem(storageKey, "true");
                            }
                            onClose();
                        }
                    }
                } as DriveStep;
            }
            return step;
        });

        driverObj = driver({
            popoverClass: 'tour-class',
            disableActiveInteraction: true,
            overlayOpacity: 0.35,
            overlayClickBehavior: undefined,
            onDestroyed: () => {
                start = false;
                driverObj = undefined;
            },
            onCloseClick: () => {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(storageKey, "true");
                }
                onClose();
            },
            steps: stepsWithSkip,
            showButtons: ['next', 'previous', 'close'],
            progressText: '{{current}} of {{total}}'
        });
    }

    onMount(() => {
        createDriver();
    });

    onDestroy(() => {
        if (driverObj) {
            driverObj.destroy();
            driverObj = undefined;
        }
    });

    $effect(() => {
        if (start) {
            if (!driverObj) createDriver();
            driverObj?.drive();
        } else if (driverObj) {
            driverObj.destroy();
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
    }
</style>