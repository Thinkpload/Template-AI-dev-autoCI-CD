import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicPages = [
  { path: '/', name: 'Landing page' },
  { path: '/sign-in', name: 'Sign-in page' },
  { path: '/sign-up', name: 'Sign-up page' },
];

for (const { path, name } of publicPages) {
  test(`${name} has no critical/serious axe violations (WCAG 2.1 AA)`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .options({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(
      critical,
      `Found ${critical.length} critical/serious violations on ${name}:\n${critical.map((v) => `  - ${v.id}: ${v.description}`).join('\n')}`
    ).toEqual([]);
  });

  test(`${name} skip link is the first focusable element`, async ({ page }) => {
    await page.goto(path);
    await page.keyboard.press('Tab');
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focusedText).toMatch(/skip to main content/i);
  });
}
