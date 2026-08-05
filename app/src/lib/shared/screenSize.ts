import { browser } from '$app/environment';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'server';

export function getScreenSize(): ScreenSize {
    if (!browser) return 'server';
    if (window.innerWidth < 1048) return 'mobile';
    if (window.innerWidth < 1200) return 'tablet';
    return 'desktop';
}
