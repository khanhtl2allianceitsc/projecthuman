/**
 * Test E2E: Man Month — edit & persist sau reload
 *
 * Flow:
 *  1. API smoke: PATCH manMonth → GET /api/data → verify field returned
 *  2. UI: navigate to /personnel → value hiển thị đúng
 *  3. UI edit (admin): login → hover → click edit → chip → Enter → reload → verify còn giá trị
 */

import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const BASE     = 'http://192.168.0.14:5173';
const API_BASE = 'http://192.168.0.14:3001';
const API_LOCAL = 'http://localhost:3001'; // cho localhost-only endpoints
const TEST_MM  = 15_000_000; // 15tr — tier "Senior"

type Member = { id: string; name: string; role?: string; color?: string; avatar?: string; manMonth?: number; isAdmin?: boolean };

// ─── helpers ───────────────────────────────────────────────────────────────

/** Lấy member đầu tiên từ API */
async function getFirstMember(request: APIRequestContext): Promise<Member> {
  const res = await request.get(`${API_BASE}/api/data`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.members.length).toBeGreaterThan(0);
  return data.members[0] as Member;
}

/** Lấy admin member đầu tiên từ API */
async function getFirstAdminMember(request: APIRequestContext): Promise<Member | null> {
  const res = await request.get(`${API_BASE}/api/data`);
  const data = await res.json();
  return (data.members as Member[]).find(m => m.isAdmin) ?? null;
}

/**
 * Login qua WhoAreYouModal UI (click button chứa tên member).
 * Nếu modal không xuất hiện (đã có identity), bỏ qua.
 */
async function loginViaModal(page: Page, memberName: string) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const modal = page.locator('h2:has-text("Xin chào")');
  if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Tìm button chứa tên member trong modal
    const memberBtn = page.locator('button').filter({ hasText: memberName }).first();
    if (await memberBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await memberBtn.click();
    } else {
      // Fallback: click member đầu tiên có avatar
      const firstRow = page.locator('button')
        .filter({ has: page.locator('[style*="background"]') })
        .first();
      await firstRow.click().catch(async () => { await page.keyboard.press('Enter'); });
    }
    await page.waitForTimeout(800);
  }
}

/**
 * Set identity via browser context (page.request) — IP của browser và server khớp nhau.
 */
async function setIdentityViaBrowser(page: Page, memberId: string) {
  const res = await page.request.post(`${API_BASE}/api/identity`, {
    data: { memberId },
    headers: { 'Content-Type': 'application/json' },
  });
  return res.ok();
}

/**
 * Cấp quyền admin — dùng localhost:3001 vì endpoint yêu cầu IP 127.0.0.1.
 * Chỉ hoạt động khi test runner chạy trên cùng máy với server.
 */
