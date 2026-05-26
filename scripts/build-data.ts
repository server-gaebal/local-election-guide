import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { candidates, residences, voterProfiles } from "../src/mockData";
import { createCandidateInfoIndex, type NecCandidateInfoRecord } from "../src/necCandidateInfo";
import type { NecNormalizedCandidate } from "../src/necCrawler";
import type { NecElectionAreaCache, NecElectionDistrictsCache } from "../src/necElectionInfo";
import { buildNationalResidences, preserveStableResidenceIds } from "../src/necResidenceIndex";
import {
  buildResidenceDatasetFromNec,
  extractPledges,
  extractPolicyTags,
  type NecDownloadIndex,
} from "../src/necRegionCache";
import { necEndpoints } from "../src/necPolicy";
import { buildResidenceShareHtml } from "../src/sharePreview";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedAt = process.env.DATA_GENERATED_AT ?? "2026-05-26T13:50:00+09:00";
const version = "mixed-nec-cache-2026-05-26";

type NecCandidatesCache = {
  candidates: NecNormalizedCandidate[];
};

type NecDownloadsCache = {
  results: Array<{
    candidateId: string;
    documentType?: "fivePledges" | "campaignBulletin";
    sourceLabel?: "5대공약" | "선거공보";
    textPath: string;
  }>;
};

type NecCandidateInfoCache = {
  records: NecCandidateInfoRecord[];
};

type NecDownloadEntry = NecDownloadIndex extends Map<string, infer Value> ? Value : never;

