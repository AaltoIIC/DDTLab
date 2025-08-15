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
            steps
        });
    });

    $effect( () => {
        if (driverObj) {
            driverObj.setConfig({
                ...driverObj.getConfig(),
                allowClose: !disableCancel
            }
            );

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
    }
</style>