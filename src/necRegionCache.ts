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

  return pledges;
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
  const officeCounts = countBy(selectedRows, (candidate) => officeFor(candidate, residence, scope));
  const officeTagCounts = buildOfficeTagCounts(selectedRows, residence, scope, downloads);

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
        sameOfficeCount: officeCounts.get(officeFor(candidate, residence, scope)) ?? 1,
        officeTagCounts: officeTagCounts.get(officeFor(candidate, residence, scope)) ?? new Map(),
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
  sameOfficeCount,
  officeTagCounts,
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
  sameOfficeCount: number;
  officeTagCounts: Map<string, number>;
}): Candidate {
  const isPartyVote = candidate.name.length === 0;
  const displayName = isPartyVote ? `${candidate.partyName} 비례대표` : candidate.name;
  const hasFivePledgePdf = Boolean(candidate.fivePledgePdf);
  const hasCampaignBulletinPdf = Boolean(candidate.campaignBulletinPdf);
  const pledgeTitles = download?.pledges?.map((pledge) => pledge.title) ?? download?.pledgeTitles ?? [];
  const policySourceLabel = download?.sourceLabel ?? (hasFivePledgePdf ? "5대공약" : hasCampaignBulletinPdf ? "선거공보" : undefined);
  const fallbackPath = candidate.fivePledgePdf?.requestedFullPath ?? candidate.campaignBulletinPdf?.requestedFullPath;
  const fullPledges = download?.pledges ?? buildPledgesFromTitles(pledgeTitles, hasFivePledgePdf, fallbackPath, policySourceLabel);
  const policyTags =
    download?.policyTags ?? extractPolicyTags((download?.pledges ?? []).map((pledge) => `${pledge.title} ${pledge.detail}`).join(" "));
  const office = officeFor(candidate, residence, scope);
  const number = Number.parseInt(candidate.candidateNumber, 10);
  const comparison = buildComparison({
    candidate,
    displayName,
    office,
    policyTags,
    officeTagCounts,
    sameOfficeCount,
    hasPolicyText: Boolean(download?.pledges?.length),
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
    pledgeSummary: buildPledgeSummary(candidate, pledgeTitles, policyTags, hasFivePledgePdf, hasCampaignBulletinPdf, policySourceLabel),
    pledgeHighlights:
      pledgeTitles.length > 0
        ? pledgeTitles.map((title) => shortenText(title, 72))
        : fallbackHighlights(hasFivePledgePdf, hasCampaignBulletinPdf, isPartyVote),
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
      `재산신고액: ${disclosure.assets}천원`,
      `병역: ${disclosure.military}`,
      `납세 납부액: ${disclosure.taxPaid}천원`,
      `입후보: ${disclosure.electionCount}`,
    );
  }

  if (candidate.fivePledgePdf) {
    records.push("5대공약 PDF 있음");
  } else if (candidate.campaignBulletinPdf) {
    records.push("선거공보 PDF 있음");
  } else {
    records.push("공약 PDF 없음");
  }

  return records;
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
    hasFivePledgePdf ? "5대공약" : hasCampaignBulletinPdf ? "선거공보" : "공약 미제공",
  ].filter(Boolean).slice(0, 5);
}

function buildPledgeSummary(
  candidate: NecNormalizedCandidate,
  pledgeTitles: string[],
  policyTags: string[],
  hasFivePledgePdf: boolean,
  hasCampaignBulletinPdf: boolean,
  policySourceLabel?: string,
) {
  if (pledgeTitles.length > 0) {
    const tagText = policyTags.length > 0 ? `${policyTags.join("·")} 중심으로 ` : "";
    const sourceText = policySourceLabel ? `${policySourceLabel} 원문에서 ` : "";
    return `${candidateSubject(candidate)} ${sourceText}${tagText}${shortenText(pledgeTitles[0], 72)} 등 ${pledgeTitles.length}개 항목을 제시했습니다.`;
  }

  if (hasFivePledgePdf) {
    return "NEC 정책공약마당의 5대공약 PDF를 확보했습니다. 텍스트 정제 후 요약과 후보 간 비교를 생성할 수 있습니다.";
  }

  if (hasCampaignBulletinPdf) {
    return "NEC 정책공약마당의 선거공보 PDF가 제공됩니다. 5대공약 PDF는 없어 선거공보 텍스트 추출로 보완해야 합니다.";
  }

  return "NEC 정책공약마당 후보/정당 row를 확보했습니다. 이 항목에는 5대공약 PDF가 제공되지 않아 선거공보 연동이 필요합니다.";
}

