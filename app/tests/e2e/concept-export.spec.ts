import { expect, test, type Locator, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { sanitizeFolderName } from '../../src/lib/concept-stage/sysml/export/archiveLayout';

/**
 * Phase 7 e2e — the plan's one Playwright export journey:
 *
 *   build a two-part system with a flow connection, save, reload, export .kpar
 *
 * "Build" goes through the real UI: the semantic library template is dropped on
 * the canvas (HTML5 drag & drop), a second flow connection is drawn between two
 * port handles through the connection-type dropdown, and the system is saved by
 * the normal persistence path (localStorage `systems`). After a reload the
 * canvas is restored and the semantic session is rebuilt from it (decision 29),
 * so the exported archive contains the two parts and the flow — never
 * presentation-only data (decisions 13/21/25/26).
 */

async function resetBrowserState(page: Page) {
    await page.route('**/api/analysis-requests/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/v1/catalog/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/catalog-api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('showedFirstTour', 'true');
        localStorage.setItem('showedDesignTour', 'true');
        localStorage.setItem('cookieNotice', 'true'); // skip the bottom-left cookie card
    });
    await page.reload();
}

async function readSystems(page: Page): Promise<any[]> {
    return page.evaluate(() => JSON.parse(localStorage.getItem('systems') || '[]'));
}

async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk as ArrayBuffer));
    }
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

/**
 * Drop a library component onto the canvas by driving the app's own
 * dragstart → DataTransfer → drop chain: a real `dragstart` on the library
 * item fills a real `DataTransfer` (the app's `handleDragStart`), and the
 * `drop` event invokes the editor's real drop handler. Deterministic — no
 * coordinate guessing through animated/overlapping slider lists.
 */
async function dropLibraryComponent(page: Page, itemName: string, clientX: number, clientY: number): Promise<void> {
    const result = await page.evaluate(
        ({ name, x, y }) => {
            const items = Array.from(document.querySelectorAll('.search-result'));
            const item = items.find((el) => el.textContent?.includes(name) && !el.textContent?.includes('Commercial'));
            if (!item) throw new Error(`Library component "${name}" not found in search results`);

            const dataTransfer = new DataTransfer();
            item.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
            const payload = dataTransfer.getData('application/json');
            if (!payload) throw new Error(`dragstart produced no payload for "${name}"`);

            const editor = document.getElementById('conceptual-editor');
            if (!editor) throw new Error('conceptual-editor not found');
            const accepted = editor.dispatchEvent(
                new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer, clientX: x, clientY: y })
            );
            return { accepted, payloadType: JSON.parse(payload).type };
        },
        { name: itemName, x: clientX, y: clientY }
    );
    expect(result.payloadType).toBe('package'); // semantic ComponentTemplate → instantiateSimpleComponent
}

/**
 * Find a connectable handle whose center is the topmost element on screen
 * (library template nodes overlap — the package wrapper and sibling nodes
 * cover other nodes' handles, so a coordinate drag would start a node drag
 * instead of a connection). `excludeNode` keeps source and target on
 * different nodes.
 */
async function unobstructedHandle(
    page: Page,
    side: 'source' | 'target',
    excludeNode = -1
): Promise<{ nodeIndex: number; locator: Locator }> {
    const nodes = page.locator('.svelte-flow__node');
    const count = await nodes.count();
    for (let i = 0; i < count; i++) {
        if (i === excludeNode) continue;
        const handles = nodes.nth(i).locator(`.svelte-flow__handle.${side}`);
        for (let h = 0; h < (await handles.count()); h++) {
            const box = await handles.nth(h).boundingBox();
            if (!box) continue;
            const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
            const topmostIsHandle = await page.evaluate(
                ([px, py]) => {
                    const el = document.elementFromPoint(px, py);
                    return el instanceof HTMLElement && el.classList.contains('svelte-flow__handle');
                },
                [x, y]
            );
            if (topmostIsHandle) return { nodeIndex: i, locator: handles.nth(h) };
        }
    }
    throw new Error(`no unobstructed ${side} handle found`);
}

