import type { Candidate, Residence, VoterProfile } from "./electionTypes";

declare const __APP_DATA_VERSION__: string;

export type CacheManifest = {
  version: string;
  generatedAt: string;
  sourceName: string;
  sourceUrl: string;
  dataMode: "mock" | "nec" | "mixed";
  nec: {
    electionId: string;
    subElectionId: string;
    endpoints: {
      region: string;
      gu: string;
      district: string;
      list: string;
      download: string;
    };
  };
  regions: Array<{
    id: string;
    file: string;
    cacheKey: string;
    candidateCount: number;
    updatedAt: string;
  }>;
};

export type RegionIndex = {
  voterProfiles: VoterProfile[];
  residences: Residence[];
};

export type RegionDataset = {
  residence: Residence;
  candidates: Candidate[];
  source: {
    mode: "mock" | "nec";
    generatedAt: string;
    sourceName: string;
    sourceUrl: string;
    pdfCount: number;
  };
};

const jsonCache = new Map<string, Promise<unknown>>();

export function clearElectionDataCache() {
  jsonCache.clear();
}

export function buildStaticDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const dataUrl = new URL(`${normalizedBase}${path.replace(/^\/+/, "")}`, "https://static.local");
  dataUrl.searchParams.set("v", __APP_DATA_VERSION__);

  return `${dataUrl.pathname.replace(/^\//, "")}${dataUrl.search}${dataUrl.hash}`;
}

async function loadJson<T>(path: string): Promise<T> {
  const url = buildStaticDataUrl(path);
  const existing = jsonCache.get(url) as Promise<T> | undefined;

  if (existing) {
    return existing;
  }

  const request = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }

    return (await response.json()) as T;
  });

  jsonCache.set(url, request);
  return request;
}

export function loadCacheManifest() {
  return loadJson<CacheManifest>("data/cache-manifest.json");
}

export function loadRegionIndex() {
  return loadJson<RegionIndex>("data/regions/index.json");
}

export function loadRegionDataset(residenceId: string) {
  return loadJson<RegionDataset>(`data/regions/${residenceId}.json`);
}
