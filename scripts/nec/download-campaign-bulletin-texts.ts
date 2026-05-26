import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { NecNormalizedCandidate } from "../../src/necCrawler";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type NecCandidatesCache = {
  candidates: NecNormalizedCandidate[];
};

type NecDownloadsCache = {
  fetchedAt?: string;
  requested?: number;
  completed?: number;
  results?: NecDownloadResult[];
};

type NecDownloadResult = {
  candidateId: string;
  documentType?: "fivePledges" | "campaignBulletin";
  sourceLabel?: "5대공약" | "선거공보";
  name?: string;
  partyName?: string;
  raceName?: string;
  requestedFileName?: string;
  requestedFullPath?: string;
  pdfPath?: string | null;
  textPath: string;
  downloadStatus?: string;
  extractStatus?: string;
  error?: string;
};

type CampaignBulletinTarget = {
  candidate: NecNormalizedCandidate;
  textPath: string;
};

const requestHeaders = {
  referer: "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
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

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, target: string) {
  const response = await fetch(url, {
    headers: requestHeaders,
  });

  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  return "downloaded";
}

async function extractText(pdfPath: string, textPath: string) {
  await mkdir(dirname(textPath), { recursive: true });
  await execFileAsync("pdftotext", ["-layout", pdfPath, textPath]);
  await writeFile(textPath, normalizeExtractedText(await readFile(textPath, "utf8")));
  return "extracted";
}

function normalizeExtractedText(value: string) {
  return `${value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").trimEnd())
    .join("\n")
    .trimEnd()}\n`;
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

function buildTextPath(outDir: string, candidate: NecNormalizedCandidate) {
  const label = candidate.name || candidate.partyName || candidate.candidateId || candidate.id;
  const raceDir = `${candidate.raceTypeCode}-${safeName(candidate.raceName)}`;
  const fileName = `${safeName(candidate.candidateNumber || "n")}-${safeName(candidate.districtName)}-${safeName(label)}-${safeName(
    candidate.candidateId ?? candidate.id,
  )}-campaign-bulletin.txt`;

  return join(outDir, "bulletin-texts", raceDir, fileName);
}

function matchesFilters(candidate: NecNormalizedCandidate) {
  const candidateId = readOptionalArg("candidate-id");
  const candidateRowId = readOptionalArg("candidate-row-id");
  const race = readOptionalArg("race");
  const district = readOptionalArg("district");
  const areaCodePrefix = readOptionalArg("area-code-prefix");

  if (candidateId && candidate.candidateId !== candidateId) {
    return false;
  }

  if (candidateRowId && candidate.id !== candidateRowId) {
    return false;
  }

  if (race && candidate.raceTypeCode !== race && candidate.raceName !== race && candidate.subElectionId !== race) {
    return false;
  }

  if (district && !candidate.districtName.includes(district)) {
    return false;
  }

  if (areaCodePrefix && !candidateDocumentAreaCode(candidate)?.startsWith(areaCodePrefix)) {
    return false;
  }

  return true;
}

function candidateDocumentAreaCode(candidate: NecNormalizedCandidate) {
  return candidate.campaignBulletinPdf?.requestedFullPath.match(/\/PDF\/[^/]+\/(\d+)\//)?.[1] ?? "";
}

function buildTargets(candidates: NecNormalizedCandidate[], outDir: string) {
  const includeWithFivePledges = hasFlag("include-with-five-pledges");

  return candidates
    .filter((candidate) => candidate.campaignBulletinPdf)
    .filter((candidate) => includeWithFivePledges || !candidate.fivePledgePdf)
    .filter(matchesFilters)
    .map((candidate): CampaignBulletinTarget => ({ candidate, textPath: buildTextPath(outDir, candidate) }));
}

async function extractCampaignBulletinText(tempRoot: string, target: CampaignBulletinTarget): Promise<NecDownloadResult> {
  const { candidate, textPath } = target;
  const pdf = candidate.campaignBulletinPdf;
  const textRelativePath = relative(repoRoot, textPath);

  if (!pdf) {
    throw new Error(`Candidate has no campaign bulletin PDF: ${candidate.id}`);
  }

  try {
    let downloadStatus = "skipped";
    let extractStatus = "skipped";

    if (!(await pathExists(textPath))) {
      const tempPdfPath = join(tempRoot, `${safeName(candidate.id)}.pdf`);
      downloadStatus = await downloadFile(pdf.downloadUrl, tempPdfPath);
      extractStatus = await extractText(tempPdfPath, textPath);
    }

    return {
      candidateId: candidate.id,
      documentType: "campaignBulletin",
      sourceLabel: "선거공보",
      name: candidate.name,
      partyName: candidate.partyName,
      raceName: candidate.raceName,
      requestedFileName: pdf.requestedFileName,
      requestedFullPath: pdf.requestedFullPath,
      pdfPath: null,
      textPath: textRelativePath,
      downloadStatus,
      extractStatus,
    };
  } catch (error) {
    return {
      candidateId: candidate.id,
      documentType: "campaignBulletin",
      sourceLabel: "선거공보",
      name: candidate.name,
      partyName: candidate.partyName,
      raceName: candidate.raceName,
      requestedFileName: pdf.requestedFileName,
      requestedFullPath: pdf.requestedFullPath,
      pdfPath: null,
      textPath: textRelativePath,
      downloadStatus: "failed",
      extractStatus: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function downloadKey(result: NecDownloadResult) {
  return `${result.candidateId}:${result.documentType ?? "fivePledges"}`;
}

async function mergeDownloadResults(downloadsPath: string, nextResults: NecDownloadResult[]) {
  const existing = (await pathExists(downloadsPath))
    ? await readJson<NecDownloadsCache>(downloadsPath)
    : { results: [] satisfies NecDownloadResult[] };
  const merged = new Map<string, NecDownloadResult>();

  for (const result of existing.results ?? []) {
    merged.set(downloadKey(result), result);
  }

  for (const result of nextResults) {
    merged.set(downloadKey(result), result);
  }

  const results = Array.from(merged.values());

  await writeJson(downloadsPath, {
    fetchedAt: new Date().toISOString(),
    requested: results.length,
    completed: results.filter((result) => result.extractStatus !== "failed").length,
    results,
  });
}

function applyLimit<T>(items: T[], limit: number) {
  return limit > 0 ? items.slice(0, limit) : items;
}

const outDir = resolve(repoRoot, readArg("out", "data/nec/full"));
const candidatesPath = join(outDir, "candidates.json");
const downloadsPath = join(outDir, "downloads.json");
const limit = Number(readArg("limit", "0"));
const concurrency = Number(readArg("concurrency", "2"));
const cache = await readJson<NecCandidatesCache>(candidatesPath);
const targets = applyLimit(buildTargets(cache.candidates, outDir), limit);
const tempRoot = await mkdtemp(join(tmpdir(), "nec-campaign-bulletins-"));

console.log(`[bulletin] ${targets.length} campaign bulletin text targets, concurrency=${concurrency}`);

try {
  const results = await runLimited(targets, concurrency, async (target, index) => {
    const result = await extractCampaignBulletinText(tempRoot, target);
    const label = target.candidate.name || target.candidate.partyName || target.candidate.id;
    console.log(`[bulletin] ${index + 1}/${targets.length} ${label}: ${result.extractStatus}`);
    return result;
  });

  await mergeDownloadResults(downloadsPath, results);
  console.log(`[bulletin] merged ${results.length} campaign bulletin entries into ${relative(repoRoot, downloadsPath)}`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
