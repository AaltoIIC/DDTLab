import { browser } from '$app/environment';
import { 
    currentNodes
} from '$lib/stores/stores';
import { get } from 'svelte/store';

export const getScreenSize = () => {
    if (browser) {
        if (window.innerWidth < 1048) {
            return 'mobile';
        } else if (window.innerWidth < 1200) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    } else {
        return 'server';
    }
}

export const nameElement = (type: 'component'|'system') => {
    const elementNames = get(currentNodes).map(elem => elem.id);
    const capitalType = type.charAt(0).toUpperCase() + type.slice(1);
    let newSystemName = `New ${capitalType}`;
    let i = 2;
    while (elementNames.includes(newSystemName)) {
        newSystemName = `New ${capitalType} (${i})`
        i++;
    }

    return newSystemName;
}