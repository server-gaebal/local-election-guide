import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultInfoElectionId,
  parseNecElectionAreaRows,
  type NecElectionAreaCache,
  type NecElectionAreaRow,
  type NecElectionDistrictsCache,
} from "../../src/necElectionInfo";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const infoEndpoint = "https://info.nec.go.kr/electioninfo/electionInfo_report.xhtml";
const defaultDistrictsPath = "data/nec/info/election-districts.json";
const defaultOutPath = "data/nec/info/election-areas.json";
const sourceUrl =
  "https://info.nec.go.kr/main/showDocument.xhtml?electionId=0020260603&topMenuId=BI&secondMenuId=BIGI05";
const args = process.argv.slice(2);

const electionId = getArgValue("--election-id") ?? defaultInfoElectionId;
const districtsPath = getArgValue("--districts") ?? defaultDistrictsPath;
const outPath = getArgValue("--out") ?? defaultOutPath;
const limitCities = toPositiveNumber(getArgValue("--limit-cities"));
const delayMs = toPositiveNumber(getArgValue("--delay-ms")) ?? 50;

const statementIds: Record<NecElectionAreaRow["electionCode"], string> = {
  "4": "BIGI05_2",
  "5": "BIGI05_5_5",
  "6": "BIGI05_6",
};

async function main() {
  const districts = JSON.parse(await readFile(join(repoRoot, districtsPath), "utf8")) as NecElectionDistrictsCache;
  const cities = limitCities ? districts.cities.slice(0, limitCities) : districts.cities;
  const rows: NecElectionAreaRow[] = [];

  for (const [cityIndex, city] of cities.entries()) {
    for (const electionCode of Object.keys(statementIds) as NecElectionAreaRow["electionCode"][]) {
      console.log(`Fetching ${cityIndex + 1}/${cities.length}: ${city.name} electionCode ${electionCode}`);
      const html = await fetchElectionAreaHtml(electionCode, city.code);
      rows.push(
        ...parseNecElectionAreaRows(html, {
          electionCode,
          cityCode: city.code,
          cityName: city.name,
        }),
      );
      await wait(delayMs);
    }
  }

  const cache: NecElectionAreaCache = {
    generatedAt: new Date().toISOString(),
    electionId,
    sourceName: "선거통계시스템 선거구 및 읍면동현황",
    sourceUrl,
    rows,
  };

  await writeJson(outPath, {
    ...cache,
    stats: {
      rowCount: rows.length,
      cityCount: new Set(rows.map((row) => row.cityCode)).size,
      districtHeadRowCount: rows.filter((row) => row.electionCode === "4").length,
      cityCouncilRowCount: rows.filter((row) => row.electionCode === "5").length,
      localCouncilRowCount: rows.filter((row) => row.electionCode === "6").length,
      neighborhoodMappingCount: rows.reduce((sum, row) => sum + row.neighborhoods.length, 0),
    },
  });

  console.log(`Wrote ${rows.length} election area rows to ${outPath}`);
}

async function fetchElectionAreaHtml(electionCode: NecElectionAreaRow["electionCode"], cityCode: string) {
  const body = new URLSearchParams({
    electionId,
    requestURI: "/electioninfo/0020260603/bi/bigi05.jsp",
    topMenuId: "BI",
    secondMenuId: "BIGI05",
    menuId: "BIGI05",
    statementId: statementIds[electionCode],
    electionCode,
    cityCode,
  });

  const response = await fetch(infoEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch election areas for ${cityCode}/${electionCode}: ${response.status}`);
  }

  return response.text();
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

async function wait(ms: number) {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

await main();
