import { execFile } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { promisify } from "node:util";
import {
  buildNecListRequest,
  defaultNecElectionId,
  getNecRaceConfigs,
  type NecNormalizedCandidate,
  type NecRaceConfig,
  type NecRawCandidate,
  normalizeNecCandidate,
  shouldFetchDistricts,
  shouldUseRegionWideScope,
} from "../../src/necCrawler";
import { necEndpoints } from "../../src/necPolicy";

const execFileAsync = promisify(execFile);

type NecRegionRow = {
  wiwid: string;
  wiwname: string;
};

type NecDistrictRow = {
  sggid: string;
  sggname: string;
};

type NecRegionResponse = {
  regionlist?: NecRegionRow[];
};

type NecDistrictResponse = {
  sgglist?: NecDistrictRow[];
};

type NecCandidateListResponse = {
  totalCnt: number;
  list: NecRawCandidate[];
};

type CrawlScopeSummary = {
  regionId: string;
  regionName: string;
  districtId: string;
  districtName: string;
  totalCount: number;
  rowCount: number;
};

type CrawlRaceResult = {
  race: NecRaceConfig;
  scopes: CrawlScopeSummary[];
  candidates: NecNormalizedCandidate[];
};

type DownloadTarget = {
  candidate: NecNormalizedCandidate;
  documentType: "fivePledges" | "campaignBulletin";
  sourceLabel: "5대공약" | "선거공보";
  pdf: NonNullable<NecNormalizedCandidate["fivePledgePdf"]>;
};

const ajaxHeaders = {
  accept: "application/json, text/javascript, */*; q=0.01",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  referer: "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  "x-requested-with": "XMLHttpRequest",
};

function readArg(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function readOptionalArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function safeName(value: string) {
  return value.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "") || "unknown";
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function postNecJson<T>(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: ajaxHeaders,
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    throw new Error(`NEC request failed ${response.status}: ${url}`);
  }

  return (await response.json()) as T;
}

async function fetchRegions(electionId: string, race: NecRaceConfig) {
  const response = await postNecJson<NecRegionResponse>(necEndpoints.region, {
    sgId: electionId,
    subSgId: race.subElectionId,
  });

  return (response.regionlist ?? []).filter((region) => region.wiwid && region.wiwname);
}

async function fetchDistricts(electionId: string, race: NecRaceConfig, regionId: string) {
  const response = await postNecJson<NecDistrictResponse>(necEndpoints.district, {
    sgId: electionId,
    subSgId: race.subElectionId,
    wiwsidocode: regionId,
    wiwid: "",
  });

  return (response.sgglist ?? []).filter((district) => district.sggid && district.sggname);
}

async function fetchCandidatePage(input: Parameters<typeof buildNecListRequest>[0]) {
  return postNecJson<NecCandidateListResponse>(necEndpoints.list, buildNecListRequest(input));
}

async function fetchCandidatePages(input: Omit<Parameters<typeof buildNecListRequest>[0], "pageIndex">) {
  const firstPage = await fetchCandidatePage({ ...input, pageIndex: 1 });
  const rows = [...(firstPage.list ?? [])];
  const totalCount = Number(firstPage.totalCnt ?? rows.length);
  const pageSize = rows.length || 15;
  const pageCount = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

  for (let pageIndex = 2; pageIndex <= pageCount; pageIndex += 1) {
    await delay(80);
    const page = await fetchCandidatePage({ ...input, pageIndex });
    rows.push(...(page.list ?? []));
  }

  return {
    totalCount,
    rows,
  };
}

