import type { RegionDataset } from "./dataLoader";
import type { Candidate, Pledge, RaceType, Residence, VoterProfile } from "./electionTypes";
import { isCrimeRecordClean, type NecCandidateInfoIndex, type NecCandidateInfoRecord } from "./necCandidateInfo";
import type { NecNormalizedCandidate } from "./necCrawler";

export type NecResidenceBuildInput = {
  residence: Residence;
  generatedAt: string;
  candidates: NecNormalizedCandidate[];
  downloads: NecDownloadIndex;
  candidateInfo?: NecCandidateInfoIndex;
};

export type NecDownloadIndex = Map<
  string,
  {
    textPath: string;
    sourceType?: "fivePledges" | "campaignBulletin";
    sourceLabel?: "5대공약" | "선거공보";
    pledgeTitles: string[];
    pledges?: Pledge[];
    policyTags?: string[];
  }
>;

type ResidenceElectionScope = {
  districtHeadDistrict?: string;
  cityCouncilDistrict?: string;
  localCouncilDistrict?: string;
};

const residenceElectionScopes: Record<string, ResidenceElectionScope> = {
  "seoul-mapo-gongdeok": {
    cityCouncilDistrict: "마포구제1선거구",
    localCouncilDistrict: "마포구가선거구",
  },
};

const partyColors: Record<string, string> = {
  더불어민주당: "#2563eb",
  국민의힘: "#dc2626",
  조국혁신당: "#1d4ed8",
  개혁신당: "#f97316",
  진보당: "#b91c1c",
  정의당: "#facc15",
  기본소득당: "#14b8a6",
  사회민주당: "#7c3aed",
  자유통일당: "#0f172a",
  무소속: "#475569",
};

const raceOrder: Record<string, number> = {
  "3": 10,
  "11": 20,
  "4": 30,
  "5": 40,
  "6": 50,
  "8": 60,
  "9": 70,
};

const profileRelevance: Record<VoterProfile, string> = {
  청년: "원문 공약에서 청년·주거·교통·일자리 키워드를 우선 확인해야 합니다.",
  학부모: "교육·돌봄·통학·생활안전 공약과 연결되는지 확인해야 합니다.",
  소상공인: "상권·규제·교통 접근성·지역 예산 공약과 연결되는지 확인해야 합니다.",
  고령층: "복지·의료·보행·대중교통 공약과 연결되는지 확인해야 합니다.",
};

const policyTagKeywords: Record<string, string[]> = {
  교통: ["교통", "철도", "지하철", "버스", "GTX", "도로", "정류소", "통근", "이동", "환승"],
  주거: ["주택", "주거", "공공임대", "재개발", "재건축", "월세", "전세", "역세권"],
  복지: ["복지", "돌봄", "연금", "장애", "취약", "노후", "어르신", "고령", "의료"],
  교육: ["교육", "학교", "학습", "돌봄", "통학", "청소년", "학생", "급식"],
  청년: ["청년", "창업", "일자리", "취업", "신혼", "월세", "대학"],
  경제: ["경제", "산업", "기업", "투자", "일자리", "창업", "상권", "관광"],
  안전: ["안전", "방재", "재난", "범죄", "보행", "안심", "소방"],
  환경: ["환경", "기후", "탄소", "녹지", "공원", "에너지", "재생"],
  행정: ["행정", "민원", "공개", "투명", "소통", "예산", "공공"],
  문화: ["문화", "관광", "체육", "예술", "콘텐츠", "축제"],
  농업: ["농업", "농촌", "농민", "어업", "어촌", "축산"],
};

export function extractPledgeTitles(text: string, limit = 5) {
  return extractPledges(text, limit).map((pledge) => pledge.title);
}

export function extractPledges(text: string, limit = 5): Pledge[] {
  const pledges: Pledge[] = [];
  const seen = new Set<string>();
  const blocks = splitPledgeBlocks(text);

  for (const block of blocks) {
    const title = extractPledgeTitleFromBlock(block);

    if (!title || seen.has(title)) {
      continue;
    }

    seen.add(title);
    pledges.push({
      title,
      detail: extractPledgeDetailFromBlock(block, title),
    });

    if (pledges.length >= limit) {
      return pledges;
    }
  }

  return pledges.length > 0 ? pledges : extractBulletinPledges(text, limit);
}

