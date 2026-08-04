import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

const userEmail = 'e2e-user@example.com'
const password = 'S3cure!Passphrase-7746'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(userEmail)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page).toHaveURL('/intro')
}

function documentPanel(page: Page, heading: string): Locator {
  return page
    .getByRole('heading', { name: heading, exact: true })
    .locator('xpath=ancestor::section[1]')
}

test('O S C 문서를 각각 30건씩 조회하고 독립적으로 페이지를 이동한다', async ({
  page,
}) => {
  await login(page)
  await page.goto('/intro/research')

  await expect(
    page.getByRole('heading', { name: '연구 데이터', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('전체 문서 96건')).toBeVisible()

  const openPanel = documentPanel(page, '공개 문서')
  const sensitivePanel = documentPanel(page, '민감 문서')
  const confidentialPanel = documentPanel(page, '기밀 문서')

  await expect(
    openPanel.locator('header').getByText('32', { exact: true }),
  ).toBeVisible()
  await expect(
    sensitivePanel.locator('header').getByText('32', { exact: true }),
  ).toBeVisible()
  await expect(
    confidentialPanel.locator('header').getByText('32', { exact: true }),
  ).toBeVisible()
  await expect(openPanel.getByText('총 32건 · 1–30 표시')).toBeVisible()
  await expect(sensitivePanel.getByText('총 32건 · 1–30 표시')).toBeVisible()
  await expect(confidentialPanel.getByText('총 32건 · 1–30 표시')).toBeVisible()

  await openPanel.getByRole('button', { name: '다음' }).click()
  await expect(openPanel.getByText('공개 연구 문서 31')).toBeVisible()
  await expect(openPanel.getByText('총 32건 · 31–32 표시')).toBeVisible()
  await expect(sensitivePanel.getByText('민감 연구 문서 01')).toBeVisible()
  await expect(confidentialPanel.getByText('기밀 연구 문서 01')).toBeVisible()

  await sensitivePanel.getByRole('button', { name: '다음' }).click()
  await expect(sensitivePanel.getByText('민감 연구 문서 31')).toBeVisible()
  await expect(openPanel.getByText('공개 연구 문서 31')).toBeVisible()
  await expect(confidentialPanel.getByText('기밀 연구 문서 01')).toBeVisible()
})

test('O와 S 문서를 동시에 펼치고 실제 파일 API를 조회한다', async ({
  page,
}) => {
  await login(page)
  await page.goto('/intro/research')

  const openPanel = documentPanel(page, '공개 문서')
  const sensitivePanel = documentPanel(page, '민감 문서')

  await openPanel
    .getByRole('button', { name: /공개 연구 문서 01/ })
    .click()
  await sensitivePanel
    .getByRole('button', { name: /민감 연구 문서 01/ })
    .click()

  await expect(
    openPanel.getByRole('button', { name: /공개 연구 문서 01/ }),
  ).toHaveAttribute('aria-expanded', 'true')
  await expect(
    sensitivePanel.getByRole('button', { name: /민감 연구 문서 01/ }),
  ).toHaveAttribute('aria-expanded', 'true')

  for (const label of [
    '문서 제목',
    '주관 부처',
    '담당 부서',
    '공개일',
    '본문 자료',
    '기타 자료',
  ]) {
    await expect(openPanel.getByText(label, { exact: true })).toBeVisible()
    await expect(sensitivePanel.getByText(label, { exact: true })).toBeVisible()
  }

  const bodyLink = openPanel.getByRole('link', {
    name: 'O_연구개발_시행계획.pdf',
  })
  const bodyUrl = await bodyLink.getAttribute('href')
  expect(bodyUrl).toMatch(
    /^\/api\/research\/documents\/\d+\/files\/body\/$/,
  )
  const fileResponse = await page.request.get(bodyUrl as string)
  expect(fileResponse.status()).toBe(200)
  expect(fileResponse.headers()['content-type']).toBe('application/pdf')
  expect(await fileResponse.body()).toEqual(Buffer.from('e2e-pdf'))

  await openPanel
    .getByRole('button', { name: /공개 연구 문서 01/ })
    .click()
  await expect(
    openPanel.getByRole('button', { name: /공개 연구 문서 01/ }),
  ).toHaveAttribute('aria-expanded', 'false')

  await openPanel
    .getByRole('button', { name: /공개 연구 문서 02/ })
    .click()
  await expect(
    openPanel.getByRole('button', { name: /공개 연구 문서 02/ }),
  ).toHaveAttribute('aria-expanded', 'true')
  await openPanel.getByRole('button', { name: '다음' }).click()
  await expect(openPanel.getByText('공개 연구 문서 31')).toBeVisible()
  await expect(
    openPanel.getByRole('button', { name: /공개 연구 문서 31/ }),
  ).toHaveAttribute('aria-expanded', 'false')
})

test('빈 유형과 목록 오류를 각각 표시하고 실패한 유형만 다시 불러온다', async ({
  page,
}) => {
  await login(page)
  let openRequests = 0
  let openShouldFail = true

  await page.route('**/api/research/documents/summary/', async (route) => {
    await route.fulfill({
      json: { totalItems: 0, counts: { O: 0, S: 0, C: 0 } },
    })
  })
  await page.route('**/api/research/documents/?**', async (route) => {
    const category = new URL(route.request().url()).searchParams.get('category')
    if (category === 'O') {
      openRequests += 1
      if (openShouldFail) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: '문서 DB를 사용할 수 없습니다.' }),
        })
        return
      }
    }
    await route.fulfill({
      json: {
        items: [],
        pagination: {
          page: 1,
          pageSize: 30,
          totalItems: 0,
          totalPages: 1,
        },
      },
    })
  })

  await page.goto('/intro/research')

  const openPanel = documentPanel(page, '공개 문서')
  const sensitivePanel = documentPanel(page, '민감 문서')
  const confidentialPanel = documentPanel(page, '기밀 문서')
  await expect(openPanel.getByRole('alert')).toContainText(
    '문서 DB를 사용할 수 없습니다.',
  )
  await expect(
    sensitivePanel.getByText('등록된 민감 문서가 없습니다.'),
  ).toBeVisible()
  await expect(
    confidentialPanel.getByText('등록된 기밀 문서가 없습니다.'),
  ).toBeVisible()

  openShouldFail = false
  await openPanel.getByRole('button', { name: '다시 시도' }).click()
  await expect(
    openPanel.getByText('등록된 공개 문서가 없습니다.'),
  ).toBeVisible()
  expect(openRequests).toBeGreaterThan(1)
})

