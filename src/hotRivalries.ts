import type { Candidate, RaceType, Residence } from "./electionTypes";

type RivalrySource = {
  name: string;
  url: string;
  note: string;
};

export type HotRivalryDefinition = {
  id: string;
  city: string;
  office: string;
  candidateNames: [string, string];
  title: string;
  interestLabel: string;
  interestSummary: string;
  updatedAt: string;
  issueTags: string[];
  sources: RivalrySource[];
};

export type HotRivalry = {
  id: string;
  title: string;
  interestLabel: string;
  interestSummary: string;
  updatedAt: string;
  issueTags: string[];
  candidates: [Candidate, Candidate];
  sources: RivalrySource[];
  sourceType: "search-backed" | "same-ballot";
};

const raceRank: Record<RaceType, number> = {
  광역단체장: 10,
  교육감: 20,
  기초단체장: 30,
  광역의원: 40,
  기초의원: 50,
};

export const searchBackedRivalries: HotRivalryDefinition[] = [
  {
    id: "seoul-mayor-jeong-oh",
    city: "서울특별시",
    office: "서울특별시장",
    candidateNames: ["정원오", "오세훈"],
    title: "서울시장 초접전",
    interestLabel: "검색 관심 상위",
    interestSummary:
      "조사기관과 시점에 따라 초박빙과 오차범위 밖 우세가 함께 나오는 최대 관심 구도입니다. 서소문 고가도로 붕괴 이후 안전 이슈까지 겹쳐 막판 변수 민감도가 큽니다.",
    updatedAt: "2026-05-27",
    issueTags: ["도시안전", "교통", "주택공급", "시정 경험"],
    sources: [
      {
        name: "뉴스핌",
        url: "https://www.newspim.com/news/view/20260526001189",
        note: "정원오 48.8%, 오세훈 41.4%로 오차범위 밖 우세 조사 보도",
      },
      {
        name: "조선비즈",
        url: "https://biz.chosun.com/policy/politics/election/2026/05/21/IZVN7IFC4JASHBR4RMW7TAGRDU/",
        note: "오차범위 내 초접전 조사 보도",
      },
    ],
  },
  {
    id: "busan-mayor-jeon-park",
    city: "부산광역시",
    office: "부산광역시장",
    candidateNames: ["전재수", "박형준"],
    title: "부산시장 초접전",
    interestLabel: "검색 관심 상위",
    interestSummary:
      "전통적 보수 강세 지역에서 전재수·박형준 구도가 오차범위 내 2.0%p 차까지 좁혀졌습니다. 적극 투표층과 권역별 격차가 마지막 판세를 좌우할 가능성이 큽니다.",
    updatedAt: "2026-05-27",
    issueTags: ["해양수도", "AI 산업", "청년자산", "가덕신공항"],
    sources: [
      {
        name: "뉴스핌",
        url: "https://www.newspim.com/news/view/20260525000137",
        note: "전재수 44.8%, 박형준 42.8% 오차범위 내 접전 보도",
      },
      {
        name: "뉴시스",
        url: "https://www.newsis.com/view/NISX20260522_0003641544",
        note: "서울·부산 등 주요 격전지 판세 요동 보도",
      },
    ],
  },
  {
    id: "daegu-mayor-kim-choo",
    city: "대구광역시",
    office: "대구광역시장",
    candidateNames: ["김부겸", "추경호"],
    title: "대구시장 초접전",
    interestLabel: "격전지 급부상",
    interestSummary:
      "보수 텃밭인 대구에서 여러 조사 결과가 오차범위 안팎으로 엇갈리며 초접전 지역으로 떠올랐습니다. 김부겸의 지역 돌파력과 추경호의 보수 결집력이 정면 충돌하는 판세입니다.",
    updatedAt: "2026-05-27",
    issueTags: ["대구경제", "보수 결집", "TK신공항", "행정통합"],
    sources: [
      {
        name: "뉴스핌",
        url: "https://www.newspim.com/news/view/20260526000890",
        note: "김부겸 43.0%, 추경호 48.0%로 오차범위 내 접전 보도",
      },
      {
        name: "MBC",
        url: "https://imnews.imbc.com/news/2026/politics/article/6823379_36912.html",
        note: "김부겸 43%, 추경호 37%로 오차범위 내 접전 조사 보도",
      },
      {
        name: "경향신문",
        url: "https://www.khan.co.kr/article/202605220600041",
        note: "샤이 김부겸과 샤이 보수 구도로 막판 해석 경쟁 보도",
      },
    ],
  },
  {
    id: "chungnam-governor-park-kim",
    city: "충청남도",
    office: "충청남도지사",
    candidateNames: ["박수현", "김태흠"],
    title: "충남지사 초접전",
    interestLabel: "최소 격차",
    interestSummary:
      "최신 종합 조사에서 격차가 0.4%p까지 좁혀진 최대 초접전입니다. 천안·아산·당진과 농어촌권의 권역별 표심이 갈려 투표율 변화에 특히 민감합니다.",
    updatedAt: "2026-05-27",
    issueTags: ["현역 평가", "충청권 개발", "경제자유구역", "농어촌"],
    sources: [
      {
        name: "뉴스핌",
        url: "https://www.newspim.com/news/view/20260526000890",
        note: "박수현 43.5%, 김태흠 43.9%로 0.4%p 차 초접전 보도",
      },
      {
        name: "뉴시스",
        url: "https://www.newsis.com/view/NISX20260522_0003641544",
        note: "충남지사 접전 양상과 여야 투표 독려 전략 보도",
      },
    ],
  },
  {
    id: "chungbuk-governor-shin-kim",
    city: "충청북도",
    office: "충청북도지사",
    candidateNames: ["신용한", "김영환"],
    title: "충북지사 접전",
    interestLabel: "오차범위 내 접전",
    interestSummary:
      "신용한·김영환 구도는 최신 조사에서 4.6%p 차 오차범위 내 접전으로 분류됐습니다. 현역 도정 평가와 청주권 표심, 산업·교통 공약의 설득력이 관전 포인트입니다.",
    updatedAt: "2026-05-27",
    issueTags: ["현역 평가", "청주권 표심", "첨단산업", "교통망"],
    sources: [
      {
        name: "뉴스핌",
        url: "https://www.newspim.com/news/view/20260526000890",
        note: "신용한 45.4%, 김영환 40.8%로 오차범위 내 접전 보도",
      },
      {
        name: "연합뉴스",
        url: "https://www.yna.co.kr/amp/view/AKR20260427127251001",
        note: "김영환 후보 확정과 신용한 후보와의 본선 대진 보도",
      },
    ],
  },
];

