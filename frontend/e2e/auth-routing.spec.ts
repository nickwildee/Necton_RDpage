import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const userEmail = 'e2e-user@example.com'
const superAdminEmail = 'e2e-super-admin@example.com'
const password = 'S3cure!Passphrase-7746'

async function login(page: Page, email = userEmail, userPassword = password) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(userPassword)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
}

test('비로그인 사용자는 로그인 페이지로 이동한다', async ({ page }) => {
  await page.goto('/intro')
  await expect(page).toHaveURL('/login')
})

test('등록된 사용자는 로그인 후 인트로 페이지로 이동한다', async ({ page }) => {
  await login(page)

  await expect(page).toHaveURL('/intro')
  await expect(page.getByRole('link', { name: '설정' })).toHaveCount(0)

  await page.reload()

  await expect(page).toHaveURL('/intro')
  await expect(page.getByRole('link', { name: '마이페이지' })).toContainText(
    userEmail,
  )
})

test('잘못된 비밀번호로 로그인하면 오류를 표시한다', async ({ page }) => {
  await login(page, userEmail, 'wrong-password')

  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('alert')).toContainText(
    '이메일 또는 비밀번호가 올바르지 않습니다.',
  )
})

test('로그아웃하면 세션이 제거되고 보호 페이지에 접근할 수 없다', async ({
  page,
}) => {
  await login(page)
  await expect(page).toHaveURL('/intro')

  await page.getByRole('button', { name: '로그아웃' }).click()

  await expect(page).toHaveURL('/login')

  await page.goto('/intro')
  await expect(page).toHaveURL('/login')
})

test('회원가입한 사용자는 새 계정으로 로그인할 수 있다', async ({ page }) => {
  const signupEmail = `e2e-signup-${Date.now()}@example.com`

  await page.goto('/signup')
  await page.getByLabel('이메일').fill(signupEmail)
  await page.getByLabel(/^비밀번호\s*\*?$/).fill(password)
  await page.getByLabel('비밀번호 확인').fill(password)
  await page.getByLabel('닉네임').fill('새 E2E 사용자')
  await page.getByLabel('핸드폰 번호').fill('01012345678')
  await page.getByLabel('회사명').fill('E2E Company')
  await page.getByRole('button', { name: '가입하기' }).click()

  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('status')).toContainText(
    '회원가입이 완료되었습니다.',
  )
  await expect(page.getByLabel('이메일')).toHaveValue(signupEmail)

  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인', exact: true }).click()

  await expect(page).toHaveURL('/intro')
  await expect(page.getByRole('link', { name: '마이페이지' })).toContainText(
    signupEmail,
  )
})

test('SUPER_ADMIN에게만 설정 메뉴가 표시된다', async ({ page }) => {
  await login(page, superAdminEmail)

  await expect(page).toHaveURL('/intro')
  await expect(page.getByRole('link', { name: '설정' })).toBeVisible()
})
