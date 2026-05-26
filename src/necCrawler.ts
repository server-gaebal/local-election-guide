import { buildNecDownloadUrl, getFivePledgePdf } from "./necPolicy";

export const defaultNecElectionId = "20260603";

export type NecRaceConfig = {
  subElectionId: string;
  raceTypeCode: string;
  name: string;
};

export type NecListRequestInput = {
  electionId: string;
  subElectionId: string;
  raceTypeCode: string;
  regionId: string;
  guId?: string;
  districtId?: string;
  pageIndex?: number;
};

export type NecRawCandidate = {
  [key: string]: string | number | null | undefined;
  sgId?: string | null;
  subSgId?: string | null;
  subSgName?: string | null;
  sggid?: string | null;
  sggname?: string | null;
  jdid?: string | null;
  jdname?: string | null;
  huboid?: string | null;
  hbjname?: string | null;
  hbjgiho?: string | null;
  hbjjikup?: string | null;
  hbjhakruk?: string | null;
  filename?: string | null;
  fileinfo?: string | null;
  filePathName?: string | null;
  updtFileName?: string | null;
  fileTypeName?: string | null;
};

export type NecPolicyPdf = {
  requestedFileName: string;
  requestedFullPath: string;
  downloadUrl: string;
};

export type NecNormalizedCandidate = {
  id: string;
  electionId: string;
  subElectionId: string;
  raceTypeCode: string;
  raceName: string;
  districtId: string;
  districtName: string;
  partyId: string;
  partyName: string;
  candidateId: string | null;
  candidateNumber: string;
  name: string;
  occupation: string;
  education: string;
  thumbnailPath: string;
  thumbnailUrl: string | null;
  fivePledgePdf: NecPolicyPdf | null;
};

const raceConfigs: NecRaceConfig[] = [
  { subElectionId: "320260603", raceTypeCode: "3", name: "시·도지사선거" },
  { subElectionId: "420260603", raceTypeCode: "4", name: "구·시·군의 장선거" },
  { subElectionId: "520260603", raceTypeCode: "5", name: "시·도의회의원선거" },
  { subElectionId: "620260603", raceTypeCode: "6", name: "구·시·군의회의원선거" },
  { subElectionId: "820260603", raceTypeCode: "8", name: "광역의원비례대표선거" },
  { subElectionId: "920260603", raceTypeCode: "9", name: "기초의원비례대표선거" },
  { subElectionId: "1120260603", raceTypeCode: "11", name: "교육감선거" },
  { subElectionId: "220260603", raceTypeCode: "2", name: "국회의원선거" },
];

export function getNecRaceConfigs() {
  return [...raceConfigs];
}

export function getNecRaceConfigByName(raceName: string) {
  const normalizedRaceName = raceName.trim();
  return raceConfigs.find((race) => race.name === normalizedRaceName) ?? null;
}

export function shouldFetchDistricts(raceTypeCode: string) {
  return raceTypeCode === "2" || raceTypeCode === "4";
}

export function shouldUseRegionWideScope(raceTypeCode: string) {
  return raceTypeCode === "5" || raceTypeCode === "6" || raceTypeCode === "9";
}

export function buildNecListRequest({
  electionId,
  subElectionId,
  raceTypeCode,
  regionId,
  guId = "",
  districtId = "",
  pageIndex = 1,
}: NecListRequestInput) {
  return {
    sgId: electionId,
    subSgId: subElectionId,
    hRegionId: regionId,
    hGuId: guId,
    hSggId: districtId,
    sgTypecode: raceTypeCode,
    pageIndex: String(pageIndex),
    phGuId: "",
    elecEndYn: "N",
  };
}

export function buildNecThumbnailUrl(electionId: string, thumbnailPath: string | null | undefined) {
  const normalizedPath = toText(thumbnailPath).replace(/^\/+/, "");

  if (!normalizedPath) {
    return null;
  }

  return `https://cdn.nec.go.kr/photo_${electionId}/${normalizedPath}`;
}

export function normalizeNecCandidate(row: NecRawCandidate): NecNormalizedCandidate {
  const electionId = toText(row.sgId) || defaultNecElectionId;
  const raceName = toText(row.subSgName);
  const raceConfig = getNecRaceConfigByName(raceName);
  const subElectionId = raceConfig?.subElectionId ?? toText(row.subSgId);
  const raceTypeCode = raceConfig?.raceTypeCode ?? "";
  const districtName = toText(row.sggname);
  const candidateName = toText(row.hbjname);
  const partyName = toText(row.jdname);
  const candidateId = toText(row.huboid) || null;
  const fallbackId = [raceName, districtName, partyName, candidateName, toText(row.filePathName), toText(row.updtFileName)]
    .filter(Boolean)
    .join("-");
  const rowId = candidateId ?? fallbackId;
  const fivePledgePdf = getFivePledgePdf(toText(row.fileinfo));
  const requestedFileName = `${electionId}_${districtName}_${candidateName || partyName}_5대공약.pdf`;

  return {
    id: [electionId, subElectionId, rowId].filter(Boolean).join("-"),
    electionId,
    subElectionId,
    raceTypeCode,
    raceName,
    districtId: toText(row.sggid),
    districtName,
    partyId: toText(row.jdid),
    partyName,
    candidateId,
    candidateNumber: toText(row.hbjgiho),
    name: candidateName,
    occupation: toText(row.hbjjikup),
    education: toText(row.hbjhakruk),
    thumbnailPath: toText(row.filename),
    thumbnailUrl: buildNecThumbnailUrl(electionId, toText(row.filename)),
    fivePledgePdf: fivePledgePdf
      ? {
          requestedFileName,
          requestedFullPath: fivePledgePdf.requestedFullPath,
          downloadUrl: buildNecDownloadUrl({
            requestedFileName,
            requestedFullPath: fivePledgePdf.requestedFullPath,
          }),
        }
      : null,
  };
}

function toText(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value).trim();
}
