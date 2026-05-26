import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { candidates, residences, voterProfiles } from "../src/mockData";
import { necEndpoints } from "../src/necPolicy";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedAt = process.env.DATA_GENERATED_AT ?? "2026-05-26T12:45:00+09:00";
const version = "mock-cache-2026-05-26";

function hashJson(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function writeJson(relativePath: string, value: unknown) {
  const target = join(repoRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

const regions = residences.map((residence) => {
  const regionCandidates = candidates.filter((candidate) => candidate.residenceId === residence.id);
  const dataset = {
    residence,
    candidates: regionCandidates,
    source: {
      mode: "mock",
      generatedAt,
      sourceName: "Mock normalized cache for NEC 5 pledge PDFs",
      sourceUrl: "https://policy.nec.go.kr/",
      pdfCount: regionCandidates.length,
    },
  };

  return {
    residence,
    dataset,
    manifestEntry: {
      id: residence.id,
      file: `data/regions/${residence.id}.json`,
      cacheKey: residence.cacheKey,
      candidateCount: regionCandidates.length,
      updatedAt: residence.cachedAt,
      contentHash: hashJson(dataset),
    },
  };
});

await writeJson("public/data/regions/index.json", {
  voterProfiles,
  residences,
});

for (const region of regions) {
  await writeJson(`public/data/regions/${region.residence.id}.json`, region.dataset);
}

await writeJson("public/data/cache-manifest.json", {
  version,
  generatedAt,
  sourceName: "Mock normalized cache for NEC 5 pledge PDFs",
  sourceUrl: "https://policy.nec.go.kr/",
  dataMode: "mock",
  nec: {
    electionId: "20260603",
    subElectionId: "320260603",
    endpoints: necEndpoints,
  },
  regions: regions.map((region) => region.manifestEntry),
});

console.log(`Wrote ${regions.length} region shards to public/data`);
