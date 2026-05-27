import { execFile } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
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
  extractMode?: string;
  error?: string;
};

type CampaignBulletinTarget = {
  candidate: NecNormalizedCandidate;
  pdfPath: string;
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
  const attempts = [
    { mode: "layout", args: ["-layout"] },
    { mode: "raw", args: ["-raw"] },
    { mode: "default", args: [] },
  ];
  let bestAttempt: { mode: string; text: string; score: number } | undefined;

  for (const attempt of attempts) {
    const attemptTextPath = `${textPath}.${process.pid}.${attempt.mode}.tmp`;

    try {
      await execFileAsync("pdftotext", [...attempt.args, pdfPath, attemptTextPath]);
      const text = normalizeExtractedText(await readFile(attemptTextPath, "utf8"));
      const score = scoreExtractedText(text);

      if (!bestAttempt || score > bestAttempt.score) {
        bestAttempt = { mode: attempt.mode, text, score };
      }
    } finally {
      await rm(attemptTextPath, { force: true });
    }
  }

  const selected = bestAttempt ?? { mode: "layout", text: "\n", score: 0 };

  await writeFile(textPath, selected.text);

  return {
    status: hasMeaningfulExtractedText(selected.text) ? "extracted" : "empty",
    mode: selected.mode,
  };
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

function hasMeaningfulExtractedText(value: string) {
  return value.replace(/\f/g, "").trim().length > 0;
}

function scoreExtractedText(value: string) {
  const text = value.replace(/\f/g, "");
  const koreanCharacters = text.match(/[가-힣]/g)?.length ?? 0;
  const actionKeywords =
    text.match(/추진|확대|확충|개선|해결|조성|구축|설치|신설|유치|지원|강화|완공|착공|도입|정비|보장|완성|혁신|건립/g)
      ?.length ?? 0;
  const numberedPolicyMarkers = text.match(/(?:^|\n)\s*(?:0?[1-5][.)]?|[①②③④⑤])\s*[가-힣]/g)?.length ?? 0;

  return koreanCharacters + actionKeywords * 20 + numberedPolicyMarkers * 30;
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

function buildCampaignBulletinFileStem(candidate: NecNormalizedCandidate) {
  const label = candidate.name || candidate.partyName || candidate.candidateId || candidate.id;
  return `${safeName(candidate.candidateNumber || "n")}-${safeName(candidate.districtName)}-${safeName(label)}-${safeName(
    candidate.candidateId ?? candidate.id,
  )}-campaign-bulletin`;
}

function buildRaceDir(candidate: NecNormalizedCandidate) {
  return `${candidate.raceTypeCode}-${safeName(candidate.raceName)}`;
}

function buildTextPath(outDir: string, candidate: NecNormalizedCandidate) {
  return join(outDir, "bulletin-texts", buildRaceDir(candidate), `${buildCampaignBulletinFileStem(candidate)}.txt`);
}

function buildPdfPath(outDir: string, candidate: NecNormalizedCandidate) {
  return join(outDir, "bulletin-pdfs", buildRaceDir(candidate), `${buildCampaignBulletinFileStem(candidate)}.pdf`);
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
    .map((candidate): CampaignBulletinTarget => ({
      candidate,
      pdfPath: buildPdfPath(outDir, candidate),
      textPath: buildTextPath(outDir, candidate),
    }));
}

async function extractCampaignBulletinText(target: CampaignBulletinTarget): Promise<NecDownloadResult> {
  const { candidate, pdfPath, textPath } = target;
  const pdf = candidate.campaignBulletinPdf;
  const pdfRelativePath = relative(repoRoot, pdfPath);
  const textRelativePath = relative(repoRoot, textPath);

  if (!pdf) {
    throw new Error(`Candidate has no campaign bulletin PDF: ${candidate.id}`);
  }

  try {
    let downloadStatus = "skipped";
    let extractStatus = "skipped";
    let extractMode: string | undefined;

    if (!(await pathExists(pdfPath))) {
      downloadStatus = await downloadFile(pdf.downloadUrl, pdfPath);
    }

    const textExists = await pathExists(textPath);
    const existingText = textExists ? await readFile(textPath, "utf8") : "";
    const shouldExtract = hasFlag("force") || !textExists || !hasMeaningfulExtractedText(existingText);

    if (shouldExtract) {
      const result = await extractText(pdfPath, textPath);
      extractStatus = result.status;
      extractMode = result.mode;
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
      pdfPath: pdfRelativePath,
      textPath: textRelativePath,
      downloadStatus,
      extractStatus,
      extractMode,
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
      pdfPath: pdfRelativePath,
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

console.log(`[bulletin] ${targets.length} campaign bulletin text targets, concurrency=${concurrency}`);

const results = await runLimited(targets, concurrency, async (target, index) => {
  const result = await extractCampaignBulletinText(target);
  const label = target.candidate.name || target.candidate.partyName || target.candidate.id;
  const modeText = result.extractMode ? `:${result.extractMode}` : "";
  console.log(`[bulletin] ${index + 1}/${targets.length} ${label}: ${result.extractStatus}${modeText}`);
  return result;
});

await mergeDownloadResults(downloadsPath, results);
console.log(`[bulletin] merged ${results.length} campaign bulletin entries into ${relative(repoRoot, downloadsPath)}`);
