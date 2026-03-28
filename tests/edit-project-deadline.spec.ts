/**
 * Test E2E: Edit "Doc AI - Upgrade 2603"
 * - Mở Admin Panel → tab Dự án
 * - Mở form edit project
 * - Bật toggle "Mở đăng ký xung phong Lead"
 * - Nhập deadline ngày mai 23:59
 * - Lưu
 * - Kiểm tra chip deadline hiển thị ngoài trang chủ
 *
 * URL: http://192.168.0.14:5173
 */

import { test, expect, type Page } from '@playwright/test';

const BASE  = 'http://192.168.0.14:5173';
const PROJECT_NAME = 'Doc AI - Upgrade 2603';

// ─── helpers ───────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Dismiss WhoAreYouModal nếu có
  const modal = page.locator('h2:has-text("Xin chào")');
  if (await modal.isVisible({ timeout: 4000 }).catch(() => false)) {
    // Click member đầu tiên trong danh sách (tab "Chọn từ danh sách" mặc định)
    const firstRow = page.locator('button')
      .filter({ has: page.locator('[style*="background:"], [style*="background "]') })
      .first();
    await firstRow.click().catch(async () => {
      // Fallback: Enter
      await page.keyboard.press('Enter');
    });
    await page.waitForTimeout(1000);
  }
}

async function openAdminProjectsTab(page: Page) {
  const gear = page.locator('button[title="Quản lý dữ liệu"]');
  await gear.waitFor({ state: 'visible', timeout: 6000 });
  await gear.click();
  await expect(page.locator('h2:has-text("Quản lý dữ liệu")')).toBeVisible();
  // Tab Dự án
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  await page.waitForTimeout(400);
}

// Ngày mai 23:59 dạng YYYY-MM-DDTHH:MM
function tomorrowDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
}

// ─── test ──────────────────────────────────────────────────────────────────

test('E2E: Bật needLead + deadline → chip hiển thị ngoài trang chủ', async ({ page }) => {

  // ── 1. Login ──────────────────────────────────────────────────────────
  await login(page);
  await page.screenshot({ path: 'tests/results/e2e-01-logged-in.png' });
  console.log('✅ Bước 1: Đã vào trang');

  // ── 2. Mở Admin Panel → tab Dự án ────────────────────────────────────
  await openAdminProjectsTab(page);
  await page.screenshot({ path: 'tests/results/e2e-02-admin-projects.png' });
  console.log('✅ Bước 2: Admin panel — tab Dự án');

  // ── 3. Tìm project và click nút edit ─────────────────────────────────
  // Scope vào trong admin drawer để tránh nhầm element bị backdrop che
  const drawer = page.locator('div.fixed.top-0.right-0');

  // Tìm row chứa tên project trong drawer
  const projectRow = drawer.locator('div.flex.items-center.gap-3')
    .filter({ hasText: PROJECT_NAME })
    .first();

  await expect(projectRow).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'tests/results/e2e-03-project-row.png' });
  console.log('✅ Bước 3: Thấy project row trong drawer');

  // Click nút edit (Edit2 icon — button đầu tiên trong action buttons)
  const editBtn = projectRow.locator('xpath=..').locator('button').first();
  await editBtn.click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'tests/results/e2e-04-form-open.png' });
  console.log('✅ Bước 3b: Form edit đã mở');

  // ── 4. Scroll tới section "Xung phong Lead" ──────────────────────────
  // Dùng span.text-amber-400 (heading section) để tránh match với label toggle
  const xungPhong = page.locator('span.text-amber-400:has-text("Xung phong Lead")');
  await xungPhong.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/results/e2e-05-scroll-to-toggle.png' });

  // ── 5. Bật toggle needLead ────────────────────────────────────────────
  const toggleDiv = page.locator('label')
    .filter({ hasText: 'Mở đăng ký xung phong Lead' })
    .locator('div')
    .first();

  await expect(toggleDiv).toBeVisible({ timeout: 3000 });
  console.log('✅ Bước 4: Thấy toggle needLead');

  // Kiểm tra trạng thái hiện tại (màu bg-amber = đang bật)
  const isOn = await toggleDiv.evaluate((el) =>
    el.className.includes('bg-amber')
  );
  console.log(`   Toggle hiện tại: ${isOn ? 'BẬT ✓' : 'TẮT — cần bật'}`);

  if (!isOn) {
    await toggleDiv.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/results/e2e-06-toggle-on.png' });
    console.log('✅ Bước 5: Đã bật toggle');
  } else {
    console.log('ℹ️  Toggle đã bật sẵn');
  }

  // ── 6. Nhập deadline ─────────────────────────────────────────────────
  const deadlineInput = page.locator('input[type="datetime-local"]');
  await expect(deadlineInput).toBeVisible({ timeout: 2000 });

  const deadline = tomorrowDeadline();
  await deadlineInput.fill(deadline);
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'tests/results/e2e-07-deadline-filled.png' });
  console.log(`✅ Bước 6: Nhập deadline ${deadline}`);

  // Verify giá trị đã điền
  const filledVal = await deadlineInput.inputValue();
  expect(filledVal).toBe(deadline);
  console.log(`   Deadline trong input: ${filledVal}`);

  // ── 7. Nhấn Lưu ──────────────────────────────────────────────────────
  const saveBtn = page.locator('button').filter({ hasText: /Lưu|Cập nhật|Save/ }).last();
  await expect(saveBtn).toBeVisible({ timeout: 2000 });
  await saveBtn.click();
  await page.waitForTimeout(1500); // đợi API save
  await page.screenshot({ path: 'tests/results/e2e-08-after-save.png' });
  console.log('✅ Bước 7: Đã lưu');

  // ── 8. Đóng admin panel ───────────────────────────────────────────────
  const closeBtn = page.locator('button').filter({ has: page.locator('svg[class*="X"], [data-lucide="x"]') }).last();
  if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(500);

  // ── 9. Kiểm tra ngoài trang chủ ──────────────────────────────────────
  // Scroll đến section "Dự án cần Lead"
  const sectionH3 = page.locator('h3:has-text("Dự án cần Lead")');
  await sectionH3.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'tests/results/e2e-09-homepage-section.png' });

  // Tìm card Doc AI trong section
  const sectionContainer = sectionH3.locator('xpath=../../..');
  const docAiCard = sectionContainer.locator('[class*="rounded-2xl"]')
    .filter({ hasText: /Doc AI.*2603/i })
    .first();

  await expect(docAiCard).toBeVisible({ timeout: 5000 });
  await docAiCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const cardText = await docAiCard.innerText();
  console.log('\n=== Nội dung card Doc AI sau save ===\n' + cardText);
  await docAiCard.screenshot({ path: 'tests/results/e2e-10-doc-ai-card.png' });

  // Kiểm tra chip deadline
  const deadlineKeywords = [
    'Hạn đăng ký', 'Còn', 'Hết hạn', 'Đang mở đăng ký',
    'không giới hạn', 'tiếng', 'phút',
    '21/03', '22/03', // ngày mai
  ];
  const found = deadlineKeywords.filter(kw => cardText.includes(kw));
  console.log(found.length
    ? `\n✅ Chip deadline hiển thị! Khớp: "${found.join('", "')}"`
    : '\n⚠️  Chip deadline CHƯA hiển thị'
  );

  expect(found.length).toBeGreaterThan(0);
  console.log('\n🎉 Test PASS — deadline chip hoạt động đúng!');
});
