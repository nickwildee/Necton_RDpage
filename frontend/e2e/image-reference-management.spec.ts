import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const superAdminEmail = 'e2e-super-admin@example.com'
const password = 'S3cure!Passphrase-7746'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(superAdminEmail)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page).toHaveURL('/intro')
}

test('Document Image 소분류를 선택하고 이미지를 등록한다', async ({
  page,
}) => {
  await login(page)
  await page.goto('/intro/settings')

  const valueHeader = page
    .getByRole('heading', { name: 'Logo', exact: true })
    .locator('xpath=ancestor::header')

  await expect(
    valueHeader.getByText('Raster image', { exact: true }),
  ).toBeVisible()
  await expect(
    valueHeader.getByText('Organization identity', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('소분류를 선택하면 등록 이미지를 확인할 수 있습니다.'),
  ).toBeVisible()

  await page
    .getByRole('row', {
      name: /국가안보기관로고 국가안보실/,
    })
    .click()

  await expect(
    page.getByRole('heading', {
      name: '국가안보기관로고 이미지',
    }),
  ).toBeVisible()
  await expect(
    page.getByText('등록된 이미지가 없습니다. 첫 이미지를 등록해 주세요.'),
  ).toBeVisible()

  await page
    .getByRole('button', {
      name: '국가안보기관로고 이미지 접기',
    })
    .click()
  await expect(
    page.getByRole('button', { name: '+ 이미지 등록' }),
  ).toBeHidden()
  await expect(
    page.getByText('등록된 이미지가 없습니다. 첫 이미지를 등록해 주세요.'),
  ).toBeHidden()

  await page
    .getByRole('row', {
      name: /군기관로고 국방부/,
    })
    .click()
  await expect(
    page.getByRole('button', {
      name: '군기관로고 이미지 접기',
    }),
  ).toHaveAttribute('aria-expanded', 'true')
  await expect(
    page.getByRole('button', { name: '+ 이미지 등록' }),
  ).toBeVisible()

  await page
    .getByRole('row', {
      name: /국가안보기관로고 국가안보실/,
    })
    .click()
  await page
    .getByRole('button', {
      name: '국가안보기관로고 이미지 접기',
    })
    .waitFor()

  await page.getByRole('button', { name: '+ 이미지 등록' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: '대통령경호처 로고.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  })
  await page
    .getByPlaceholder('이미지의 의미와 사용처를 입력해 주세요.')
    .fill('대통령경호처 공식 로고')
  await page.getByRole('button', { name: '등록', exact: true }).click()

  await expect(page.getByText('대통령경호처 로고.png')).toBeVisible()

  await page
    .getByRole('button', {
      name: '대통령경호처 로고.png 설명 수정',
    })
    .click()
  await page
    .getByPlaceholder('이미지의 의미와 사용처를 입력해 주세요.')
    .fill('수정된 대통령경호처 공식 로고')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await expect(
    page.getByText('수정된 대통령경호처 공식 로고'),
  ).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', {
      name: '대통령경호처 로고.png 비활성화',
    })
    .click()
  await expect(
    page.getByText('등록된 이미지가 없습니다. 첫 이미지를 등록해 주세요.'),
  ).toBeVisible()
})
