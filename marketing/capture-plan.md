# Threads Capture Plan

## Direction

Threads에서 먹히는 첫 문장은 제품 설명이 아니라 `그거 진짜 해봐도 됨?` 하는 장면이어야 한다.

이번 캠페인은 `AI한테 후보를 뽑아달라 하니까...`로 시작한다. 다만 실제 메시지는 후보 추천이 아니다. AI가 투표권자처럼 특정 후보를 고르는 대신, 선관위 공개자료를 읽고 `비교해야 할 질문`을 뽑아준다는 쪽으로 가져간다.

핵심 훅:

```text
AI한테 서울시장 후보를 뽑아달라 했더니
후보 이름 대신 이런 표를 만들었다.
```

경기도 버전:

```text
AI한테 경기도지사 후보를 뽑아달라 했더니
누굴 찍으라고는 안 하고, 공약에서 확인할 질문만 뽑아줬다.
```

## Threads Observations

- 공개 웹에서 Threads 검색 페이지는 로그인 모달에 막혀 실제 인기 게시물 목록을 안정적으로 확인할 수 없었다.
- 대신 공식 설명 기준으로 Threads는 `생각 공유`, `질문`, `대화 참여`, `인기 주제` 중심의 피드다.
- Meta도 Threads 하이라이터를 `실시간 인기 주제`와 `깊이 있는 대화`를 강조하는 기능으로 설명한다.
- 그래서 포맷은 광고 문안보다 `한 줄 도발 -> 실제 화면/사진 -> 내 기준은 뭔지 묻기`가 맞다.

Source notes:

- Meta launch note: https://about.fb.com/ko/news/2023/07/instagram%EC%9D%B4-%ED%85%8D%EC%8A%A4%ED%8A%B8-%EA%B8%B0%EB%B0%98%EC%9D%98-%EC%83%88%EB%A1%9C%EC%9A%B4-%EC%86%8C%EC%85%9C-%EC%95%B1-%EC%8A%A4%EB%A0%88%EB%93%9Cthreads%EB%A5%BC/
- Meta Highlighter note: https://about.fb.com/ko/news/2025/07/introducing-messaging-and-highlighted-perspectives-on-threads/

## Guardrails

쓰면 안 되는 표현:

- `AI가 뽑은 서울시장`
- `코덱스가 선택한 경기도지사`
- `이 후보가 제일 낫다`
- `당선 가능성`, `승리 가능성`, `추천 후보`

바꿔 쓸 표현:

- `AI는 후보를 뽑지 못했다. 대신 비교 질문을 뽑았다.`
- `누굴 찍으라는 말은 없다. 내가 봐야 할 자료만 정리했다.`
- `선관위 공개자료 기준으로 후보별 공약과 검증 포인트를 나눴다.`
- `가능/불가능 단정 대신 공식 사업 확인, 권한 확인 필요, 재원 확인 필요로 표시했다.`

## Image Order

### Post A: Seoul Mayor Hook

1. User-provided screenshot
   - Overlay: `AI한테 서울시장 후보 뽑아달라 함`
   - Purpose: 첫 장에서 호기심과 댓글을 만든다.
2. `marketing/assets/threads-cover-desktop.png`
   - Overlay: `주소 고르면 내가 받는 투표지만`
3. `marketing/assets/threads-mobile-cards.png`
   - Overlay: `정당·전과·공약·차이점`
4. `marketing/assets/threads-detail-dialog.png`
   - Overlay: `선관위 자료 기반으로 확인`

### Post B: Gyeonggi Governor Hook

1. User-provided screenshot
   - Overlay: `AI한테 경기도지사 후보 뽑아달라 함`
2. `marketing/assets/threads-mobile-cards.png`
   - Overlay: `GTX? 반도체? 전세? 돌봄?`
3. `marketing/assets/threads-detail-dialog.png`
   - Overlay: `도지사가 혼자 할 수 있는지 따로 표시`
4. `marketing/assets/threads-cover-desktop.png`
   - Overlay: `내 동네 투표지까지 내려가기`

## Video Script

Use `marketing/assets/threads-demo-flow.mp4`.

- 0-2s: User-provided screenshot. Caption: `AI한테 후보 뽑아달라 했더니`
- 2-4s: 주소 선택 화면. Caption: `후보 추천 대신`
- 4-7s: 투표지별 후보 카드. Caption: `내가 받는 투표지만 정리`
- 7-9s: 후보 카드 스캔. Caption: `정당·전과·공약·차이점`
- 9-11s: 전체 공약 상세. Caption: `공식자료 기준으로 확인`

## Threads Copy

Threads 본문은 500자 제한을 고려해 여러 개로 이어 붙인다.

### Post 1: Codex Seoul Mayor Hook

```text
코덱스한테 서울시장 후보를 뽑아달라 했다.

결론:
누굴 찍으라고는 안 해줌.

대신 선관위 공개자료를 기준으로 후보별 공약, 전과 건수, 재산·납세, 검증해야 할 질문을 나눠줬다.

(여기에 캡처 이미지)
```

