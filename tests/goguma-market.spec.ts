import { test, expect, Browser } from "@playwright/test";

const BASE = "http://localhost:3000";
// 고정 제목 — 테스트 전체에서 동일한 값 사용
const TEST_TITLE = "플레이라이트_테스트상품_고구마";

// CRUD 흐름에서 생성된 상품 URL을 공유
let createdProductUrl = "";

// 테스트 실패 등으로 삭제 테스트가 실행되지 않았을 때 잔여 데이터 정리
test.afterAll(async ({ browser }) => {
  if (!createdProductUrl) return;
  const page = await browser.newPage();
  try {
    await page.goto(createdProductUrl, { timeout: 5000 });
    // 404가 아니고 삭제 버튼이 보이면 아직 상품이 남아 있는 것
    const deleteBtn = page.getByRole("button", { name: "삭제" });
    if (await deleteBtn.isVisible({ timeout: 3000 })) {
      page.on("dialog", (d) => d.accept());
      await deleteBtn.click();
      await page.waitForURL(`${BASE}/`, { timeout: 8000 });
    }
  } catch {
    // 이미 삭제됐거나 접근 불가 — 정리 불필요
  } finally {
    await page.close();
  }
});

// ─────────────────────────────────────────
// 헬퍼: UI로 상품 등록 후 상세 URL 반환
// ─────────────────────────────────────────
async function registerProduct(browser: Browser): Promise<string> {
  const page = await browser.newPage();
  await page.goto(`${BASE}/products/new`);
  await page.getByPlaceholder("상품명을 입력해주세요 *").fill(TEST_TITLE);
  await page.getByPlaceholder("가격을 입력해주세요 *").fill("12345");
  await page.getByPlaceholder("상품 설명을 입력해주세요.").fill("Playwright 자동 테스트");
  await page.getByPlaceholder("판매자 이름 *").fill("테스트봇");
  await page.getByRole("button", { name: "기타" }).click();
  await page.getByRole("button", { name: "상품 등록하기" }).click();
  // 메인으로 이동 후 방금 등록한 상품 클릭
  await expect(page).toHaveURL(`${BASE}/`, { timeout: 10000 });
  await page.getByRole("link", { name: new RegExp(TEST_TITLE) }).first().click();
  await page.waitForURL(/\/products\/.+/);
  const url = page.url();
  await page.close();
  return url;
}

