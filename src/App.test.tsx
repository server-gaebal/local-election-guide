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

const gyeonggiRegionWithGovernor = {
  ...gyeonggiRegion,
  candidates: [
    {
      ...seoulRegion.candidates[0],
      id: "gyeonggi-governor-test",
      residenceId: gyeonggiRegion.residence.id,
      name: "추미애",
      party: "더불어민주당",
      office: "경기도지사",
      criminalRecord: {
        summary: "전과 없음",
        details: "선거통계시스템 후보자 명부 기준 전과기록유무: 없음.",
        tone: "clean" as const,
      },
    },
    ...gyeonggiRegion.candidates,
  ],
};

const testRegionIndex = {
  ...regionIndex,
  residences: [gyeonggiRegion.residence, busanRegion.residence, seoulRegion.residence],
};

const jsonFixtures = {
  "data/cache-manifest.json": cacheManifest,
  "data/regions/index.json": testRegionIndex,
  "data/regions/seoul-mapo-gongdeok.json": seoulRegion,
  "data/regions/gyeonggi-seongnam-jeongja.json": gyeonggiRegionWithGovernor,
  "data/regions/busan-haeundae-woojedong.json": busanRegion,
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

  it("uses the preferred default residence and stable city ordering", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "서울특별시 마포구 공덕동에서 투표할 후보" });

    const cityOptions = within(screen.getByLabelText("시도")).getAllByRole("option").map((option) => option.textContent);
    expect(cityOptions).toEqual(["서울특별시", "부산광역시", "경기도"]);
  });

  it("selects a region through search", async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchbox = await screen.findByLabelText("지역 검색");
    await user.type(searchbox, "부산 해운대");
    await user.click(screen.getByRole("button", { name: "지역 검색 적용" }));

    expect(await screen.findByRole("heading", { name: "부산광역시 해운대구 우제1동에서 투표할 후보" })).toBeInTheDocument();
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
    expect(within(candidateCard).getByRole("button", { name: "정원오 차별점 더보기" })).toBeInTheDocument();
    expect(within(candidateCard).queryByText("후보 특징")).not.toBeInTheDocument();
    expect(within(candidateCard).queryByText("실현 가능성")).not.toBeInTheDocument();
    expect(within(candidateCard).getByText("팩트체크")).toBeInTheDocument();
    expect(within(candidateCard).getByText("선관위 제공 정보만 기반")).toBeInTheDocument();
    expect(within(candidateCard).getByText("공약 요약")).toBeInTheDocument();
    expect(within(candidateCard).queryByText("실행 요약")).not.toBeInTheDocument();
    expect(within(candidateCard).getAllByText("어떻게").length).toBeGreaterThan(0);
    expect(within(candidateCard).getByText(/정책 초점은/)).toBeInTheDocument();
    expect(candidateCard).toHaveTextContent(/앞세운 공약:/);
    expect(candidateCard).toHaveTextContent(/같은 투표지에서는 .* 공약을 중심으로 차이가 납니다/);
    expect(candidateCard).not.toHaveTextContent(/비교 기준:/);
    expect((candidateCard.textContent ?? "").indexOf("공약 요약")).toBeLessThan(
      (candidateCard.textContent ?? "").indexOf("차별점"),
    );
    expect(within(candidateCard).queryByText(/눈에 띄는 고유 공약:/)).not.toBeInTheDocument();
    expect(within(candidateCard).queryByText(/NEC CDN|원문 기반 요약·비교 생성 대상|후보 사진은/)).not.toBeInTheDocument();
    expect(within(candidateCard).queryByText(/NEC 5대공약 원문 텍스트에서/)).not.toBeInTheDocument();
    expect(within(candidateCard).getAllByText(/대중교통 간 네트워크 효율성/).length).toBeGreaterThan(0);
    expect(within(candidateCard).queryByText(/본문 요약은 다음 정제 단계/)).not.toBeInTheDocument();
    expect(within(candidateCard).getAllByText(/30분 통근도시 실현으로 시민에게 쉼표를/).length).toBeGreaterThan(0);
    expect(within(candidateCard).getAllByText(/10분 역세권/).length).toBeGreaterThan(0);
    expect(within(candidateCard).getAllByText(/5분 정류소/).length).toBeGreaterThan(0);
    expect(within(candidateCard).queryByText(/(^|\s)분 역세권/)).not.toBeInTheDocument();
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
    expect(within(dialog).queryByText("후보 특징")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("공약 실현 가능성 검토")).not.toBeInTheDocument();
    expect(within(dialog).getByText(/눈에 띄는 고유 공약:/)).toBeInTheDocument();
    expect(within(dialog).getByText(/다른 후보와 나눠볼 지점:/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/NEC CDN|원문 기반 요약·비교 생성 대상|선거구 기준:|비교 기준:/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("공약 팩트체크")).toBeInTheDocument();
    expect(within(dialog).getByText(/선거관리위원회에서 제공한 후보자 정보와 5대 공약 텍스트만/)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/대중교통 간 네트워크 효율성/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/월 100만 원/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/200개소/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/4050\+센터/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/data\/nec\/full\/pdfs\/3-시-도지사선거/).length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/본문 요약은 다음 정제 단계/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/월 만 원|임기 중 개소|플러스재단을 플러스재단/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("프롬프트 보기")).toBeInTheDocument();
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

  it("only opens detailed criminal records for Seoul mayor and Gyeonggi governor candidates", async () => {
    const user = userEvent.setup();
    render(<App />);

    const seoulMayorCard = await screen.findByRole("article", { name: /정원오 후보 카드/ });
    expect(within(seoulMayorCard).getByRole("button", { name: "정원오 전과 기록 보기" })).toBeInTheDocument();

    const educationCard = await screen.findByRole("article", { name: /김영배 후보 카드/ });
    expect(within(educationCard).queryByRole("button", { name: "김영배 전과 기록 보기" })).not.toBeInTheDocument();
    expect(within(educationCard).getByText("전과 3건")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("시도"), "경기도");
    await user.selectOptions(screen.getByLabelText("시군구"), "성남시 분당구");
    await user.selectOptions(screen.getByLabelText("읍면동"), "정자동");

    const gyeonggiGovernorCard = await screen.findByRole("article", { name: /추미애 후보 카드/ });
    await user.click(within(gyeonggiGovernorCard).getByRole("button", { name: "추미애 전과 기록 보기" }));

    expect(screen.getByRole("dialog", { name: "추미애 전과 기록" })).toBeInTheDocument();
  });

  it("keeps implementation cache metadata out of the voter UI and reuses region fetches", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "서울특별시장 후보" })).toBeInTheDocument();
    expect(screen.queryByText(cacheManifest.version)).not.toBeInTheDocument();
    expect(screen.queryByText("정적 JSON 캐시")).not.toBeInTheDocument();
    expect(screen.queryByText(/NEC CDN|원문 기반 요약·비교 생성 대상|5대공약 PDF가 제공되어/)).not.toBeInTheDocument();
    await waitFor(() => {
      const fetchMock = vi.mocked(fetch);
      const seoulRegionCalls = fetchMock.mock.calls.filter(([url]) =>
        new URL(String(url), "https://example.com").pathname.endsWith("data/regions/seoul-mapo-gongdeok.json"),
      );

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
