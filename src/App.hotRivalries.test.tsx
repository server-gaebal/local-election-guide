import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { clearElectionDataCache } from "./dataLoader";
import cacheManifest from "../public/data/cache-manifest.json";
import regionIndex from "../public/data/regions/index.json";
import seoulRegion from "../public/data/regions/seoul-mapo-gongdeok.json";

const testRegionIndex = {
  ...regionIndex,
  residences: [seoulRegion.residence],
};

const jsonFixtures = {
  "data/cache-manifest.json": cacheManifest,
  "data/regions/index.json": testRegionIndex,
  "data/regions/seoul-mapo-gongdeok.json": seoulRegion,
};

function installStaticDataFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const pathname = new URL(url, "https://example.com").pathname.replace(/^\/+/, "");
      const fixture = Object.entries(jsonFixtures).find(([path]) => pathname.endsWith(path))?.[1];

      if (!fixture) {
        return new Response("Not found", { status: 404 });
      }

      return new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

describe("search-backed hot rivalries", () => {
  beforeEach(() => {
    clearElectionDataCache();
    installStaticDataFetch();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the current Seoul mayor rivalry with source-backed interest context", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("tab", { name: "내 지역 후보" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "초접전 라이벌" }));

    expect(screen.getByRole("tab", { name: "초접전 라이벌" })).toHaveAttribute("aria-selected", "true");

    const rivalrySection = await screen.findByRole("region", { name: "관심 라이벌" });

    expect(within(rivalrySection).getByRole("heading", { name: "전국 초접전 라이벌" })).toBeInTheDocument();
    expect(within(rivalrySection).getByRole("heading", { name: "서울시장 초접전" })).toBeInTheDocument();
    expect(within(rivalrySection).getByRole("heading", { name: "부산시장 초접전" })).toBeInTheDocument();
    expect(within(rivalrySection).getByRole("heading", { name: "대구시장 초접전" })).toBeInTheDocument();
    expect(within(rivalrySection).getByRole("heading", { name: "충남지사 초접전" })).toBeInTheDocument();
    expect(within(rivalrySection).getByRole("heading", { name: "충북지사 접전" })).toBeInTheDocument();

    const seoulCard = within(rivalrySection).getByRole("article", { name: "서울시장 초접전" });

    expect(within(seoulCard).getByText("정원오")).toBeInTheDocument();
    expect(within(seoulCard).getByText("오세훈")).toBeInTheDocument();
    expect(within(rivalrySection).getByText(/2026-05-27 검색 기준/)).toBeInTheDocument();
    expect(within(seoulCard).getByRole("link", { name: /뉴스핌/ })).toHaveAttribute(
      "href",
      "https://www.newspim.com/news/view/20260526001189",
    );

    await user.click(within(seoulCard).getByRole("button", { name: "정원오 후보 상세 보기" }));

    expect(await screen.findByRole("dialog", { name: "정원오 전체 공약" })).toBeInTheDocument();
  });
});
