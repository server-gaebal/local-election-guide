# Local Election Guide

Static voter guide prototype for South Korean local elections.

## Static Deployment Direction

This app is intentionally shaped to work without a database:

- Build output is static Vite assets, deployable to Pages-style hosting.
- Election data lives in Git as generated JSON under `public/data`.
- Region filtering loads only the selected region shard instead of one large national dataset.
- `cache-manifest.json` holds data version, generated timestamp, NEC endpoint metadata, region file paths, and content hashes.
- Raw NEC PDFs can be downloaded under `data/nec/pdfs`; keep an eye on repository size before scaling this to all races.

Current data layout:

```text
public/data/
  cache-manifest.json
  regions/index.json
  regions/seoul-mapo-gongdeok.json

data/nec/
  nec-region-1100-race-3.json
  candidates.json
  downloads.json
  manifest.json
  full/
    candidates.json
    downloads.json
    manifest.json
    races/*.json
    pdfs/*/*.pdf
    pdfs/*/*.txt
  pdfs/*-5pledges.pdf
  pdfs/*-5pledges.txt
```

## NEC Data Pipeline

The candidate pledge page uses these official endpoints:

- Region list: `https://policy.nec.go.kr/plc/commiment/initUCACommimentRegion.do`
- District list: `https://policy.nec.go.kr/plc/commiment/initUCACommimentSgg.do`
- Candidate list: `https://policy.nec.go.kr/plc/commiment/initUCACommimentList.do`
- PDF download: `https://policy.nec.go.kr/plc/common/downloadFile.do`
- Candidate thumbnails: `https://cdn.nec.go.kr/photo_20260603/{filename}`

The sample downloader fetches Seoul mayor candidates and downloads/extracts the first two 5-pledge PDFs:

```bash
npm run data:nec:sample
```

The full downloader crawls every race exposed on the NEC pledge page. Current run:

- Total NEC rows: 7,313
- NEC rows with `5대공약` PDF metadata: 677
- Downloaded PDFs: 677
- Extracted text files: 677
- Data footprint: about 141 MB under `data/nec/full`

```bash
npm run data:nec:all
npm run data:nec:all:download
```

Text extraction uses `pdftotext` from Poppler.

## GitHub Pages Note

The repository can stay private, but GitHub Pages for private repositories requires a GitHub plan that supports private Pages. On GitHub Free, switch the repository to public or use another static host such as Cloudflare Pages/Netlify for a private-source workflow.

## Commands

```bash
npm install
npm run data:build
npm run data:nec:sample
npm test
npm run build
npm run dev
```
