import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildStaticDataUrl,
  clearElectionDataCache,
  loadCacheManifest,
  loadRegionDataset,
} from "./dataLoader";

describe("static election data loader", () => {
  beforeEach(() => {
    clearElectionDataCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds GitHub Pages safe data URLs", () => {
    expect(buildStaticDataUrl("data/cache-manifest.json")).toContain("data/cache-manifest.json");
  });

  it("caches JSON requests by static data URL", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ version: "sample-cache-v1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    await loadCacheManifest();
    await loadCacheManifest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("loads a selected region dataset from the region shard", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ candidates: [{ id: "han-jiwoo" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const region = await loadRegionDataset("seoul-mapo-gongdeok");

    expect(region.candidates).toEqual([{ id: "han-jiwoo" }]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("data/regions/seoul-mapo-gongdeok.json"));
  });
});
