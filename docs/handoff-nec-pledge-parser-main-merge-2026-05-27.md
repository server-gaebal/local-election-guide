# NEC Pledge Parser Main Merge Handoff - 2026-05-27

Branch checked: `main`

## What Was Verified

- `data/nec/full/candidates.json`: 7,311 NEC rows.
- Candidates with at least one public policy source: 5,909.
- `data/nec/full/downloads.json`: 6,462 download records after this pass.
- Usable downloaded text records scanned through `extractPledges`: 6,457.
- Candidate-level unresolved count after parsing all usable sources: 5.

The 102 usable document records with zero extracted pledges are not candidate-level misses: each affected candidate has another downloaded source with extracted pledge text.

## Work Completed In This Pass

- Downloaded missing `국회의원선거` campaign bulletin records.
- OCR-processed the 15 `국회의원선거` campaign bulletins that `pdftotext` could not structure.
- Confirmed the 15 OCR records now extract pledge items.
- Optimized `scripts/nec/ocr-pledge-pdfs.ts` so candidate/race/district filters are applied before scanning all existing downloads.
- Regenerated static data with `npm run data:build`.

## Remaining Candidate-Level Misses

These 5 candidates still have no extractable pledge text. They all have only `선거공보` metadata, no `5대공약` PDF, and the official campaign bulletin source is not usable locally.

| Candidate ID | Name | Race | District | Reason |
| --- | --- | --- | --- | --- |
| `20260603-520260603-100163383` | 임춘원 | 시·도의회의원선거 | 남동구제1선거구 | NEC download returns a 1-byte blank file. |
| `20260603-620260603-100156955` | 장현태 | 구·시·군의회의원선거 | 미추홀구나선거구 | NEC download returns a 1-byte blank file. |
| `20260603-620260603-100161275` | 권용수 | 구·시·군의회의원선거 | 삼척시가선거구 | NEC download returns a 1-byte blank file. |
| `20260603-620260603-100157949` | 임정구 | 구·시·군의회의원선거 | 진천군가선거구 | NEC download returns a 1-byte blank file. |
| `20260603-620260603-100155600` | 심성욱 | 구·시·군의회의원선거 | 전주시마선거구 | PDF downloads, but Poppler cannot read page structure and OCR cannot render it. |

## Verification Commands Run

```bash
npm test
npx tsc --noEmit -p tsconfig.json
npm run data:build
npx vite build
```

All verification commands passed.

## Notes For Next Session

- Do not treat the 102 zero-pledge document records as unresolved candidates unless their candidate has no alternative parsed source.
- The remaining 5 misses need either a corrected NEC source file or another PDF repair/rendering tool. Current local tools cannot recover them.
- `ocr-pledge-pdfs.ts` should keep the early filter behavior; it avoids scanning every cached document when the operator asks for a single race or candidate.