export function extractPolicyTags(value: string, limit = 4) {
  const tagScores = Object.entries(policyTagKeywords)
    .map(([tag, keywords]) => ({
      tag,
      score: keywords.reduce((sum, keyword) => sum + countOccurrences(value, keyword), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag));

  return tagScores.slice(0, limit).map((item) => item.tag);
}

export function buildResidenceDatasetFromNec({
  residence,
  generatedAt,
  candidates,
  downloads,
  candidateInfo = new Map(),
}: NecResidenceBuildInput): RegionDataset {
  const scope = residence.electionScope ?? residenceElectionScopes[residence.id];

  if (!scope) {
    throw new Error(`No NEC election scope configured for ${residence.id}`);
  }

  const selectedRows = candidates
    .filter((candidate) => isInResidenceScope(candidate, residence, scope))
    .sort(sortNecRows);
  const comparisonCounts = countBy(selectedRows, (candidate) => comparisonKeyFor(candidate, residence, scope));
  const comparisonPolicyCounts = buildComparisonPolicyCounts(selectedRows, residence, scope, downloads);

  return {
    residence,
    candidates: selectedRows.map((candidate, index) =>
      toAppCandidate({
        candidate,
        residence,
        scope,
        fallbackOrder: index + 1,
        generatedAt,
        download: downloads.get(candidate.id),
        disclosure: candidateInfo.get(candidate.candidateId ?? ""),
        comparisonDistrict: comparisonDistrictFor(candidate, residence, scope),
        sameComparisonCount: comparisonCounts.get(comparisonKeyFor(candidate, residence, scope)) ?? 1,
        comparisonPolicyCounts: comparisonPolicyCounts.get(comparisonKeyFor(candidate, residence, scope)) ?? {
          issueCounts: new Map(),
        },
      }),
    ),
    source: {
      mode: "nec",
      generatedAt,
      sourceName: "선관위 정책공약마당 · 후보자 정보공개",
      sourceUrl: "https://policy.nec.go.kr/",
      pdfCount: selectedRows.filter((candidate) => candidate.fivePledgePdf || candidate.campaignBulletinPdf).length,
    },
  };
}

function isInResidenceScope(
  candidate: NecNormalizedCandidate,
  residence: Residence,
  scope: ResidenceElectionScope,
) {
  switch (candidate.raceTypeCode) {
    case "3":
    case "11":
    case "8":
      return candidate.districtName === residence.city;
    case "4":
    case "9":
      return candidate.districtName === (scope.districtHeadDistrict ?? residence.district);
    case "5":
      return Boolean(scope.cityCouncilDistrict) && candidate.districtName === scope.cityCouncilDistrict;
    case "6":
      return Boolean(scope.localCouncilDistrict) && candidate.districtName === scope.localCouncilDistrict;
    default:
      return false;
  }
}

function toAppCandidate({
  candidate,
  residence,
  scope,
  fallbackOrder,
  generatedAt,
  download,
  disclosure,
  comparisonDistrict,
  sameComparisonCount,
  comparisonPolicyCounts,
}: {
  candidate: NecNormalizedCandidate;
  residence: Residence;
  scope: ResidenceElectionScope;
  fallbackOrder: number;
  generatedAt: string;
  download?: {
    textPath: string;
    sourceType?: "fivePledges" | "campaignBulletin";
    sourceLabel?: "5대공약" | "선거공보";
    pledgeTitles: string[];
    pledges?: Pledge[];
    policyTags?: string[];
  };
  disclosure?: NecCandidateInfoRecord;
  comparisonDistrict: string;
  sameComparisonCount: number;
  comparisonPolicyCounts: {
    issueCounts: Map<string, number>;
  };
}): Candidate {
  const isPartyVote = candidate.name.length === 0;
  const displayName = isPartyVote ? `${candidate.partyName} 비례대표` : candidate.name;
  const hasFivePledgePdf = Boolean(candidate.fivePledgePdf);
  const hasCampaignBulletinPdf = Boolean(candidate.campaignBulletinPdf);
  const parsedPledges = download?.pledges?.length ? download.pledges : undefined;
  const pledgeTitles = parsedPledges?.map((pledge) => pledge.title) ?? download?.pledgeTitles ?? [];
  const policySourceLabel = download?.sourceLabel ?? (hasFivePledgePdf ? "5대공약" : hasCampaignBulletinPdf ? "선거공보" : undefined);
  const fallbackPath = candidate.fivePledgePdf?.requestedFullPath ?? candidate.campaignBulletinPdf?.requestedFullPath;
  const hasDownloadedSource = Boolean(download);
  const fullPledges =
    parsedPledges ??
    buildPledgesFromTitles(pledgeTitles, hasFivePledgePdf, download?.textPath ?? fallbackPath, policySourceLabel, hasDownloadedSource);
  const hasPolicyText = Boolean(download?.pledges?.length);
  const policyTags =
    download?.policyTags ?? extractPolicyTags((download?.pledges ?? []).map((pledge) => `${pledge.title} ${pledge.detail}`).join(" "));
  const policyIssues = extractPolicyIssues(download?.pledges ?? []);
  const office = officeFor(candidate, residence, scope);
  const number = Number.parseInt(candidate.candidateNumber, 10);
  const comparison = buildComparison({
    candidate,
    displayName,
    office,
    comparisonDistrict,
    policyTags,
    policyIssues,
    comparisonPolicyCounts,
    sameComparisonCount,
    hasPolicyText,
  });

  return {
    id: candidate.id,
    residenceId: residence.id,
    name: displayName,
    number: Number.isFinite(number) ? number : fallbackOrder,
    numberLabel: isPartyVote ? "정당투표" : undefined,
    party: candidate.partyName || "무소속",
    race: raceTypeFor(candidate),
    office,
    age: disclosure?.age ?? 0,
    occupation: isPartyVote
      ? "비례대표 정당 선택"
      : disclosure?.occupation || candidate.occupation || "후보자 정보 확인 필요",
    color: partyColors[candidate.partyName] ?? "#0f766e",
    photoUrl: candidate.thumbnailUrl ?? undefined,
    criminalRecord: buildCriminalRecord(isPartyVote, disclosure),
    publicRecord: buildPublicRecords(candidate, disclosure),
    focusTags: buildFocusTags(candidate, hasFivePledgePdf, hasCampaignBulletinPdf, policyTags),
    candidateTraits: buildCandidateTraits(candidate, disclosure, policyTags, policySourceLabel),
    pledgeSummary: buildPledgeSummary(
      candidate,
      pledgeTitles,
      policyTags,
      hasFivePledgePdf,
      hasCampaignBulletinPdf,
      hasDownloadedSource,
      policySourceLabel,
    ),
    pledgeHighlights:
      pledgeTitles.length > 0
        ? pledgeTitles.map((title) => normalizeWhitespace(title))
        : fallbackHighlights(hasFivePledgePdf, hasCampaignBulletinPdf, isPartyVote, hasDownloadedSource),
    comparison: comparison.summary,
    comparisonDetails: comparison.details,
    fullPledges,
    profileRelevance,
    cache: {
      policyPdf:
        download?.textPath ??
        candidate.fivePledgePdf?.requestedFullPath ??
        candidate.campaignBulletinPdf?.requestedFullPath ??
        "NEC row metadata only",
      normalizedAt: generatedAt,
    },
  };
}

function officeFor(candidate: NecNormalizedCandidate, residence: Residence, scope: ResidenceElectionScope) {
  switch (candidate.raceTypeCode) {
    case "3":
      return wideGovernmentHeadOfficeName(residence.city);
    case "11":
      return `${residence.city}교육감`;
    case "4":
      return localGovernmentHeadOfficeName(scope.districtHeadDistrict ?? residence.district);
    case "5":
      return `${cityCouncilOfficeName(residence.city)} ${scope.cityCouncilDistrict ?? candidate.districtName}`;
    case "6":
      return `${scope.districtHeadDistrict ?? residence.district}의원 ${scope.localCouncilDistrict ?? candidate.districtName}`;
    case "8":
      return `${cityCouncilOfficeName(residence.city)} 비례대표`;
    case "9":
      return `${scope.districtHeadDistrict ?? residence.district}의원 비례대표`;
    default:
      return candidate.raceName;
  }
}

function comparisonKeyFor(candidate: NecNormalizedCandidate, residence: Residence, scope: ResidenceElectionScope) {
  return [candidate.raceTypeCode, comparisonDistrictFor(candidate, residence, scope), officeFor(candidate, residence, scope)].join("\u0000");
}

function comparisonDistrictFor(candidate: NecNormalizedCandidate, residence: Residence, scope: ResidenceElectionScope) {
  switch (candidate.raceTypeCode) {
    case "3":
    case "11":
    case "8":
      return residence.city;
    case "4":
    case "9":
      return scope.districtHeadDistrict ?? residence.district;
    case "5":
      return scope.cityCouncilDistrict ?? candidate.districtName;
    case "6":
      return scope.localCouncilDistrict ?? candidate.districtName;
    default:
      return candidate.districtName || residence.district;
  }
}

function raceTypeFor(candidate: NecNormalizedCandidate): RaceType {
  switch (candidate.raceTypeCode) {
    case "3":
      return "광역단체장";
    case "11":
      return "교육감";
    case "4":
      return "기초단체장";
    case "5":
    case "8":
      return "광역의원";
    case "6":
    case "9":
      return "기초의원";
    default:
      return "기초의원";
  }
}

function buildCriminalRecord(isPartyVote: boolean, disclosure?: NecCandidateInfoRecord): Candidate["criminalRecord"] {
  if (isPartyVote) {
    return {
      summary: "정당 투표",
      details: "비례대표 선출을 위한 정당 선택 항목입니다. 후보 개인 범죄기록과는 다른 데이터입니다.",
      tone: "notice",
    };
  }

  if (!disclosure) {
    return {
      summary: "전과 정보 확인 필요",
      details: "선거통계시스템 후보자 정보공개 자료와 아직 매칭되지 않았습니다.",
      tone: "notice",
    };
  }

  return {
    summary: isCrimeRecordClean(disclosure.crimeRecord) ? "전과 없음" : `전과 ${disclosure.crimeRecord}`,
    details: [
      `선거통계시스템 후보자 명부 기준 전과기록유무(건수): ${disclosure.crimeRecord}.`,
      disclosure.crimeDisclosureFiles.length > 0
        ? `전과 증명서 스캔 파일 ${disclosure.crimeDisclosureFiles.length}건이 공개되어 있습니다.`
        : "전과 증명서 스캔 파일은 후보자 정보공개 원문에서 추가 확인해야 합니다.",
    ].join(" "),
    tone: isCrimeRecordClean(disclosure.crimeRecord) ? "clean" : "risk",
    disclosureFiles: disclosure.crimeDisclosureFiles,
  };
}

function buildPublicRecords(candidate: NecNormalizedCandidate, disclosure?: NecCandidateInfoRecord) {
  const records = [
    disclosure?.education || candidate.education ? `학력: ${disclosure?.education || candidate.education}` : "학력 정보 확인 필요",
    candidate.districtName ? `선거구: ${candidate.districtName}` : "선거구 정보 확인 필요",
  ];

  if (disclosure) {
    records.push(
      `재산신고액: ${formatThousandWon(disclosure.assets)}`,
      `병역: ${disclosure.military}`,
      `납세 납부액: ${formatThousandWon(disclosure.taxPaid)}`,
      `입후보: ${disclosure.electionCount}`,
    );
  }

  if (candidate.fivePledgePdf) {
    records.push("5대공약 PDF 있음");
  } else if (candidate.campaignBulletinPdf) {
    records.push("선거공보 PDF 있음");
  }

  return records;
}

function formatThousandWon(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  const amountInThousands = Number.parseInt(normalized, 10);

  if (!Number.isFinite(amountInThousands)) {
    return value;
  }

  if (amountInThousands === 0) {
    return "0원";
  }

  const sign = amountInThousands < 0 ? "-" : "";
  let remainingThousands = Math.abs(amountInThousands);
  const eok = Math.floor(remainingThousands / 100_000);
  remainingThousands %= 100_000;
  const man = Math.floor(remainingThousands / 10);
  const cheon = remainingThousands % 10;
  const parts = [];

  if (eok > 0) {
    parts.push(`${eok.toLocaleString("ko-KR")}억`);
  }

  if (man > 0) {
    parts.push(`${man.toLocaleString("ko-KR")}만`);
  }

  if (cheon > 0) {
    parts.push(`${cheon}천`);
  }

  return `${sign}${parts.join(" ")}원`;
}

function buildFocusTags(
  candidate: NecNormalizedCandidate,
  hasFivePledgePdf: boolean,
  hasCampaignBulletinPdf: boolean,
  policyTags: string[],
) {
  return [
    candidate.raceName.replace(/선거$/, ""),
    candidate.districtName || "비례",
    ...policyTags.slice(0, 2),
    hasFivePledgePdf ? "5대공약" : hasCampaignBulletinPdf ? "선거공보" : "",
  ].filter(Boolean).slice(0, 5);
}

function buildCandidateTraits(
  candidate: NecNormalizedCandidate,
  disclosure: NecCandidateInfoRecord | undefined,
  policyTags: string[],
  policySourceLabel?: string,
) {
  const traits = [
    candidate.partyName ? `${candidate.partyName} 소속` : "정당 정보 확인 필요",
    disclosure?.career ? `주요 경력: ${shortenText(disclosure.career, 48)}` : candidate.occupation ? `직업: ${candidate.occupation}` : "",
    policyTags.length > 0 ? `공약 키워드: ${policyTags.slice(0, 3).join("·")}` : "",
    policySourceLabel ? `근거 자료: ${policySourceLabel}` : "근거 자료: 후보 메타데이터",
  ];

  return traits.filter(Boolean).slice(0, 4);
}

function buildPledgeSummary(
  candidate: NecNormalizedCandidate,
  pledgeTitles: string[],
  policyTags: string[],
  hasFivePledgePdf: boolean,
  hasCampaignBulletinPdf: boolean,
  hasDownloadedSource: boolean,
  policySourceLabel?: string,
) {
  if (pledgeTitles.length > 0) {
    const tagText = policyTags.length > 0 ? `${policyTags.join("·")} 중심으로 ` : "";
    const sourceText = policySourceLabel ? `${policySourceLabel} 원문에서 ` : "";
    return `${candidateSubject(candidate)} ${sourceText}${tagText}${normalizeWhitespace(pledgeTitles[0])} 등 ${pledgeTitles.length}개 항목을 제시했습니다.`;
  }

  if (hasFivePledgePdf) {
    return "NEC 정책공약마당에 5대공약 PDF가 공개되어 있습니다. 자동으로 읽을 수 있는 세부 문장이 부족해 원문 확인이 필요합니다.";
  }

  return "";
}

function fallbackHighlights(
  hasFivePledgePdf: boolean,
  hasCampaignBulletinPdf: boolean,
  isPartyVote: boolean,
  hasDownloadedSource: boolean,
) {
  if (isPartyVote) {
    if (hasCampaignBulletinPdf && hasDownloadedSource) {
      return ["비례대표 정당 투표 항목", "정당별 선거공보"];
    }

    return hasCampaignBulletinPdf ? ["비례대표 정당 투표 항목", "정당별 선거공보"] : ["비례대표 정당 투표 항목"];
  }

  if (hasFivePledgePdf) {
    return ["5대공약 PDF 공개", "공약 원문 확인 가능", "세부 설명 원문 확인 필요"];
  }

  if (hasCampaignBulletinPdf) {
    return ["선거공보"];
  }

  return [];
}

function buildFullPledges(
  pledgeTitles: string[],
  hasFivePledgePdf: boolean,
  requestedFullPath?: string,
  policySourceLabel?: string,
): Pledge[] {
  return buildPledgesFromTitles(pledgeTitles, hasFivePledgePdf, requestedFullPath, policySourceLabel, false);
}

function buildPledgesFromTitles(
  pledgeTitles: string[],
  hasFivePledgePdf: boolean,
  requestedFullPath?: string,
  policySourceLabel?: string,
  hasDownloadedSource = false,
): Pledge[] {
  if (pledgeTitles.length > 0) {
    return pledgeTitles.map((title) => ({
      title,
      detail: `${policySourceLabel ?? "PDF"} 원문에서 추출한 항목입니다. 세부 내용은 원문 확인이 필요합니다.`,
    }));
  }

  if (hasFivePledgePdf) {
    return [
      {
        title: "5대공약 원문 PDF 확보",
        detail: "NEC 정책공약마당에 5대공약 원문 PDF가 공개되어 있습니다. 세부 내용은 원문에서 확인해 주세요.",
      },
    ];
  }

  if (hasDownloadedSource && policySourceLabel) {
    return [];
  }

  return [];
}

function buildComparisonPolicyCounts(
  candidates: NecNormalizedCandidate[],
  residence: Residence,
  scope: ResidenceElectionScope,
  downloads: NecDownloadIndex,
) {
  const comparisonPolicyCounts = new Map<string, { issueCounts: Map<string, number> }>();

  for (const candidate of candidates) {
    const comparisonKey = comparisonKeyFor(candidate, residence, scope);
    const issues = candidateIssues(downloads.get(candidate.id));
    const counts = comparisonPolicyCounts.get(comparisonKey) ?? {
      issueCounts: new Map<string, number>(),
    };

    for (const issue of issues) {
      counts.issueCounts.set(issue, (counts.issueCounts.get(issue) ?? 0) + 1);
    }

    comparisonPolicyCounts.set(comparisonKey, counts);
  }

  return comparisonPolicyCounts;
}

function candidateIssues(download?: { pledges?: Pledge[] }) {
  return extractPolicyIssues(download?.pledges ?? []);
}

function extractPolicyIssues(pledges: Pledge[], limit = 6) {
  const seen = new Set<string>();
  const issues: string[] = [];

  for (const pledge of pledges) {
    for (const phrase of [pledge.title, ...extractActionPhrases(pledge.detail)]) {
      const normalized = cleanPolicyIssue(phrase);

      if (!isSpecificPolicyIssue(normalized) || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      issues.push(normalized);

      if (issues.length >= limit) {
        return issues;
      }
    }
  }

  return issues;
}

function extractActionPhrases(value: string) {
  const normalized = normalizeWhitespace(value);
  const actionPattern =
    /([가-힣A-Za-z0-9·()\- ]{3,42}(?:개통|추진|지원|통합|확대|증대|조정|설치|조성|구축|유치|반영|착공|확보|정비|수립|협의|운행|개선|해소|공급|보장|강화))(?:합니다|한다|하고|하며|,|\.|$)?/g;

  return Array.from(normalized.matchAll(actionPattern), (match) => match[1]);
}

function cleanPolicyIssue(value: string) {
  return normalizeWhitespace(value)
    .replace(/^[○□■·\-–•]+/, "")
    .replace(/^(?:주요내용|핵심추진과제|정책|공약)\s*/g, "")
    .replace(/[.,;:]+$/g, "")
    .trim();
}

function isSpecificPolicyIssue(value: string) {
  if (value.length < 4 || !/[가-힣A-Za-z0-9]{2}/.test(value)) {
    return false;
  }

  return !Object.keys(policyTagKeywords).includes(value);
}

function buildComparison({
  candidate,
  displayName,
  office,
  comparisonDistrict,
  policyTags,
  policyIssues,
  comparisonPolicyCounts,
  sameComparisonCount,
  hasPolicyText,
}: {
  candidate: NecNormalizedCandidate;
  displayName: string;
  office: string;
  comparisonDistrict: string;
  policyTags: string[];
  policyIssues: string[];
  comparisonPolicyCounts: {
    issueCounts: Map<string, number>;
  };
  sameComparisonCount: number;
  hasPolicyText: boolean;
}) {
  const partyText = candidate.partyName ? `${candidate.partyName} ` : "";
  const subject = candidate.name ? `${partyText}${displayName} 후보는` : `${displayName}은`;
  const officeText = officeContextText(office);

  if (!hasPolicyText || policyTags.length === 0) {
    return {
      summary: `${officeText} ${subject} 공개 공약 정보가 부족해 기본 공개자료 중심으로 비교가 필요합니다.`,
      details: [
        "공약 차이를 판단할 원문 정보가 부족합니다. 정당, 전과, 재산·납세, 경력 같은 공개 기본정보부터 비교해 주세요.",
        "상세 공약이 공개되면 같은 투표지 후보와 대상, 실행 방식, 재원 문구를 나란히 확인해야 합니다.",
      ],
    };
  }

  const distinctiveIssues = policyIssues.filter((issue) => (comparisonPolicyCounts.issueCounts.get(issue) ?? 0) <= 1);
  const leadIssues = distinctiveIssues.length > 0 ? distinctiveIssues : policyIssues;
  const leadText = leadIssues.length > 0 ? leadIssues.slice(0, 2).join("·") : policyTags.slice(0, 2).join("·");

  if (sameComparisonCount <= 1) {
    return {
      summary: `${officeText} ${subject} ${leadText} 공약을 중심으로 단독 비교됩니다.`,
      details: [
        "같은 선거구의 비교 후보가 없어 이 후보의 공약 문구만 확인했습니다.",
        `눈여겨볼 실행 문구: ${(leadIssues.length > 0 ? leadIssues : policyTags).slice(0, 4).join(", ")}.`,
      ],
    };
  }

  return {
    summary: `${officeText} ${subject} ${leadText} 쟁점을 앞세웁니다.`,
    details: [
      distinctiveIssues.length > 0
        ? `눈여겨볼 차이: ${distinctiveIssues.slice(0, 4).join(", ")}.`
        : "세부 차이 보류: 다른 후보와 겹치는 주제가 많아 실행 방식까지 확인해야 합니다.",
      `실행 방식 확인: ${(leadIssues.length > 0 ? leadIssues : policyTags).slice(0, 3).join(", ")}.`,
    ],
  };
}

function officeContextText(office: string) {
  return office.endsWith("비례대표") ? `${office} 투표에서` : `${office} 선거에서`;
}

function shortenText(value: string, maxLength: number) {
  const normalized = normalizeWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function candidateSubject(candidate: NecNormalizedCandidate) {
  if (!candidate.name) {
    return `${candidate.partyName || "해당 정당"}은`;
  }

  return `${candidate.name} 후보${candidate.partyName ? `(${candidate.partyName})` : ""}는`;
}

function splitPledgeBlocks(text: string) {
  return text
    .replace(/\r/g, "")
    .split(/(?=\n?\s*공약순위\s*:?\s*\d*)/g)
    .map((block) => block.trim())
    .filter((block) => block.includes("공약순위"));
}

function extractPledgeTitleFromBlock(block: string) {
  const header = normalizeWhitespace(block.split("\n").slice(0, 6).join(" "));
  const patterns = [
    /공약순위\s*:?\s*\d+\s*제목\s*:?\s*(.+?)(?:\s*(?:□\s*)?목\s*표|\s*이행방법|$)/,
    /공약순위\s*:?\s*\d+\s+(.+?)(?:\s*(?:□\s*)?목\s*표|\s*이행방법|$)/,
    /공약순위\s+제목\s+(.+?)(?:\s*(?:□\s*)?목\s*표|\s*이행방법|$)/,
  ];

  for (const pattern of patterns) {
    const match = header.match(pattern);
    const title = match ? cleanPledgeTitle(match[1]) : "";

    if (title) {
      return title;
    }
  }

  return "";
}

function extractPledgeDetailFromBlock(block: string, title: string) {
  const lines = block
    .split("\n")
    .map(cleanPledgeLine)
    .filter((line) => isMeaningfulPledgeLine(line, title));
  const targetSectionLines = extractTargetSectionLines(lines, 2);
  const methodSectionLines = extractSectionLines(lines, /^(?:□\s*)?이행방법/, /^(?:□\s*)?(?:이행기간|재원조달)/, 4);
  const fallbackLines = lines.filter(isUsefulDetailLine);
  const selectedLines = methodSectionLines.length > 0 ? methodSectionLines : targetSectionLines.length > 0 ? targetSectionLines : fallbackLines.slice(0, 3);
  const detail = normalizeWhitespace(selectedLines.join(" "));

  return detail || "PDF 원문에서 제목을 추출했으나 목표·이행방법 문장은 추가 확인이 필요합니다.";
}

function extractBulletinPledges(text: string, limit: number): Pledge[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(cleanBulletinLine)
    .filter((line) => line && !isBulletinNoiseLine(line));
  const policyLines = lines.slice(findBulletinPolicyStartIndex(lines));
  const pledges: Pledge[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < policyLines.length; index += 1) {
    const numberedTitle = extractBulletinNumberedTitle(policyLines, index);

    if (!numberedTitle) {
      continue;
    }

    const { title, nextIndex } = numberedTitle;

    if (seen.has(title)) {
      continue;
    }

    const detail = extractBulletinDetail(policyLines, nextIndex, title);

    seen.add(title);
    pledges.push({
      title,
      detail,
    });

    if (pledges.length >= limit) {
      return pledges;
    }
  }

  return pledges;
}

function findBulletinPolicyStartIndex(lines: string[]) {
  const markerIndex = lines.findIndex(
    (line) => /(달라집니다|약속|비전|공약|프로젝트|대전환)/.test(line) && !isBulletinNoiseLine(line),
  );

  return markerIndex >= 0 ? markerIndex : 0;
}

function extractBulletinNumberedTitle(lines: string[], index: number) {
  const line = lines[index];
  const singleNumber = line.match(/^(?:공약\s*)?([1-5])[.)]?$/);

  if (singleNumber && lines[index + 1]) {
    const title = cleanBulletinTitle(lines[index + 1]);

    return isBulletinTitle(title) ? { title, nextIndex: index + 2 } : null;
  }

  const match = line.match(/^(?:공약\s*)?(?:[1-5][.)]|[①②③④⑤])\s*(.+)$/);
  const title = match ? cleanBulletinTitle(match[1]) : "";

  return isBulletinTitle(title) ? { title, nextIndex: index + 1 } : null;
}

function extractBulletinDetail(lines: string[], startIndex: number, title: string) {
  const details: string[] = [];

  for (const line of lines.slice(startIndex)) {
    if (/^(?:공약\s*)?[1-5][.)]?$/.test(line) || extractBulletinNumberedTitle([line], 0)) {
      break;
    }

    const detail = cleanBulletinDetailLine(line);

    if (!isBulletinDetailLine(detail, title)) {
      continue;
    }

    details.push(detail);

    if (details.length >= 3) {
      break;
    }
  }

  const normalized = normalizeWhitespace(details.join(" "));

  return normalized || "선거공보 원문에서 제목을 추출했으나 세부 설명은 추가 확인이 필요합니다.";
}

function cleanBulletinLine(value: string) {
  return normalizeWhitespace(value.replace(/[\u0000-\u001f\u007f]/g, ""))
    .replace(/^\f+/, "")
    .replace(/^[·\-–•]+/, "")
    .replace(/^[○□■]+/, "")
    .trim();
}

function cleanBulletinTitle(value: string) {
  return cleanPledgeTitle(value)
    .replace(/^[.)·\-–•]+/, "")
    .replace(/\s*\([^)]*쪽\)\s*$/g, "")
    .trim();
}