function hashJson(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function writeJson(relativePath: string, value: unknown) {
  const target = join(repoRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value)}\n`);
}

async function writeText(relativePath: string, value: string) {
  const target = join(repoRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, value);
}

async function readJsonFile<T>(relativePath: string) {
  return JSON.parse(await readFile(join(repoRoot, relativePath), "utf8")) as T;
}

async function pathExists(relativePath: string) {
  try {
    await access(join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function buildNecDownloadIndex(downloads: NecDownloadsCache) {
  const index: NecDownloadIndex = new Map();

  for (const result of downloads.results) {
    const text = await readFile(join(repoRoot, result.textPath), "utf8");
    const pledges = extractPledges(text);
    const policyText = pledges.map((pledge) => `${pledge.title} ${pledge.detail}`).join(" ");
    const existing = index.get(result.candidateId);
    const nextEntry = {
      textPath: result.textPath,
      sourceType: result.documentType ?? "fivePledges",
      sourceLabel: result.sourceLabel ?? "5대공약",
      pledgeTitles: pledges.map((pledge) => pledge.title),
      pledges,
      policyTags: extractPolicyTags(policyText),
    } satisfies NecDownloadEntry;

    if (!existing || nextEntry.sourceType === "fivePledges") {
      index.set(result.candidateId, nextEntry);
    }
  }

  return index;
}

async function buildNecRegionDatasets(nextResidences: typeof residences) {
  if (!(await pathExists("data/nec/full/candidates.json")) || !(await pathExists("data/nec/full/downloads.json"))) {
    return new Map();
  }

  const [necCache, downloadsCache] = await Promise.all([
    readJsonFile<NecCandidatesCache>("data/nec/full/candidates.json"),
    readJsonFile<NecDownloadsCache>("data/nec/full/downloads.json"),
  ]);
  const downloads = await buildNecDownloadIndex(downloadsCache);
  const candidateInfoPath = (await pathExists("data/nec/info/all-candidates.json"))
    ? "data/nec/info/all-candidates.json"
    : "data/nec/info/selected-candidates.json";
  const candidateInfo = (await pathExists(candidateInfoPath))
    ? createCandidateInfoIndex((await readJsonFile<NecCandidateInfoCache>(candidateInfoPath)).records)
    : new Map();
  const buildableResidences = nextResidences.filter(
    (residence) => residence.electionScope || residence.id === "seoul-mapo-gongdeok",
  );

  return new Map(
    buildableResidences.map((residence) => [
      residence.id,
      buildResidenceDatasetFromNec({
        residence,
        generatedAt,
        candidates: necCache.candidates,
        downloads,
        candidateInfo,
      }),
    ]),
  );
}

async function buildResidences() {
  const nationalResidences = preserveStableResidenceIds(await buildNationalResidencesFromCache(), residences);
  const nationalResidenceKeys = new Set(nationalResidences.map(residenceLocationKey));
  const fallbackResidences = residences.filter((residence) => !nationalResidenceKeys.has(residenceLocationKey(residence)));
  const residenceMap = new Map([...fallbackResidences, ...nationalResidences].map((residence) => [residence.id, residence]));

  return Array.from(residenceMap.values());
}

function residenceLocationKey(residence: { city: string; district: string; neighborhood: string }) {
  return [residence.city, residence.district, residence.neighborhood].join("\u0000");
}

async function buildNationalResidencesFromCache() {
  if (!(await pathExists("data/nec/info/election-districts.json"))) {
    return [];
  }

  const districts = await readJsonFile<NecElectionDistrictsCache>("data/nec/info/election-districts.json");
  const areaCache = (await pathExists("data/nec/info/election-areas.json"))
    ? await readJsonFile<NecElectionAreaCache>("data/nec/info/election-areas.json")
    : undefined;

  return buildNationalResidences(districts, areaCache);
}

const allResidences = await buildResidences();
const normalizedResidences = allResidences.map((residence) =>
  residence.id === "seoul-mapo-gongdeok"
    ? {
        ...residence,
        cacheKey: "nec:policy:20260603:seoul-mapo-gongdeok:v1",
        cachedAt: "2026-05-26 13:50 KST",
      }
    : residence,
);
const necRegionDatasets = await buildNecRegionDatasets(normalizedResidences);

const regions = normalizedResidences.map((residence) => {
  const necDataset = necRegionDatasets.get(residence.id);
  const regionCandidates = candidates.filter((candidate) => candidate.residenceId === residence.id);
  const dataset = {
    residence,
    candidates: regionCandidates,
    source: {
      mode: "mock" as const,
      generatedAt,
      sourceName: "Mock normalized cache for NEC 5 pledge PDFs",
      sourceUrl: "https://policy.nec.go.kr/",
      pdfCount: regionCandidates.length,
    },
  };
  const selectedDataset = necDataset ?? dataset;

  return {
    residence,
    dataset: selectedDataset,
    manifestEntry: {
      id: residence.id,
      file: `data/regions/${residence.id}.json`,
      cacheKey: residence.cacheKey,
      candidateCount: selectedDataset.candidates.length,
      updatedAt: residence.cachedAt,
      contentHash: hashJson(selectedDataset),
    },
  };
});

await cleanGeneratedRegionShards();
await rm(join(repoRoot, "public/share"), { recursive: true, force: true });

await writeJson("public/data/regions/index.json", {
  voterProfiles,
  residences: normalizedResidences,
});

for (const region of regions) {
  await writeJson(`public/data/regions/${region.residence.id}.json`, region.dataset);
  await writeText(
    `public/share/${region.residence.id}.html`,
    buildResidenceShareHtml({
      residence: region.residence,
      ballotCount: new Set(region.dataset.candidates.map((candidate) => candidate.office)).size,
      candidateCount: region.dataset.candidates.length,
      generatedAt,
    }),
  );
}

await writeJson("public/data/cache-manifest.json", {
  version,
  generatedAt,
  sourceName: necRegionDatasets.size > 0 ? "NEC policy cache with mock fallbacks" : "Mock normalized cache for NEC 5 pledge PDFs",
  sourceUrl: "https://policy.nec.go.kr/",
  dataMode: necRegionDatasets.size > 0 ? "mixed" : "mock",
  nec: {
    electionId: "20260603",
    subElectionId: "all-local-races",
    endpoints: necEndpoints,
  },
  regions: regions.map((region) => region.manifestEntry),
});

await writeOptionalPublicJsonCopy("data/nec/info/election-districts.json", "public/data/nec/election-districts.json");
await writeOptionalPublicJsonCopy("data/nec/info/election-areas.json", "public/data/nec/election-areas.json");
await writeOptionalPublicJsonCopy("data/nec/info/all-candidates.json", "public/data/nec/all-candidates.json");

console.log(`Wrote ${regions.length} region shards to public/data`);

async function writeOptionalPublicJsonCopy(sourcePath: string, targetPath: string) {
  if (await pathExists(sourcePath)) {
    await writeJson(targetPath, await readJsonFile<unknown>(sourcePath));
  }
}

async function cleanGeneratedRegionShards() {
  const regionsDir = join(repoRoot, "public/data/regions");
  await mkdir(regionsDir, { recursive: true });

  for (const fileName of await readdir(regionsDir)) {
    if (fileName.startsWith("nec-") && fileName.endsWith(".json")) {
      await unlink(join(regionsDir, fileName));
    }
  }
}
