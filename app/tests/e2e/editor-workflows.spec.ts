import { expect, test } from '@playwright/test';

async function resetBrowserState(page: import('@playwright/test').Page) {
  await page.route('**/api/analysis-requests/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/api/v1/catalog/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('**/catalog-api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('showedFirstTour', 'true');
    localStorage.setItem('showedDesignTour', 'true');
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

  test('uses the shared TopBar button to show and replay the concept-stage tutorial', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Conceptual Stage' }).click();

    await expect(page.locator('#stage-help-btn')).toHaveCount(1);
    await expect(page.locator('#help-btn')).toHaveCount(0);
    await page.getByRole('button', { name: 'Start concept stage tutorial tour' }).click();
    await expect(page.locator('.driver-popover-title')).toHaveText('Welcome to the Concept Stage tour!');

    await page.locator('.driver-popover-close-btn').click();
    await expect(page.locator('.driver-popover')).toBeHidden();
    await page.getByRole('button', { name: 'Start concept stage tutorial tour' }).click();
    await expect(page.locator('.driver-popover-title')).toHaveText('Welcome to the Concept Stage tour!');
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

  test('shows and replays the design-stage tutorial', async ({ page }) => {
    await resetBrowserState(page);
    await page.evaluate(() => localStorage.removeItem('showedDesignTour'));
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Design Stage' }).click();

    await expect(page.locator('.driver-popover-title')).toHaveText('Welcome to the Design Stage tour!');
    const overlayBox = await page.locator('.driver-overlay').boundingBox();
    const viewport = page.viewportSize();
    expect(overlayBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(overlayBox!.width).toBe(viewport!.width);
    expect(overlayBox!.height).toBe(viewport!.height);
    await page.locator('.driver-popover-close-btn').click();
    await expect(page.locator('.driver-popover')).toBeHidden();
    await expect(page).toHaveTitle(/Edit/);

    await page.getByRole('button', { name: 'Start design stage tutorial tour' }).click();
    await expect(page.locator('.driver-popover-title')).toHaveText('Welcome to the Design Stage tour!');
    await page.locator('.driver-popover-next-btn').click();
    await expect(page.locator('.driver-popover-title')).toHaveText('Top bar');
  });

  test('caps design-stage node names at 40 characters and exposes them via tooltip', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Design Stage' }).click();
    await expect(page).toHaveURL(/\/editor\/[^/]+\/?$/);

    // Add a component node through the sidebar
    await page.locator('#design-add-menu').click();
    await page.getByRole('button', { name: 'Component', exact: true }).click();

    // Unfocused: the name is shown as a display div (not an editable field yet)
    const display = page.locator('.name-display');
    await expect(display).toHaveCount(1);
    // A short name is shown in full
    expect((await display.textContent())?.trim().length).toBeGreaterThan(0);

    // Clicking the name switches to the editable textarea
    await display.click();
    const nameField = page.locator('textarea.main-name-field');
    await expect(nameField).toBeVisible();
    await expect(nameField).toHaveAttribute('spellcheck', 'false');
    await expect(nameField).toHaveAttribute('maxlength', '40');

    // Rename it to a name longer than the 40-character cap
    const longName = 'A very long design component name that would normally be truncated';
    const cappedName = longName.slice(0, 40);
    await nameField.fill(longName);
    await nameField.blur();

    // Unfocused again: the display reappears, showing the capped name in full
    await expect(display).toBeVisible();
    await expect(display).toHaveText(cappedName);
    // The native tooltip (title) exposes the capped name on hover
    await expect(display).toHaveAttribute('title', cappedName);
    // Clicking the display opens the editor with the capped name
    await display.click();
    await expect(nameField).toHaveValue(cappedName);
  });

  test('caps concept-stage definition names at 40 characters', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Conceptual Stage' }).click();
    await expect(page).toHaveURL(/\/editor\/[^/]+\/?\?stage=concept$/);

    // Open the part definitions slider and start defining a new part
    await page.locator('#partBtn').click();
    await page.locator('#defBtn').click();

    const nameInput = page.locator('#nameinput');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('maxlength', '40');

    const longName = 'An extremely long concept part definition name exceeding the cap';
    const cappedName = longName.slice(0, 40);
    await nameInput.fill(longName);
    await page.locator('#def-editor').getByRole('button', { name: 'Add', exact: true }).click();

    // The new definition appears in the list with the capped name
    await page.locator('#allDefsBtn').click();
    await expect(page.locator('.template-name', { hasText: cappedName })).toHaveText(cappedName);
  });

  test('caps the TopBar system name at 40 characters and keeps it as a tooltip', async ({ page }) => {
    await resetBrowserState(page);
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Design Stage' }).click();
    await expect(page).toHaveURL(/\/editor\/[^/]+\/?$/);

    const nameInput = page.getByRole('textbox', { name: 'System name' });
    await expect(nameInput).toHaveAttribute('spellcheck', 'false');
    await expect(nameInput).toHaveAttribute('maxlength', '40');

    const longName = 'A very long system name that exceeds the width of the top bar field';
    const cappedName = longName.slice(0, 40);
    await nameInput.fill(longName);
    await nameInput.focus();
    await nameInput.evaluate((el) => {
      (el as HTMLInputElement).scrollLeft = (el as HTMLInputElement).scrollWidth;
    });
    await nameInput.blur();

    // Unfocusing snaps the input back to the beginning of the name
    expect(await nameInput.evaluate((el) => (el as HTMLInputElement).scrollLeft)).toBe(0);
    await expect(nameInput).toHaveAttribute('title', cappedName);
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
