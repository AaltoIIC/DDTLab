import { browser } from '$app/environment';
import { 
    currentNodes,
    systems
} from '$lib/stores/stores.svelte';
import { get } from 'svelte/store';
import { capitalize } from 'lodash';

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

export const nameElement = (type: 'component'|'subsystem') => {
    const elementNames = get(currentNodes).map(elem => elem.data.name);
    const allNames = elementNames.concat(get(systems).map(s => s.name));
    const capitalType = capitalize(type);
    let newElemName = `New ${capitalType}`;
    let i = 2;
    while (allNames.includes(newElemName)) {
        newElemName = `New ${capitalType} (${i})`
        i++;
    }

    return newElemName;
}

// Check if a name is valid
export const isNameValid = (name: string) => {
    return (
        (name !== "") && (!name.includes("'")) && (!name.includes('"')) &&
        (!name.includes("`")) && (!name.includes("\\")) && (!name.includes("/")) &&
        (!name.includes("\n")) && (!name.includes("\t")) && (!name.includes("."))
    )
}

export const validateName = (currentName: string, newName: string, nameList: string[]): boolean => {
    const isNameTaken = (newName !== currentName) && nameList.some(name => name.replace(/\s+/g, '').toLowerCase() === newName.replace(/\s+/g, '').toLowerCase());
    return !isNameValid(newName) || isNameTaken;
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

export const makeValidFileName = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}