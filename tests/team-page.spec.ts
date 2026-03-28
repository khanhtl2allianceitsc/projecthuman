import { test, expect } from '@playwright/test';

test('/team page — hiển thị danh sách nhân sự', async ({ page }) => {
  await page.goto('/team');
  await page.waitForLoadState('networkidle');

  // Heading
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  const h1Text = await h1.textContent();
  console.log('H1:', h1Text?.trim());

  // Phải có ít nhất 1 member card (có portrait/avatar image hoặc avatar circle)
  const cards = page.locator('.grid > div');
  await expect(cards.first()).toBeVisible({ timeout: 5000 });
  const count = await cards.count();
  console.log('Member cards:', count);
  expect(count).toBeGreaterThan(0);

  // Link back về dashboard
  const backLink = page.locator('a', { hasText: 'Dashboard' });
  await expect(backLink).toBeVisible();
  console.log('✅ Back link hiện');

  // Summary chips
  await expect(page.locator('text=thành viên')).toBeVisible();
  await expect(page.locator('text=dự án active')).toBeVisible();
  console.log('✅ Summary chips hiện');

  // Screenshot
  await page.screenshot({ path: 'tests/results/team-page.png', fullPage: true });
  console.log('📸 Screenshot: tests/results/team-page.png');
  console.log('🎉 /team page OK!');
});
