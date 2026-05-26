import { describe, expect, it } from "vitest";
import type { Residence } from "./electionTypes";
import { createCandidateInfoIndex } from "./necCandidateInfo";
import {
  buildResidenceDatasetFromNec,
  extractPledges,
  extractPolicyTags,
  extractPledgeTitles,
  type NecDownloadIndex,
} from "./necRegionCache";
import type { NecNormalizedCandidate } from "./necCrawler";

const residence: Residence = {
  id: "seoul-mapo-gongdeok",
  city: "서울특별시",
  district: "마포구",
  neighborhood: "공덕동",
  cacheKey: "residence:seoul:mapo:gongdeok:v1",
  cachedAt: "2026-05-26 13:30 KST",
};

const busanResidence: Residence = {
  id: "nec-2600-2601-5260101-6260101",
  city: "부산광역시",
  district: "중구",
  neighborhood: "중구선거구 · 중구가선거구",
  cacheKey: "nec:scope:2600:2601:5260101:6260101:v1",
  cachedAt: "2026-05-26T13:30:00+09:00",
  electionScope: {
    cityCouncilDistrict: "중구선거구",
    localCouncilDistrict: "중구가선거구",
  },
};

const suwonResidence: Residence = {
  id: "nec-4100-4101-dong-1qhklm1",
  city: "경기도",
  district: "수원시 장안구",
  neighborhood: "파장동",
  cacheKey: "nec:area:4100:4101:파장동:v1",
  cachedAt: "2026-05-26T13:30:00+09:00",
  electionScope: {
    districtHeadDistrict: "수원시",
    cityCouncilDistrict: "수원시제1선거구",
    localCouncilDistrict: "수원시나선거구",
  },
};

function necRow(overrides: Partial<NecNormalizedCandidate>): NecNormalizedCandidate {
  return {
    id: overrides.id ?? "row",
    electionId: "20260603",
    subElectionId: overrides.subElectionId ?? "320260603",
    raceTypeCode: overrides.raceTypeCode ?? "3",
    raceName: overrides.raceName ?? "시·도지사선거",
    districtId: "",
    districtName: overrides.districtName ?? "서울특별시",
    partyId: overrides.partyId ?? "100",
    partyName: overrides.partyName ?? "더불어민주당",
    candidateId: overrides.candidateId ?? "100",
    candidateNumber: overrides.candidateNumber ?? "1",
    name: overrides.name ?? "정원오",
    occupation: overrides.occupation ?? "정당인",
    education: "",
    thumbnailPath: "",
    thumbnailUrl: overrides.thumbnailUrl ?? "https://cdn.nec.go.kr/photo_20260603/sample.JPG",
    fivePledgePdf:
      overrides.fivePledgePdf === undefined
        ? {
            requestedFileName: "sample.pdf",
            requestedFullPath: "20260603/PDF/P5_PRMS_PUB/sample.pdf",
            downloadUrl: "https://policy.nec.go.kr/sample.pdf",
          }
        : overrides.fivePledgePdf,
    campaignBulletinPdf: overrides.campaignBulletinPdf ?? null,
  };
}

