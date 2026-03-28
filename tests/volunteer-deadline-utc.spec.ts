/**
 * Test: Hạn đăng ký Lead — kiểm tra UTC storage & local display
 *
 * Mục tiêu:
 *   1. User nhập giờ local (VN +07) trong form edit
 *   2. DB lưu đúng UTC
 *   3. Form mở lại hiển thị đúng giờ local (pre-fill)
 *   4. Card ngoài trang chủ hiển thị đúng giờ local
 *
 * Project: "Doc AI - Upgrade 2603"
 * Base URL: http://192.168.0.14:5173
 * API:      http://192.168.0.14:3001
 */

import { test, expect, type Page } from '@playwright/test';

const BASE        = 'http://192.168.0.14:5173';
const API         = 'http://192.168.0.14:3001';
const PROJECT_NAME = 'Doc AI - Upgrade 2603';

// ─── Timezone helpers ─────────────────────────────────────────────────────────

/** Offset phút của browser (ví dụ: VN = -420, tức UTC+7) */
const TZ_OFFSET_MIN = new Date().getTimezoneOffset(); // âm = ahead of UTC
const TZ_OFFSET_MS  = TZ_OFFSET_MIN * 60 * 1000;

/** Tạo một deadline cố định: ngày mai 20:30 local */
function makeTestDeadline() {
  const local = new Date();
  local.setDate(local.getDate() + 1);
  local.setHours(20, 30, 0, 0);

  const pad = (n: number) => String(n).padStart(2, '0');
  // Dạng datetime-local: "YYYY-MM-DDTHH:MM"
  const localStr  = `${local.getFullYear()}-${pad(local.getMonth()+1)}-${pad(local.getDate())}T20:30`;
  // UTC tương ứng
  const utcDate   = new Date(local.getTime());
  const utcStr    = utcDate.toISOString(); // "...Z"

  // Label hiển thị kỳ vọng trên card (vi-VN)
  const displayDate = local.toLocaleDateString('vi-VN');  // "21/3/2026"
  const displayTime = local.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); // "20:30"

  return { localStr, utcStr, utcDate, displayDate, displayTime };
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

async function dismissModal(page: Page) {
  const modal = page.locator('h2:has-text("Xin chào")');
  if (!await modal.isVisible({ timeout: 4000 }).catch(() => false)) return;
  // Click member đầu tiên trong danh sách
  const firstBtn = page.locator('div.space-y-1\\.5, div.space-y-2')
    .locator('button')
    .first();
  await firstBtn.click().catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(1000);
  // Đảm bảo modal đã đóng
  await page.locator('h2:has-text("Xin chào")').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}

async function openAdminProjectsTab(page: Page) {
  const gear = page.locator('button[title="Quản lý dữ liệu"]');
  await gear.waitFor({ state: 'visible', timeout: 6000 });
  await gear.click();
  await expect(page.locator('h2:has-text("Quản lý dữ liệu")')).toBeVisible();
  await page.getByRole('button', { name: 'Dự án', exact: true }).click();
  await page.waitForTimeout(400);
}

async function openEditForm(page: Page) {
  const drawer  = page.locator('div.fixed.top-0.right-0');
  const row     = drawer.locator('div.flex.items-center.gap-3')
    .filter({ hasText: PROJECT_NAME })
    .first();
  await expect(row).toBeVisible({ timeout: 5000 });
  await row.locator('xpath=..').locator('button').first().click();
  await page.waitForTimeout(700);
}