async function ensureAdminViaLocalhost(request: APIRequestContext, memberId: string) {
  const res = await request.patch(`${API_LOCAL}/api/members/${memberId}/admin`, {
    data: { isAdmin: true },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) {
    console.warn(`  ⚠️  Admin elevation failed (${res.status()}): ${await res.text()}`);
  }
  return res.ok();
}

// ════════════════════════════════════════════════════════════════════════════

test.describe('Man Month — persist sau reload', () => {

  // ── TEST 1: API chỉ ──────────────────────────────────────────────────────
  test('1. API smoke: PATCH manMonth → GET /api/data phải trả về đúng giá trị', async ({ request }) => {
    const member = await getFirstMember(request);
    console.log(`\n🔍 Member: ${member.name} (${member.id})`);
    console.log(`   manMonth hiện tại: ${member.manMonth ?? 'chưa set'}`);

    // PATCH manMonth
    const patch = await request.patch(`${API_BASE}/api/members/${member.id}`, {
      data: {
        name:     member.name,
        role:     member.role ?? '',
        color:    member.color ?? '#6366f1',
        avatar:   member.avatar ?? '',
        manMonth: TEST_MM,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`   PATCH status: ${patch.status()}`);
    const patchBody = await patch.text();
    expect(patch.ok(), `PATCH failed (${patch.status()}): ${patchBody}`).toBeTruthy();

    // GET lại để verify DB đã lưu
    const res2 = await request.get(`${API_BASE}/api/data`);
    const data2 = await res2.json();
    const updated = (data2.members as Member[]).find(m => m.id === member.id);
    console.log(`   manMonth sau PATCH: ${updated?.manMonth}`);
    // PostgreSQL BIGINT được pg trả về dạng string — dùng Number() để so sánh
    expect(Number(updated?.manMonth), 'manMonth KHÔNG được lưu vào DB — đây là bug!').toBe(TEST_MM);
  });

  // ── TEST 2: Hiển thị trên UI ─────────────────────────────────────────────
  test('2. UI: /personnel hiển thị đúng giá trị sau khi set qua API', async ({ page, request }) => {
    const member = await getFirstMember(request);

    // Set manMonth via API (idempotent)
    await request.patch(`${API_BASE}/api/members/${member.id}`, {
      data: { name: member.name, role: member.role ?? '', color: member.color ?? '#6366f1', avatar: member.avatar ?? '', manMonth: TEST_MM },
      headers: { 'Content-Type': 'application/json' },
    });

    // Navigate thẳng tới /personnel
    await page.goto(`${BASE}/personnel`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/results/mm-01-personnel-page.png', fullPage: true });

    // Tìm tên member trên trang
    const memberName = page.locator(`text=${member.name}`).first();
    await expect(memberName, `Không tìm thấy member "${member.name}" trên trang`).toBeVisible();

    // Giá trị compact 15_000_000 → "15 Tr" hoặc "15tr" (tuỳ format)
    const valueText = page.locator('text=/15[\u00a0\s]?[Tt]r/').first();
    await expect(valueText, 'Không thấy giá trị 15Tr trên trang /personnel').toBeVisible({ timeout: 5000 });
    console.log(`\n✅ Giá trị "15 Tr" hiển thị đúng trên /personnel`);
  });

  // ── TEST 3: Inline edit → reload → verify ───────────────────────────────
  test('3. UI edit inline: admin hover → edit → save → reload → giá trị vẫn còn', async ({ page, request }) => {
    // 3a. Tìm admin member (hoặc tạo admin từ member đầu tiên)
    let adminMember = await getFirstAdminMember(request);

    if (!adminMember) {
      // Không có admin → thử cấp quyền cho member đầu tiên qua localhost
      const first = await getFirstMember(request);
      const elevated = await ensureAdminViaLocalhost(request, first.id);
      if (elevated) {
        adminMember = first;
        console.log(`\n👤 Đã cấp admin cho: ${first.name}`);
      } else {
        // Không cấp được → bỏ qua test này
        test.skip(true, 'Không tìm được admin member và không thể cấp quyền từ localhost');
        return;
      }
    } else {
      console.log(`\n👤 Admin sẵn có: ${adminMember.name}`);
    }

    // Reset manMonth về 0 để test rõ ràng (verify giá trị mới, không phải tồn dư cũ)
    await request.patch(`${API_BASE}/api/members/${adminMember.id}`, {
      data: { name: adminMember.name, role: adminMember.role ?? '', color: adminMember.color ?? '#6366f1', avatar: adminMember.avatar ?? '', manMonth: 0 },
      headers: { 'Content-Type': 'application/json' },
    });

    // 3b. Set identity qua browser (IP của browser = IP của request subsequent)
    const identityOk = await setIdentityViaBrowser(page, adminMember.id);
    console.log(`   Identity set: ${identityOk}`);

    // 3c. Load /personnel
    await page.goto(`${BASE}/personnel`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/results/mm-02-before-edit.png' });

    // 3d. Verify admin badge (gear icon "Quản lý dữ liệu" trên header)
    const gearBtn = page.locator('button[title="Quản lý dữ liệu"]');
    const hasAdmin = await gearBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasAdmin) {
      // Modal có thể chưa dismiss — thử login qua modal
      const modal = page.locator('h2:has-text("Xin chào")');
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        const memberBtn = page.locator('button').filter({ hasText: adminMember.name }).first();
        await memberBtn.click().catch(async () => { await page.keyboard.press('Enter'); });
        await page.waitForTimeout(800);
        await page.goto(`${BASE}/personnel`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
      }
    }

    // 3e. Tìm row của admin member, scroll và hover
    // Tất cả member rows đều dùng rounded-2xl trong bar-view
    const adminRow = page.locator('[class*="rounded-2xl"]')
      .filter({ hasText: adminMember.name })
      .first();
    await adminRow.scrollIntoViewIfNeeded();
    await adminRow.hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/results/mm-03-hovered.png' });

    // 3f. Click nút edit (scoped vào adminRow để tránh nhầm)
    const editBtn = adminRow.locator('button[title="Chỉnh sửa Man Month"]');
    const editVisible = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!editVisible) {
      // Log content của adminRow để debug
      const rowText = await adminRow.textContent().catch(() => 'N/A');
      await page.screenshot({ path: 'tests/results/mm-03b-no-edit-btn.png', fullPage: true });
      throw new Error(`Nút "Chỉnh sửa Man Month" không hiển thị trong row "${adminMember.name}". Row text: ${rowText}`);
    }
    await editBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'tests/results/mm-04-editing.png' });

    // 3g. Chọn chip 15tr trong adminRow
    const chip15 = adminRow.locator('button').filter({ hasText: /^15tr$/ });
    if (await chip15.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chip15.click();
      await page.waitForTimeout(300); // đợi React state update + re-render
      console.log('   ✅ Click chip 15tr');
    } else {
      // Fallback: gõ tay vào input trong adminRow
      const numInput = adminRow.locator('input[inputmode="numeric"]');
      await numInput.fill('15000000');
      console.log('   ✅ Nhập tay 15000000');
    }

    // 3h. Click nút ✓ trong adminRow (scoped để tránh nhầm)
    const checkBtnInRow = adminRow.locator('button.text-green-400').first();
    if (await checkBtnInRow.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkBtnInRow.click();
      console.log('   ✅ Click nút ✓ (Check button in row)');
    } else {
      // Fallback: press Enter
      await page.keyboard.press('Enter');
      console.log('   ✅ Press Enter (fallback)');
    }
    await page.waitForTimeout(2000); // đợi PATCH API hoàn thành

    // 3i. Verify qua API ngay sau save (trước reload) để confirm PATCH đã chạy
    const apiAfterSave = await request.get(`${API_BASE}/api/data`);
    const jsonAfterSave = await apiAfterSave.json();
    const memberAfterSave = (jsonAfterSave.members as Member[]).find(m => m.id === adminMember!.id);
    console.log(`   API manMonth sau save (trước reload): ${memberAfterSave?.manMonth}`);
    expect(memberAfterSave?.manMonth, 'PATCH API không lưu manMonth — bug ở API hoặc DataContext').toBe(TEST_MM);
    await page.screenshot({ path: 'tests/results/mm-05-after-save.png' });
    console.log('   ✅ API đã lưu manMonth 15000000 thành công');

    // ── RELOAD ──────────────────────────────────────────────────────────────
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tests/results/mm-06-after-reload.png', fullPage: true });

    // 3j. Kiểm tra after reload qua API
    const apiAfterReload = await request.get(`${API_BASE}/api/data`);
    const jsonAfterReload = await apiAfterReload.json();
    const memberAfterReload = (jsonAfterReload.members as Member[]).find(m => m.id === adminMember!.id);
    console.log(`   API manMonth sau reload: ${memberAfterReload?.manMonth}`);
    expect(memberAfterReload?.manMonth, '❌ BUG: Giá trị biến mất sau reload — DB không persisted!').toBe(TEST_MM);
    console.log('   ✅ Giá trị "15 Tr" vẫn persist sau reload — persist OK!');
  });

});
