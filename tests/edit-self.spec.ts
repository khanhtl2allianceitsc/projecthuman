import { test, expect } from '@playwright/test';

const MEMBER_NAME = 'Trương Lê Khánh';

test('Edit self button — mở form chỉnh sửa từ Header', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Chọn identity nếu cần
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

  // Xác nhận user badge hiển thị
  const userBadge = page.locator(`text=${MEMBER_NAME}`).first();
  await expect(userBadge).toBeVisible({ timeout: 5000 });
  console.log('✅ User badge hiện:', MEMBER_NAME);
  await page.screenshot({ path: 'tests/results/edit-self-01-badge.png' });

  // Click nút edit (Pencil icon)
  const editBtn = page.locator('button[title="Chỉnh sửa hồ sơ"]');
  await expect(editBtn).toBeVisible({ timeout: 3000 });
  await editBtn.click();
  console.log('✅ Clicked edit self button');

  // Modal mở
  const formModal = page.locator('text=Chỉnh sửa hồ sơ');
  await expect(formModal).toBeVisible({ timeout: 3000 });
  console.log('✅ Modal mở thành công');
  await page.screenshot({ path: 'tests/results/edit-self-02-modal.png' });

  // Kiểm tra form có các field — scope vào trong modal
  const editModal = page.locator('[class*="fixed"][class*="inset-0"]').last();
  const nameInput = editModal.locator('input').first();
  await expect(nameInput).toBeVisible({ timeout: 2000 });
  const nameValue = await nameInput.inputValue();
  console.log('✅ Name field:', nameValue);
  expect(nameValue, 'Tên phải được pre-fill từ member data').toBeTruthy();

  // Scroll xuống để thấy phần upload ảnh
  await editModal.locator('text=Ảnh nhân sự').scrollIntoViewIfNeeded().catch(() => {});
  const avatarSection = page.locator('text=Ảnh nhân sự');
  await expect(avatarSection).toBeVisible({ timeout: 3000 });
  console.log('✅ Upload section "Ảnh nhân sự" hiện');

  const portraitSection = page.locator('text=Ảnh chân dung');
  await expect(portraitSection).toBeVisible({ timeout: 2000 });
  console.log('✅ Portrait upload section hiện');

  // Đổi tên thử rồi cancel
  await nameInput.fill(nameValue + ' ');
  await nameInput.fill(nameValue); // restore
  const cancelBtn = page.locator('button', { hasText: 'Huỷ' });
  await cancelBtn.click();
  await expect(formModal).not.toBeVisible({ timeout: 2000 });
  console.log('✅ Modal đóng khi click Huỷ');

  await page.screenshot({ path: 'tests/results/edit-self-03-closed.png' });
  console.log('🎉 Tất cả pass!');
});