function cleanBulletinDetailLine(value: string) {
  return cleanBulletinTitle(value).replace(/^[·\-–•]+/, "").trim();
}

function isBulletinTitle(title: string) {
  return (
    title.length >= 4 &&
    title.length <= 30 &&
    /[가-힣]{2}/.test(title) &&
    !isBulletinNoiseLine(title) &&
    !/[.?!]$/.test(title)
  );
}

function isBulletinDetailLine(line: string, title: string) {
  return (
    line.length >= 6 &&
    line !== title &&
    /[가-힣]{2}/.test(line) &&
    !isBulletinNoiseLine(line) &&
    !extractBulletinNumberedTitle([line], 0)
  );
}

function isBulletinNoiseLine(line: string) {
  return /^(후보자|후보자정보|후보자 정보|정보공개|공개자료|인적사항|재산|병역|납세|세금|체납|납부|전과|소명서|선거명|선거구명|후보자명|기호|성명|생년월일|직업|학력|경력|주소|소속정당명|책자형|점자형|후원회|회계책임자|전화|팩스|홈페이지|이메일|제\d+회|투표일|사전투표|작성근거)/.test(
    line,
  );
}

function extractTargetSectionLines(lines: string[], maxLines = 2) {
  return extractSectionLines(lines, /^(?:□\s*)?목\s*표|^목표/, /^(?:□\s*)?(?:이행방법|이행기간|재원조달)/, maxLines);
}