test.describe('concept stage .kpar export journey', () => {
    test('builds a two-part system with a flow connection, saves, reloads, and exports a conformant archive', async ({ page }) => {
        await resetBrowserState(page);
        await page.getByRole('button', { name: 'New' }).click();
        await page.getByRole('button', { name: 'Conceptual Stage' }).click();
        await expect(page).toHaveURL(/\/editor\/[^/]+\/?\?stage=concept$/);
        await expect(page.getByRole('button', { name: 'Concept', exact: true })).toBeVisible();

        // ── Build: drop the semantic "Powertrain" library template onto the canvas ──
        await page.locator('#conLibBtn').click();
        await page.locator('.search-input').fill('Powertrain');
        const powertrainItem = page.locator('.search-result', { hasText: 'Powertrain' }).first();
        await expect(powertrainItem).toBeVisible();
        expect(await powertrainItem.textContent()).toContain('Powertrain');
        expect((await powertrainItem.textContent())?.trim()).not.toContain('Commercial');

        const editorBox = await page.locator('#conceptual-editor').boundingBox();
        expect(editorBox).not.toBeNull();
        await dropLibraryComponent(page, 'Powertrain', editorBox!.x + editorBox!.width / 2, editorBox!.y + editorBox!.height / 2);

        // The drop is persisted through the normal save path (poll for autosave).
        await expect
            .poll(async () => (await readSystems(page))[0]?.nodes?.length ?? 0)
            .toBeGreaterThanOrEqual(2);
        let systems = await readSystems(page);
        const partNames = systems[0].nodes
            .filter((node: any) => node.type === 'part' || node.type === 'item')
            .map((node: any) => node.data?.declaredName)
            .filter((name: any): name is string => typeof name === 'string');
        expect(partNames.length).toBeGreaterThanOrEqual(2);
        const flowEdgesBefore = systems[0].edges.filter((edge: any) => edge.data?.connectionType === 'flow');
        expect(flowEdgesBefore.length).toBeGreaterThanOrEqual(1);

        // Close the library slider — its overlay would block canvas interactions.
        await page.locator('.slider-panel .close-button').click();
        await expect(page.locator('.slider-overlay')).toBeHidden();

        // ── Build: draw a second flow connection between two port handles ──
        const nodes = page.locator('.svelte-flow__node');
        expect(await nodes.count()).toBeGreaterThanOrEqual(2);
        const { nodeIndex: sourceNode, locator: sourceHandle } = await unobstructedHandle(page, 'source');
        const { nodeIndex: targetNode, locator: targetHandle } = await unobstructedHandle(page, 'target', sourceNode);
        await nodes.nth(sourceNode).hover();
        await expect(sourceHandle).toBeVisible();
        await nodes.nth(targetNode).hover();
        await expect(targetHandle).toBeVisible();

        // Trusted mouse drag between the two unobstructed handles (native pointer events).
        const sourceBox = await sourceHandle.boundingBox();
        const targetBox = await targetHandle.boundingBox();
        expect(sourceBox).not.toBeNull();
        expect(targetBox).not.toBeNull();
        await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, {
            steps: 15
        });
        await page.mouse.up();
        await expect(page.locator('.connection-dropdown')).toBeVisible();
        await page.locator('.connection-dropdown').getByRole('button', { name: 'Flow Connection' }).click();

        // The new flow edge lands in the persisted system.
        await expect
            .poll(async () => {
                const current = await readSystems(page);
                return current[0].edges.filter((edge: any) => edge.data?.connectionType === 'flow').length;
            })
            .toBeGreaterThanOrEqual(flowEdgesBefore.length + 1);

        // ── Save + reload: the canvas is restored, the session rebuilt (decision 29) ──
        const nodeCount = await page.locator('.svelte-flow__node').count();
        expect(nodeCount).toBeGreaterThanOrEqual(2);
        await page.reload();
        await expect(page.locator('.model-health')).toBeVisible(); // semantic session bound
        await expect(page.locator('.svelte-flow__node')).toHaveCount(nodeCount);

        // ── Export .kpar from the sidebar outer menu (decision 17) ──
        const downloadPromise = page.waitForEvent('download');
        await page.locator('#exportBtn').click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.kpar$/);

        await expect(page.locator('.main-notification-cont')).toContainText('Exported');
        await expect(page.locator('.main-notification-cont')).toContainText('.kpar');

        // ── Verify the archive contents (KerML Clause 10 layout) ──
        systems = await readSystems(page);
        const systemName = systems[0].name;
        const folderName = sanitizeFolderName(systemName);

        const stream = await download.createReadStream();
        expect(stream).not.toBeNull();
        const buffer = await streamToBuffer(stream!);
        const zip = await JSZip.loadAsync(buffer);
        const files = Object.keys(zip.files);

        expect(files).toContain(`${folderName}/.project.json`);
        expect(files).toContain(`${folderName}/.meta.json`);

        const project = JSON.parse(await zip.file(`${folderName}/.project.json`)!.async('string'));
        expect(project.name).toBe(systemName);
        expect(project.version).toBe('1.0.0');
        expect(project.usage).toEqual([]);

        const meta = JSON.parse(await zip.file(`${folderName}/.meta.json`)!.async('string'));
        expect(meta.metamodel).toBe('https://www.omg.org/spec/SysML/20250201');
        expect(typeof meta.created).toBe('string');
        expect(Object.keys(meta.index).length).toBeGreaterThanOrEqual(1);
        for (const fileName of Object.values(meta.index)) {
            expect(fileName).toMatch(/\.sysml$/);
            expect(files).toContain(`${folderName}/${fileName}`);
        }

        // The semantic files carry the two parts and the flow connection…
        const sysmlTexts = files
            .filter((file) => file.endsWith('.sysml'))
            .map((file) => zip.file(file)!.async('string'));
        const sysml = (await Promise.all(sysmlTexts)).join('\n');
        expect(sysml.length).toBeGreaterThan(0);
        for (const partName of partNames) {
            expect(sysml).toContain(partName);
        }
        expect(sysml).toMatch(/flow\b[^;]*\bfrom\b[^;]*\bto\b/);

        // …and never presentation-only data (decisions 13/21/25/26).
        expect(sysml).not.toContain('position');
        expect(sysml).not.toContain('interfaceType');
        expect(sysml).not.toContain('compatibility');
        expect(sysml).not.toContain('adapterRequired');
    });
});