// 콘텐츠 JSON의 링크만으로 학습 도구 iframe을 자동 생성하는 공통 컴포넌트
// 지원: 유튜브, 알지오매스, GeoGebra, Desmos — 링크를 붙여넣으면 종류를 자동 감지한다.

/** 유튜브 URL(watch, youtu.be, embed 어떤 형태든)을 embed URL로 변환 */
function toYoutubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    let videoId = null;

    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    } else if (u.pathname.startsWith("/embed/")) {
      return url;
    } else if (u.searchParams.get("v")) {
      videoId = u.searchParams.get("v");
    }

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

/** GeoGebra 자료 링크(geogebra.org/m/ID)를 iframe용 URL로 변환 */
function toGeogebraEmbedUrl(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/m\/([A-Za-z0-9]+)/);
    if (m) return `https://www.geogebra.org/material/iframe/id/${m[1]}`;
    if (u.pathname.includes("/material/iframe/")) return url;
    // 계산기류(geogebra.org/calculator 등)는 그대로 임베드 가능
    return url;
  } catch {
    return null;
  }
}

/** 링크 종류를 자동 감지해 embed URL 반환 */
function detectEmbedUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (host.includes("youtube.com") || host.includes("youtu.be")) return toYoutubeEmbedUrl(url);
    if (host.includes("geogebra.org")) return toGeogebraEmbedUrl(url);
    // 알지오매스·Desmos 등은 공유 링크 자체가 iframe에서 동작
    return url;
  } catch {
    return null;
  }
}

/**
 * 주어진 컨테이너 안에 반응형 16:9 iframe을 렌더링한다.
 * @param {HTMLElement} container
 * @param {string} url 원본 링크 (유튜브/알지오매스/GeoGebra/Desmos)
 * @param {string} [type] 과거 호환용 — 생략하면 자동 감지
 */
function renderEmbed(container, url, type) {
  if (!container || !url) return;

  const embedUrl = type === "youtube" ? toYoutubeEmbedUrl(url) : detectEmbedUrl(url);
  if (!embedUrl) return;

  const wrap = document.createElement("div");
  wrap.className = "embed-wrap";

  const iframe = document.createElement("iframe");
  iframe.src = embedUrl;
  iframe.loading = "lazy";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;

  wrap.appendChild(iframe);
  container.appendChild(wrap);
}
