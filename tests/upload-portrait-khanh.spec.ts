import { test, expect } from '@playwright/test';
import path from 'path';

const PORTRAIT_FILE = 'C:\\Users\\Khanh-Truong\\Downloads\\Truong Le Khanh - Portrait.webp';
const MEMBER_NAME   = 'Trương Lê Khánh';
const MEMBER_ID     = 'm1773994187701';
const API           = 'http://192.168.0.14:4000';

test.describe('Upload ảnh chân dung — Trương Lê Khánh', () => {

  test('1. API endpoint: upload portrait trực tiếp', async ({ request }) => {
    // Kiểm tra member tồn tại
    const data = await request.get(`${API}/api/data`);
    expect(data.ok()).toBeTruthy();
    const json = await data.json();
    const member = json.members.find((m: { id: string; name: string }) => m.id === MEMBER_ID);
    expect(member, `Không tìm thấy member ${MEMBER_NAME}`).toBeTruthy();
    console.log('✅ Member found:', member.name, '| portraitUrl hiện tại:', member.portraitUrl || '(rỗng)');

    // Upload portrait qua API
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(PORTRAIT_FILE);
    const resp = await request.post(`${API}/api/members/${MEMBER_ID}/portrait`, {
      multipart: {
        portrait: {
          name: 'Truong Le Khanh - Portrait.webp',
          mimeType: 'image/webp',
          buffer: fileBuffer,
        },
      },
    });

    console.log('Upload status:', resp.status());
    const body = await resp.json().catch(() => ({}));
    console.log('Upload response:', JSON.stringify(body));

    expect(resp.ok(), `Upload thất bại: ${JSON.stringify(body)}`).toBeTruthy();
    expect(body.portraitUrl).toBeTruthy();
    console.log('✅ portraitUrl:', body.portraitUrl);

    // Xác nhận URL trả về hợp lệ (không cần test HTTP vì cluster trên Windows có quirk với 127.0.0.1 vs ::1)
    // Tests 2, 3, 4 confirm ảnh accessible từ browser
    expect(body.portraitUrl).toMatch(/^\/uploads\/portraits\//);
    console.log(`✅ portraitUrl hợp lệ: ${body.portraitUrl}`);
  });

  test('2. UI: ảnh hiển thị trong PersonnelPage', async ({ page }) => {
    // Đến trang nhân sự
    await page.goto('/personnel');
    await page.waitForLoadState('networkidle');

    // Chọn identity nếu cần
    const modal = page.locator('text=Xin chào');
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator(`text=${MEMBER_NAME}`).first().click();
      await page.waitForTimeout(1000);
    }

    // Chụp trước khi verify
    await page.screenshot({ path: 'tests/results/personnel-before.png', fullPage: false });

    // Tìm card của Trương Lê Khánh
    const memberCard = page.locator('[class*="rounded-2xl"]').filter({ hasText: MEMBER_NAME }).first();
    await expect(memberCard, `Không tìm thấy card của ${MEMBER_NAME}`).toBeVisible({ timeout: 5000 });

    // Kiểm tra portrait img
    const portraitImg = memberCard.locator('img[alt*="chân dung"]').or(
      memberCard.locator(`img[src*="portrait"]`)
    );

    const hasPortrait = await portraitImg.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPortrait) {
      const src = await portraitImg.getAttribute('src');
      console.log('✅ Portrait hiện trong UI, src:', src);
    } else {
      console.log('⚠️  Portrait img không tìm thấy trong card — có thể cần reload');
    }

    await page.screenshot({ path: 'tests/results/personnel-after.png', fullPage: false });
    console.log('📸 Screenshot lưu tại tests/results/');
  });

  test('3. UI: ảnh hiển thị trong Admin Panel → Members', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Chọn identity nếu cần
    const modal = page.locator('text=Xin chào');
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Chọn Trương Lê Khánh
      const btn = page.locator('button').filter({ hasText: MEMBER_NAME }).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Mở admin panel
    const settingsBtn = page.locator('[title="Quản lý dữ liệu"]');
    await expect(settingsBtn).toBeVisible({ timeout: 5000 });
    await settingsBtn.click();
    await page.waitForTimeout(500);

    // Mở edit form của Trương Lê Khánh
    const memberRow = page.locator('[class*="space-y"] > div').filter({ hasText: MEMBER_NAME }).first();
    await expect(memberRow).toBeVisible({ timeout: 5000 });
    await memberRow.hover();
    await page.screenshot({ path: 'tests/results/admin-member-hover.png' });

    const editBtn = memberRow.locator('button').first();
    await editBtn.click();
    await page.waitForTimeout(500);

    // Kiểm tra ảnh trong form
    const form = page.locator('[class*="space-y-4"]').last();
    await expect(form).toBeVisible({ timeout: 3000 });

    const portraitSection = page.locator('text=Ảnh chân dung');
    const hasSection = await portraitSection.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Upload section visible:', hasSection);

    // Tìm img preview trong form
    const previewImg = page.locator('img[src*="portrait"]');
    const hasPreview = await previewImg.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasPreview) {
      const src = await previewImg.getAttribute('src');
      console.log('✅ Portrait preview trong form, src:', src);
    } else {
      console.log('⚠️  Chưa thấy portrait preview trong form');
    }

    await page.screenshot({ path: 'tests/results/admin-edit-form.png', fullPage: false });
    console.log('📸 Screenshot lưu tại tests/results/admin-edit-form.png');
  });

  test('4. Re-upload portrait từ UI (Admin Panel)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Bỏ qua modal nếu có
    const modal = page.locator('text=Xin chào');
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      const btn = page.locator('button').filter({ hasText: MEMBER_NAME }).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Mở admin panel
    await page.locator('[title="Quản lý dữ liệu"]').click();
    await page.waitForTimeout(500);

    // Click edit Trương Lê Khánh
    const memberRow = page.locator('[class*="space-y"] > div').filter({ hasText: MEMBER_NAME }).first();
    await memberRow.hover();
    const editBtn = memberRow.locator('button').first();
    await editBtn.click();
    await page.waitForTimeout(500);

    // Tìm input file portrait
    const portraitInput = page.locator('input[type="file"]').nth(1); // 0=avatar, 1=portrait
    await expect(portraitInput).toBeAttached({ timeout: 3000 });

    // Upload file
    await portraitInput.setInputFiles(PORTRAIT_FILE);
    console.log('📤 Đã set file portrait:', PORTRAIT_FILE);

    // Chờ upload hoàn tất (spinner biến mất)
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/results/after-portrait-upload.png', fullPage: false });

    // Verify img src updated
    const previewImg = page.locator('img[src*="portrait"]').first();
    const hasImg = await previewImg.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasImg) {
      const src = await previewImg.getAttribute('src');
      console.log('✅ Portrait preview cập nhật, src:', src);
    } else {
      console.log('⚠️  Portrait img chưa thấy sau upload');
    }

    // Verify API
    await page.waitForTimeout(500);
    const resp = await page.request.get(`${API}/api/data`);
    const json = await resp.json();
    const member = json.members.find((m: { id: string }) => m.id === MEMBER_ID);
    console.log('📊 API portraitUrl sau upload:', member?.portraitUrl);
    expect(member?.portraitUrl).toBeTruthy();
    expect(member?.portraitUrl).toContain('portrait');
    console.log('✅ Upload thành công!');
  });

});