function extractSectionLines(lines: string[], startPattern: RegExp, endPattern: RegExp, maxLines = 2) {
  const startIndex = lines.findIndex((line) => startPattern.test(line));

  if (startIndex < 0) {
    return [];
  }

  const sectionLines: string[] = [];

  for (const line of lines.slice(startIndex + 1)) {
    if (endPattern.test(line)) {
      break;
    }

    if (isUsefulDetailLine(line)) {
      sectionLines.push(line);
    }

    if (sectionLines.length >= maxLines) {
      break;
    }
  }

  return sectionLines;
}

function cleanPledgeLine(value: string) {
  return cleanPledgeTitle(value)
    .replace(/^[·\-–•]+/, "")
    .replace(/^[○□]+/, "")
    .trim();
}

function isMeaningfulPledgeLine(line: string, title: string) {
  if (!line || line === title) {
    return false;
  }

  if (/^(선거명|선거구명|후보자명|기호|소속정당명|공약순위|제목)/.test(line)) {
    return false;
  }

  if (line.length < 6 && !/목\s*표|이행방법/.test(line)) {
    return false;
  }

  return true;
}

function isUsefulDetailLine(line: string) {
  return line.length >= 8 && /[가-힣]{2}/.test(line) && !/^(목\s*표|목표|이행방법)$/.test(line);
}

