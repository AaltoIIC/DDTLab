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
 * Hard cap for a stored system / node / definition name. Duplicate names
 * ("X (2)", "X (3)", ...) may reach this length.
 */
export const MAX_NAME_LENGTH = 40;

/**
 * Soft cap for the name edit fields. Four below MAX_NAME_LENGTH so a 36-character
 * name leaves room for the " (n)" duplicate suffix (e.g. "X (2)") within the hard
 * cap; longer suffixes fall back to trimming the base name in duplicateName.
 */
export const MAX_EDIT_NAME_LENGTH = 36;

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

/**
 * Generates a unique duplicate name for a copy of `originalName` using the
 * "<name> (2)", "<name> (3)", ... convention. Skips any name already in
 * `takenNames` and stays within MAX_NAME_LENGTH, trimming the base name if the
 * numeric suffix would overflow the cap (so "X (10)" never gets cut mid-suffix).
 */
export function duplicateName(originalName: string, takenNames: string[]): string {
    const taken = new Set(takenNames);
    let suffix = 2;
    let candidate = '';

    do {
        const suffixText = ` (${suffix})`;
        const base = originalName.slice(0, MAX_NAME_LENGTH - suffixText.length);
        candidate = `${base}${suffixText}`;
        suffix += 1;
    } while (taken.has(candidate));

    return candidate;
}