async function crawlRaceRegion(electionId: string, race: NecRaceConfig, region: NecRegionRow): Promise<CrawlRaceResult> {
  const scopes: CrawlScopeSummary[] = [];
  const candidates: NecNormalizedCandidate[] = [];

  if (shouldFetchDistricts(race.raceTypeCode)) {
    const districts = await fetchDistricts(electionId, race, region.wiwid);
    const scopesToFetch = districts.length > 0 ? districts : [{ sggid: "", sggname: "" }];

    for (const district of scopesToFetch) {
      await delay(80);
      const pageResult = await fetchCandidatePages({
        electionId,
        subElectionId: race.subElectionId,
        raceTypeCode: race.raceTypeCode,
        regionId: region.wiwid,
        districtId: district.sggid,
      });
      const normalized = pageResult.rows.map(normalizeNecCandidate);
      candidates.push(...normalized);
      scopes.push({
        regionId: region.wiwid,
        regionName: region.wiwname,
        districtId: district.sggid,
        districtName: district.sggname,
        totalCount: pageResult.totalCount,
        rowCount: normalized.length,
      });
    }

    return { race, scopes, candidates: dedupeCandidates(candidates) };
  }

  const useRegionWideScope = shouldUseRegionWideScope(race.raceTypeCode);
  const pageResult = await fetchCandidatePages({
    electionId,
    subElectionId: race.subElectionId,
    raceTypeCode: race.raceTypeCode,
    regionId: region.wiwid,
    guId: useRegionWideScope ? "ALL" : "",
    districtId: useRegionWideScope ? "ALL" : "",
  });
  const normalized = pageResult.rows.map(normalizeNecCandidate);

  scopes.push({
    regionId: region.wiwid,
    regionName: region.wiwname,
    districtId: useRegionWideScope ? "ALL" : "",
    districtName: useRegionWideScope ? "ALL" : "",
    totalCount: pageResult.totalCount,
    rowCount: normalized.length,
  });

  return { race, scopes, candidates: dedupeCandidates(normalized) };
}

async function crawlRace(electionId: string, race: NecRaceConfig, selectedRegionId?: string): Promise<CrawlRaceResult> {
  const regions = await fetchRegions(electionId, race);
  const targetRegions = selectedRegionId ? regions.filter((region) => region.wiwid === selectedRegionId) : regions;

  if (selectedRegionId && targetRegions.length === 0) {
    throw new Error(`Region ${selectedRegionId} was not returned for ${race.name}`);
  }

  const raceResult: CrawlRaceResult = { race, scopes: [], candidates: [] };

  for (const region of targetRegions) {
    await delay(80);
    const regionResult = await crawlRaceRegion(electionId, race, region);
    raceResult.scopes.push(...regionResult.scopes);
    raceResult.candidates.push(...regionResult.candidates);
    console.log(
      `[metadata] ${race.name} ${region.wiwname}: ${regionResult.candidates.length} rows, ${
        regionResult.candidates.filter((candidate) => candidate.fivePledgePdf).length
      } five-pledge PDFs`,
    );
  }

  return { race, scopes: raceResult.scopes, candidates: dedupeCandidates(raceResult.candidates) };
}

async function downloadFile(url: string, target: string) {
  if (await pathExists(target)) {
    return "skipped";
  }

  const response = await fetch(url, {
    headers: {
      referer: ajaxHeaders.referer,
      "user-agent": ajaxHeaders["user-agent"],
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  return "downloaded";
}

async function extractText(pdfPath: string, textPath: string) {
  if (await pathExists(textPath)) {
    return "skipped";
  }

  await execFileAsync("pdftotext", ["-layout", pdfPath, textPath]);
  return "extracted";
}

async function downloadCandidateDocument(outDir: string, target: DownloadTarget, { groupByRace }: { groupByRace: boolean }) {
  const { candidate, documentType, pdf, sourceLabel } = target;
  const label = candidate.name || candidate.partyName || candidate.candidateId || candidate.id;
  const raceDir = `${candidate.raceTypeCode}-${safeName(candidate.raceName)}`;
  const suffix = documentType === "fivePledges" ? "5pledges" : "campaign-bulletin";
  const fileName = groupByRace
    ? `${safeName(candidate.candidateNumber || "n")}-${safeName(candidate.districtName)}-${safeName(label)}-${safeName(
        candidate.candidateId ?? candidate.id,
      )}-${suffix}.pdf`
    : `${safeName(candidate.candidateNumber || "n")}-${safeName(label)}-${safeName(candidate.candidateId ?? candidate.id)}-${suffix}.pdf`;
  const pdfPath = groupByRace ? join(outDir, "pdfs", raceDir, fileName) : join(outDir, "pdfs", fileName);
  const textPath = pdfPath.replace(/\.pdf$/i, ".txt");
  const downloadStatus = await downloadFile(pdf.downloadUrl, pdfPath);
  const extractStatus = await extractText(pdfPath, textPath);

  return {
    candidateId: candidate.id,
    documentType,
    sourceLabel,
    name: candidate.name,
    partyName: candidate.partyName,
    raceName: candidate.raceName,
    requestedFullPath: pdf.requestedFullPath,
    pdfPath: relative(process.cwd(), pdfPath),
    textPath: relative(process.cwd(), textPath),
    downloadStatus,
    extractStatus,
  };
}

async function runLimited<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const results: R[] = [];
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length || 1));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(items[index], index);
      }
    }),
  );

  return results;
}

