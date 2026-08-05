import { expect, test } from '@playwright/test';

async function resetBrowserState(page: import('@playwright/test').Page) {
  await page.route('**/api/analysis-requests/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/v1/catalog/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/catalog-api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('showedFirstTour', 'true');
  });
  await page.reload();
}

test.describe('dashboard and editor lifecycle', () => {
  test('creates a conceptual system and preserves its stage URL after reload', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Conceptual Stage' }).click();

    await expect(page).toHaveURL(/\/editor\/[^/]+\/?\?stage=concept$/);
    await expect(page.getByRole('button', { name: 'Concept', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Design', exact: true })).toBeDisabled();

    const systems = await page.evaluate(() => JSON.parse(localStorage.getItem('systems') || '[]'));
    expect(systems).toHaveLength(1);
    expect(systems[0].stage).toBe('concept');

    await page.reload();
    await expect(page).toHaveURL(/\/editor\/[^/]+\/?\?stage=concept$/);
    await expect(page.getByRole('button', { name: 'Concept', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Design', exact: true })).toBeDisabled();
  });

  test('creates a design system and exposes editor history controls', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Design Stage' }).click();

    await expect(page).toHaveURL(/\/editor\/[^/]+\/?$/);
    await expect(page.getByRole('button', { name: 'Concept', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Redo' })).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();

    const systems = await page.evaluate(() => JSON.parse(localStorage.getItem('systems') || '[]'));
    expect(systems).toHaveLength(1);
    expect(systems[0].stage).toBe('design');
    expect(systems[0].nodes).toEqual([]);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Your Systems:' })).toBeVisible();
  });

  test('deletes a system from the editor top bar and returns to the dashboard', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Design Stage' }).click();
    await expect(page).toHaveURL(/\/editor\/[^/]+\/?$/);

    await page.getByRole('button', { name: 'Delete system' }).click();
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Your Systems:' })).toBeVisible();
    const systems = await page.evaluate(() => JSON.parse(localStorage.getItem('systems') || '[]'));
    expect(systems).toHaveLength(0);
  });

  test('opens an existing system on the canonical stage and survives dashboard reload', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Conceptual Stage' }).click();
    const editorUrl = page.url();
    await page.getByRole('button', { name: 'Home' }).click();
    await expect(page).toHaveURL('/');
    await page.reload();
    await page.getByText('CONCEPT', { exact: true }).click();
    await expect(page).toHaveURL(editorUrl);
  });
});

test.describe('compatibility guardrails', () => {
  test('redirects a stage mismatch instead of loading a system in the wrong editor', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Conceptual Stage' }).click();
    await expect(page).toHaveURL(/\/editor\/[^/]+\/?\?stage=concept$/);
    const conceptUrl = new URL(page.url());
    const idMatch = conceptUrl.pathname.match(/\/editor\/([^/]+)\/?$/);
    expect(idMatch?.[1]).toBeTruthy();
    const id = idMatch![1];
    await page.goto(`/editor/${id}`);
    await expect(page).toHaveURL(new RegExp(`/editor/${id}/?\\?stage=concept$`));
    await expect(page.getByRole('button', { name: 'Concept', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Design', exact: true })).toBeDisabled();
  });
});
