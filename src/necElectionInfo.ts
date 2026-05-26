export const defaultInfoElectionId = "0020260603";
export const necInfoBaseUrl = "https://info.nec.go.kr";
export const necSelectboxBaseUrl = `${necInfoBaseUrl}/bizcommon/selectbox`;

export type NecSelectboxItem = {
  code: string;
  name: string;
};

export type NecTownDistrictScope = {
  town: NecSelectboxItem;
  districts: NecSelectboxItem[];
};

export type NecCityElectionDistricts = NecSelectboxItem & {
  districtHeadScopes: NecSelectboxItem[];
  cityCouncilTownScopes: NecTownDistrictScope[];
  localCouncilTownScopes: NecTownDistrictScope[];
};

export type NecElectionDistrictsCache = {
  generatedAt: string;
  electionId: string;
  sourceName: string;
  sourceUrl: string;
  cities: NecCityElectionDistricts[];
};

export type NecCandidateInfoQuery = {
  slug: string;
  electionCode: string;
  electionName: string;
  cityCode: string;
  cityName: string;
  sggCityCode?: string;
  sggCityName?: string;
  townCode?: string;
  townName?: string;
  sggTownCode?: string;
  sggTownName?: string;
  scopeName: string;
};

export type NecSelectboxEndpoint = "cityCodeDIBySg" | "townCodeBySg" | "getSggCityCode" | "getSggTownCode";

type NecSelectboxPayload = {
  jsonResult?: {
    header?: {
      result?: string;
      errorMessage?: string;
      errorCode?: string;
    };
    body?: Array<{
      CODE?: string | number | null;
      NAME?: string | number | null;
    }>;
  };
};

const selectboxFiles: Record<NecSelectboxEndpoint, string> = {
  cityCodeDIBySg: "selectbox_cityCodeDIBySgJson.json",
  townCodeBySg: "selectbox_townCodeBySgJson.json",
  getSggCityCode: "selectbox_getSggCityCodeJson.json",
  getSggTownCode: "selectbox_getSggTownCodeJson.json",
};

const disclosureElectionNames: Record<string, string> = {
  "3": "시·도지사선거",
  "4": "구·시·군의 장선거",
  "5": "시·도의회의원선거",
  "6": "구·시·군의회의원선거",
  "11": "교육감선거",
};

export function parseNecSelectboxItems(payload: NecSelectboxPayload): NecSelectboxItem[] {
  const jsonResult = payload.jsonResult;
  const result = jsonResult?.header?.result;

  if (!jsonResult) {
    return [];
  }

  if (result && result.toLowerCase() !== "ok") {
    const errorMessage = jsonResult.header?.errorMessage || jsonResult.header?.errorCode || "unknown selectbox error";
    throw new Error(`NEC selectbox request failed: ${errorMessage}`);
  }

  return (jsonResult.body ?? [])
    .map((item) => ({
      code: toText(item.CODE),
      name: toText(item.NAME),
    }))
    .filter((item) => item.code.length > 0 && item.name.length > 0);
}

export function buildNecSelectboxUrl(endpoint: NecSelectboxEndpoint, params: Record<string, string>) {
  const url = new URL(`${necSelectboxBaseUrl}/${selectboxFiles[endpoint]}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function buildCandidateInfoQueriesFromDistricts(cache: NecElectionDistrictsCache): NecCandidateInfoQuery[] {
  return cache.cities.flatMap((city) => [
    buildCityWideQuery("3", city),
    buildCityWideQuery("11", city),
    ...city.districtHeadScopes.map((scope) => buildSggCityQuery("4", city, scope)),
    ...city.cityCouncilTownScopes.flatMap((townScope) =>
      townScope.districts.map((district) => buildSggTownQuery("5", city, townScope.town, district)),
    ),
    ...city.localCouncilTownScopes.flatMap((townScope) =>
      townScope.districts.map((district) => buildSggTownQuery("6", city, townScope.town, district)),
    ),
  ]);
}

function buildCityWideQuery(electionCode: string, city: NecSelectboxItem): NecCandidateInfoQuery {
  return {
    slug: [electionCode, city.code].join("-"),
    electionCode,
    electionName: disclosureElectionNames[electionCode],
    cityCode: city.code,
    cityName: city.name,
    scopeName: city.name,
  };
}

function buildSggCityQuery(
  electionCode: string,
  city: NecSelectboxItem,
  scope: NecSelectboxItem,
): NecCandidateInfoQuery {
  return {
    slug: [electionCode, city.code, scope.code].join("-"),
    electionCode,
    electionName: disclosureElectionNames[electionCode],
    cityCode: city.code,
    cityName: city.name,
    sggCityCode: scope.code,
    sggCityName: scope.name,
    scopeName: scope.name,
  };
}

function buildSggTownQuery(
  electionCode: string,
  city: NecSelectboxItem,
  town: NecSelectboxItem,
  district: NecSelectboxItem,
): NecCandidateInfoQuery {
  return {
    slug: [electionCode, city.code, town.code, district.code].join("-"),
    electionCode,
    electionName: disclosureElectionNames[electionCode],
    cityCode: city.code,
    cityName: city.name,
    townCode: town.code,
    townName: town.name,
    sggTownCode: district.code,
    sggTownName: district.name,
    scopeName: district.name,
  };
}

function toText(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value).trim();
}
