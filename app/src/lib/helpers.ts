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

// Check if a name is valid
export const isNameValid = (name: string) => {
    return (
        (name !== "") && (!name.includes("'")) && (!name.includes('"')) &&
        (!name.includes("`")) && (!name.includes("\\")) && (!name.includes("/")) &&
        (!name.includes("\n")) && (!name.includes("\t")) && (!name.includes("."))
    )
}

// function to automatically give a unique name
export const generateName = (nameBasis: string, names: string[]) => {
    let newName = nameBasis;
    let i = 2;
    while (names.includes(newName)) {
        newName = `${nameBasis} (${i})`
        i++;
    }

    return newName;
}

// function to set selected node
export const selectNode = (nodeId: string) => {
    currentNodes.update((nodes) => {
        return nodes.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    selected: true
                }
            } else {
                return {
                    ...node,
                    selected: false
                }
            }
        });
    });
}

// generate unique string of 6 characters
export const generateId = (ids: string[]) => {
    const generateRandomString = () => {
        const utf8Chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

        let randomString = '';
        for (let i = 0; i < 6; i++) {
            randomString +=utf8Chars.charAt(Math.floor(Math.random() * utf8Chars.length));
        }

        return randomString;
    }
    let randomString = generateRandomString();
    while (ids.includes(randomString)) {
        randomString = generateRandomString();
    }

    return randomString;
}

export const formatDate = (isoString: string) => {
    if (isNaN(Date.parse(isoString))) return '';
    
    const date = new Date(isoString);
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}