export function formatDate(isoString: string): string {
    if (Number.isNaN(Date.parse(isoString))) return '';

    const date = new Date(isoString);
    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function makeValidFileName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
