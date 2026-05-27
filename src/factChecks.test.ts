import { describe, expect, it } from "vitest";
import { getCandidateFactCheck } from "./factChecks";
import mayorGovernorRace from "../data/nec/full/races/3-시-도지사선거.json";
import superintendentRace from "../data/nec/full/races/11-교육감선거.json";
import districtHeadRace from "../data/nec/full/races/4-구-시-군의-장선거.json";

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
      id: "synthetic-mayor-candidate",
      race: "광역단체장",
    });
    const busanEducationFactCheck = getCandidateFactCheck({
      id: "synthetic-education-candidate",
      race: "교육감",
    });

    expect(busanMayorFactCheck?.summary).toContain("광역단체장 공약");
    expect(busanMayorFactCheck?.items[0].check).toContain("예비타당성조사");
    expect(busanEducationFactCheck?.summary).toContain("교육감 공약");
    expect(busanEducationFactCheck?.items[1].sources.some((source) => source.name.includes("지방교육재정"))).toBe(
      true,
    );
  });

  it("provides candidate-specific checks for every mayor/governor and superintendent candidate", () => {
    const candidates = [...mayorGovernorRace.candidates, ...superintendentRace.candidates];
    const missingCandidateFactChecks = candidates
      .filter((candidate) => !getCandidateFactCheck(candidate.id))
      .map((candidate) => `${candidate.name} ${candidate.id}`);

    expect(candidates).toHaveLength(112);
    expect(missingCandidateFactChecks).toEqual([]);
  });

  it("falls back to gu mayor fact checks for every district office candidate without covering city or county heads", () => {
    const guCandidates = districtHeadRace.candidates.filter((candidate) => candidate.districtName.endsWith("구"));
    const nonGuCandidates = districtHeadRace.candidates.filter((candidate) => !candidate.districtName.endsWith("구"));
    const missingGuFactChecks = guCandidates
      .filter(
        (candidate) =>
          !getCandidateFactCheck({
            id: candidate.id,
            race: "기초단체장",
            office: `${candidate.districtName}청장`,
          }),
      )
      .map((candidate) => `${candidate.districtName} ${candidate.name} ${candidate.id}`);
    const cityCandidate = nonGuCandidates.find((candidate) => candidate.districtName.endsWith("시"));
    const countyCandidate = nonGuCandidates.find((candidate) => candidate.districtName.endsWith("군"));

    expect(guCandidates).toHaveLength(165);
    expect(missingGuFactChecks).toEqual([]);
    expect(
      getCandidateFactCheck({
        id: cityCandidate?.id ?? "synthetic-city-head",
        race: "기초단체장",
        office: `${cityCandidate?.districtName ?? "수원시"}장`,
      }),
    ).toBeUndefined();
    expect(
      getCandidateFactCheck({
        id: countyCandidate?.id ?? "synthetic-county-head",
        race: "기초단체장",
        office: `${countyCandidate?.districtName ?? "기장군"}수`,
      }),
    ).toBeUndefined();
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