function countOccurrences(value: string, keyword: string) {
  if (!keyword) {
    return 0;
  }

  return value.split(keyword).length - 1;
}

function sortNecRows(a: NecNormalizedCandidate, b: NecNormalizedCandidate) {
  return (
    (raceOrder[a.raceTypeCode] ?? 999) - (raceOrder[b.raceTypeCode] ?? 999) ||
    a.districtName.localeCompare(b.districtName) ||
    numericOrder(a.candidateNumber) - numericOrder(b.candidateNumber) ||
    a.partyName.localeCompare(b.partyName) ||
    a.name.localeCompare(b.name)
  );
}

function wideGovernmentHeadOfficeName(city: string) {
  return city.endsWith("도") ? `${city}지사` : `${city}장`;
}

function localGovernmentHeadOfficeName(district: string) {
  if (district.endsWith("군")) {
    return `${district}수`;
  }

  if (district.endsWith("시")) {
    return `${district}장`;
  }

  return `${district}청장`;
}

function cityCouncilOfficeName(city: string) {
  if (city === "서울특별시") {
    return "서울시의원";
  }

  if (city.endsWith("광역시")) {
    return `${city.replace(/광역시$/, "시")}의원`;
  }

  return `${city}의원`;
}

function numericOrder(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 999;
}

function cleanPledgeTitle(value: string) {
  return normalizeWhitespace(value)
    .replace(/[□○Ÿ■]+/g, "")
    .trim()
    .replace(/^[:\-–]+/, "")
    .trim();
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}