function findRaceConfig(raceArg: string) {
  const race = getNecRaceConfigs().find(
    (candidate) => candidate.raceTypeCode === raceArg || candidate.subElectionId === raceArg || candidate.name === raceArg,
  );

  if (!race) {
    throw new Error(`Unknown race: ${raceArg}`);
  }

  return race;
}

function dedupeCandidates(candidates: NecNormalizedCandidate[]) {
  return [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()];
}

function applyLimit<T>(items: T[], limit: number) {
  return limit > 0 ? items.slice(0, limit) : items;
}

function buildDownloadTargets(candidates: NecNormalizedCandidate[]) {
  return candidates.flatMap((candidate): DownloadTarget[] => {
    const targets: DownloadTarget[] = [];

    if (candidate.fivePledgePdf) {
      targets.push({
        candidate,
        documentType: "fivePledges",
        sourceLabel: "5대공약",
        pdf: candidate.fivePledgePdf,
      });
    }

    const shouldDownloadBulletin =
      candidate.campaignBulletinPdf && (shouldIncludeAllBulletins || (shouldIncludeFallbackBulletins && !candidate.fivePledgePdf));

    if (shouldDownloadBulletin && candidate.campaignBulletinPdf) {
      targets.push({
        candidate,
        documentType: "campaignBulletin",
        sourceLabel: "선거공보",
        pdf: candidate.campaignBulletinPdf,
      });
    }

    return targets;
  });
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const electionId = readArg("election", defaultNecElectionId);
const shouldCrawlAll = hasFlag("all");
const metadataOnly = hasFlag("metadata-only");
const shouldDownload = hasFlag("download") && !metadataOnly;
const shouldIncludeAllBulletins = hasFlag("include-bulletins");
const shouldIncludeFallbackBulletins = shouldIncludeAllBulletins || hasFlag("fallback-bulletins");
const downloadLimit = Number(readArg("limit", "0"));
const concurrency = Number(readArg("concurrency", "2"));
const outDir = readArg("out", shouldCrawlAll ? "data/nec/full" : "data/nec");
const fetchedAt = new Date().toISOString();
const raceResults: CrawlRaceResult[] = [];

if (shouldCrawlAll) {
  for (const race of getNecRaceConfigs()) {
    const result = await crawlRace(electionId, race);
    raceResults.push(result);
    await writeJson(join(outDir, "races", `${race.raceTypeCode}-${safeName(race.name)}.json`), {
      fetchedAt,
      electionId,
      source: necEndpoints.list,
      race,
      scopeCount: result.scopes.length,
      totalRows: result.candidates.length,
      fivePledgePdfCount: result.candidates.filter((candidate) => candidate.fivePledgePdf).length,
      campaignBulletinPdfCount: result.candidates.filter((candidate) => candidate.campaignBulletinPdf).length,
      scopes: result.scopes,
      candidates: result.candidates,
    });
  }
} else {
  const regionId = readArg("region", "1100");
  const race = findRaceConfig(readArg("race", "3"));
  const result = await crawlRace(electionId, race, regionId);
  raceResults.push(result);
  await writeJson(join(outDir, `nec-region-${regionId}-race-${race.raceTypeCode}.json`), {
    fetchedAt,
    electionId,
    source: necEndpoints.list,
    race,
    scopeCount: result.scopes.length,
    totalRows: result.candidates.length,
    fivePledgePdfCount: result.candidates.filter((candidate) => candidate.fivePledgePdf).length,
    campaignBulletinPdfCount: result.candidates.filter((candidate) => candidate.campaignBulletinPdf).length,
    scopes: result.scopes,
    candidates: result.candidates,
  });
}

const candidates = dedupeCandidates(raceResults.flatMap((result) => result.candidates));
const downloadableTargets = buildDownloadTargets(candidates);
const fivePledgeCandidates = candidates.filter((candidate) => candidate.fivePledgePdf);
const campaignBulletinCandidates = candidates.filter((candidate) => candidate.campaignBulletinPdf);

await writeJson(join(outDir, "candidates.json"), {
  fetchedAt,
  electionId,
  source: {
    page: "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25",
    endpoints: necEndpoints,
  },
  totalRows: candidates.length,
  fivePledgePdfCount: fivePledgeCandidates.length,
  campaignBulletinPdfCount: campaignBulletinCandidates.length,
  races: raceResults.map((result) => ({
    ...result.race,
    scopeCount: result.scopes.length,
    totalRows: result.candidates.length,
    fivePledgePdfCount: result.candidates.filter((candidate) => candidate.fivePledgePdf).length,
    campaignBulletinPdfCount: result.candidates.filter((candidate) => candidate.campaignBulletinPdf).length,
  })),
  candidates,
});

let downloadResults: Awaited<ReturnType<typeof downloadCandidateDocument>>[] = [];

if (shouldDownload) {
  const targets = applyLimit(downloadableTargets, downloadLimit);
  console.log(`[download] ${targets.length} PDF targets, concurrency=${concurrency}`);
  downloadResults = await runLimited(targets, concurrency, async (target, index) => {
    const result = await downloadCandidateDocument(outDir, target, { groupByRace: shouldCrawlAll });
    const label = target.candidate.name || target.candidate.partyName || target.candidate.id;
    console.log(`[download] ${index + 1}/${targets.length} ${label} ${target.sourceLabel}`);
    return result;
  });

  await writeJson(join(outDir, "downloads.json"), {
    fetchedAt,
    requested: targets.length,
    completed: downloadResults.filter(Boolean).length,
    results: downloadResults.filter(Boolean),
  });
}

const existingDownloadedPdfCount = await readExistingDownloadedPdfCount(join(outDir, "downloads.json"));

await writeJson(join(outDir, "manifest.json"), {
  fetchedAt,
  electionId,
  mode: shouldCrawlAll ? "all" : "single-region-race",
  metadataOnly,
  downloadedPdfCount: shouldDownload ? downloadResults.filter(Boolean).length : existingDownloadedPdfCount,
  totalRows: candidates.length,
  fivePledgePdfCount: fivePledgeCandidates.length,
  campaignBulletinPdfCount: campaignBulletinCandidates.length,
  raceCount: raceResults.length,
  endpoints: necEndpoints,
});

console.log(
  `Wrote ${candidates.length} NEC rows with ${fivePledgeCandidates.length} five-pledge PDFs and ${campaignBulletinCandidates.length} campaign bulletins to ${outDir}${
    shouldDownload ? `; downloaded ${downloadResults.filter(Boolean).length}` : ""
  }`,
);

async function readExistingDownloadedPdfCount(downloadsPath: string) {
  if (!(await pathExists(downloadsPath))) {
    return 0;
  }

  const downloads = await readJson<{ completed?: number; results?: unknown[] }>(downloadsPath);

  return downloads.completed ?? downloads.results?.length ?? 0;
}
