/** Generate a unique six-character identifier that is absent from the supplied IDs. */
export function generateId(ids: string[]): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const createCandidate = () => {
        let candidate = '';
        for (let index = 0; index < 6; index += 1) {
            candidate += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return candidate;
    };

    let candidate = createCandidate();
    while (ids.includes(candidate)) {
        candidate = createCandidate();
    }

    return candidate;
}
