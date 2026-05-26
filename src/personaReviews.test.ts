import { describe, expect, it } from "vitest";
import {
  getCandidatePersonaReview,
  personaReviewScopeNotice,
  personaReviewSourceNotice,
} from "./personaReviews";

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

  it("does not invent persona reviews outside the supported races", () => {
    expect(getCandidatePersonaReview("local-council-candidate", "청년")).toBeUndefined();
  });
});
