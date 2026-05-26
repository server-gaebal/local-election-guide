import { describe, expect, it } from "vitest";
import { buildNecDownloadUrl, getFivePledgePdf, parseNecFileInfo } from "./necPolicy";

const sampleFileInfo =
  "선거공보||20260603/PDF/PBINFO/1100/003_100157144_20260520_1.pdf||||1||HEIGHT||Y||00||01,선거공약서||||||0||HEIGHT||Y||||00,5대공약||20260603/PDF/P5_PRMS_PUB/1100/001_100157144_20260516_1.pdf||11551||1||HEIGHT||Y||00||01";

describe("NEC policy data helpers", () => {
  it("parses the 5 pledge PDF entry from NEC fileinfo strings", () => {
    const entries = parseNecFileInfo(sampleFileInfo);

    expect(entries).toContainEqual(
      expect.objectContaining({
        label: "5대공약",
        requestedFullPath: "20260603/PDF/P5_PRMS_PUB/1100/001_100157144_20260516_1.pdf",
        submitted: true,
      }),
    );
  });

  it("builds the official download URL for a candidate PDF", () => {
    const pdf = getFivePledgePdf(sampleFileInfo);

    expect(pdf).not.toBeNull();
    expect(
      buildNecDownloadUrl({
        requestedFileName: "20260603_서울특별시_정원오_5대공약.pdf",
        requestedFullPath: pdf?.requestedFullPath ?? "",
      }),
    ).toBe(
      "https://policy.nec.go.kr/plc/common/downloadFile.do?requestedFileName=20260603_%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C_%EC%A0%95%EC%9B%90%EC%98%A4_5%EB%8C%80%EA%B3%B5%EC%95%BD.pdf&requestedFullPath=20260603%2FPDF%2FP5_PRMS_PUB%2F1100%2F001_100157144_20260516_1.pdf",
    );
  });
});
