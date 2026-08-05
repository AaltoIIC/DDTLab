export interface HistoryCursor {
    currentIndex: number;
    dataLength: number;
}

/** Return the cursor state after appending one snapshot. */
export function appendHistoryCursor(cursor: HistoryCursor): HistoryCursor {
    const retainedLength = cursor.currentIndex === -1
        ? cursor.dataLength
        : cursor.currentIndex + 1;
    return { currentIndex: -1, dataLength: retainedLength + 1 };
}

export function undoHistoryIndex(cursor: HistoryCursor): number | null {
    const currentIndex = cursor.currentIndex === -1
        ? cursor.dataLength - 1
        : cursor.currentIndex;
    const nextIndex = currentIndex - 1;
    return nextIndex >= 0 ? nextIndex : null;
}

/** Return the entry to restore; the newest entry is represented by cursor -1. */
export function redoHistoryIndex(cursor: HistoryCursor): number | null {
    if (cursor.currentIndex === -1 || cursor.currentIndex >= cursor.dataLength - 1) return null;
    const nextCursor = cursor.currentIndex + 1;
    return nextCursor === cursor.dataLength - 1 ? cursor.dataLength - 1 : nextCursor;
}
