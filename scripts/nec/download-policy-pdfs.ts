import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { buildNecDownloadUrl, getFivePledgePdf, necEndpoints } from "../../src/necPolicy";

const execFileAsync = promisify(execFile);
const defaultElectionId = "20260603";
const defaultSubElectionId = "320260603";

type NecCandidate = {
  sgId: string;
  subSgName: string;
  sggid: string;
  sggname: string;
  jdid: string;
  jdname: string;
  huboid: string;
  hbjname: string;
  hbjgiho: string;
  hbjjikup: string;
  hbjhakruk: string;
  filename: string;
  fileinfo: string;
};

function readArg(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function safeName(value: string) {
  return value.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "");
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function downloadFile(url: string, target: string) {
  const response = await fetch(url, {
    headers: {
      referer: "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
}

async function extractText(pdfPath: string, textPath: string) {
  await execFileAsync("pdftotext", ["-layout", pdfPath, textPath]);
}

const region = readArg("region", "1100");
const race = readArg("race", "3");
const limit = Number(readArg("limit", "6"));
const outDir = readArg("out", "data/nec");
const shouldDownload = hasFlag("download");

const requestBody = new URLSearchParams({
  sgId: defaultElectionId,
  subSgId: defaultSubElectionId,
  hRegionId: region,
  hGuId: "",
  hSggId: "",
  sgTypecode: race,
  pageIndex: "1",
  phGuId: "",
  elecEndYn: "N",
});

const listResponse = await fetch(necEndpoints.list, {
  method: "POST",
  headers: {
    accept: "application/json, text/javascript, */*; q=0.01",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    referer: "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest",
  },
  body: requestBody,
});

if (!listResponse.ok) {
  throw new Error(`Candidate list request failed ${listResponse.status}`);
}

const candidateList = (await listResponse.json()) as { totalCnt: number; list: NecCandidate[] };
const normalized = candidateList.list.map((candidate) => {
  const fivePledgePdf = getFivePledgePdf(candidate.fileinfo);
  const requestedFileName = `${candidate.sgId}_${candidate.sggname}_${candidate.hbjname}_5대공약.pdf`;

  return {
    id: candidate.huboid,
    electionId: candidate.sgId,
    raceName: candidate.subSgName.trim(),
    districtId: candidate.sggid,
    districtName: candidate.sggname,
    partyId: candidate.jdid,
    partyName: candidate.jdname,
    number: candidate.hbjgiho,
    name: candidate.hbjname,
    occupation: candidate.hbjjikup,
    education: candidate.hbjhakruk,
    thumbnailPath: candidate.filename,
    fivePledgePdf: fivePledgePdf
      ? {
          requestedFileName,
          requestedFullPath: fivePledgePdf.requestedFullPath,
          downloadUrl: buildNecDownloadUrl({
            requestedFileName,
            requestedFullPath: fivePledgePdf.requestedFullPath,
          }),
        }
      : null,
  };
});

await writeJson(join(outDir, `nec-region-${region}-race-${race}.json`), {
  fetchedAt: new Date().toISOString(),
  endpoint: necEndpoints.list,
  request: Object.fromEntries(requestBody),
  totalCount: candidateList.totalCnt,
  candidates: normalized,
});

if (shouldDownload) {
  for (const candidate of normalized.filter((item) => item.fivePledgePdf).slice(0, limit)) {
    const pdfPath = join(outDir, "pdfs", `${safeName(candidate.number)}-${safeName(candidate.name)}-${candidate.id}-5pledges.pdf`);
    const textPath = pdfPath.replace(/\.pdf$/i, ".txt");

    await downloadFile(candidate.fivePledgePdf!.downloadUrl, pdfPath);
    await extractText(pdfPath, textPath);
    console.log(`Downloaded and extracted ${candidate.name}: ${textPath}`);
  }
}

console.log(`Wrote ${normalized.length} NEC candidates to ${outDir}`);
