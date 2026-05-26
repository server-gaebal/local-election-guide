import { describe, expect, it } from "vitest";
import { buildNationalResidences, preserveStableResidenceIds } from "./necResidenceIndex";
import type { NecElectionAreaCache, NecElectionDistrictsCache } from "./necElectionInfo";

const districtsCache: NecElectionDistrictsCache = {
  generatedAt: "2026-05-26T00:00:00+09:00",
  electionId: "0020260603",
  sourceName: "선거통계시스템 선거구 코드",
  sourceUrl: "https://info.nec.go.kr/",
  cities: [
    {
      code: "1100",
      name: "서울특별시",
      districtHeadScopes: [{ code: "4111400", name: "마포구" }],
      cityCouncilTownScopes: [
        {
          town: { code: "1114", name: "마포구" },
          districts: [
            { code: "5111401", name: "마포구제1선거구" },
            { code: "5111402", name: "마포구제2선거구" },
          ],
        },
      ],
      localCouncilTownScopes: [
        {
          town: { code: "1114", name: "마포구" },
          districts: [
            { code: "6111401", name: "마포구가선거구" },
            { code: "6111402", name: "마포구나선거구" },
          ],
        },
      ],
    },
    {
      code: "5100",
      name: "세종특별자치시",
      districtHeadScopes: [],
      cityCouncilTownScopes: [
        {
          town: { code: "5100", name: "세종특별자치시" },
          districts: [{ code: "5510001", name: "세종특별자치시제1선거구" }],
        },
      ],
      localCouncilTownScopes: [],
    },
    {
      code: "4100",
      name: "경기도",
      districtHeadScopes: [{ code: "4410100", name: "수원시" }],
      cityCouncilTownScopes: [
        {
          town: { code: "4101", name: "수원시장안구" },
          districts: [{ code: "5410101", name: "수원시제1선거구" }],
        },
      ],
      localCouncilTownScopes: [
        {
          town: { code: "4101", name: "수원시장안구" },
          districts: [{ code: "6410101", name: "수원시가선거구" }],
        },
      ],
    },
  ],
};

const areaCache: NecElectionAreaCache = {
  generatedAt: "2026-05-26T00:00:00+09:00",
  electionId: "0020260603",
  sourceName: "선거통계시스템 선거구 및 읍면동현황",
  sourceUrl: "https://info.nec.go.kr/main/showDocument.xhtml?electionId=0020260603&topMenuId=BI&secondMenuId=BIGI05",
  rows: [
    {
      electionCode: "4",
      cityCode: "1100",
      cityName: "서울특별시",
      jurisdictionName: "마포구",
      districtName: "마포구",
      seatCount: 1,
      neighborhoods: ["공덕동", "아현동", "도화동"],
    },
    {
      electionCode: "5",
      cityCode: "1100",
      cityName: "서울특별시",
      jurisdictionName: "마포구",
      districtName: "마포구제1선거구",
      seatCount: 1,
      neighborhoods: ["공덕동", "아현동", "도화동"],
    },
    {
      electionCode: "5",
      cityCode: "1100",
      cityName: "서울특별시",
      jurisdictionName: "마포구",
      districtName: "마포구제2선거구",
      seatCount: 1,
      neighborhoods: ["용강동", "대흥동"],
    },
    {
      electionCode: "6",
      cityCode: "1100",
      cityName: "서울특별시",
      jurisdictionName: "마포구",
      districtName: "마포구가선거구",
      seatCount: 2,
      neighborhoods: ["공덕동", "아현동"],
    },
    {
      electionCode: "6",
      cityCode: "1100",
      cityName: "서울특별시",
      jurisdictionName: "마포구",
      districtName: "마포구나선거구",
      seatCount: 2,
      neighborhoods: ["도화동", "용강동", "대흥동"],
    },
  ],
};

