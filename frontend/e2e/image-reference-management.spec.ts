import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const superAdminEmail = 'e2e-super-admin@example.com'
const password = 'S3cure!Passphrase-7746'
const transparentPixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

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

test('수백 장을 불러와도 화면 주변 이미지만 렌더링한다', async ({
  page,
}) => {
  const totalItems = 300
  const pageSize = 12

  await page.route(
    '**/api/settings/image-references/?**',
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      const requestUrl = new URL(route.request().url())
      if (requestUrl.searchParams.get('valueId') !== '11') {
        await route.continue()
        return
      }

      const currentPage = Number(
        requestUrl.searchParams.get('page') ?? '1',
      )
      const firstId = (currentPage - 1) * pageSize + 1
      const lastId = Math.min(firstId + pageSize - 1, totalItems)
      const items = Array.from(
        { length: Math.max(0, lastId - firstId + 1) },
        (_, index) => {
          const id = firstId + index
          return {
            id,
            valueId: 11,
            originName: `참조 이미지 ${id}.png`,
            storedName: `${id}.png`,
            description: `가상화 검증 이미지 ${id}`,
            registeredAt: '2026-07-30T00:00:00+09:00',
            updatedAt: '2026-07-30T00:00:00+09:00',
            fileUrl: transparentPixel,
          }
        },
      )

      await route.fulfill({
        json: {
          items,
          pagination: {
            page: currentPage,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
          },
        },
      })
    },
  )

  await login(page)
  await page.goto('/intro/settings')
  await page
    .getByRole('row', {
      name: /국가안보기관로고 국가안보실/,
    })
    .click()

  const carousel = page.getByLabel(
    '국가안보기관로고 등록 이미지',
  )
  const progress = page.getByText(/\d+ \/ 300개 불러옴/)

  await expect(progress).toHaveText('12 / 300개 불러옴')
  await page
    .getByRole('button', { name: '다음 이미지 보기' })
    .click()
  await expect
    .poll(() =>
      carousel.evaluate((element) => element.scrollLeft),
    )
    .toBeGreaterThan(0)

  await carousel.evaluate((element) => {
    element.style.scrollBehavior = 'auto'
    element.style.scrollSnapType = 'none'
  })

  await expect
    .poll(
      async () => {
        await carousel.evaluate(async (element) => {
          element.scrollLeft = element.scrollWidth
          element.dispatchEvent(
            new Event('scroll', { bubbles: true }),
          )
          await new Promise((resolve) =>
            requestAnimationFrame(() => resolve(null)),
          )
        })
        return progress.textContent()
      },
      {
        intervals: [10, 20, 50],
        timeout: 20_000,
      },
    )
    .toBe('300 / 300개 불러옴')

  await expect
    .poll(async () => {
      await carousel.evaluate(async (element) => {
        element.scrollLeft = element.scrollWidth
        element.dispatchEvent(
          new Event('scroll', { bubbles: true }),
        )
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(null)),
        )
      })
      return page.getByText('참조 이미지 300.png').count()
    })
    .toBe(1)

  await expect(
    page.getByText('참조 이미지 300.png'),
  ).toBeVisible()
  await expect(
    page.getByText('참조 이미지 1.png'),
  ).toHaveCount(0)

  const scrollSize = await carousel.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
  }))
  expect(scrollSize.scrollWidth).toBeGreaterThan(
    scrollSize.clientWidth,
  )
  expect(
    scrollSize.scrollWidth -
      scrollSize.scrollLeft -
      scrollSize.clientWidth,
  ).toBeLessThan(180)

  const renderedCardCount = await carousel
    .locator('[data-image-reference-card]')
    .count()
  expect(renderedCardCount).toBeLessThan(12)
})