// ─────────────────────────────────────────
// 1. 메인 페이지 (독립 테스트)
// ─────────────────────────────────────────
test.describe("1. 메인 페이지", () => {
  test("헤더 렌더링 - 로고, 검색바 확인", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByText("고구마마켓")).toBeVisible();
    await expect(page.getByText("상품을 검색해보세요")).toBeVisible();
  });

  test("상품 등록 FAB 버튼 존재", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: "상품 등록" })).toBeVisible();
  });

  test("카테고리 칩 - '전체'가 기본 선택 (주황색)", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: "전체" })).toHaveClass(/bg-orange-500/);
  });

  test("카테고리 필터 클릭 → URL 변경 및 해당 칩 활성화", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("link", { name: "디지털/가전" }).click();
    await expect(page).toHaveURL(/category=%EB%94%94%EC%A7%80%ED%84%B8/);
    await expect(page.getByRole("link", { name: "디지털/가전" })).toHaveClass(/bg-orange-500/);
  });

  test("상품 목록에 ₩ 가격 형태 표시 또는 빈 상태 메시지", async ({ page }) => {
    await page.goto(BASE);
    const items = page.locator("main a");
    const count = await items.count();
    if (count > 0) {
      const firstText = await items.first().textContent();
      expect(firstText).toContain("₩");
    } else {
      await expect(page.getByText("아직 등록된 상품이 없어요")).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────
// 2. 상품 등록
// ─────────────────────────────────────────
test.describe("2. 상품 등록", () => {
  test("등록 페이지 렌더링 - 필드 확인", async ({ page }) => {
    await page.goto(`${BASE}/products/new`);
    // heading으로 특정 (버튼 텍스트와 충돌 방지)
    await expect(page.getByRole("heading", { name: "상품 등록" })).toBeVisible();
    await expect(page.getByPlaceholder("상품명을 입력해주세요 *")).toBeVisible();
    await expect(page.getByPlaceholder("가격을 입력해주세요 *")).toBeVisible();
    await expect(page.getByPlaceholder("판매자 이름 *")).toBeVisible();
    await expect(page.getByText("카테고리")).toBeVisible();
  });

  test("카테고리 미선택 시 에러 메시지 표시", async ({ page }) => {
    await page.goto(`${BASE}/products/new`);
    await page.getByPlaceholder("상품명을 입력해주세요 *").fill("테스트");
    await page.getByPlaceholder("가격을 입력해주세요 *").fill("10000");
    await page.getByPlaceholder("판매자 이름 *").fill("테스터");
    await page.getByRole("button", { name: "상품 등록하기" }).click();
    await expect(page.getByText("카테고리를 선택해주세요.")).toBeVisible();
  });

  test("카테고리 선택 시 버튼 스타일 활성화", async ({ page }) => {
    await page.goto(`${BASE}/products/new`);
    await page.getByRole("button", { name: "디지털/가전" }).click();
    await expect(page.getByRole("button", { name: "디지털/가전" })).toHaveClass(/bg-orange-500/);
  });

  test("정상 입력 후 등록 → 메인 페이지 이동 및 목록에 표시", async ({ page, browser }) => {
    // 혹시 이전 테스트 잔여 상품이 있으면 삭제하고 재등록
    createdProductUrl = await registerProduct(browser);
    expect(createdProductUrl).toMatch(/\/products\/.+/);

    await page.goto(BASE);
    await expect(page.getByRole("link", { name: new RegExp(TEST_TITLE) }).first()).toBeVisible();
  });
});

// ─────────────────────────────────────────
// 3. 상품 상세 페이지
// ─────────────────────────────────────────
test.describe("3. 상품 상세 페이지", () => {
  test.beforeAll(async ({ browser }) => {
    if (!createdProductUrl) {
      createdProductUrl = await registerProduct(browser);
    }
  });

  test("상품 정보 표시 (제목, 가격, 판매자, 카테고리)", async ({ page }) => {
    await page.goto(createdProductUrl);
    // h1, h2 모두 제목을 가지므로 first()로 매칭
    await expect(page.locator("h1, h2").filter({ hasText: TEST_TITLE }).first()).toBeVisible();
    await expect(page.getByText("₩12,345")).toBeVisible();
    await expect(page.getByText("테스트봇")).toBeVisible();
    await expect(page.getByText("기타")).toBeVisible();
  });

  test("뒤로가기 링크 → 메인 페이지", async ({ page }) => {
    await page.goto(createdProductUrl);
    await page.locator('header a[href="/"]').click();
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("수정 링크 → 수정 페이지로 이동", async ({ page }) => {
    await page.goto(createdProductUrl);
    await page.getByRole("link", { name: "수정" }).click();
    await expect(page).toHaveURL(/\/products\/.+\/edit/);
  });

  test("찜 버튼 클릭 → 하트 색 변경 (활성화)", async ({ page }) => {
    await page.goto(createdProductUrl);
    // 하단 fixed 영역의 full variant 찜 버튼 (border 박스)
    const likeBtn = page.locator("div.fixed button").first();
    await likeBtn.waitFor({ state: "visible" });
    await likeBtn.click();
    await page.waitForTimeout(800);
    // 찜 활성화 시 red 계열 클래스 적용
    await expect(likeBtn).toHaveClass(/red/);
  });

  test("채팅하기 버튼 활성화 (판매중 상태)", async ({ page }) => {
    await page.goto(createdProductUrl);
    await expect(page.getByRole("button", { name: "채팅하기" })).toBeEnabled();
  });
});

// ─────────────────────────────────────────
// 4. 상품 수정
// ─────────────────────────────────────────
test.describe("4. 상품 수정", () => {
  test.beforeAll(async ({ browser }) => {
    if (!createdProductUrl) {
      createdProductUrl = await registerProduct(browser);
    }
  });

  test("수정 폼에 기존 데이터 자동 채워짐", async ({ page }) => {
    await page.goto(`${createdProductUrl}/edit`);
    await expect(page.getByPlaceholder("상품명 *")).toHaveValue(TEST_TITLE);
    await expect(page.getByPlaceholder("가격 *")).toHaveValue("12345");
    await expect(page.getByPlaceholder("판매자 이름 *")).toHaveValue("테스트봇");
  });

  test("제목 수정 후 저장 → 상세 페이지에 반영", async ({ page }) => {
    await page.goto(`${createdProductUrl}/edit`);
    const titleInput = page.getByPlaceholder("상품명 *");
    await titleInput.clear();
    await titleInput.fill(`${TEST_TITLE}_수정됨`);
    await page.getByRole("button", { name: "수정 완료" }).click();
    await page.waitForURL(new RegExp(createdProductUrl.replace(BASE, "")), { timeout: 10000 });
    await expect(
      page.locator("h1, h2").filter({ hasText: `${TEST_TITLE}_수정됨` }).first()
    ).toBeVisible({ timeout: 8000 });
  });
});

// ─────────────────────────────────────────
// 5. 상품 삭제
// ─────────────────────────────────────────
test.describe("5. 상품 삭제", () => {
  test.beforeAll(async ({ browser }) => {
    if (!createdProductUrl) {
      createdProductUrl = await registerProduct(browser);
    }
  });

  test("삭제 확인 후 메인 목록에서 제거됨", async ({ page }) => {
    await page.goto(createdProductUrl);
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "삭제" }).click();
    await expect(page).toHaveURL(`${BASE}/`, { timeout: 10000 });
    // 삭제된 상품이 목록에 없어야 함
    await expect(
      page.getByRole("link", { name: new RegExp(`${TEST_TITLE}`) }).first()
    ).not.toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────
// 6. 반응형 레이아웃 (모바일 375px)
// ─────────────────────────────────────────
test.describe("6. 반응형 레이아웃 (모바일 375px)", () => {
  test("메인 페이지 - 가로 스크롤 없음", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await expect(page.getByText("고구마마켓")).toBeVisible();
    await expect(page.getByRole("link", { name: "상품 등록" })).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380);
  });

  test("상품 등록 폼 - 버튼 및 필드 가시성", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/products/new`);
    await expect(page.getByPlaceholder("상품명을 입력해주세요 *")).toBeVisible();
    await expect(page.getByRole("button", { name: "상품 등록하기" })).toBeVisible();
  });
});
