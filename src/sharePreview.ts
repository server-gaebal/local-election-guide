import type { Residence } from "./electionTypes";

export const PUBLIC_SITE_URL = "https://kimsunghyun1995.github.io/local-election-guide/";
export const PUBLIC_OG_IMAGE_URL = `${PUBLIC_SITE_URL}og-image.png`;
export const SHARE_IMAGE_ALT = "지방선거 가이드 미리보기";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function hasFinalConsonant(value: string) {
  const lastCharacter = value.trim().at(-1);

  if (!lastCharacter) {
    return false;
  }

  const code = lastCharacter.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) {
    return false;
  }

  return (code - 0xac00) % 28 !== 0;
}

function appendConditionalParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? "이라면" : "라면"}`;
}

export function createResidenceShareTitle(residence: Residence) {
  return `${residence.city} ${residence.district} 후보 가이드`;
}

export function createResidenceShareDescription(
  residence: Residence,
  ballotCount: number,
  candidateCount: number,
) {
  const address = `${residence.city} ${residence.district} ${residence.neighborhood}`;
  return `내 주소가 ${appendConditionalParticle(address)} 받는 투표지 ${ballotCount}종, 후보 ${candidateCount}명을 공약·전과·비교 요약으로 확인하세요.`;
}

export function createResidenceShareUrl(residenceId: string) {
  return `${PUBLIC_SITE_URL}share/${encodeURIComponent(residenceId)}.html`;
}

export function createResidenceAppUrl(residenceId: string) {
  const url = new URL(PUBLIC_SITE_URL);
  url.searchParams.set("region", residenceId);
  return url.toString();
}

export function buildResidenceShareHtml({
  residence,
  ballotCount,
  candidateCount,
  generatedAt,
}: {
  residence: Residence;
  ballotCount: number;
  candidateCount: number;
  generatedAt: string;
}) {
  const title = createResidenceShareTitle(residence);
  const description = createResidenceShareDescription(residence, ballotCount, candidateCount);
  const shareUrl = createResidenceShareUrl(residence.id);
  const appUrl = createResidenceAppUrl(residence.id);
  const scriptAppUrl = JSON.stringify(appUrl);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeHtml(shareUrl)}" />
    <link rel="image_src" href="${PUBLIC_OG_IMAGE_URL}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:site_name" content="지방선거 가이드" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <meta property="og:image" content="${PUBLIC_OG_IMAGE_URL}" />
    <meta property="og:image:secure_url" content="${PUBLIC_OG_IMAGE_URL}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${SHARE_IMAGE_ALT}" />
    <meta property="og:updated_time" content="${escapeHtml(generatedAt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:url" content="${escapeHtml(shareUrl)}" />
    <meta name="twitter:image" content="${PUBLIC_OG_IMAGE_URL}" />
    <meta name="twitter:image:alt" content="${SHARE_IMAGE_ALT}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(appUrl)}" />
    <script>window.location.replace(${scriptAppUrl});</script>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <a href="${escapeHtml(appUrl)}">지방선거 가이드에서 보기</a>
    </main>
  </body>
</html>
`;
}
