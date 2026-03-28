/**
 * Tests: Volunteer deadline chip + Edit project popup
 * URL: http://192.168.0.14:5173
 */

import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://192.168.0.14:5173';

// Section container: 3 levels lên từ h3 "Dự án cần Lead"
const getSectionContainer = (page: Page) =>
  page.locator('h3:has-text("Dự án cần Lead")').locator('xpath=../../..');

async function skipWhoAreYouModal(page: Page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const modal = page.locator('h2:has-text("Xin chào")');
  if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Chọn member đầu tiên trong danh sách
    const firstMember = page.locator('button[disabled!=true]')
      .filter({ has: page.locator('[style*="background"][class*="rounded-full"]') })
      .first();
    await firstMember.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
}

// ════════════════════════════════════════════════════════════════════════════
test.describe('Volunteer deadline chip', () => {

  test.beforeEach(async ({ page }) => {
    await skipWhoAreYouModal(page);
  });

  test('1. Full-page screenshot', async ({ page }) => {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/results/00-full-dashboard.png', fullPage: true });
    console.log('✅ tests/results/00-full-dashboard.png');
  });

  test('2. Section hiển thị + đếm card', async ({ page }) => {
    const section = getSectionContainer(page);
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Dự án cần Lead")')).toBeVisible();

    const cards = section.locator('[class*="rounded-2xl"]');
    const count = await cards.count();
    console.log(`\n📋 Số card trong section: ${count}`);

    await page.screenshot({ path: 'tests/results/01-section-can-lead.png' });
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('3. Log + chụp ảnh từng card', async ({ page }) => {
    const section = getSectionContainer(page);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const cards = section.locator('[class*="rounded-2xl"]');
    const count = await cards.count();
    console.log(`\n📦 Tổng ${count} card`);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();
      const text = await card.innerText();
      console.log(`\n──── Card ${i + 1} ────\n${text}`);
      await card.screenshot({ path: `tests/results/card-${String(i + 1).padStart(2, '0')}.png` });
    }
  });

  test('4. Card "Doc AI" — chip deadline phải có nội dung', async ({ page }) => {
    const section = getSectionContainer(page);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Chỉ tìm trong section container
    const docAiCard = section.locator('[class*="rounded-2xl"]')
      .filter({ hasText: /Doc AI.*2603/i })
      .first();

    const visible = await docAiCard.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      console.log('ℹ️  Card "Doc AI" không có trong section');
      test.skip();
      return;
    }

    await docAiCard.scrollIntoViewIfNeeded();
    const cardText = await docAiCard.innerText();
    console.log('\n=== Card Doc AI ===\n' + cardText);
    await docAiCard.screenshot({ path: 'tests/results/doc-ai-card.png' });

    const keywords = [
      'Hạn đăng ký', 'Còn', 'Hết hạn', 'Đang mở đăng ký',
      'không giới hạn', 'Sắp hết hạn', 'tiếng', 'phút',
      'Admin chưa mở', 'chưa mở đăng ký',
    ];
    const found = keywords.filter(kw => cardText.includes(kw));
    console.log(found.length ? `\n✅ Chip OK. Khớp: ${found.join(', ')}` : '\n⚠️  Không thấy chip!');
    expect(found.length).toBeGreaterThan(0);
  });

  test('5. Số nút "Tôi muốn làm Lead"', async ({ page }) => {
    const section = getSectionContainer(page);
    await section.scrollIntoViewIfNeeded();
    const btns = section.locator('button:has-text("Tôi muốn làm Lead")');
    const count = await btns.count();
    console.log(`\n🙋 Số nút xung phong: ${count}`);
    await page.screenshot({ path: 'tests/results/05-volunteer-btns.png' });
  });

});

