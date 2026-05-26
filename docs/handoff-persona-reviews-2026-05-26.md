# Handoff: Persona Reviews

Date: 2026-05-26
Repo: `/Users/user/cursorProjects/local-election-guide`
Branch at handoff: `feature/threads-capture-hooks`

## Purpose

This document is for a separate Codex session focused only on persona-based candidate reviews.

Do not mix this work into the nationwide selector/static deployment task or criminal-record OCR task.

## Product Goal

Provide voter-profile-specific review notes that help users ask better questions about candidates without recommending a candidate.

Current profiles:

- `청년`
- `학부모`
- `소상공인`
- `고령층`

Persona reviews must:

- Use only NEC-provided candidate metadata and 5-pledge text already cached in the repository.
- Avoid polls, ideology, party stereotypes, news, public opinion, or inferred political leanings.
- Show the source boundary in the UI.
- Show the prompt used to generate the review.
- Include conservative caveats when details, feasibility, budget, authority, or timeline are unclear.
- Compare only candidates in the same race/region when comparison is involved.
- Never say which candidate is better.

## Current Implementation State

Relevant files:

- `src/personaReviews.ts`
- `src/personaReviews.test.ts`
- `src/App.tsx`
- `src/electionTypes.ts`
- `src/mockData.ts`
- `src/necRegionCache.ts`

Current type:

```ts
export type PersonaReview = {
  summary: string;
  questions: string[];
  highlights: string[];
  cautions: string[];
  prompt: string;
  sourceNotice: string;
};
```

Current scope:

- Persona reviews are hard-coded in `src/personaReviews.ts`.
- They are currently applied only to Seoul mayor and Gyeonggi governor candidates.
- `personaReviewScopeNotice` says:
  - `현재 페르소나 평가는 서울특별시장·경기도지사 후보에만 우선 적용했습니다. 다른 선거는 추후 적용 예정입니다.`

Current source notice:

- `코덱스가 선거관리위원회에서 제공한 후보자 정보와 5대 공약 텍스트만으로 판단한 정보입니다. 절대 정치색 들어가지 않았습니다.`

Current UI:

- Candidate card profile area shows the selected profile summary.
- If a persona review exists, it shows `선관위 제공 정보만 기반`.
- Candidate detail dialog shows:
  - persona summary,
  - source notice,
  - scope notice,
  - highlights,
  - questions,
  - cautions,
  - `프롬프트 보기`.

Current tests:

- `src/personaReviews.test.ts` verifies:
  - NEC-only source notice exists,
  - prompt includes no-external-opinions wording,
  - Seoul/Gyeonggi scope notice exists,
  - unsupported candidates return `undefined`.

## Current Prompt Pattern

Current prompts in `src/personaReviews.ts` follow this shape:

```text
Work in /Users/user/cursorProjects/local-election-guide. Read-only task.
Persona: <profile>.
Evaluate only <scope> candidates using NEC-provided information already cached in the repo:
candidate metadata and five pledge text.
Do not use external opinions, polls, ideology, news, or inferred political leanings.
Output structured JSON-like notes keyed by candidate id with:
personaFitSummary as one sentence,
voterQuestions as 2-3 concrete questions,
highlights as 2-3 NEC-grounded points,
cautions as 1-2 conservative caveats where details or feasibility are unclear.
Do not edit files.
```

Keep this style unless the session introduces a tested generator.

## What Is Not Done

Not implemented yet:

- Persona reviews outside Seoul mayor and Gyeonggi governor.
- A repeatable generation pipeline that writes structured persona data from source pledge text.
- A source-evidence map for each persona note.
- Coverage reporting by race/region/profile.
- Batch generation with review gates.
- Tests that validate every persona note has a source-backed evidence pointer.

## Recommended Next Scope

Do not immediately expand to every candidate nationwide unless the session first creates a repeatable process.

Recommended expansion order:

1. Keep current Seoul mayor and Gyeonggi governor reviews stable.
2. Extract persona review data from `src/personaReviews.ts` into a structured data file if it makes testing and batch generation easier.
3. Add coverage tests:
   - every reviewed candidate has all four profiles,
   - every profile has summary/questions/highlights/cautions,
   - every prompt includes source restrictions,
   - unsupported candidates still return `undefined`.
4. Add evidence references:
   - candidate id,
   - pledge title or metadata field,
   - source file path,
   - optional quoted short snippet.
5. Expand one race class at a time:
   - other 광역단체장 candidates first,
   - then 기초단체장,
   - then council races if the source text quality is sufficient.

## Guardrails

Hard rules:

- Do not use external browsing for persona judgments unless the user explicitly changes the source policy.
- Do not use party labels as a proxy for policy stance.
- Do not describe a candidate as better/worse overall.
- Do not produce generic persona notes that could apply to every candidate.
- If the pledge text is too sparse, say the profile evaluation is limited.
- If a note mentions budget/authority/timeline, it must be grounded in the pledge text or framed as a question/caveat.

Bad output:

- `청년에게 가장 적합합니다.`
- `이 당은 원래 청년 정책에 강합니다.`
- `고령층에게 불리합니다.`
- `실현 가능성이 높습니다.`

Better output:

- `청년 주거·통근 부담과 닿는 공약이 있으나, 대상 규모와 예산 확인이 필요합니다.`
- `공약문에는 돌봄시설 확충이 제시되어 있어 학부모 관점에서 확인할 질문이 생깁니다.`
- `소상공인 직접 지원보다 교통·상권 활성화에 가까워 지원 대상 확인이 필요합니다.`

## Verification

Run at minimum:

```bash
npm test
npx tsc --noEmit -p tsconfig.json
```

If UI rendering changes:

```bash
npm run build
```

Then smoke-test in browser:

- profile switcher still changes the displayed persona/profile text,
- unsupported candidates fall back to regular `profileRelevance`,
- supported candidates show prompt disclosure,
- source notice remains visible.

## Suggested Fresh-Session Prompt

```text
Read /Users/user/cursorProjects/local-election-guide/docs/handoff-persona-reviews-2026-05-26.md.

Work only on persona reviews. Do not work on nationwide selector UX or criminal-record OCR.

Goal:
- Keep reviews based only on NEC candidate metadata and 5-pledge text.
- Preserve prompt disclosure and source notice.
- Do not recommend candidates or use political stereotypes.
- Add tests before changing implementation.

Start by inspecting src/personaReviews.ts, src/personaReviews.test.ts, and current git diff.
```

