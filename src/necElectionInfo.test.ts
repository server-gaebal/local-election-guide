import { describe, expect, it } from "vitest";
import {
  buildCandidateInfoQueriesFromDistricts,
  buildNecSelectboxUrl,
  parseNecSelectboxItems,
  type NecElectionDistrictsCache,
} from "./necElectionInfo";

describe("NEC election-info helpers", () => {
  it("parses selectbox JSON bodies into stable code/name pairs", () => {
    expect(
      parseNecSelectboxItems({
        jsonResult: {
          header: { result: "ok", errorMessage: "", errorCode: "" },
          body: [
            { CODE: 1100, NAME: "서울특별시" },
            { CODE: "1114", NAME: "마포구" },
          ],
        },
      }),
    ).toEqual([
      { code: "1100", name: "서울특별시" },
      { code: "1114", name: "마포구" },
    ]);
  });

  it("builds official selectbox URLs without losing numeric codes", () => {
    expect(
      buildNecSelectboxUrl("getSggTownCode", {
        electionId: "0020260603",
        electionCode: "5",
        townCode: "1114",
      }),
    ).toBe(
      "https://info.nec.go.kr/bizcommon/selectbox/selectbox_getSggTownCodeJson.json?electionId=0020260603&electionCode=5&townCode=1114",
    );
  });

  it("derives personal candidate disclosure queries from nationwide district metadata", () => {
    const cache: NecElectionDistrictsCache = {
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
              districts: [{ code: "5111401", name: "마포구제1선거구" }],
            },
          ],
          localCouncilTownScopes: [
            {
              town: { code: "1114", name: "마포구" },
              districts: [{ code: "6111401", name: "마포구가선거구" }],
            },
          ],
        },
      ],
    };

    expect(buildCandidateInfoQueriesFromDistricts(cache)).toEqual([
      {
        slug: "3-1100",
        electionCode: "3",
        electionName: "시·도지사선거",
        cityCode: "1100",
        cityName: "서울특별시",
        scopeName: "서울특별시",
      },
      {
        slug: "11-1100",
        electionCode: "11",
        electionName: "교육감선거",
        cityCode: "1100",
        cityName: "서울특별시",
        scopeName: "서울특별시",
      },
      {
        slug: "4-1100-4111400",
        electionCode: "4",
        electionName: "구·시·군의 장선거",
        cityCode: "1100",
        cityName: "서울특별시",
        sggCityCode: "4111400",
        sggCityName: "마포구",
        scopeName: "마포구",
      },
      {
        slug: "5-1100-1114-5111401",
        electionCode: "5",
        electionName: "시·도의회의원선거",
        cityCode: "1100",
        cityName: "서울특별시",
        townCode: "1114",
        townName: "마포구",
        sggTownCode: "5111401",
        sggTownName: "마포구제1선거구",
        scopeName: "마포구제1선거구",
      },
      {
        slug: "6-1100-1114-6111401",
        electionCode: "6",
        electionName: "구·시·군의회의원선거",
        cityCode: "1100",
        cityName: "서울특별시",
        townCode: "1114",
        townName: "마포구",
        sggTownCode: "6111401",
        sggTownName: "마포구가선거구",
        scopeName: "마포구가선거구",
      },
    ]);
  });
});