export function getHotRivalryForResidence(candidates: Candidate[], residence: Residence): HotRivalry | null {
  const searchBackedRivalry = findSearchBackedRivalry(candidates, residence);

  if (searchBackedRivalry) {
    return searchBackedRivalry;
  }

  return findSameBallotRivalry(candidates);
}

function findSearchBackedRivalry(candidates: Candidate[], residence: Residence): HotRivalry | null {
  for (const rivalry of searchBackedRivalries) {
    if (rivalry.city !== residence.city) {
      continue;
    }

    const pair = rivalry.candidateNames.map((name) =>
      candidates.find((candidate) => candidate.office === rivalry.office && candidate.name === name),
    );

    if (pair[0] && pair[1]) {
      return {
        ...rivalry,
        candidates: [pair[0], pair[1]],
        sourceType: "search-backed",
      };
    }
  }

  return null;
}

function findSameBallotRivalry(candidates: Candidate[]): HotRivalry | null {
  const groups = new Map<string, Candidate[]>();

  for (const candidate of candidates) {
    if (candidate.name.includes("비례대표") || candidate.office.includes("비례대표")) {
      continue;
    }

    const key = `${candidate.race}:${candidate.office}`;
    groups.set(key, [...(groups.get(key) ?? []), candidate]);
  }

  const rivalryCandidates = Array.from(groups.values())
    .filter((group) => group.length >= 2)
    .sort(compareCandidateGroups)[0]
    ?.slice()
    .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, "ko-KR"))
    .slice(0, 2);

  if (!rivalryCandidates || rivalryCandidates.length < 2) {
    return null;
  }

  const [first, second] = rivalryCandidates;

  return {
    id: `same-ballot-${first.office}`,
    title: `${first.office} 주요 라이벌`,
    interestLabel: "같은 투표지",
    interestSummary:
      "현재 선택한 지역의 같은 투표지에서 먼저 비교할 두 후보입니다. 검색 근거가 있는 전국 관심 대진이 없을 때 후보 번호와 선거 종류를 기준으로 구성합니다.",
    updatedAt: first.cache.normalizedAt.slice(0, 10),
    issueTags: getFallbackIssueTags(first, second),
    candidates: [first, second],
    sources: [],
    sourceType: "same-ballot",
  };
}

function compareCandidateGroups(a: Candidate[], b: Candidate[]) {
  const firstA = a[0];
  const firstB = b[0];

  return (
    raceRank[firstA.race] - raceRank[firstB.race] ||
    firstA.office.localeCompare(firstB.office, "ko-KR") ||
    b.length - a.length
  );
}

function getFallbackIssueTags(first: Candidate, second: Candidate) {
  const tags = [...first.focusTags, ...second.focusTags]
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && !tag.includes("비례대표"));

  return Array.from(new Set(tags)).slice(0, 4);
}
