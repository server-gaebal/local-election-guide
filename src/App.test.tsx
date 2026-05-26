import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { clearElectionDataCache } from "./dataLoader";
import cacheManifest from "../public/data/cache-manifest.json";
import regionIndex from "../public/data/regions/index.json";
import busanRegion from "../public/data/regions/busan-haeundae-woojedong.json";
import gyeonggiRegion from "../public/data/regions/gyeonggi-seongnam-jeongja.json";
import seoulRegion from "../public/data/regions/seoul-mapo-gongdeok.json";

const jsonFixtures = {
  "data/cache-manifest.json": cacheManifest,
  "data/regions/index.json": regionIndex,
  "data/regions/seoul-mapo-gongdeok.json": seoulRegion,
  "data/regions/gyeonggi-seongnam-jeongja.json": gyeonggiRegion,
  "data/regions/busan-haeundae-woojedong.json": busanRegion,
};

function installStaticDataFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const fixture = Object.entries(jsonFixtures).find(([path]) => url.endsWith(path))?.[1];

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

describe("local election guide static experience", () => {
  beforeEach(() => {
    clearElectionDataCache();
    installStaticDataFetch();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("filters candidates by residence and voter profile", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: "서울특별시 마포구 공덕동에서 투표할 후보" });
    await user.selectOptions(screen.getByLabelText("시도"), "경기도");
    await user.selectOptions(screen.getByLabelText("시군구"), "성남시 분당구");
    await user.selectOptions(screen.getByLabelText("읍면동"), "정자동");
    await user.click(screen.getByRole("button", { name: "학부모" }));

    expect(await screen.findByRole("heading", { name: "경기도 성남시 분당구 정자동에서 투표할 후보" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "백서연" })).toBeInTheDocument();
    expect(screen.getByText("교육·돌봄")).toBeInTheDocument();
    expect(screen.queryByText("한지우")).not.toBeInTheDocument();
  });

  it("opens a shared region from the URL query", async () => {
    window.history.replaceState({}, "", "/?region=busan-haeundae-woojedong");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "부산광역시 해운대구 우제1동에서 투표할 후보" })).toBeInTheDocument();
  });

  it("shares the selected region through a crawlable preview page", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: share,
    });
    render(<App />);

    await screen.findByRole("heading", { name: "서울특별시 마포구 공덕동에서 투표할 후보" });
    await user.click(screen.getByRole("button", { name: "선택 지역 공유" }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://kimsunghyun1995.github.io/local-election-guide/share/seoul-mapo-gongdeok.html",
          title: "서울특별시 마포구 후보 가이드",
        }),
      );
    });
  });

  it("groups all candidates by the ballots the voter receives", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "서울특별시장 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울특별시교육감 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구청장 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울시의원 마포구제1선거구 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구의원 마포구가선거구 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울시의원 비례대표 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구의원 비례대표 후보" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "동장 후보" })).not.toBeInTheDocument();
  });

  it("renders candidate photo slots and bold party labels", async () => {
    render(<App />);

    const candidateCard = await screen.findByRole("article", { name: /정원오 후보 카드/ });
    expect(within(candidateCard).getByRole("img", { name: "정원오 후보 사진" })).toBeInTheDocument();
    expect(within(candidateCard).getByText("더불어민주당").tagName).toBe("STRONG");
    expect(within(candidateCard).getByText("전과 2건")).toBeInTheDocument();
    expect(within(candidateCard).getByText("57세")).toBeInTheDocument();
    expect(within(candidateCard).getByText("차별점")).toBeInTheDocument();
    expect(within(candidateCard).getByText("후보 특징")).toBeInTheDocument();
    expect(within(candidateCard).getByText("실현 가능성")).toBeInTheDocument();
    expect(within(candidateCard).getByText(/서울특별시장 투표지에서/)).toBeInTheDocument();
  });

  it("opens a full pledge detail view from a candidate card", async () => {
    const user = userEvent.setup();
    render(<App />);

    const candidateCard = await screen.findByRole("article", { name: /정원오 후보 카드/ });
    await user.click(within(candidateCard).getByRole("button", { name: "전체 공약 보기" }));

    const dialog = screen.getByRole("dialog", { name: "정원오 전체 공약" });
    expect(within(dialog).getByText("범죄 기록")).toBeInTheDocument();
    expect(within(dialog).getByText("5대 공약")).toBeInTheDocument();
    expect(within(dialog).getByText("상대 후보와의 차별점")).toBeInTheDocument();
    expect(within(dialog).getByText("공약 실현 가능성 검토")).toBeInTheDocument();
  });

  it("opens criminal record details from the record badge", async () => {
    const user = userEvent.setup();
    render(<App />);

    const candidateCard = await screen.findByRole("article", { name: /정원오 후보 카드/ });
    await user.click(within(candidateCard).getByRole("button", { name: "정원오 전과 기록 보기" }));

    const dialog = screen.getByRole("dialog", { name: "정원오 전과 기록" });
    expect(within(dialog).getByRole("heading", { name: "전과 2건" })).toBeInTheDocument();
    expect(within(dialog).getByText(/선관위 후보자 정보공개에서 스캔 원문 1건/)).toBeInTheDocument();
    expect(within(dialog).getByText(/죄명과 형량까지 자동 표시하려면/)).toBeInTheDocument();
  });

  it("keeps implementation cache metadata out of the voter UI and reuses region fetches", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "서울특별시장 후보" })).toBeInTheDocument();
    expect(screen.queryByText(cacheManifest.version)).not.toBeInTheDocument();
    expect(screen.queryByText("정적 JSON 캐시")).not.toBeInTheDocument();
    await waitFor(() => {
      const fetchMock = vi.mocked(fetch);
      const seoulRegionCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("data/regions/seoul-mapo-gongdeok.json"));

      expect(seoulRegionCalls).toHaveLength(1);
    });
  });

  it("turns on large text mode from the older voter profile", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await screen.findByRole("heading", { name: "서울특별시장 후보" });
    await user.click(screen.getByRole("button", { name: "고령층" }));

    expect(container.querySelector(".app-shell")).toHaveClass("app-shell--large-text");
    expect(screen.getByRole("button", { name: "큰 글씨" })).toHaveAttribute("aria-pressed", "true");
  });
});
