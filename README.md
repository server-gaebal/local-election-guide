# Local Election Guide

Mock frontend for a static voter guide for South Korean local elections.

## Static Deployment Direction

This app is intentionally shaped to work without a database:

- Build output is static Vite assets, deployable to Pages-style hosting.
- Election data can live in Git as generated JSON under `public/data`.
- Region filtering should load only the selected region file instead of one large national dataset.
- `cache-manifest.json` should hold data version, generated timestamp, source PDF URL, and content hashes.
- Original NEC PDFs should be treated carefully. Prefer committing extracted text and normalized JSON first; keep raw PDFs out of Git unless the final size is confirmed acceptable.

Suggested data layout:

```text
public/data/
  cache-manifest.json
  regions/index.json
  regions/gyeonggi-seongnam-jeongja.json
  candidates/baek-seoyeon.json
```

## Commands

```bash
npm install
npm test
npm run build
npm run dev
```