test('전체 합계 fallback과 5페이지 번호 창, 빈 메타데이터를 처리한다', async ({
  page,
}) => {
  await login(page)
  let summaryShouldFail = true

  await page.route('**/api/research/documents/summary/', async (route) => {
    if (summaryShouldFail) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: '전체 건수를 불러오지 못했습니다.' }),
      })
      return
    }
    await route.fulfill({
      json: { totalItems: 999, counts: { O: 150, S: 2, C: 3 } },
    })
  })
  await page.route('**/api/research/documents/?**', async (route) => {
    const url = new URL(route.request().url())
    const category = url.searchParams.get('category') as 'O' | 'S' | 'C'
    const requestedPage = Number(url.searchParams.get('page'))
    const totals = { O: 150, S: 2, C: 3 }
    const totalItems = totals[category]
    const totalPages = category === 'O' ? 5 : 1
    await route.fulfill({
      json: {
        items: [
          {
            id: requestedPage,
            category,
            title: null,
            orderingAgency: null,
            department: null,
            productionDate: null,
            bodyFile: null,
            otherFiles: [],
          },
        ],
        pagination: {
          page: requestedPage,
          pageSize: 30,
          totalItems,
          totalPages,
        },
      },
    })
  })

  await page.goto('/intro/research')

  await expect(page.getByText('전체 문서 155건')).toBeVisible()
  const summaryError = page.getByText('전체 건수를 불러오지 못했습니다.', {
    exact: false,
  })
  await expect(summaryError).toBeVisible()

  const openPanel = documentPanel(page, '공개 문서')
  const pagination = openPanel.getByRole('navigation', {
    name: 'O 문서 페이지 이동',
  })
  await expect(
    pagination.getByRole('button', { name: '1', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await pagination.getByRole('button', { name: '2', exact: true }).click()
  await expect(
    pagination.getByRole('button', { name: '2', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await pagination.getByRole('button', { name: '이전' }).click()
  await expect(
    pagination.getByRole('button', { name: '1', exact: true }),
  ).toHaveAttribute('aria-current', 'page')

  await openPanel.getByRole('button', { name: '제목 없음' }).click()
  await expect(openPanel.getByText('자료 없음')).toHaveCount(2)
  await expect(openPanel.getByText('—')).toHaveCount(5)

  await pagination.getByRole('button', { name: '다음' }).click()
  await pagination.getByRole('button', { name: '다음' }).click()
  await pagination.getByRole('button', { name: '다음' }).click()
  for (const pageNumber of ['3', '4', '5']) {
    await expect(
      pagination.getByRole('button', { name: pageNumber, exact: true }),
    ).toBeVisible()
  }
  await expect(
    pagination.getByRole('button', { name: '4', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await pagination.getByRole('button', { name: '이전' }).click()
  await expect(
    pagination.getByRole('button', { name: '3', exact: true }),
  ).toHaveAttribute('aria-current', 'page')

  summaryShouldFail = false
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(page.getByText('전체 문서 999건')).toBeVisible()
})
