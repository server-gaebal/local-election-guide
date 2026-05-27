import { describe, expect, it } from "vitest";
import { getCandidateFactCheck } from "./factChecks";

describe("candidate fact checks", () => {
  it("provides conservative official-source checks for Seoul mayor and Gyeonggi governor candidates", () => {
    expect(getCandidateFactCheck("20260603-320260603-100157144")?.summary).toContain("공식 계획");
    expect(
      getCandidateFactCheck({ id: "20260603-320260603-100157144", race: "광역단체장" })?.summary,
    ).toContain("서울 철도망");
    expect(getCandidateFactCheck("20260603-320260603-100163148")?.items[0].check).toContain("도 단독");
    expect(getCandidateFactCheck("20260603-320260603-100158402")?.items[0].check).toContain("법률");
    expect(
      getCandidateFactCheck("20260603-320260603-100163432")?.items[0].sources.some((source) =>
        source.url.includes("korea.kr"),
      ),
    ).toBe(true);
  });

  it("falls back to nationwide mayor/governor and education superintendent category checks", () => {
    const busanMayorFactCheck = getCandidateFactCheck({
      id: "20260603-320260603-100162954",
      race: "광역단체장",
    });
    const busanEducationFactCheck = getCandidateFactCheck({
      id: "20260603-1120260603-100162788",
      race: "교육감",
    });

    expect(busanMayorFactCheck?.summary).toContain("광역단체장 공약");
    expect(busanMayorFactCheck?.items[0].check).toContain("예비타당성조사");
    expect(busanEducationFactCheck?.summary).toContain("교육감 공약");
    expect(busanEducationFactCheck?.items[1].sources.some((source) => source.name.includes("지방교육재정"))).toBe(
      true,
    );
  });

  it("provides candidate-specific checks for Seoul and Gyeonggi education superintendent candidates", () => {
    const seoulEducationCandidateIds = [
      "20260603-1120260603-100153800",
      "20260603-1120260603-100155563",
      "20260603-1120260603-100163258",
      "20260603-1120260603-100162651",
      "20260603-1120260603-100153774",
      "20260603-1120260603-100161493",
      "20260603-1120260603-100153778",
      "20260603-1120260603-100153786",
    ];

    for (const candidateId of seoulEducationCandidateIds) {
      const factCheck = getCandidateFactCheck(candidateId);

      expect(factCheck?.summary).not.toContain("교육감 공약은");
      expect(factCheck?.items.length).toBeGreaterThanOrEqual(2);
    }

    expect(getCandidateFactCheck("20260603-1120260603-100153800")?.summary).toContain("교육과정 자율");
    expect(getCandidateFactCheck("20260603-1120260603-100163064")?.summary).toContain("기초학력·AI");
    expect(getCandidateFactCheck("20260603-1120260603-100153797")?.items[1].check).toContain("법률·중앙부처");
  });

  it("does not invent fact checks for unsupported local races", () => {
    expect(getCandidateFactCheck("unknown-candidate")).toBeUndefined();
    expect(getCandidateFactCheck("20260603-320260603-unknown")).toBeUndefined();
    expect(getCandidateFactCheck("20260603-1120260603-unknown")).toBeUndefined();
    expect(getCandidateFactCheck("20260603-420260603-100161476")).toBeUndefined();
  });
});