function fallbackHighlights(hasFivePledgePdf: boolean, hasCampaignBulletinPdf: boolean, isPartyVote: boolean) {
  if (isPartyVote) {
    return hasCampaignBulletinPdf
      ? ["비례대표 정당 투표 항목", "정당별 선거공보 PDF 제공", "선거공보 텍스트 추출 대기"]
      : ["비례대표 정당 투표 항목", "정당별 선거공보 row 확보", "후보 명부·공보 상세 연동 대기"];
  }

  if (hasFivePledgePdf) {
    return ["5대공약 PDF 확보", "후보 사진 URL 확보", "AI 요약·후보 간 비교 생성 대기"];
  }

  if (hasCampaignBulletinPdf) {
    return ["선거공보 PDF 제공", "후보 사진 URL 확보", "선거공보 텍스트 추출 대기"];
  }

  return ["후보 메타데이터 확보", "공약 PDF 미제공", "선거공보 원문 연동 대기"];
}

function buildFullPledges(
  pledgeTitles: string[],
  hasFivePledgePdf: boolean,
  requestedFullPath?: string,
  policySourceLabel?: string,
): Pledge[] {
  return buildPledgesFromTitles(pledgeTitles, hasFivePledgePdf, requestedFullPath, policySourceLabel);
}

function buildPledgesFromTitles(
  pledgeTitles: string[],
  hasFivePledgePdf: boolean,
  requestedFullPath?: string,
  policySourceLabel?: string,
): Pledge[] {
  if (pledgeTitles.length > 0) {
    return pledgeTitles.map((title) => ({
      title,
      detail: `${policySourceLabel ?? "PDF"} 원문에서 추출한 항목입니다. 본문 요약은 다음 정제 단계에서 생성합니다.`,
    }));
  }

  if (hasFivePledgePdf) {
    return [
      {
        title: "5대공약 원문 PDF 확보",
        detail: requestedFullPath ?? "NEC 정책공약마당 PDF 경로를 확보했습니다.",
      },
    ];
  }

  return [
    {
      title: policySourceLabel ? `${policySourceLabel} 원문 확보` : "공약 PDF 미제공",
      detail:
        requestedFullPath ??
        "NEC 정책공약마당 응답에 5대공약 PDF 항목이 없어 선거공보 또는 후보자 정보공개 자료를 추가 연동해야 합니다.",
    },
  ];
}

function buildOfficeTagCounts(
  candidates: NecNormalizedCandidate[],
  residence: Residence,
  scope: ResidenceElectionScope,
  downloads: NecDownloadIndex,
) {
  const officeTagCounts = new Map<string, Map<string, number>>();

  for (const candidate of candidates) {
    const office = officeFor(candidate, residence, scope);
    const tags = candidateTags(downloads.get(candidate.id));
    const tagCounts = officeTagCounts.get(office) ?? new Map<string, number>();

    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }

    officeTagCounts.set(office, tagCounts);
  }

  return officeTagCounts;
}

function candidateTags(download?: { pledgeTitles: string[]; pledges?: Pledge[]; policyTags?: string[] }) {
  const tags = download?.policyTags ?? extractPolicyTags((download?.pledges ?? []).map((pledge) => `${pledge.title} ${pledge.detail}`).join(" "));

  return tags.length > 0 ? tags : ["자료확인"];
}

