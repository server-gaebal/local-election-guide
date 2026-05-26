import { describe, expect, it } from "vitest";
import {
  getCandidatePersonaReview,
  getCandidatePersonaSourcePledges,
  getPersonaReviewCoverageReport,
  getPersonaReviewPrompt,
  personaReviewProfiles,
  personaReviewScopeNotice,
  personaReviewSourceNotice,
} from "./personaReviews";

const supportedPersonaCandidateIds = [
  "20260603-320260603-100157144",
  "20260603-320260603-100162984",
  "20260603-320260603-100158541",
  "20260603-320260603-100162632",
  "20260603-320260603-100162642",
  "20260603-320260603-100162720",
  "20260603-320260603-100163148",
  "20260603-320260603-100163432",
  "20260603-320260603-100163471",
  "20260603-320260603-100153796",
  "20260603-320260603-100158402",
];

describe("candidate persona reviews", () => {
  it("provides NEC-only persona reviews for Seoul mayor and Gyeonggi governor candidates", () => {
    const youthReview = getCandidatePersonaReview("20260603-320260603-100157144", "청년");
    const parentReview = getCandidatePersonaReview("20260603-320260603-100163148", "학부모");

    expect(youthReview?.sourceNotice).toContain("선거관리위원회");
    expect(youthReview?.sourceNotice).toContain("정치색");
    expect(youthReview?.prompt).toContain("Do not use external opinions");
    expect(youthReview?.summary).toContain("청년");
    expect(parentReview?.questions[0]).toContain("어린이");
    expect(personaReviewScopeNotice).toContain("서울특별시장·경기도지사");
    expect(personaReviewSourceNotice).toContain("선거관리위원회");
  });

  it("covers every supported candidate and profile with source evidence", () => {
    const coverage = getPersonaReviewCoverageReport();

    expect(coverage.map((item) => item.candidateId)).toEqual(supportedPersonaCandidateIds);

    for (const item of coverage) {
      expect(item.office).toMatch(/서울특별시장|경기도지사/);
      expect(item.profiles).toEqual(personaReviewProfiles);
      expect(item.sourcePath).toContain("data/nec/full/pdfs/3-시-도지사선거");

      for (const profile of personaReviewProfiles) {
        const review = getCandidatePersonaReview(item.candidateId, profile);

        expect(review?.summary).toBeTruthy();
        expect(review?.questions.length).toBeGreaterThanOrEqual(2);
        expect(review?.highlights.length).toBeGreaterThanOrEqual(2);
        expect(review?.cautions.length).toBeGreaterThanOrEqual(1);
        expect(review?.evidence.length).toBeGreaterThanOrEqual(2);
        expect(review?.evidence.every((source) => source.candidateId === item.candidateId)).toBe(true);
        expect(review?.evidence.some((source) => source.kind === "candidateMetadata")).toBe(true);
        expect(review?.evidence.some((source) => source.kind === "fivePledge")).toBe(true);
        expect(review?.evidence.some((source) => source.kind === "fivePledge" && source.snippet)).toBe(true);
      }
    }
  });

  it("derives visible pledge details from cached NEC five-pledge text for supported candidates", () => {
    const pledges = getCandidatePersonaSourcePledges("20260603-320260603-100157144");

    expect(pledges).toHaveLength(5);
    expect(pledges[0].title).toContain("통근도시");
    expect(pledges[3].title).toContain("24시간");
    expect(pledges[4].title).toContain("4050+센터");
    expect(pledges[0].detail).toContain("대중교통");
    expect(pledges[0].detail).toContain("10분 역세권");
    expect(pledges[0].detail).toContain("5분 정류소");
    expect(pledges[2].detail).toContain("월 100만 원");
    expect(pledges[2].detail).toContain("4,000만 원");
    expect(pledges[3].detail).toContain("200개소");
    expect(pledges[3].detail).toContain("30분 이내");
    expect(pledges[4].detail).toContain("4050세대");
    expect(pledges[0].detail).not.toContain("본문 요약은 다음 정제 단계");
    expect(pledges.map((pledge) => pledge.detail).join(" ")).not.toMatch(
      /(^|[^\d])(?:분 통근도시|분 역세권|분 정류소|분 이내)|월 만 원|임기 중 개소|플러스재단을 플러스재단/,
    );
    expect(pledges.every((pledge) => pledge.sourcePath.includes("data/nec/full/pdfs/3-시-도지사선거"))).toBe(true);
  });

  it("corrects known numeric glyph losses in visible NEC pledge snippets", () => {
    const ohSehunPledges = getCandidatePersonaSourcePledges("20260603-320260603-100162984");
    const choEungcheonPledges = getCandidatePersonaSourcePledges("20260603-320260603-100163471");

    expect(ohSehunPledges[0].detail).toContain("3년 내 8.5만호");
    expect(ohSehunPledges[1].detail).toContain("‘31년까지 공공주택 약 13만호");
    expect(ohSehunPledges[4].detail).toContain("연간 일자리 15.1만개");
    expect(choEungcheonPledges[0].detail).toContain("1기 신도시");
    expect(choEungcheonPledges[1].detail).toContain("3기 신도시·1기 신도시");
    expect(choEungcheonPledges[4].detail).toContain("AI 기반 민원행정");

    expect(ohSehunPledges[0].detail).not.toContain("년 내 만호");
    expect(ohSehunPledges[1].detail).not.toContain("공공주택 약 만호");
    expect(ohSehunPledges[4].detail).not.toContain("연간 일자리 만개");
    expect(choEungcheonPledges[0].detail).not.toMatch(/(^|\s)기 신도시 재정비/);
    expect(choEungcheonPledges[1].detail).not.toContain("명문화 기 신도시");
    expect(choEungcheonPledges[4].detail).not.toMatch(/^기반 민원행정/);
  });

  it("keeps every profile prompt inside the NEC-only source boundary", () => {
    for (const profile of personaReviewProfiles) {
      const prompt = getPersonaReviewPrompt(profile);

      expect(prompt).toContain("NEC-provided");
      expect(prompt).toContain("candidate metadata");
      expect(prompt).toContain("five pledge");
      expect(prompt).toContain("Do not use external opinions");
      expect(prompt).toContain("inferred political leanings");
    }
  });

  it("does not invent persona reviews outside the supported races", () => {
    expect(getCandidatePersonaReview("local-council-candidate", "청년")).toBeUndefined();
  });
});