async function scrollToDeadlineSection(page: Page) {
  const heading = page.locator('span.text-amber-400:has-text("Xung phong Lead")');
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Hạn đăng ký Lead — UTC storage & local display', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissModal(page);
  });

  // ── T1: Nhập giờ local → DB lưu UTC đúng ──────────────────────────────────
  test('T1: Nhập deadline local → lưu UTC vào DB', async ({ page }) => {
    const { localStr, utcDate } = makeTestDeadline();
    console.log(`\n📅 Local input : ${localStr}`);
    console.log(`🌍 Expected UTC: ${utcDate.toISOString()}`);
    console.log(`🕐 TZ offset   : UTC${TZ_OFFSET_MIN <= 0 ? '+' : ''}${-TZ_OFFSET_MIN/60}h`);

    // 1. Mở form edit
    await openAdminProjectsTab(page);
    await openEditForm(page);
    await scrollToDeadlineSection(page);

    // 2. Bật toggle nếu chưa bật
    const toggle = page.locator('label')
      .filter({ hasText: 'Mở đăng ký xung phong Lead' })
      .locator('div').first();
    await expect(toggle).toBeVisible({ timeout: 3000 });
    const isOn = await toggle.evaluate(el => el.className.includes('bg-amber'));
    if (!isOn) { await toggle.click(); await page.waitForTimeout(300); }

    // 3. Nhập deadline
    const input = page.locator('input[type="datetime-local"]');
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill(localStr);
    await page.screenshot({ path: 'tests/results/t1-input-filled.png' });
    console.log(`✅ Đã nhập: ${await input.inputValue()}`);

    // 4. Save
    await page.locator('button').filter({ hasText: /Lưu|Cập nhật|Save/ }).last().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/results/t1-after-save.png' });

    // 5. Kiểm tra DB qua API — phải là UTC
    const apiData = await page.evaluate(async (api) => {
      const r = await fetch(`${api}/api/data`);
      return r.json();
    }, API);

    const project = apiData.projects.find((p: { name: string }) => p.name === PROJECT_NAME);
    expect(project, 'Không tìm thấy project trong API').toBeTruthy();

    const storedDeadline = project.volunteerDeadline;
    console.log(`\n📦 API trả về  : ${storedDeadline}`);
    expect(storedDeadline, 'API phải trả UTC string kết thúc bằng Z').toMatch(/Z$/);

    // So sánh UTC timestamp (trong vòng ±60s để tránh giây lẻ)
    const storedMs  = new Date(storedDeadline).getTime();
    const expectedMs = utcDate.getTime();
    const diffSec   = Math.abs(storedMs - expectedMs) / 1000;
    console.log(`⏱  Diff        : ${diffSec}s`);
    expect(diffSec, `UTC lệch ${diffSec}s — phải < 60s`).toBeLessThan(60);

    console.log('✅ T1 PASS — DB lưu đúng UTC');
  });

  // ── T2: Form mở lại → deadline pre-fill đúng giờ local ────────────────────
  test('T2: Mở lại form edit → deadline hiện đúng giờ local', async ({ page }) => {
    const { localStr } = makeTestDeadline();

    // Đảm bảo T1 đã chạy (có deadline trong DB) — nếu chưa, set lại
    await openAdminProjectsTab(page);
    await openEditForm(page);
    await scrollToDeadlineSection(page);

    const input = page.locator('input[type="datetime-local"]');
    await expect(input).toBeVisible({ timeout: 2000 });

    const prefilled = await input.inputValue();
    console.log(`\n🔍 Pre-fill trong form: "${prefilled}"`);
    console.log(`📅 Kỳ vọng local      : "${localStr}"`);

    // Pre-fill phải là giờ local (không phải UTC, không rỗng)
    expect(prefilled, 'Trường deadline không được rỗng').not.toBe('');
    expect(prefilled, 'Pre-fill không được là UTC string').not.toMatch(/Z$/);

    // Parse cả hai và so sánh minutes (trong vòng ±1 phút)
    const prefilledMs = new Date(prefilled).getTime();
    const expectedMs  = new Date(localStr).getTime();
    const diffMin = Math.abs(prefilledMs - expectedMs) / 60000;
    console.log(`⏱  Diff: ${diffMin.toFixed(1)} phút`);
    expect(diffMin, `Giờ local lệch ${diffMin.toFixed(1)} phút — phải < 2`).toBeLessThan(2);

    await page.screenshot({ path: 'tests/results/t2-prefill.png' });
    console.log('✅ T2 PASS — form pre-fill đúng giờ local');
  });

  // ── T3: Card ngoài trang chủ → hiển thị đúng giờ local ───────────────────
  test('T3: Card "Dự án cần Lead" → chip hiển thị đúng giờ local', async ({ page }) => {
    const { displayDate, displayTime } = makeTestDeadline();
    const expectedChip = `Hạn đăng ký: ${displayDate} ${displayTime}`;
    console.log(`\n🔎 Kỳ vọng chip: "${expectedChip}"`);

    // Đóng admin panel (nếu mở) và scroll tới section
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const section = page.locator('h3:has-text("Dự án cần Lead")');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Tìm card
    const card = page.locator('[class*="rounded-2xl"]')
      .filter({ hasText: PROJECT_NAME })
      .first();
    await expect(card).toBeVisible({ timeout: 5000 });
    await card.scrollIntoViewIfNeeded();

    const cardText = await card.innerText();
    console.log(`\n📋 Nội dung card:\n${cardText}`);
    await card.screenshot({ path: 'tests/results/t3-card.png' });

    // Chip phải chứa ngày + giờ local
    expect(cardText, `Không thấy "${expectedChip}"`).toContain(expectedChip);
    console.log('✅ T3 PASS — chip hiển thị đúng giờ local');
  });

  // ── T4: Full flow tổng hợp + bảng so sánh ────────────────────────────────
  test('T4: Full flow — input → UTC stored → local displayed', async ({ page }) => {
    const dl = makeTestDeadline();
    console.log('\n══════════════════════════════════════');
    console.log('  FULL FLOW: Hạn đăng ký Lead');
    console.log('══════════════════════════════════════');
    console.log(`  User nhập (local) : ${dl.localStr}`);
    console.log(`  Kỳ vọng UTC (DB)  : ${dl.utcStr}`);
    console.log(`  Hiển thị card     : Hạn đăng ký: ${dl.displayDate} ${dl.displayTime}`);
    console.log(`  TZ offset         : UTC${TZ_OFFSET_MIN <= 0 ? '+' : ''}${-TZ_OFFSET_MIN/60}h`);
    console.log('══════════════════════════════════════\n');

    // ── STEP 1: Edit + save ──────────────────────────────────────────────────
    await openAdminProjectsTab(page);
    await openEditForm(page);
    await scrollToDeadlineSection(page);

    const toggle = page.locator('label')
      .filter({ hasText: 'Mở đăng ký xung phong Lead' })
      .locator('div').first();
    const isOn = await toggle.evaluate(el => el.className.includes('bg-amber'));
    if (!isOn) { await toggle.click(); await page.waitForTimeout(300); }

    const input = page.locator('input[type="datetime-local"]');
    await input.fill(dl.localStr);
    console.log(`[1/4] ✅ Nhập deadline: ${dl.localStr}`);

    await page.locator('button').filter({ hasText: /Lưu|Cập nhật|Save/ }).last().click();
    await page.waitForTimeout(1500);
    console.log('[2/4] ✅ Đã save');

    // ── STEP 2: Verify DB via API ────────────────────────────────────────────
    const apiData = await page.evaluate(async (api) => {
      const r = await fetch(`${api}/api/data`);
      return r.json();
    }, API);
    const proj = apiData.projects.find((p: { name: string }) => p.name === PROJECT_NAME);
    const stored = proj?.volunteerDeadline ?? '';
    console.log(`[3/4] 📦 DB trả về: ${stored}`);

    expect(stored).toMatch(/Z$/, 'API phải trả UTC (kết thúc Z)');
    const diffSec = Math.abs(new Date(stored).getTime() - dl.utcDate.getTime()) / 1000;
    expect(diffSec).toBeLessThan(60);
    console.log(`       UTC diff: ${diffSec.toFixed(0)}s ✅`);

    // ── STEP 3: Verify card display ──────────────────────────────────────────
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const section = page.locator('h3:has-text("Dự án cần Lead")');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const card = page.locator('[class*="rounded-2xl"]')
      .filter({ hasText: PROJECT_NAME }).first();
    await card.scrollIntoViewIfNeeded();
    const cardText = await card.innerText();
    const expectedChip = `Hạn đăng ký: ${dl.displayDate} ${dl.displayTime}`;
    expect(cardText).toContain(expectedChip);
    await card.screenshot({ path: 'tests/results/t4-card-final.png' });
    console.log(`[4/4] ✅ Chip: "${expectedChip}"`);

    console.log('\n══════════════════════════════════════');
    console.log('  ✅ T4 PASS — Full flow OK!');
    console.log('══════════════════════════════════════');
  });

});
