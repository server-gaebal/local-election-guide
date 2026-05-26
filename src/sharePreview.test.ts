import { describe, expect, it } from "vitest";
import rootHtml from "../index.html?raw";
import {
  PUBLIC_OG_IMAGE_URL,
  PUBLIC_SITE_DOMAIN,
  PUBLIC_SITE_URL,
  buildResidenceShareHtml,
  createResidenceShareDescription,
  createResidenceShareTitle,
} from "./sharePreview";
import type { Residence } from "./electionTypes";

const sampleResidence: Residence = {
  id: "nec-4100-4101-5410101-6410101",
  city: "경기도",
  district: "수원시",
  neighborhood: "장안구 수원시제1선거구 · 수원시가선거구",
  cacheKey: "nec:test",
  cachedAt: "2026-05-26 13:50 KST",
};

function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

function getProperty(doc: Document, property: string) {
  return doc.querySelector(`meta[property="${property}"]`)?.getAttribute("content");
}

function getName(doc: Document, name: string) {
  return doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
}

describe("social share preview metadata", () => {
  it("keeps root HTML compatible with KakaoTalk, Threads, Instagram, and X previews", () => {
    const doc = parseHtml(rootHtml);

    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(PUBLIC_SITE_URL);
    expect(doc.querySelector('link[rel="image_src"]')?.getAttribute("href")).toBe(PUBLIC_OG_IMAGE_URL);
    expect(getProperty(doc, "og:type")).toBe("website");
    expect(getProperty(doc, "og:locale")).toBe("ko_KR");
    expect(getProperty(doc, "og:url")).toBe(PUBLIC_SITE_URL);
    expect(getProperty(doc, "og:image")).toBe(PUBLIC_OG_IMAGE_URL);
    expect(getProperty(doc, "og:image:url")).toBe(PUBLIC_OG_IMAGE_URL);
    expect(getProperty(doc, "og:image:secure_url")).toBe(PUBLIC_OG_IMAGE_URL);
    expect(getProperty(doc, "og:image:type")).toBe("image/png");
    expect(getProperty(doc, "og:image:width")).toBe("1200");
    expect(getProperty(doc, "og:image:height")).toBe("630");
    expect(getProperty(doc, "og:image:alt")).toBe("지방선거 가이드 미리보기");
    expect(getName(doc, "twitter:card")).toBe("summary_large_image");
    expect(getName(doc, "twitter:url")).toBe(PUBLIC_SITE_URL);
    expect(getName(doc, "twitter:domain")).toBe(PUBLIC_SITE_DOMAIN);
    expect(getName(doc, "twitter:image")).toBe(PUBLIC_OG_IMAGE_URL);
    expect(getName(doc, "twitter:image:alt")).toBe("지방선거 가이드 미리보기");
  });

  it("renders crawlable region share HTML before redirecting voters into the app", () => {
    expect(createResidenceShareDescription(sampleResidence, 7, 40)).toContain("수원시가선거구라면");

    const html = buildResidenceShareHtml({
      residence: sampleResidence,
      ballotCount: 7,
      candidateCount: 40,
      generatedAt: "2026-05-26T13:50:00+09:00",
    });
    const doc = parseHtml(html);

    expect(getProperty(doc, "og:title")).toBe(createResidenceShareTitle(sampleResidence));
    expect(getProperty(doc, "og:description")).toBe(createResidenceShareDescription(sampleResidence, 7, 40));
    expect(getProperty(doc, "og:url")).toBe(`${PUBLIC_SITE_URL}share/${sampleResidence.id}.html`);
    expect(getProperty(doc, "og:image")).toBe(PUBLIC_OG_IMAGE_URL);
    expect(getProperty(doc, "og:image:url")).toBe(PUBLIC_OG_IMAGE_URL);
    expect(getProperty(doc, "og:image:type")).toBe("image/png");
    expect(getName(doc, "twitter:card")).toBe("summary_large_image");
    expect(getName(doc, "twitter:url")).toBe(`${PUBLIC_SITE_URL}share/${sampleResidence.id}.html`);
    expect(getName(doc, "twitter:domain")).toBe(PUBLIC_SITE_DOMAIN);
    expect(doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute("content")).toContain(
      `${PUBLIC_SITE_URL}?region=${sampleResidence.id}`,
    );
    expect(doc.querySelector("body a")?.getAttribute("href")).toBe(`${PUBLIC_SITE_URL}?region=${sampleResidence.id}`);
  });
});
