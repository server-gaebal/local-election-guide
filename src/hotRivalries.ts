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
    interestSummary: [
      "서울은 조사기관과 시점에 따라 초박빙과 오차범위 밖 우세가 함께 나오는 최대 관심 구도입니다.",
      "정원오는 생활밀착형 행정 경험과 통근·주거 공약을 앞세우고, 오세훈은 현직 시장의 시정 연속성과 주택 공급 속도를 강조합니다.",
      "교통, 주택공급, 시정 경험은 기본 쟁점이고, 서소문 고가도로 붕괴 이후 도시안전 이슈까지 막판 변수로 올라왔습니다.",
      "그래서 서울은 단순히 누가 앞서느냐보다 누가 더 안정적으로 바꾸고 관리할 수 있나의 싸움에 가깝습니다.",
      "기사별 온도 차가 남아 있는 만큼, 마지막까지 가장 많은 관심이 몰릴 라이벌전입니다.",
    ].join("\n"),
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
    interestSummary: [
      "부산은 전통적 보수 강세 지역이지만 전재수·박형준 구도가 오차범위 내 2.0%p 차까지 좁혀지며 접전 신호가 켜졌습니다.",
      "전재수는 변화와 해양수도·AI 산업 중심의 지역경제 재설계를 말하고, 박형준은 현직 프리미엄과 시정 연속성을 내세웁니다.",
      "청년자산, 가덕신공항, 산업 전환 같은 큰 의제가 생활 이슈와 같이 묶여 있어 메시지 싸움도 꽤 선명합니다.",
      "적극 투표층과 권역별 격차가 실제 승부처가 될 가능성이 커, 투표율 변화에 특히 민감한 지역입니다.",
      "부산의 관전 포인트는 익숙한 안정감이냐, 예상 밖 변화냐의 선택입니다.",
    ].join("\n"),
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
    interestSummary: [
      "대구는 보수 텃밭이라는 기본값 위에서 김부겸·추경호 구도가 오차범위 안팎으로 엇갈리며 초접전 지역으로 떠올랐습니다.",
      "김부겸은 지역 돌파력과 대구경제 회복 메시지를, 추경호는 보수 결집력과 경제관료 이미지를 전면에 둡니다.",
      "TK신공항, 행정통합, 산업 전환 같은 큰 이슈가 붙어 있어 단순 정당 대결보다 지역 미래 경쟁 성격도 큽니다.",
      "조사마다 결이 엇갈리는 만큼 숨어 있던 지지층이 실제 투표장에 얼마나 나오느냐가 중요합니다.",
      "대구는 이번 선거에서 이변 가능성이라는 단어가 가장 잘 어울리는 지역입니다.",
    ].join("\n"),
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
    interestSummary: [
      "충남은 박수현·김태흠 구도가 0.4%p 차까지 좁혀진, 숫자만 보면 가장 날카로운 초접전 지역입니다.",
      "박수현은 충청권 개발과 변화의 동력을 말하고, 김태흠은 현역 평가와 도정 연속성을 중심에 둡니다.",
      "천안·아산·당진권과 농어촌권의 표심 차이가 커서 지역별 투표율이 결과에 바로 영향을 줄 수 있습니다.",
      "경제자유구역, 농어촌, 현역 평가 같은 의제가 맞물려 있어 막판 메시지 하나도 가볍지 않습니다.",
      "충남은 말 그대로 막판 하루, 막판 한 동네의 투표율이 결과를 바꿀 수 있는 선거입니다.",
    ].join("\n"),
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
    interestSummary: [
      "충북은 신용한·김영환 구도가 4.6%p 차 오차범위 내 접전으로 분류된 잠복형 격전지입니다.",
      "신용한은 교체와 새 성장 전략을, 김영환은 현역 도정 경험과 정책 연속성을 중심에 둡니다.",
      "청주권 표심, 첨단산업, 교통망, 현역 평가가 한꺼번에 걸려 있어 조용해 보여도 변수는 많습니다.",
      "특히 현역 평가가 강하게 작동할수록 찬반 표심이 더 뚜렷하게 갈릴 가능성이 있습니다.",
      "충북은 크게 시끄럽진 않아도 마지막에 흔들릴 수 있는, 끝까지 봐야 하는 접전지입니다.",
    ].join("\n"),
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
