import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCandidateInfoTable, type NecCandidateInfoRecord } from "../../src/necCandidateInfo";
import {
  buildCandidateInfoQueriesFromDistricts,
  defaultInfoElectionId,
  type NecCandidateInfoQuery,
  type NecElectionDistrictsCache,
} from "../../src/necElectionInfo";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(repoRoot, "data/nec/info");
const infoEndpoint = "https://info.nec.go.kr/electioninfo/electionInfo_report.xhtml";
const crimeScanEndpoint = "https://info.nec.go.kr/electioninfo/candidate_detail_scanSearchJson.json";
const electionId = defaultInfoElectionId;
const args = process.argv.slice(2);

type CandidateInfoDistrictsCache = NecElectionDistrictsCache & {
  candidateDisclosureQueryPlan?: NecCandidateInfoQuery[];
};

const selectedQueries: NecCandidateInfoQuery[] = [
  {
    slug: "seoul-mayor",
    electionCode: "3",
    electionName: "시·도지사선거",
    cityCode: "1100",
    cityName: "서울특별시",
    scopeName: "서울특별시",
  },
  {
    slug: "seoul-education",
    electionCode: "11",
    electionName: "교육감선거",
    cityCode: "1100",
    cityName: "서울특별시",
    scopeName: "서울특별시",
  },
  {
    slug: "mapo-mayor",
    electionCode: "4",
    electionName: "구·시·군의 장선거",
    cityCode: "1100",
    cityName: "서울특별시",
    sggCityCode: "4111400",
    sggCityName: "마포구",
    scopeName: "마포구",
  },
  {
    slug: "seoul-council-mapo-1",
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
    slug: "mapo-council-a",
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
];

async function main() {
  const allMode = args.includes("--all");
  const saveHtml = !args.includes("--no-html");
  const limit = toPositiveNumber(getArgValue("--limit"));
  const delayMs = toPositiveNumber(getArgValue("--delay-ms")) ?? 0;
  const outputFileName = getArgValue("--out") ?? (allMode ? "all-candidates.json" : "selected-candidates.json");
  const htmlDir = join(outDir, allMode ? "html/all" : "html");
  const queryPlan = await loadCandidateInfoQueries(allMode);
  const queries = limit ? queryPlan.slice(0, limit) : queryPlan;

  if (saveHtml) {
    await mkdir(htmlDir, { recursive: true });
  }

  const records: NecCandidateInfoRecord[] = [];

  for (const [index, query] of queries.entries()) {
    console.log(`Fetching ${index + 1}/${queries.length}: ${query.electionName} ${query.scopeName}`);
    const html = await fetchCandidateList(query);
    if (saveHtml) {
      await writeFile(join(htmlDir, `${query.slug}.html`), html);
    }
    records.push(...parseCandidateInfoTable(html));
    await wait(delayMs);
  }

  const recordsWithCrimeFiles = await mapWithConcurrency(records, 12, attachCrimeDisclosureFiles);
  const uniqueRecords = Array.from(new Map(recordsWithCrimeFiles.map((record) => [record.candidateId, record])).values());

  await writeFile(
    join(outDir, outputFileName),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceUrl: "https://info.nec.go.kr/main/showDocument.xhtml?electionId=0020260603&topMenuId=CP&secondMenuId=CPRI03",
        queryCount: queries.length,
        records: uniqueRecords,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${uniqueRecords.length} candidate disclosure records to data/nec/info/${outputFileName}`);
}

async function loadCandidateInfoQueries(allMode: boolean) {
  if (!allMode) {
    return selectedQueries;
  }

  const districtsPath = getArgValue("--districts") ?? "data/nec/info/election-districts.json";
  const cache = JSON.parse(await readFile(join(repoRoot, districtsPath), "utf8")) as CandidateInfoDistrictsCache;

  return cache.candidateDisclosureQueryPlan ?? buildCandidateInfoQueriesFromDistricts(cache);
}

async function fetchCandidateList(query: NecCandidateInfoQuery) {
  const body = new URLSearchParams({
    electionId,
    requestURI: "/electioninfo/0020260603/cp/cpri03.jsp",
    topMenuId: "CP",
    secondMenuId: "CPRI03",
    menuId: "CPRI03",
    statementId: `CPRI03_#${query.electionCode}`,
    electionCode: query.electionCode,
    cityCode: query.cityCode,
    sggCityCode: query.sggCityCode ?? "-1",
    townCode: query.townCode ?? "-1",
    sggTownCode: query.sggTownCode ?? "0",
    dateCode: "0",
    proportionalRepresentationCode: "-1",
  });

  const response = await fetch(infoEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch candidate info for ${query.slug}: ${response.status}`);
  }

  return response.text();
}

async function attachCrimeDisclosureFiles(record: NecCandidateInfoRecord): Promise<NecCandidateInfoRecord> {
  if (record.crimeRecord === "없음" || record.crimeRecord === "0건") {
    return record;
  }

  const params = new URLSearchParams({
    gubun: "5",
    electionId,
    huboId: record.candidateId,
    statementId: "CPRI03_candidate_scanSearch",
  });

  try {
    const response = await fetch(`${crimeScanEndpoint}?${params.toString()}`);

    if (!response.ok) {
      return record;
    }

    const payload = (await response.json()) as {
      jsonResult?: { body?: Array<{ FILEPATH?: string }> };
    };

    return {
      ...record,
      crimeDisclosureFiles: payload.jsonResult?.body?.flatMap((item) => (item.FILEPATH ? [item.FILEPATH] : [])) ?? [],
    };
  } catch {
    return record;
  }
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

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}

await main();