describe("NEC residence cache builder", () => {
  it("extracts pledge titles from pdftotext output", () => {
    const text = `
공약순위: 1 제목 : AI로 똑똑한 행정, 안전은 미리미리
□ 목표
교통 안전 데이터를 활용해 보행 사고를 줄입니다.
공약순위: 2 제목 : 사는 동네가 달라집니다
□ 목표
공공주택과 역세권 주거 공급을 늘립니다.
공약순위: 3 제목 : 돌봄은 제도가 아니라 일상
□ 목표
어르신과 아동 돌봄 서비스를 동네에서 연결합니다.
`;

    expect(extractPledgeTitles(text)).toEqual([
      "AI로 똑똑한 행정, 안전은 미리미리",
      "사는 동네가 달라집니다",
      "돌봄은 제도가 아니라 일상",
    ]);
    expect(extractPledges(text)[0]).toEqual({
      title: "AI로 똑똑한 행정, 안전은 미리미리",
      detail: "교통 안전 데이터를 활용해 보행 사고를 줄입니다.",
    });
    expect(extractPolicyTags(text)).toEqual(expect.arrayContaining(["안전", "복지", "주거"]));
  });

  it("extracts pledge highlights from campaign bulletin text without five-pledge headings", () => {
    const text = `
후보자 정보 공개자료
인적사항
북수원이 달라집니다
1. 신산업 유치
- 북수원 테크로밸리 조성 추진
- 영화도시재생혁신지구 추진
2. 편리한 지하철 시대
- 동탄인덕원선 및 신분당선 조기 개통
- 수원도시철도 1호선 조기 추진
3. 수원의 미래
- 재개발ㆍ재건축 조속추진 행ㆍ재정적 지원
4. 구도심 지역경제 활성화
- 전통시장 등 공용주차장 대폭 확충
5. 체육시설 확충
- 수원 돔구장 추진
`;

    expect(extractPledges(text)).toEqual([
      {
        title: "신산업 유치",
        detail: "북수원 테크로밸리 조성 추진 영화도시재생혁신지구 추진",
      },
      {
        title: "편리한 지하철 시대",
        detail: "동탄인덕원선 및 신분당선 조기 개통 수원도시철도 1호선 조기 추진",
      },
      {
        title: "수원의 미래",
        detail: "재개발ㆍ재건축 조속추진 행ㆍ재정적 지원",
      },
      {
        title: "구도심 지역경제 활성화",
        detail: "전통시장 등 공용주차장 대폭 확충",
      },
      {
        title: "체육시설 확충",
        detail: "수원 돔구장 추진",
      },
    ]);
  });

  it("builds the selected residence ballot from matching NEC districts only", () => {
    const downloads: NecDownloadIndex = new Map([
      [
        "20260603-320260603-100",
        {
          textPath: "data/nec/full/pdfs/sample.txt",
          pledgeTitles: ["서울 공약 1", "서울 공약 2"],
          pledges: [
            { title: "서울 교통망 재편", detail: "버스와 지하철 환승 체계를 시비로 개편합니다." },
            { title: "청년 주거 지원", detail: "역세권 공공주택과 월세 지원을 확대합니다." },
          ],
          policyTags: ["교통", "주거", "청년"],
        },
      ],
    ]);
    const dataset = buildResidenceDatasetFromNec({
      residence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads,
      candidateInfo: createCandidateInfoIndex([
        {
          candidateId: "100",
          districtName: "서울특별시",
          number: "1",
          partyName: "더불어민주당",
          name: "정원오",
          gender: "남",
          birthDate: "1968.08.12",
          age: 57,
          address: "서울특별시 성동구",
          occupation: "정당인",
          education: "한양대학교 도시대학원 박사 수료",
          career: "(전)성동구청장",
          assets: "1,823,897",
          military: "군복무를 마친사람",
          taxPaid: "84,423",
          taxArrearsFiveYears: "0",
          taxCurrentArrears: "0",
          crimeRecord: "2건",
          electionCount: "3회",
          crimeDisclosureFiles: ["20260603/open/sample/junkwa/sample.tif"],
        },
      ]),
      candidates: [
        necRow({ id: "20260603-320260603-100", raceTypeCode: "3", raceName: "시·도지사선거", name: "정원오" }),
        necRow({ id: "education", raceTypeCode: "11", raceName: "교육감선거", name: "김영배", partyName: "무소속" }),
        necRow({ id: "mapo-head", raceTypeCode: "4", raceName: "구·시·군의 장선거", districtName: "마포구", name: "유동균" }),
        necRow({
          id: "city-council-1",
          raceTypeCode: "5",
          raceName: "시·도의회의원선거",
          districtName: "마포구제1선거구",
          name: "고병준",
          fivePledgePdf: null,
          campaignBulletinPdf: {
            requestedFileName: "고병준_선거공보.pdf",
            requestedFullPath: "20260603/PDF/PBINFO/1100/003_100_20260520_1.pdf",
            downloadUrl: "https://policy.nec.go.kr/bulletin.pdf",
          },
        }),
        necRow({
          id: "city-council-2",
          raceTypeCode: "5",
          raceName: "시·도의회의원선거",
          districtName: "마포구제2선거구",
          name: "한기영",
          fivePledgePdf: null,
        }),
        necRow({
          id: "local-council-a",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "마포구가선거구",
          name: "장덕준",
          fivePledgePdf: null,
        }),
        necRow({
          id: "local-council-b",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "마포구나선거구",
          name: "배동수",
          fivePledgePdf: null,
        }),
        necRow({
          id: "metro-prop",
          raceTypeCode: "8",
          raceName: "광역의원비례대표선거",
          districtName: "서울특별시",
          name: "",
          partyName: "국민의힘",
          candidateNumber: "",
          fivePledgePdf: null,
        }),
        necRow({
          id: "local-prop",
          raceTypeCode: "9",
          raceName: "기초의원비례대표선거",
          districtName: "마포구",
          name: "",
          partyName: "더불어민주당",
          candidateNumber: "",
          fivePledgePdf: null,
        }),
      ],
    });

    expect(dataset.candidates.map((candidate) => candidate.office)).toEqual([
      "서울특별시장",
      "서울특별시교육감",
      "마포구청장",
      "서울시의원 마포구제1선거구",
      "마포구의원 마포구가선거구",
      "서울시의원 비례대표",
      "마포구의원 비례대표",
    ]);
    expect(dataset.candidates.map((candidate) => candidate.name)).toContain("국민의힘 비례대표");
    expect(dataset.candidates.map((candidate) => candidate.name)).not.toContain("한기영");
    expect(dataset.candidates[0].age).toBe(57);
    expect(dataset.candidates[0].criminalRecord.summary).toBe("전과 2건");
    expect(dataset.candidates[0].criminalRecord.tone).toBe("risk");
    expect(dataset.candidates[0].pledgeSummary).toContain("교통·주거·청년");
    expect(dataset.candidates[0].comparison).toContain("교통·주거");
    expect(dataset.candidates[0].comparisonDetails[0]).toContain("차별점");
    expect(dataset.candidates[0].candidateTraits).toEqual(
      expect.arrayContaining(["더불어민주당 소속", expect.stringContaining("주요 경력:")]),
    );
    expect(dataset.candidates[0].feasibilityReview?.summary).toBe("원문 근거로 추가 검토 가능");
    expect(dataset.candidates[0].feasibilityReview?.details.join(" ")).toContain("재원 단서");
    expect(dataset.candidates[0].pledgeHighlights).toEqual(["서울 교통망 재편", "청년 주거 지원"]);
    expect(dataset.candidates[0].fullPledges[0].detail).toBe("버스와 지하철 환승 체계를 시비로 개편합니다.");
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.publicRecord).toContain("선거공보 PDF 있음");
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.pledgeSummary).toContain("선거공보 PDF가 제공됩니다");
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.pledgeHighlights).toContain("선거공보 PDF 제공");
    expect(dataset.source.mode).toBe("nec");
  });

  it("uses election scope embedded in generated nationwide residences", () => {
    const dataset = buildResidenceDatasetFromNec({
      residence: busanResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads: new Map(),
      candidates: [
        necRow({ id: "busan-mayor", raceTypeCode: "3", raceName: "시·도지사선거", districtName: "부산광역시", name: "김부산" }),
        necRow({ id: "busan-education", raceTypeCode: "11", raceName: "교육감선거", districtName: "부산광역시", name: "박교육" }),
        necRow({ id: "busan-head", raceTypeCode: "4", raceName: "구·시·군의 장선거", districtName: "중구", name: "최중구" }),
        necRow({ id: "busan-city-council", raceTypeCode: "5", raceName: "시·도의회의원선거", districtName: "중구선거구", name: "이광역" }),
        necRow({ id: "busan-local-council", raceTypeCode: "6", raceName: "구·시·군의회의원선거", districtName: "중구가선거구", name: "오기초" }),
        necRow({ id: "busan-metro-prop", raceTypeCode: "8", raceName: "광역의원비례대표선거", districtName: "부산광역시", name: "", partyName: "국민의힘" }),
        necRow({ id: "busan-local-prop", raceTypeCode: "9", raceName: "기초의원비례대표선거", districtName: "중구", name: "", partyName: "더불어민주당" }),
        necRow({ id: "other-city-council", raceTypeCode: "5", raceName: "시·도의회의원선거", districtName: "서구제1선거구", name: "제외" }),
      ],
    });

    expect(dataset.candidates.map((candidate) => candidate.office)).toEqual([
      "부산광역시장",
      "부산광역시교육감",
      "중구청장",
      "부산시의원 중구선거구",
      "중구의원 중구가선거구",
      "부산시의원 비례대표",
      "중구의원 비례대표",
    ]);
    expect(dataset.candidates.map((candidate) => candidate.name)).not.toContain("제외");
  });

  it("labels district-head ballots from election scope, not display district text", () => {
    const dataset = buildResidenceDatasetFromNec({
      residence: suwonResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads: new Map(),
      candidates: [
        necRow({ id: "suwon-head", raceTypeCode: "4", raceName: "구·시·군의 장선거", districtName: "수원시", name: "수원후보" }),
        necRow({ id: "suwon-local", raceTypeCode: "6", raceName: "구·시·군의회의원선거", districtName: "수원시나선거구", name: "기초후보" }),
      ],
    });

    expect(dataset.candidates.map((candidate) => candidate.office)).toEqual([
      "수원시장",
      "수원시의원 수원시나선거구",
    ]);
  });

  it("compares differentiators only within the same local electoral district", () => {
    const downloads: NecDownloadIndex = new Map([
      [
        "local-a",
        {
          textPath: "data/nec/full/pdfs/local-a.txt",
          pledgeTitles: ["교통 개선", "청년 주거"],
          pledges: [
            { title: "교통 개선", detail: "마을버스 노선을 조정합니다." },
            { title: "청년 주거", detail: "청년 주거 상담을 확대합니다." },
          ],
          policyTags: ["교통", "주거"],
        },
      ],
      [
        "local-b",
        {
          textPath: "data/nec/full/pdfs/local-b.txt",
          pledgeTitles: ["교통 안전"],
          pledges: [{ title: "교통 안전", detail: "보행 안전 시설을 늘립니다." }],
          policyTags: ["교통"],
        },
      ],
      [
        "other-local",
        {
          textPath: "data/nec/full/pdfs/other-local.txt",
          pledgeTitles: ["주거 지원"],
          pledges: [{ title: "주거 지원", detail: "다른 선거구 주거 공약입니다." }],
          policyTags: ["주거"],
        },
      ],
    ]);
    const dataset = buildResidenceDatasetFromNec({
      residence: suwonResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads,
      candidates: [
        necRow({
          id: "local-a",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시나선거구",
          name: "나후보",
          candidateNumber: "1",
        }),
        necRow({
          id: "local-b",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시나선거구",
          name: "다후보",
          candidateNumber: "2",
        }),
        necRow({
          id: "other-local",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시다선거구",
          name: "다른선거구",
          candidateNumber: "3",
        }),
      ],
    });

    const candidate = dataset.candidates.find((item) => item.name === "나후보");

    expect(dataset.candidates.map((item) => item.name)).not.toContain("다른선거구");
    expect(candidate?.comparisonDetails[0]).toContain("같은 선거구 후보 대비");
    expect(candidate?.comparisonDetails[0]).toContain("주거");
    expect(candidate?.comparisonDetails[1]).toContain("교통");
    expect(candidate?.comparisonDetails.join(" ")).toContain("수원시나선거구 후보/정당 2개");
    expect(candidate?.comparisonDetails.join(" ")).not.toContain("수원시다선거구");
  });
});
