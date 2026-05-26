import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCandidateInfoQueriesFromDistricts,
  buildNecSelectboxUrl,
  defaultInfoElectionId,
  parseNecSelectboxItems,
  type NecCityElectionDistricts,
  type NecElectionDistrictsCache,
  type NecSelectboxEndpoint,
  type NecSelectboxItem,
  type NecTownDistrictScope,
} from "../../src/necElectionInfo";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const defaultOutPath = "data/nec/info/election-districts.json";

const args = process.argv.slice(2);
const electionId = getArgValue("--election-id") ?? defaultInfoElectionId;
const outPath = getArgValue("--out") ?? defaultOutPath;
const limitCities = toPositiveNumber(getArgValue("--limit-cities"));
const delayMs = toPositiveNumber(getArgValue("--delay-ms")) ?? 50;

async function main() {
  const allCities = await fetchSelectbox("cityCodeDIBySg", { electionId, electionCode: "3" }, "cities");
  const cities = limitCities ? allCities.slice(0, limitCities) : allCities;
  const cityDistricts: NecCityElectionDistricts[] = [];

  for (const [index, city] of cities.entries()) {
    console.log(`Fetching ${index + 1}/${cities.length}: ${city.name}(${city.code})`);

    const [districtHeadScopes, cityCouncilTownScopes, localCouncilTownScopes] = await Promise.all([
      fetchSelectbox(
        "getSggCityCode",
        { electionId, electionCode: "4", cityCode: city.code },
        `${city.name} district-head scopes`,
      ),
      fetchTownDistrictScopes("5", city),
      fetchTownDistrictScopes("6", city),
    ]);

    cityDistricts.push({
      ...city,
      districtHeadScopes,
      cityCouncilTownScopes,
      localCouncilTownScopes,
    });

    await wait(delayMs);
  }

  const cache: NecElectionDistrictsCache = {
    generatedAt: new Date().toISOString(),
    electionId,
    sourceName: "선거통계시스템 선거구 코드",
    sourceUrl: "https://info.nec.go.kr/",
    cities: cityDistricts,
  };
  const candidateDisclosureQueryPlan = buildCandidateInfoQueriesFromDistricts(cache);

  await writeJson(outPath, {
    ...cache,
    candidateDisclosureQueryPlan,
    stats: {
      cityCount: cache.cities.length,
      districtHeadScopeCount: sumBy(cache.cities, (city) => city.districtHeadScopes.length),
      cityCouncilTownCount: sumBy(cache.cities, (city) => city.cityCouncilTownScopes.length),
      cityCouncilDistrictCount: sumBy(cache.cities, (city) =>
        sumBy(city.cityCouncilTownScopes, (scope) => scope.districts.length),
      ),
      localCouncilTownCount: sumBy(cache.cities, (city) => city.localCouncilTownScopes.length),
      localCouncilDistrictCount: sumBy(cache.cities, (city) =>
        sumBy(city.localCouncilTownScopes, (scope) => scope.districts.length),
      ),
      candidateDisclosureQueryCount: candidateDisclosureQueryPlan.length,
    },
  });

  console.log(`Wrote ${candidateDisclosureQueryPlan.length} candidate disclosure queries to ${outPath}`);
}

async function fetchTownDistrictScopes(electionCode: "5" | "6", city: NecSelectboxItem): Promise<NecTownDistrictScope[]> {
  const towns = await fetchSelectbox(
    "townCodeBySg",
    { electionId, electionCode, cityCode: city.code },
    `${city.name} towns for electionCode ${electionCode}`,
  );
  const scopes: NecTownDistrictScope[] = [];

  for (const town of towns) {
    const districts = await fetchSelectbox(
      "getSggTownCode",
      { electionId, electionCode, townCode: town.code },
      `${town.name} districts for electionCode ${electionCode}`,
    );

    scopes.push({ town, districts });
    await wait(delayMs);
  }

  return scopes;
}

async function fetchSelectbox(
  endpoint: NecSelectboxEndpoint,
  params: Record<string, string>,
  context: string,
): Promise<NecSelectboxItem[]> {
  const url = buildNecSelectboxUrl(endpoint, params);
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${context}: ${response.status} ${response.statusText}`);
  }

  return parseNecSelectboxItems(await response.json());
}

async function writeJson(relativePath: string, value: unknown) {
  const target = join(repoRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

function getArgValue(name: string) {
  const arg = args.find((value) => value === name || value.startsWith(`${name}=`));

  if (!arg) {
    return undefined;
  }

  if (arg === name) {
    return args[args.indexOf(arg) + 1];
  }

  return arg.slice(name.length + 1);
}

function toPositiveNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

async function wait(ms: number) {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

await main();
