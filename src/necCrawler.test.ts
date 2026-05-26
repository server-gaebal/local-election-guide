import { describe, expect, it } from "vitest";
import {
  buildNecThumbnailUrl,
  buildNecListRequest,
  getNecRaceConfigs,
  normalizeNecCandidate,
  shouldFetchDistricts,
} from "./necCrawler";

describe("NEC full crawler helpers", () => {
  it("lists all local-election race configs from the candidate pledge page", () => {
    expect(getNecRaceConfigs().map((race) => [race.subElectionId, race.raceTypeCode, race.name])).toEqual([
      ["320260603", "3", "시·도지사선거"],
      ["420260603", "4", "구·시·군의 장선거"],
      ["520260603", "5", "시·도의회의원선거"],
      ["620260603", "6", "구·시·군의회의원선거"],
      ["820260603", "8", "광역의원비례대표선거"],
      ["920260603", "9", "기초의원비례대표선거"],
      ["1120260603", "11", "교육감선거"],
      ["220260603", "2", "국회의원선거"],
    ]);
  });

  it("knows which races require district traversal", () => {
    expect(shouldFetchDistricts("4")).toBe(true);
    expect(shouldFetchDistricts("2")).toBe(true);
    expect(shouldFetchDistricts("3")).toBe(false);
    expect(shouldFetchDistricts("5")).toBe(false);
  });

  it("builds list request bodies for region-wide council races", () => {
    expect(
      buildNecListRequest({
        electionId: "20260603",
        subElectionId: "520260603",
        raceTypeCode: "5",
        regionId: "1100",
        districtId: "ALL",
        guId: "ALL",
        pageIndex: 2,
      }),
    ).toEqual({
      sgId: "20260603",
      subSgId: "520260603",
      hRegionId: "1100",
      hGuId: "ALL",
      hSggId: "ALL",
      sgTypecode: "5",
      pageIndex: "2",
      phGuId: "",
      elecEndYn: "N",
    });
  });

  it("normalizes NEC candidate rows with 5 pledge PDF metadata", () => {
    const normalized = normalizeNecCandidate({
      sgId: "20260603",
      subSgName: "시·도지사선거 ",
      sggid: "3110000",
      sggname: "서울특별시",
      jdid: "100",
      jdname: "더불어민주당",
      huboid: "100157144",
      hbjname: "정원오",
      hbjgiho: "1",
      hbjjikup: "정당인",
      hbjhakruk: "한양대학교 도시대학원 도시개발경영전공 박사 수료",
      filename: "Gsg1100/Hb100157144/gicho/thumbnail.100157144.JPG",
      fileinfo:
        "선거공보||20260603/PDF/PBINFO/1100/003_100157144_20260520_1.pdf||||1||HEIGHT||Y||00||01,5대공약||20260603/PDF/P5_PRMS_PUB/1100/001_100157144_20260516_1.pdf||11551||1||HEIGHT||Y||00||01",
    });

    expect(normalized).toMatchObject({
      id: "20260603-320260603-100157144",
      candidateId: "100157144",
      raceName: "시·도지사선거",
      partyName: "더불어민주당",
      name: "정원오",
      thumbnailUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100157144/gicho/thumbnail.100157144.JPG",
      campaignBulletinPdf: {
        requestedFileName: "20260603_서울특별시_정원오_선거공보.pdf",
        requestedFullPath: "20260603/PDF/PBINFO/1100/003_100157144_20260520_1.pdf",
      },
      fivePledgePdf: {
        requestedFileName: "20260603_서울특별시_정원오_5대공약.pdf",
        requestedFullPath: "20260603/PDF/P5_PRMS_PUB/1100/001_100157144_20260516_1.pdf",
      },
    });
  });

  it("builds CDN thumbnail URLs from NEC filename fields", () => {
    expect(buildNecThumbnailUrl("20260603", "Gsg1100/Hb100157144/gicho/thumbnail.100157144.JPG")).toBe(
      "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100157144/gicho/thumbnail.100157144.JPG",
    );
  });
});
