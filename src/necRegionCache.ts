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
    pledgeTitles: string[];
  }
>;

type ResidenceElectionScope = {
  cityCouncilDistrict: string;
  localCouncilDistrict: string;
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

export function extractPledgeTitles(text: string, limit = 5) {
  const titles: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /공약순위\s*:?\s*\d*\s*제목\s*:?\s*(.+)/g,
    /공약순위\s+제목\s+(.+)/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const title = cleanPledgeTitle(match[1]);

      if (title && !seen.has(title)) {
        seen.add(title);
        titles.push(title);
      }

      if (titles.length >= limit) {
        return titles;
      }
    }
  }

  return titles;
}

export function buildResidenceDatasetFromNec({
  residence,
  generatedAt,
  candidates,
  downloads,
  candidateInfo = new Map(),
}: NecResidenceBuildInput): RegionDataset {
  const scope = residenceElectionScopes[residence.id];

  if (!scope) {
    throw new Error(`No NEC election scope configured for ${residence.id}`);
  }

  const selectedRows = candidates
    .filter((candidate) => isInResidenceScope(candidate, residence, scope))
    .sort(sortNecRows);
  const officeCounts = countBy(selectedRows, (candidate) => officeFor(candidate, residence, scope));

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
      }),
    ),
    source: {
      mode: "nec",
      generatedAt,
      sourceName: "선관위 정책공약마당 · 후보자 정보공개",
      sourceUrl: "https://policy.nec.go.kr/",
      pdfCount: selectedRows.filter((candidate) => candidate.fivePledgePdf).length,
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
      return candidate.districtName === residence.district;
    case "5":
      return candidate.districtName === scope.cityCouncilDistrict;
    case "6":
      return candidate.districtName === scope.localCouncilDistrict;
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
}: {
  candidate: NecNormalizedCandidate;
  residence: Residence;
  scope: ResidenceElectionScope;
  fallbackOrder: number;
  generatedAt: string;
  download?: { textPath: string; pledgeTitles: string[] };
  disclosure?: NecCandidateInfoRecord;
  sameOfficeCount: number;
}): Candidate {
  const isPartyVote = candidate.name.length === 0;
  const displayName = isPartyVote ? `${candidate.partyName} 비례대표` : candidate.name;
  const hasFivePledgePdf = Boolean(candidate.fivePledgePdf);
  const pledgeTitles = download?.pledgeTitles ?? [];
  const office = officeFor(candidate, residence, scope);
  const number = Number.parseInt(candidate.candidateNumber, 10);

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
    focusTags: buildFocusTags(candidate, hasFivePledgePdf),
    pledgeSummary: buildPledgeSummary(candidate, pledgeTitles, hasFivePledgePdf),
    pledgeHighlights: pledgeTitles.length > 0 ? pledgeTitles : fallbackHighlights(hasFivePledgePdf, isPartyVote),
    comparison: `${office} 투표지에서 ${sameOfficeCount}개 후보/정당과 함께 비교 대상입니다.`,
    comparisonDetails: [
      hasFivePledgePdf
        ? "5대공약 PDF가 제공되어 원문 기반 요약·비교 생성 대상입니다."
        : "NEC 정책공약마당에서 5대공약 PDF는 제공되지 않았습니다.",
      candidate.thumbnailUrl ? "후보 사진은 NEC CDN 썸네일을 사용합니다." : "후보 사진 썸네일은 제공되지 않았습니다.",
      `선거구 기준: ${candidate.districtName || office}`,
    ],
    fullPledges: buildFullPledges(pledgeTitles, hasFivePledgePdf, candidate.fivePledgePdf?.requestedFullPath),
    profileRelevance,
    cache: {
      policyPdf: download?.textPath ?? candidate.fivePledgePdf?.requestedFullPath ?? "NEC row metadata only",
      normalizedAt: generatedAt,
    },
  };
}

function officeFor(candidate: NecNormalizedCandidate, residence: Residence, scope: ResidenceElectionScope) {
  switch (candidate.raceTypeCode) {
    case "3":
      return `${residence.city}장`;
    case "11":
      return `${residence.city}교육감`;
    case "4":
      return `${residence.district}청장`;
    case "5":
      return `서울시의원 ${scope.cityCouncilDistrict}`;
    case "6":
      return `${residence.district}의원 ${scope.localCouncilDistrict}`;
    case "8":
      return "서울시의원 비례대표";
    case "9":
      return `${residence.district}의원 비례대표`;
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

  records.push(candidate.fivePledgePdf ? "5대공약 PDF 있음" : "5대공약 PDF 없음");

  return records;
}

function buildFocusTags(candidate: NecNormalizedCandidate, hasFivePledgePdf: boolean) {
  return [
    candidate.raceName.replace(/선거$/, ""),
    candidate.districtName || "비례",
    hasFivePledgePdf ? "5대공약" : "선거공보",
  ];
}

function buildPledgeSummary(
  candidate: NecNormalizedCandidate,
  pledgeTitles: string[],
  hasFivePledgePdf: boolean,
) {
  if (pledgeTitles.length > 0) {
    return `NEC 5대공약 원문에서 ${pledgeTitles.length}개 공약 제목을 추출했습니다. 세부 비교 요약은 원문 정제 후 생성합니다.`;
  }

  if (hasFivePledgePdf) {
    return "NEC 정책공약마당의 5대공약 PDF를 확보했습니다. 텍스트 정제 후 요약과 후보 간 비교를 생성할 수 있습니다.";
  }

  return "NEC 정책공약마당 후보/정당 row를 확보했습니다. 이 항목에는 5대공약 PDF가 제공되지 않아 선거공보 연동이 필요합니다.";
}

function fallbackHighlights(hasFivePledgePdf: boolean, isPartyVote: boolean) {
  if (isPartyVote) {
    return ["비례대표 정당 투표 항목", "정당별 선거공보 row 확보", "후보 명부·공보 상세 연동 대기"];
  }

  return hasFivePledgePdf
    ? ["5대공약 PDF 확보", "후보 사진 URL 확보", "AI 요약·후보 간 비교 생성 대기"]
    : ["후보 메타데이터 확보", "5대공약 PDF 미제공", "선거공보 원문 연동 대기"];
}

function buildFullPledges(pledgeTitles: string[], hasFivePledgePdf: boolean, requestedFullPath?: string): Pledge[] {
  if (pledgeTitles.length > 0) {
    return pledgeTitles.map((title) => ({
      title,
      detail: "PDF 원문에서 추출한 공약 제목입니다. 본문 요약은 다음 정제 단계에서 생성합니다.",
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
      title: "5대공약 PDF 미제공",
      detail: "NEC 정책공약마당 응답에 5대공약 PDF 항목이 없어 선거공보 또는 후보자 정보공개 자료를 추가 연동해야 합니다.",
    },
  ];
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

function numericOrder(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 999;
}

function cleanPledgeTitle(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[□○Ÿ■]+/g, "")
    .trim()
    .replace(/^[:\-–]+/, "")
    .trim();
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}