```text
지방선거가 빡센 이유는
서울시장 하나만 뽑는 게 아니라
교육감, 구청장, 시의원, 구의원까지 한 번에 봐야 해서다.

그래서 주소를 고르면
내가 실제로 받는 투표지별 후보만 보여주는 가이드를 만들고 있다.
```

```text
정치 추천 앱 아님.
투표 전에 내가 뭘 봐야 하는지 줄여주는 도구에 가깝다.

보고 싶은 동네 있으면 댓글로 남겨주세요.
서울/경기부터 먼저 열어볼게요.
```

### Post 2: Codex Gyeonggi Governor Hook

```text
코덱스한테 경기도지사 후보를 뽑아달라 했다.

후보 이름은 안 뽑고,
이런 질문만 뽑아줬다.
```

```text
GTX는 공식 사업인지.
반도체 클러스터는 승인된 사업인지.
전세·신도시·교통 공약은 중앙정부 협의가 필요한지.
돌봄·노동·공공금융은 조례와 예산으로 가능한지.
```

```text
이게 오히려 더 유용했다.

누굴 찍으라는 말보다
내가 뭘 확인해야 하는지가 먼저라서.

지금 만든 사이트는 주소를 고르면
내가 받는 투표지별 후보만 모아서 보여준다.
```

```text
경기도는 도지사만 봐도 빡센데,
실제로는 시장, 도의원, 시의원까지 같이 봐야 한다.

그래서 후보 추천 말고
선관위 공개자료 기반 비교표로 만들고 있다.
```

### Post 3: The Contrarian Version

```text
솔직히 지방선거는
정치 고관여층 말고는 너무 불친절하다.

후보는 많고
투표지도 많고
공약은 PDF 안에 있고
우리 동네 후보만 골라보기도 귀찮다.
```

```text
그래서 AI한테 후보를 뽑아달라고 해봤는데
진짜 필요한 건 추천이 아니라 정리였다.

내 주소 기준으로
내가 받는 투표지,
그 투표지에 나오는 후보,
후보별 공약과 확인 포인트만 보여주면 된다.

지방선거 가이드를 그렇게 만들고 있다.
```

### Post 4: Parent Share Version

```text
부모님한테 지방선거 후보 설명하려고 만들기 시작했다.

AI한테 "누구 뽑아야 해?"라고 물어보는 건 위험하고,
선관위 PDF를 전부 읽으라고 하는 건 현실성이 없다.
```

```text
그래서 중간 지점을 만들었다.

주소 선택하면
내가 받는 투표지별 후보만 나오고,
큰 글씨로 정당·전과·공약·차이점을 볼 수 있다.

후보 추천은 안 한다.
대신 투표 전에 최소한 뭘 확인할지는 보여준다.
```

## Short Hooks

- `AI한테 후보 뽑아달라 했더니, 추천 대신 숙제를 줬다.`
- `코덱스는 누굴 뽑을까? 결론: 안 뽑고 비교표만 만든다.`
- `AI가 서울시장 후보를 못 뽑는 이유.`
- `경기도지사 후보, 누가 낫냐고 묻기 전에 봐야 할 것들.`
- `지방선거는 후보 추천보다 후보 정리가 먼저다.`
- `투표지 7장 받는 선거를 감으로 치르지 않으려고 만들었다.`
- `공약 PDF 다 읽을 자신 없어서 만든 사이트.`
- `부모님께 링크 하나로 설명하려고 만들었다.`

## Reply Baits

첫 댓글:

```text
특정 후보 추천은 안 합니다.
대신 선관위 공개자료 기준으로 후보별 공약/전과/재산·납세/검증 포인트를 정리합니다.
보고 싶은 지역 있으면 댓글로 남겨주세요.
```

댓글 유도 질문:

- `지방선거 때 제일 헷갈리는 투표지가 뭐예요?`
- `서울/경기 말고 먼저 열어봤으면 하는 지역 있나요?`
- `후보 볼 때 전과, 공약, 재산, 경력 중 뭐부터 보세요?`
- `부모님께 보내기엔 어떤 화면이 제일 필요할까요?`

## Screenshot Carousel

1. User-provided screenshot
   - Text overlay: `AI한테 후보 뽑아달라 했더니`
2. `threads-cover-desktop.png`
   - Text overlay: `내 주소 기준 투표지만`
3. `threads-mobile-cards.png`
   - Text overlay: `후보 사진·정당·전과·공약`
4. `threads-detail-dialog.png`
   - Text overlay: `공식자료와 확인 포인트`

## Notes

- 게시물 본문 첫 줄은 항상 `AI한테...` 또는 `코덱스는...`로 시작한다.
- 두 번째 줄에서 바로 반전시킨다. `추천은 안 함`, `누굴 찍으라고는 안 함`, `비교 질문만 뽑음`.
- 후보 이름을 직접 나열할 때는 `누가 낫다`가 아니라 `각 공약에서 확인할 질문`으로만 묶는다.
- Threads는 해시태그보다 댓글/리포스트 대화가 중요하므로 해시태그는 생략하거나 1개만 쓴다.
- 마지막 줄은 링크보다 댓글 유도 우선. 링크는 첫 댓글에 둔다.