function buildComparison({
  candidate,
  displayName,
  office,
  policyTags,
  officeTagCounts,
  sameOfficeCount,
  hasPolicyText,
}: {
  candidate: NecNormalizedCandidate;
  displayName: string;
  office: string;
  policyTags: string[];
  officeTagCounts: Map<string, number>;
  sameOfficeCount: number;
  hasPolicyText: boolean;
}) {
  if (!hasPolicyText || policyTags.length === 0) {
    return {
      summary: `${officeContextText(office)} ${sameOfficeCount}개 후보/정당과 비교 대상입니다.`,
      details: [
        "공약 PDF가 없거나 텍스트 추출이 부족해 정책 키워드 비교는 제한적입니다.",
        candidate.thumbnailUrl ? "후보 사진은 NEC CDN 썸네일을 사용합니다." : "후보 사진 썸네일은 제공되지 않았습니다.",
        `선거구 기준: ${candidate.districtName || office}`,
      ],
    };
  }

  const distinctiveTags = policyTags.filter((tag) => (officeTagCounts.get(tag) ?? 0) <= 1);
  const sharedTags = policyTags.filter((tag) => (officeTagCounts.get(tag) ?? 0) > 1);
  const leadTags = distinctiveTags.length > 0 ? distinctiveTags : policyTags;
  const partyText = candidate.partyName ? `${candidate.partyName} ` : "";
  const subject = candidate.name ? `${partyText}${displayName} 후보는` : `${displayName}은`;
  const officeText = officeContextText(office);

  if (sameOfficeCount <= 1) {
    return {
      summary: `${officeText} ${subject} ${leadTags.slice(0, 2).join("·")} 공약을 중심으로 단독 비교됩니다.`,
      details: [
        "같은 투표지의 다른 후보/정당 데이터가 없어 후보 내부 공약 키워드만 표시합니다.",
        `주요 키워드: ${policyTags.join(", ")}.`,
        `비교 기준: 5대공약 제목과 목표·이행방법 문장.`,
      ],
    };
  }

  return {
    summary: `${officeText} ${subject} ${leadTags.slice(0, 2).join("·")} 쟁점을 앞세웁니다.`,
    details: [
      distinctiveTags.length > 0
        ? `상대 후보 대비 두드러지는 키워드: ${distinctiveTags.join(", ")}.`
        : `주요 키워드: ${policyTags.join(", ")}.`,
      sharedTags.length > 0
        ? `공통 경쟁 쟁점: ${sharedTags.join(", ")}.`
        : "같은 투표지 안에서 겹치는 핵심 키워드는 적습니다.",
      `비교 기준: ${sameOfficeCount}개 후보/정당의 5대공약 제목과 목표·이행방법 문장.`,
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
  const targetSectionLines = extractTargetSectionLines(lines);
  const methodSectionLines = extractSectionLines(lines, /^(?:□\s*)?이행방법/, /^(?:□\s*)?(?:이행기간|재원조달)/);
  const fallbackLines = lines.filter(isUsefulDetailLine);
  const selectedLines = (targetSectionLines.length > 0 ? targetSectionLines : methodSectionLines.length > 0 ? methodSectionLines : fallbackLines).slice(0, 2);
  const detail = normalizeWhitespace(selectedLines.join(" "));

  return detail || "PDF 원문에서 제목을 추출했으나 목표·이행방법 문장은 추가 확인이 필요합니다.";
}

function extractTargetSectionLines(lines: string[]) {
  return extractSectionLines(lines, /^(?:□\s*)?목\s*표|^목표/, /^(?:□\s*)?(?:이행방법|이행기간|재원조달)/);
}

function extractSectionLines(lines: string[], startPattern: RegExp, endPattern: RegExp) {
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

    if (sectionLines.length >= 2) {
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
