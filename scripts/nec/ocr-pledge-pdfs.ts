import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile, access, mkdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { extractPledges } from "../../src/necRegionCache";
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
  extractMode?: string;
  error?: string;
};

type OcrTarget = {
  candidate?: NecNormalizedCandidate;
  source: NecDownloadResult;
  pdfPath: string;
  textPath: string;
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

function normalizeExtractedText(value: string) {
  return `${value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").trimEnd())
    .join("\n")
    .trimEnd()}\n`;
}

function countKorean(value: string) {
  return value.match(/[가-힣]/g)?.length ?? 0;
}

function hasMeaningfulText(value: string) {
  return value.replace(/\f/g, "").trim().length > 0;
}

function isBlankLikeText(value: string) {
  return value.replace(/\f/g, "").trim().length <= 5 || countKorean(value) < 20;
}

function downloadKey(result: Pick<NecDownloadResult, "candidateId" | "documentType">) {
  return `${result.candidateId}:${result.documentType ?? "fivePledges"}`;
}

function outputTextPath(outDir: string, pdfPath: string) {
  const relativePdfPath = relative(outDir, pdfPath);
  const extension = extname(relativePdfPath);
  const base = extension ? relativePdfPath.slice(0, -extension.length) : relativePdfPath;

  return join(outDir, "ocr-texts", `${base}-ocr.txt`);
}

async function getPdfPageCount(pdfPath: string) {
  const { stdout } = await execFileAsync("pdfinfo", [pdfPath]);
  const match = stdout.match(/^Pages:\s+(\d+)/m);
  const pages = match ? Number.parseInt(match[1], 10) : 1;

  return Number.isFinite(pages) && pages > 0 ? pages : 1;
}

async function renderPdfPages(pdfPath: string, workDir: string, maxPages: number, resolution: number) {
  const pages = Math.min(await getPdfPageCount(pdfPath), maxPages);
  const prefix = join(workDir, "page");

  await execFileAsync("pdftoppm", ["-png", "-r", String(resolution), "-f", "1", "-l", String(pages), pdfPath, prefix]);

  return (await readdir(workDir))
    .filter((name) => name.startsWith("page-") && name.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => join(workDir, name));
}

async function ocrImage(imagePath: string, language: string, pageSegmentationMode: string) {
  const { stdout } = await execFileAsync(
    "tesseract",
    [
      imagePath,
      "stdout",
      "-l",
      language,
      "--psm",
      pageSegmentationMode,
      "-c",
      "preserve_interword_spaces=1",
    ],
    { maxBuffer: 40 * 1024 * 1024 },
  );

  return stdout;
}

async function ocrPdf(target: OcrTarget, options: { maxPages: number; resolution: number; language: string; psm: string }) {
  const workDir = await mkdtemp(join(tmpdir(), "nec-ocr-"));

  try {
    const images = await renderPdfPages(target.pdfPath, workDir, options.maxPages, options.resolution);
    const pageTexts: string[] = [];

    for (const image of images) {
      pageTexts.push(await ocrImage(image, options.language, options.psm));
    }

    const text = normalizeExtractedText(pageTexts.join("\n\f\n"));

    await mkdir(dirname(target.textPath), { recursive: true });
    await writeFile(target.textPath, text);

    return text;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function matchesFilters(result: NecDownloadResult, candidate?: NecNormalizedCandidate) {
  const candidateId = readOptionalArg("candidate-id");
  const candidateRowId = readOptionalArg("candidate-row-id");
  const race = readOptionalArg("race");
  const district = readOptionalArg("district");
  const documentType = readOptionalArg("document-type");

  if (candidateId && candidate?.candidateId !== candidateId && result.candidateId !== candidateId) {
    return false;
  }

  if (candidateRowId && result.candidateId !== candidateRowId) {
    return false;
  }

  if (race && candidate?.raceTypeCode !== race && candidate?.raceName !== race && candidate?.subElectionId !== race) {
    return false;
  }

  if (district && !(candidate?.districtName ?? "").includes(district)) {
    return false;
  }

  if (documentType && (result.documentType ?? "fivePledges") !== documentType) {
    return false;
  }

  return true;
}

async function buildTargets(outDir: string, candidates: NecNormalizedCandidate[], downloads: NecDownloadsCache) {
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const bestPledgeCounts = new Map<string, number>();

  for (const result of downloads.results ?? []) {
    if (result.downloadStatus === "failed" || result.extractStatus === "failed" || !(await pathExists(join(repoRoot, result.textPath)))) {
      continue;
    }

    const text = await readFile(join(repoRoot, result.textPath), "utf8");
    const pledgeCount = extractPledges(text).length;
    bestPledgeCounts.set(result.candidateId, Math.max(bestPledgeCounts.get(result.candidateId) ?? 0, pledgeCount));
  }

  const targets: OcrTarget[] = [];

  for (const result of downloads.results ?? []) {
    const candidate = candidateById.get(result.candidateId);
    const pdfPath = result.pdfPath ? join(repoRoot, result.pdfPath) : "";
    const existingTextPath = join(repoRoot, result.textPath);

    if (result.downloadStatus === "failed" || result.extractStatus === "failed" || !pdfPath || !(await pathExists(pdfPath))) {
      continue;
    }

    if (!matchesFilters(result, candidate)) {
      continue;
    }

    if (!hasFlag("include-parsed") && (bestPledgeCounts.get(result.candidateId) ?? 0) > 0) {
      continue;
    }

    const existingText = (await pathExists(existingTextPath)) ? await readFile(existingTextPath, "utf8") : "";

    if (!hasFlag("include-nonblank") && !isBlankLikeText(existingText)) {
      continue;
    }

    const textPath = outputTextPath(outDir, pdfPath);

    if (!hasFlag("force") && (await pathExists(textPath))) {
      const ocrText = await readFile(textPath, "utf8");

      if (hasMeaningfulText(ocrText)) {
        targets.push({ candidate, source: result, pdfPath, textPath });
      }

      continue;
    }

    targets.push({ candidate, source: result, pdfPath, textPath });
  }

  return targets;
}

async function ocrTarget(
  target: OcrTarget,
  options: { maxPages: number; resolution: number; language: string; psm: string },
): Promise<NecDownloadResult> {
  const source = target.source;

  try {
    const text =
      !hasFlag("force") && (await pathExists(target.textPath))
        ? await readFile(target.textPath, "utf8")
        : await ocrPdf(target, options);
    const pledges = extractPledges(text);

    return {
      ...source,
      pdfPath: relative(repoRoot, target.pdfPath),
      textPath: relative(repoRoot, target.textPath),
      downloadStatus: source.downloadStatus ?? "skipped",
      extractStatus: hasMeaningfulText(text) ? "extracted" : "empty",
      extractMode: "ocr",
      error: pledges.length > 0 ? undefined : "OCR completed but no structured pledges were extracted",
    };
  } catch (error) {
    return {
      ...source,
      pdfPath: relative(repoRoot, target.pdfPath),
      textPath: relative(repoRoot, target.textPath),
      downloadStatus: source.downloadStatus ?? "skipped",
      extractStatus: "failed",
      extractMode: "ocr",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function mergeDownloadResults(downloadsPath: string, nextResults: NecDownloadResult[]) {
  const existing = await readJson<NecDownloadsCache>(downloadsPath);
  const merged = new Map<string, NecDownloadResult>();

  for (const result of existing.results ?? []) {
    merged.set(downloadKey(result), result);
  }

  for (const result of nextResults) {
    if (result.extractStatus === "failed") {
      continue;
    }

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
const concurrency = Number(readArg("concurrency", "1"));
const maxPages = Number(readArg("max-pages", "12"));
const resolution = Number(readArg("resolution", "200"));
const language = readArg("language", "kor+eng");
const psm = readArg("psm", "6");
const [candidateCache, downloadsCache] = await Promise.all([
  readJson<NecCandidatesCache>(candidatesPath),
  readJson<NecDownloadsCache>(downloadsPath),
]);
const targets = applyLimit(await buildTargets(outDir, candidateCache.candidates, downloadsCache), limit);

console.log(
  `[ocr] ${targets.length} PDF OCR targets, concurrency=${concurrency}, language=${language}, maxPages=${maxPages}, resolution=${resolution}`,
);

const results = await runLimited(targets, concurrency, async (target, index) => {
  const result = await ocrTarget(target, { maxPages, resolution, language, psm });
  const text = result.extractStatus === "failed" ? "" : await readFile(join(repoRoot, result.textPath), "utf8");
  const pledgeCount = text ? extractPledges(text).length : 0;
  const label = target.candidate?.name || target.candidate?.partyName || result.candidateId;

  console.log(`[ocr] ${index + 1}/${targets.length} ${label}: ${result.extractStatus}, pledges=${pledgeCount}`);

  return result;
});
const usableResults = results.filter((result) => result.extractStatus !== "failed");

await mergeDownloadResults(downloadsPath, usableResults);
console.log(`[ocr] merged ${usableResults.length}/${results.length} OCR entries into ${relative(repoRoot, downloadsPath)}`);
