export function isNameValid(name: string): boolean {
    return (
        name !== '' &&
        !name.includes("'") &&
        !name.includes('"') &&
        !name.includes('`') &&
        !name.includes('\\') &&
        !name.includes('/') &&
        !name.includes('\n') &&
        !name.includes('\t') &&
        !name.includes('.')
    );
}

/**
 * Maximum length of a system / node / definition name.
 * Enforced on the name inputs (maxlength) and when saving.
 */
export const MAX_NAME_LENGTH = 40;

/**
 * Cuts a name down to MAX_NAME_LENGTH characters. No-op for shorter names.
 */
export function truncateName(name: string): string {
    return name.length > MAX_NAME_LENGTH ? name.slice(0, MAX_NAME_LENGTH) : name;
}

/**
 * Returns true when the proposed name is invalid or already used.
 * The historical helper API returns this error-state boolean rather than validity.
 */
export function validateName(
    currentName: string,
    newName: string,
    nameList: string[]
): boolean {
    const isNameTaken =
        newName !== currentName &&
        nameList.some(
            (name) =>
                name.replace(/\s+/g, '').toLowerCase() ===
                newName.replace(/\s+/g, '').toLowerCase()
        );

    return !isNameValid(newName) || isNameTaken;
}

export function generateName(nameBasis: string, names: string[]): string {
    let newName = nameBasis;
    let suffix = 2;

    while (names.includes(newName)) {
        newName = `${nameBasis} (${suffix})`;
        suffix += 1;
    }

    return newName;
}

export function generateElementName(
    type: 'component' | 'subsystem',
    elementNames: string[],
    systemNames: string[]
): string {
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    const allNames = [...elementNames, ...systemNames];
    return generateName(`New ${capitalizedType}`, allNames);
}
