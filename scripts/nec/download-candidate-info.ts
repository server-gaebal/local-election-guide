import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCandidateInfoTable, type NecCandidateInfoRecord } from "../../src/necCandidateInfo";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(repoRoot, "data/nec/info");
const infoEndpoint = "https://info.nec.go.kr/electioninfo/electionInfo_report.xhtml";
const crimeScanEndpoint = "https://info.nec.go.kr/electioninfo/candidate_detail_scanSearchJson.json";
const electionId = "0020260603";

type CandidateInfoQuery = {
  slug: string;
  electionCode: string;
  cityCode: string;
  sggCityCode?: string;
  townCode?: string;
  sggTownCode?: string;
};

const queries: CandidateInfoQuery[] = [
  { slug: "seoul-mayor", electionCode: "3", cityCode: "1100" },
  { slug: "seoul-education", electionCode: "11", cityCode: "1100" },
  { slug: "mapo-mayor", electionCode: "4", cityCode: "1100", sggCityCode: "4111400" },
  { slug: "seoul-council-mapo-1", electionCode: "5", cityCode: "1100", townCode: "1114", sggTownCode: "5111401" },
  { slug: "mapo-council-a", electionCode: "6", cityCode: "1100", townCode: "1114", sggTownCode: "6111401" },
];

async function main() {
  await mkdir(join(outDir, "html"), { recursive: true });

  const records: NecCandidateInfoRecord[] = [];

  for (const query of queries) {
    const html = await fetchCandidateList(query);
    await writeFile(join(outDir, "html", `${query.slug}.html`), html);
    records.push(...parseCandidateInfoTable(html));
  }

  const recordsWithCrimeFiles = await Promise.all(records.map(attachCrimeDisclosureFiles));
  const uniqueRecords = Array.from(new Map(recordsWithCrimeFiles.map((record) => [record.candidateId, record])).values());

  await writeFile(
    join(outDir, "selected-candidates.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceUrl: "https://info.nec.go.kr/main/showDocument.xhtml?electionId=0020260603&topMenuId=CP&secondMenuId=CPRI03",
        records: uniqueRecords,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${uniqueRecords.length} candidate disclosure records to data/nec/info`);
}

async function fetchCandidateList(query: CandidateInfoQuery) {
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

await main();
