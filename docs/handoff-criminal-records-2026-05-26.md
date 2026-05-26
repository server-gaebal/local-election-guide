# Handoff: Criminal Record Data

Date: 2026-05-26
Repo: `/Users/user/cursorProjects/local-election-guide`
Branch at handoff: `feature/threads-capture-hooks`

## Purpose

This document is for a separate Codex session focused only on criminal-record data.

Do not mix this work into the nationwide selector/static deployment task. The user explicitly wants criminal-record work handled separately.

## Product Goal

Show criminal-record information in a voter-friendly but conservative way:

- Candidate cards may show the official criminal-record count.
- If a user opens details, show what the official source actually provides.
- If only a count is available, do not imply the app knows the offense details.
- If scan files are available, extract and show offense/details only after OCR/parsing is implemented and verified.
- Never infer crime categories, severity, intent, or context from party, candidate, or pledge text.

## Current Implementation State

Relevant files:

- `src/electionTypes.ts`
- `src/necCandidateInfo.ts`
- `src/necRegionCache.ts`
- `src/App.tsx`
- `src/App.test.tsx`
- `src/necRegionCache.test.ts`
- `scripts/nec/download-candidate-info.ts`

Current data model:

- `Candidate.criminalRecord.summary`
- `Candidate.criminalRecord.details`
- `Candidate.criminalRecord.tone`
- `Candidate.criminalRecord.disclosureFiles?`

Current NEC candidate disclosure parser:

- `src/necCandidateInfo.ts` parses candidate info rows from NEC candidate disclosure HTML.
- It extracts:
  - `crimeRecord`
  - `crimeDisclosureFiles`
  - assets/tax/military/election-count metadata.

Current scan-file collection:

- `scripts/nec/download-candidate-info.ts`
- Uses NEC endpoint:
  - `https://info.nec.go.kr/electioninfo/candidate_detail_scanSearchJson.json`
- Calls it with:
  - `gubun=5`
  - `electionId=0020260603`
  - `huboId=<candidateId>`
  - `statementId=CPRI03_candidate_scanSearch`
- Stores returned `FILEPATH` values in `crimeDisclosureFiles`.

Current region cache behavior:

- `src/necRegionCache.ts` builds:
  - `"전과 없음"` when `crimeRecord` is `없음`, `0건`, or blank.
  - `"전과 N건"` otherwise.
  - Detail text says the count comes from the NEC candidate disclosure table.
  - If scan files exist, it only says scan files exist; it does not OCR or summarize them.

Current UI behavior:

- `src/App.tsx` has a `CrimeRecordDialog`.
- It shows:
  - official count summary,
  - current detail text,
  - scan file path list if available,
  - a notice that offense name and sentence need OCR.

Known local WIP:

- There are currently uncommitted changes in `src/App.tsx` and `src/App.test.tsx` that make detailed criminal-record dialogs clickable only for Seoul mayor and Gyeonggi governor candidates.
- Treat those changes as WIP. Decide in the criminal-record session whether to keep, revise, or replace them.

## What Is Not Done

Not implemented yet:

- Downloading actual scan image/PDF files behind `crimeDisclosureFiles`.
- OCR for scan source files.
- Parsing offense name, sentence, date, or judgment text.
- Mapping OCR output back to candidate ids.
- Displaying verified offense details in the voter UI.
- Regression tests for OCR extraction.
- A conservative fallback when OCR confidence is low.

## Source Boundaries

Allowed sources for this task:

- NEC candidate disclosure HTML already cached under `data/nec/info`.
- NEC candidate scan endpoint listed above.
- Downloaded scan source files from NEC, if the session implements that.

Do not use:

- News articles.
- Blogs.
- Party material.
- Search-engine snippets.
- LLM assumptions.

If offense detail is not machine-readable from official NEC source files, show only the official count and state that detail extraction is not available.

## Recommended Implementation Plan

1. Confirm current worktree:

```bash
cd /Users/user/cursorProjects/local-election-guide
git status --short
git diff -- src/App.tsx src/App.test.tsx src/necRegionCache.ts src/necCandidateInfo.ts scripts/nec/download-candidate-info.ts
```

2. Add or update tests before implementation:

- Parser test for `crimeDisclosureFiles`.
- Region cache test for count-only candidates.
- Region cache test for scan-file candidates.
- UI test for count-only dialog wording.
- UI test for scan-file/OCR detail once implemented.

3. Download scan files:

- Add a script or extend `download-candidate-info.ts`.
- Store files under an ignored or explicitly reviewed data path first.
- Preserve original file path and candidate id mapping.

4. OCR and parse:

- Prefer a deterministic local OCR pipeline if available.
- Keep raw OCR text in a cache file.
- Add confidence/parse-status fields.
- If OCR fails or text is ambiguous, do not show offense detail.

5. Data model:

Consider extending `Candidate.criminalRecord` with explicit fields:

```ts
sourceCount: string;
detailStatus: "count-only" | "scan-available" | "ocr-extracted" | "ocr-failed" | "unmatched";
offenses?: Array<{
  title: string;
  sentence?: string;
  sourceText: string;
  sourceFile: string;
}>;
```

Only add fields that are actually backed by tests and source files.

6. UI:

- Keep card text short.
- Dialog should separate:
  - official count,
  - extracted details,
  - source files,
  - extraction limitation.
- Avoid scary or editorial labels. Use official wording.

7. Verify:

```bash
npm test
npx tsc --noEmit -p tsconfig.json
npm run build
```

If browser UI changed, run a local preview smoke test.

## Suggested Fresh-Session Prompt

```text
Read /Users/user/cursorProjects/local-election-guide/docs/handoff-criminal-records-2026-05-26.md.

Work only on criminal-record data and UI. Do not work on nationwide selector UX or persona expansion.

Goal:
- Use only NEC official candidate disclosure data and scan files.
- Keep current count display conservative.
- Add OCR/download/parsing only if it can be verified.
- Never infer offense details.
- Add tests before implementation.

Start by inspecting current git diff and fixing/absorbing any WIP criminal-record changes safely.
```

