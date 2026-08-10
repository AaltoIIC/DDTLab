import { getScreenSize as getScreenSizeValue } from '$lib/shared/screenSize';
import { generateId as generateIdValue } from '$lib/shared/identifiers';
import {
    generateName as generateNameValue,
    duplicateName as duplicateNameValue,
    isNameValid as isNameValidValue,
    validateName as validateNameValue,
    MAX_NAME_LENGTH as MAX_NAME_LENGTHValue,
    MAX_EDIT_NAME_LENGTH as MAX_EDIT_NAME_LENGTHValue,
    truncateName as truncateNameValue
} from '$lib/shared/validation/nameValidation';
import {
    formatDate as formatDateValue,
    makeValidFileName as makeValidFileNameValue
} from '$lib/shared/formatting';

export const getScreenSize = getScreenSizeValue;

/** @deprecated Import nameElement from the editor-core active actions module. */
export { nameElement } from '$lib/domains/editor-core/services/activeEditorActions';

// Check if a name is valid
export const isNameValid = isNameValidValue;

export const validateName = validateNameValue;

// Hard cap for stored names; duplicates ("X (2)") may reach this length
export const MAX_NAME_LENGTH = MAX_NAME_LENGTHValue;

// Soft cap for the name edit fields, leaving room for duplicate suffixes
export const MAX_EDIT_NAME_LENGTH = MAX_EDIT_NAME_LENGTHValue;

// Cut a name down to MAX_NAME_LENGTH characters
export const truncateName = truncateNameValue;

// function to automatically give a unique name
export const generateName = generateNameValue;

// Generate a unique "<name> (2)" duplicate name within MAX_NAME_LENGTH
export const duplicateName = duplicateNameValue;

/** @deprecated Import selectNode from the editor-core active actions module. */
export { selectNode } from '$lib/domains/editor-core/services/activeEditorActions';

// generate unique string of 6 characters
export const generateId = generateIdValue;

export const formatDate = formatDateValue;

export const makeValidFileName = makeValidFileNameValue;