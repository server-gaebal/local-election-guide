const necOrigin = "https://policy.nec.go.kr";

export const necEndpoints = {
  region: `${necOrigin}/plc/commiment/initUCACommimentRegion.do`,
  gu: `${necOrigin}/plc/commiment/initUCACommimentGu.do`,
  district: `${necOrigin}/plc/commiment/initUCACommimentSgg.do`,
  list: `${necOrigin}/plc/commiment/initUCACommimentList.do`,
  download: `${necOrigin}/plc/common/downloadFile.do`,
};

export type NecFileEntry = {
  label: string;
  requestedFullPath: string;
  attachmentSequence: string;
  submitted: boolean;
  previewMode: string;
  displayEnabled: boolean;
  raw: string[];
};

export function parseNecFileInfo(fileinfo: string): NecFileEntry[] {
  if (!fileinfo.trim()) {
    return [];
  }

  return fileinfo.split(",").map((chunk) => {
    const parts = chunk.split("||");
    const [label = "", requestedFullPath = "", attachmentSequence = "", submittedFlag = "", previewMode = "", displayFlag = ""] =
      parts;

    return {
      label,
      requestedFullPath,
      attachmentSequence,
      submitted: submittedFlag === "1" && requestedFullPath.length > 0,
      previewMode,
      displayEnabled: displayFlag === "Y",
      raw: parts,
    };
  });
}

export function getFivePledgePdf(fileinfo: string) {
  return parseNecFileInfo(fileinfo).find((entry) => entry.label === "5대공약" && entry.submitted) ?? null;
}

export function getCampaignBulletinPdf(fileinfo: string) {
  return parseNecFileInfo(fileinfo).find((entry) => entry.label === "선거공보" && entry.submitted) ?? null;
}

export function buildNecDownloadUrl({
  requestedFileName,
  requestedFullPath,
}: {
  requestedFileName: string;
  requestedFullPath: string;
}) {
  const params = new URLSearchParams({
    requestedFileName,
    requestedFullPath,
  });

  return `${necEndpoints.download}?${params.toString()}`;
}
