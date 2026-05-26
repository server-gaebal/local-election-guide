import { describe, expect, it } from "vitest";
import { getCandidateFactCheck } from "./factChecks";

describe("candidate fact checks", () => {
  it("provides conservative official-source checks for Seoul mayor and Gyeonggi governor candidates", () => {
    expect(getCandidateFactCheck("20260603-320260603-100157144")?.summary).toContain("공식 계획");
    expect(getCandidateFactCheck("20260603-320260603-100163148")?.items[0].check).toContain("도 단독");
    expect(getCandidateFactCheck("20260603-320260603-100158402")?.items[0].check).toContain("법률");
    expect(
      getCandidateFactCheck("20260603-320260603-100163432")?.items[0].sources.some((source) =>
        source.url.includes("korea.kr"),
      ),
    ).toBe(true);
  });

  it("does not invent fact checks for unsupported local races", () => {
    expect(getCandidateFactCheck("unknown-candidate")).toBeUndefined();
  });
});