describe("NEC nationwide residence index", () => {
  it("builds selectable residence scopes from city and local council district combinations", () => {
    const residences = buildNationalResidences(districtsCache);

    expect(residences).toHaveLength(6);
    expect(residences[0]).toMatchObject({
      id: "nec-1100-1114-5111401-6111401",
      city: "서울특별시",
      district: "마포구",
      neighborhood: "마포구제1선거구 · 마포구가선거구",
      electionScope: {
        cityCouncilDistrict: "마포구제1선거구",
        localCouncilDistrict: "마포구가선거구",
      },
    });
    expect(residences.map((residence) => residence.id)).toContain("nec-5100-5100-5510001-local");
    expect(residences.at(-1)).toMatchObject({
      city: "경기도",
      district: "수원시",
      neighborhood: "장안구 수원시제1선거구 · 수원시가선거구",
      electionScope: {
        districtHeadDistrict: "수원시",
        cityCouncilDistrict: "수원시제1선거구",
        localCouncilDistrict: "수원시가선거구",
      },
    });
    expect(residences.find((residence) => residence.id === "nec-5100-5100-5510001-local")).toMatchObject({
      city: "세종특별자치시",
      district: "세종특별자치시",
      neighborhood: "세종특별자치시제1선거구",
      electionScope: {
        cityCouncilDistrict: "세종특별자치시제1선거구",
      },
    });
  });

  it("builds actual neighborhood residences when official area mappings are available", () => {
    const residences = buildNationalResidences(districtsCache, areaCache).filter(
      (residence) => residence.city === "서울특별시",
    );

    expect(residences).toHaveLength(5);
    expect(residences).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: expect.stringMatching(/^nec-1100-1114-dong-/),
        city: "서울특별시",
        district: "마포구",
        neighborhood: "공덕동",
        electionScope: {
          districtHeadDistrict: "마포구",
          cityCouncilDistrict: "마포구제1선거구",
          localCouncilDistrict: "마포구가선거구",
        },
      }),
      expect.objectContaining({
        id: expect.stringMatching(/^nec-1100-1114-dong-/),
        neighborhood: "아현동",
        electionScope: expect.objectContaining({
          cityCouncilDistrict: "마포구제1선거구",
          localCouncilDistrict: "마포구가선거구",
        }),
      }),
      expect.objectContaining({
        id: expect.stringMatching(/^nec-1100-1114-dong-/),
        neighborhood: "도화동",
        electionScope: expect.objectContaining({
          cityCouncilDistrict: "마포구제1선거구",
          localCouncilDistrict: "마포구나선거구",
        }),
      }),
      expect.objectContaining({
        id: expect.stringMatching(/^nec-1100-1114-dong-/),
        neighborhood: "용강동",
        electionScope: expect.objectContaining({
          cityCouncilDistrict: "마포구제2선거구",
          localCouncilDistrict: "마포구나선거구",
        }),
      }),
    ]));
  });

  it("preserves existing stable ids for matching generated neighborhoods", () => {
    const generatedResidences = buildNationalResidences(districtsCache, areaCache);
    const stableResidences = [
      {
        id: "seoul-mapo-gongdeok",
        city: "서울특별시",
        district: "마포구",
        neighborhood: "공덕동",
        cacheKey: "residence:seoul:mapo:gongdeok:v1",
        cachedAt: "2026-05-26 13:30 KST",
      },
    ];

    const residences = preserveStableResidenceIds(generatedResidences, stableResidences);

    expect(residences.find((residence) => residence.neighborhood === "공덕동")).toMatchObject({
      id: "seoul-mapo-gongdeok",
      city: "서울특별시",
      district: "마포구",
      electionScope: {
        districtHeadDistrict: "마포구",
        cityCouncilDistrict: "마포구제1선거구",
        localCouncilDistrict: "마포구가선거구",
      },
    });
    expect(residences.find((residence) => residence.neighborhood === "아현동")?.id).toMatch(
      /^nec-1100-1114-dong-/,
    );
  });
});
