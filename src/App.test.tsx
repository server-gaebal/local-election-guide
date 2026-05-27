import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { clearElectionDataCache } from "./dataLoader";
import cacheManifest from "../public/data/cache-manifest.json";
import regionIndex from "../public/data/regions/index.json";
import busanRegion from "../public/data/regions/busan-haeundae-woojedong.json";
import gyeonggiRegion from "../public/data/regions/gyeonggi-seongnam-jeongja.json";
import uiwangCheonggyeRegion from "../public/data/regions/nec-4100-4124-dong-1gfp6af.json";
import seoulRegion from "../public/data/regions/seoul-mapo-gongdeok.json";

const testRegionIndex = {
  ...regionIndex,
  residences: [gyeonggiRegion.residence, busanRegion.residence, seoulRegion.residence, uiwangCheonggyeRegion.residence],
  residenceAliases: [
    {
      label: "경기도 의왕시 포일동",
      residenceId: uiwangCheonggyeRegion.residence.id,
      targetLabel: "경기도 의왕시 청계동",
    },
  ],
};

const jsonFixtures = {
  "data/cache-manifest.json": cacheManifest,
  "data/regions/index.json": testRegionIndex,
  "data/regions/seoul-mapo-gongdeok.json": seoulRegion,
  "data/regions/gyeonggi-seongnam-jeongja.json": gyeonggiRegion,
  "data/regions/busan-haeundae-woojedong.json": busanRegion,
  [`data/regions/${uiwangCheonggyeRegion.residence.id}.json`]: uiwangCheonggyeRegion,
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

    await screen.findByRole("heading", { name: "서울특별시 마포구 공덕동에서 공약을 비교할 후보" });
    await user.selectOptions(screen.getByLabelText("시도"), "경기도");
    await user.selectOptions(screen.getByLabelText("시군구"), "성남시 분당구");
    await user.selectOptions(screen.getByLabelText("읍면동"), "정자동");
    await user.click(screen.getByRole("button", { name: "학부모" }));

    expect(await screen.findByRole("heading", { name: "경기도 성남시 분당구 정자동에서 공약을 비교할 후보" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "추미애" })).toBeInTheDocument();
    expect(screen.getAllByText("학부모 관점").length).toBeGreaterThan(0);
    expect(screen.queryByText("정원오")).not.toBeInTheDocument();
  });

  it("uses the preferred default residence and stable city ordering", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "서울특별시 마포구 공덕동에서 공약을 비교할 후보" });

    const cityOptions = within(screen.getByLabelText("시도")).getAllByRole("option").map((option) => option.textContent);
    expect(cityOptions).toEqual(["서울특별시", "부산광역시", "경기도"]);
  });

  it("selects a region through search", async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchbox = await screen.findByLabelText("지역 검색");
    await user.type(searchbox, "부산 해운대");
    await user.click(screen.getByRole("button", { name: "지역 검색 적용" }));

    expect(await screen.findByRole("heading", { name: "부산광역시 해운대구 우제1동에서 공약을 비교할 후보" })).toBeInTheDocument();
  });

  it("maps legal dong search terms to the matching administrative election region", async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchbox = await screen.findByLabelText("지역 검색");
    await user.type(searchbox, "경기도 의왕시 포일동");
    await user.click(screen.getByRole("button", { name: "지역 검색 적용" }));

    expect(await screen.findByRole("heading", { name: "경기도 의왕시 청계동에서 공약을 비교할 후보" })).toBeInTheDocument();
    expect(screen.getByText("주소 동이 안 보이면 검색하면 관할 행정동 후보로 연결합니다.")).toBeInTheDocument();
  });

  it("opens a shared region from the URL query", async () => {
    window.history.replaceState({}, "", "/?region=busan-haeundae-woojedong");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "부산광역시 해운대구 우제1동에서 공약을 비교할 후보" })).toBeInTheDocument();
  });

  it("shows candidate-specific fact checks for Busan mayor and education superintendent candidates", async () => {
    window.history.replaceState({}, "", "/?region=busan-haeundae-woojedong");
    render(<App />);

    const mayorCard = await screen.findByRole("article", { name: /박형준 후보 카드/ });
    const educationCard = await screen.findByRole("article", { name: /김석준 후보 카드/ });

    expect(within(mayorCard).getByText("팩트체크")).toBeInTheDocument();
    expect(within(mayorCard).getByText(/청년자산·가덕신공항/)).toBeInTheDocument();
    expect(within(mayorCard).getByText("재원 확인 필요")).toBeInTheDocument();
    expect(within(educationCard).getByText("팩트체크")).toBeInTheDocument();
    expect(within(educationCard).getByText(/AI 튜터, 기초학력/)).toBeInTheDocument();
    expect(within(educationCard).getByText("재원 확인 필요")).toBeInTheDocument();
  });

  it("shows education category fact checks for Seoul and Gyeonggi superintendent candidates", async () => {
    const user = userEvent.setup();
    render(<App />);

    const seoulEducationCard = await screen.findByRole("article", { name: /김영배 후보 카드/ });
    expect(within(seoulEducationCard).getByText("팩트체크")).toBeInTheDocument();
    expect(within(seoulEducationCard).getByText(/교육과정 자율/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("시도"), "경기도");
    await user.selectOptions(screen.getByLabelText("시군구"), "성남시 분당구");
    await user.selectOptions(screen.getByLabelText("읍면동"), "정자동");

    const gyeonggiEducationCard = await screen.findByRole("article", { name: /임태희 후보 카드/ });
    expect(within(gyeonggiEducationCard).getByText("팩트체크")).toBeInTheDocument();
    expect(within(gyeonggiEducationCard).getByText(/기초학력·AI/)).toBeInTheDocument();
  });

  it("shares the selected region through a crawlable preview page", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "share", {
      configurable: true,
      value: share,
    });
    render(<App />);

    await screen.findByRole("heading", { name: "서울특별시 마포구 공덕동에서 공약을 비교할 후보" });
    await user.click(screen.getByRole("button", { name: "선택 지역 공유" }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://server-gaebal.github.io/local-election-guide/share/seoul-mapo-gongdeok.html",
          title: "서울특별시 마포구 후보 가이드",
        }),
      );
    });
  });

  it("shows every ballot group even when some candidates do not have structured pledge data yet", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "서울특별시장 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울특별시교육감 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구청장 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울시의원 마포구제1선거구 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구의원 마포구가선거구 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울시의원 비례대표 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구의원 비례대표 후보" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /서울시의원 마포구제1선거구/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /마포구의원 마포구가선거구/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /서울시의원 비례대표/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /마포구의원 비례대표/ })).toBeInTheDocument();
    expect(screen.getByText("7종")).toBeInTheDocument();
    expect(screen.getByText("42명")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "동장 후보" })).not.toBeInTheDocument();
  });

  it("renders candidate photo slots and bold party labels", async () => {
    render(<App />);

    const candidateCard = await screen.findByRole("article", { name: /정원오 후보 카드/ });
    const seoulMayorComparison = seoulRegion.candidates.find((candidate) => candidate.name === "정원오")?.comparison;
    expect(seoulMayorComparison).toBeTruthy();
    expect(candidateCard).toHaveStyle("--candidate-color: #2563eb");
    expect(within(candidateCard).getByRole("img", { name: "정원오 후보 사진" })).toBeInTheDocument();
    expect(within(candidateCard).getByText("더불어민주당").tagName).toBe("STRONG");
    expect(within(candidateCard).queryByText("시·도지사")).not.toBeInTheDocument();
    expect(within(candidateCard).queryByText("서울특별시")).not.toBeInTheDocument();
    expect(within(candidateCard).queryByText("5대공약")).not.toBeInTheDocument();
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
    expect(candidateCard).toHaveTextContent(seoulMayorComparison as string);
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
    expect(within(candidateCard).getAllByText(/분 통근도시 실현으로 시민에게 쉼표를/).length).toBeGreaterThan(0);
    expect(within(candidateCard).getAllByText(/분 역세권/).length).toBeGreaterThan(0);
    expect(within(candidateCard).getAllByText(/격자형 철도망/).length).toBeGreaterThan(0);
  });

  it("opens a full pledge detail view from a candidate card", async () => {
    const user = userEvent.setup();
    render(<App />);

    const candidateCard = await screen.findByRole("article", { name: /정원오 후보 카드/ });
    await user.click(within(candidateCard).getByRole("button", { name: "전체 공약 보기" }));

    const dialog = screen.getByRole("dialog", { name: "정원오 전체 공약" });
    const seoulMayorComparisonDetails = seoulRegion.candidates.find(
      (candidate) => candidate.name === "정원오",
    )?.comparisonDetails;
    expect(seoulMayorComparisonDetails?.length).toBeGreaterThan(0);
    expect(within(dialog).getByText("후보자 공개 정보")).toBeInTheDocument();
    expect(within(dialog).getByText("전과 2건")).toBeInTheDocument();
    expect(within(dialog).queryByText(/전과 증명서|스캔 파일/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("5대 공약")).toBeInTheDocument();
    expect(within(dialog).getByText("상대 후보와의 차별점")).toBeInTheDocument();
    expect(within(dialog).queryByText("후보 특징")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("공약 실현 가능성 검토")).not.toBeInTheDocument();
    for (const detail of seoulMayorComparisonDetails ?? []) {
      expect(within(dialog).getByText(detail)).toBeInTheDocument();
    }
    expect(within(dialog).queryByText(/NEC CDN|원문 기반 요약·비교 생성 대상|선거구 기준:|비교 기준:/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("공약 팩트체크")).toBeInTheDocument();
    expect(within(dialog).getByText(/선거관리위원회에서 제공한 후보자 정보와 공개 공약·공보 텍스트만/)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/대중교통 간 네트워크 효율성/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/격자형 철도망/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/창업도전캠퍼스/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/초등 돌봄시설/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/data\/nec\/full\/pdfs\/3-시-도지사선거/).length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/본문 요약은 다음 정제 단계/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("프롬프트 보기")).toBeInTheDocument();
  });

  it("shows proportional candidates without leaking implementation placeholders", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "서울특별시장 후보" });

    expect(screen.getByRole("heading", { name: "서울시의원 비례대표 후보" })).toBeInTheDocument();
    expect(screen.getAllByRole("article", { name: /비례대표 후보 카드/ }).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/원문 PDF 링크 없음|NEC 공개 여부|후보 메타데이터|선거공보 연동|PDF 미제공/),
    ).not.toBeInTheDocument();
  });

  it("marks pledge sections as preparing when source pledges are not found", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "서울특별시장 후보" });

    const localCouncilCard = screen.getByRole("article", { name: /장덕준 후보 카드/ });
    const proportionalCards = screen.getAllByRole("article", { name: /비례대표 후보 카드/ });

    expect(within(localCouncilCard).getByText("준비중")).toBeInTheDocument();
    expect(proportionalCards.length).toBeGreaterThan(0);

    for (const card of proportionalCards) {
      expect(within(card).getByText("준비중")).toBeInTheDocument();
    }
  });

  it("shows first-wave detailed persona details for selected city and race candidates", async () => {
    const user = userEvent.setup();
    render(<App />);

    const educationCard = await screen.findByRole("article", { name: /김영배 후보 카드/ });
    expect(within(educationCard).getByText("선관위 제공 정보만 기반")).toBeInTheDocument();

    await user.click(within(educationCard).getByRole("button", { name: "전체 공약 보기" }));

    const dialog = screen.getByRole("dialog", { name: "김영배 전체 공약" });
    expect(within(dialog).getByText(/선거관리위원회에서 제공한 후보자 정보와 공개 공약·공보 텍스트만/)).toBeInTheDocument();
    expect(within(dialog).getByText(/모든 후보 카드에 적용/)).toBeInTheDocument();
    expect(within(dialog).getByText(/서울·경기·강원·대전의 광역단체장·교육감·기초단체장/)).toBeInTheDocument();
    expect(within(dialog).getByText(/서울특별시 교육감 상세 정리 대상/)).toBeInTheDocument();
    expect(within(dialog).getByText("근거 출처")).toBeInTheDocument();
    expect(within(dialog).getByText("프롬프트 보기")).toBeInTheDocument();
    expect(within(dialog).getByText(/서울특별시교육감 김영배 후보자 정보/)).toBeInTheDocument();
  });

  it("shows only criminal record counts without opening detailed criminal records", async () => {
    render(<App />);

    const seoulMayorCard = await screen.findByRole("article", { name: /정원오 후보 카드/ });
    expect(within(seoulMayorCard).getByText("전과 2건")).toBeInTheDocument();
    expect(within(seoulMayorCard).queryByRole("button", { name: "정원오 전과 기록 보기" })).not.toBeInTheDocument();

    const educationCard = await screen.findByRole("article", { name: /김영배 후보 카드/ });
    expect(within(educationCard).queryByRole("button", { name: "김영배 전과 기록 보기" })).not.toBeInTheDocument();
    expect(within(educationCard).getByText("전과 3건")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /전과 기록/ })).not.toBeInTheDocument();
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