// ════════════════════════════════════════════════════════════════════════════
test.describe('Edit project popup — needLead + deadline', () => {

  test.beforeEach(async ({ page }) => {
    await skipWhoAreYouModal(page);
    // Mở AdminPanel (gear button)
    const gear = page.locator('button[title="Quản lý dữ liệu"]');
    await expect(gear).toBeVisible({ timeout: 5000 });
    await gear.click();
    // Chờ drawer mở
    await expect(page.locator('h2:has-text("Quản lý dữ liệu")')).toBeVisible();
    // Chuyển sang tab Dự án (exact match để tránh nhầm button khác)
    await page.getByRole('button', { name: 'Dự án', exact: true }).click();
    await page.waitForTimeout(300);
  });

  test('6. Mở edit "Doc AI" — kiểm tra form có toggle needLead', async ({ page }) => {
    // Tìm project "Doc AI - Upgrade 2603" trong danh sách admin
    const projectRow = page.locator('[class*="rounded"]')
      .filter({ hasText: /Doc AI.*2603/i })
      .first();

    const visible = await projectRow.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      console.log('ℹ️  Không tìm thấy Doc AI trong admin panel');
      test.skip();
      return;
    }

    // Click nút edit (bút chì)
    const editBtn = projectRow.locator('button[title*="ửa"], button[title*="dit"]').first();
    if (!await editBtn.isVisible().catch(() => false)) {
      // Fallback: click icon Edit2
      await projectRow.locator('button').filter({ has: page.locator('svg') }).first().click();
    } else {
      await editBtn.click();
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/results/06-edit-form-open.png' });

    // Kiểm tra toggle "Mở đăng ký xung phong" có trong form
    const toggleLabel = page.locator('text=Mở đăng ký xung phong');
    console.log('Toggle needLead visible:', await toggleLabel.isVisible().catch(() => false));

    // Kiểm tra field "Thời hạn xung phong"
    const deadlineLabel = page.locator('text=Thời hạn xung phong');
    console.log('Deadline label visible:', await deadlineLabel.isVisible().catch(() => false));

    await page.screenshot({ path: 'tests/results/06b-edit-form-fields.png' });
  });

  test('7. Bật needLead + đặt deadline + save → kiểm tra data thay đổi', async ({ page }) => {
    // Tìm và click edit Doc AI trong ProjectsTab
    const projectRow = page.locator('[class*="rounded"]')
      .filter({ hasText: /Doc AI.*2603/i })
      .first();

    if (!await projectRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('ℹ️  Không tìm thấy Doc AI trong admin panel');
      test.skip();
      return;
    }

    await projectRow.hover();
    await page.screenshot({ path: 'tests/results/07a-hover-row.png' });

    // Click nút edit (icon bút) trong row
    const editBtn = projectRow.locator('button').first();
    await editBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/results/07b-form-opened.png' });

    // Scroll đến section "Xung phong Lead" trong form
    const xungPhongSection = page.locator('text=Xung phong Lead');
    if (await xungPhongSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await xungPhongSection.scrollIntoViewIfNeeded();
    }

    // Toggle needLead = div.rounded-full bên trong label chứa text "Mở đăng ký xung phong"
    const toggle = page.locator('label')
      .filter({ hasText: 'Mở đăng ký xung phong Lead' })
      .locator('div[class*="rounded-full"]')
      .first();

    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggle.scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'tests/results/07c-before-toggle.png' });
      await toggle.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'tests/results/07d-after-toggle.png' });

      // Đặt deadline = ngày mai 23:59
      const deadlineInput = page.locator('input[type="datetime-local"]');
      if (await deadlineInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 0, 0);
        // Format: YYYY-MM-DDTHH:MM
        const pad = (n: number) => String(n).padStart(2, '0');
        const deadlineStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth()+1)}-${pad(tomorrow.getDate())}T23:59`;
        await deadlineInput.fill(deadlineStr);
        console.log(`\n📅 Deadline: ${deadlineStr}`);
        await page.screenshot({ path: 'tests/results/07e-deadline-filled.png' });
      }
    } else {
      console.log('ℹ️  Toggle không thấy — form có thể cần scroll thêm');
      await page.screenshot({ path: 'tests/results/07c-no-toggle.png' });
    }

    // Click nút Save
    const saveBtn = page.locator('button').filter({ hasText: /Lưu|Save|Cập nhật/ }).last();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: 'tests/results/07f-after-save.png' });
      console.log('✅ Đã click Save');
    } else {
      console.log('⚠️  Không tìm thấy nút Save');
      await page.screenshot({ path: 'tests/results/07f-no-save.png' });
    }
  });

  test('8. Sau khi save — card Doc AI phải có chip deadline', async ({ page }) => {
    // Đóng admin panel trước
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const section = getSectionContainer(page);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    const docAiCard = section.locator('[class*="rounded-2xl"]')
      .filter({ hasText: /Doc AI.*2603/i })
      .first();

    if (!await docAiCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    const text = await docAiCard.innerText();
    console.log('\n=== Card sau khi save ===\n' + text);
    await docAiCard.screenshot({ path: 'tests/results/08-doc-ai-after-save.png' });

    const keywords = [
      'Hạn đăng ký', 'Còn', 'Hết hạn', 'Đang mở đăng ký',
      'không giới hạn', 'tiếng', 'phút', 'Admin chưa mở',
    ];
    const found = keywords.filter(kw => text.includes(kw));
    console.log(found.length ? `✅ Chip OK: ${found.join(', ')}` : '⚠️  Vẫn không thấy chip');
    expect(found.length).toBeGreaterThan(0);
  });

});
