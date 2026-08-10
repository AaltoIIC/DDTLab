import { getScreenSize as getScreenSizeValue } from '$lib/shared/screenSize';
import { generateId as generateIdValue } from '$lib/shared/identifiers';
import {
    generateName as generateNameValue,
    isNameValid as isNameValidValue,
    validateName as validateNameValue,
    MAX_NAME_LENGTH as MAX_NAME_LENGTHValue,
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

// Maximum name length enforced across the concept and design stages
export const MAX_NAME_LENGTH = MAX_NAME_LENGTHValue;

// Cut a name down to MAX_NAME_LENGTH characters
export const truncateName = truncateNameValue;

// function to automatically give a unique name
export const generateName = generateNameValue;

/** @deprecated Import selectNode from the editor-core active actions module. */
export { selectNode } from '$lib/domains/editor-core/services/activeEditorActions';

// generate unique string of 6 characters
export const generateId = generateIdValue;

export const formatDate = formatDateValue;

export const makeValidFileName = makeValidFileNameValue;