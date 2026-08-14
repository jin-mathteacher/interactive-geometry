// GeoGebra 공식 임베드(deployggb.js)를 이용해 소단원 전용 실습 창을 생성한다.
// 콘텐츠 JSON의 apply.geogebra = { app, commands[], caption } 만으로 렌더링된다.

let deployPromise = null;

function loadDeployGgb() {
  if (!deployPromise) {
    deployPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://www.geogebra.org/apps/deployggb.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return deployPromise;
}

/**
 * @param {HTMLElement} container
 * @param {{app?:string, commands?:string[], caption?:string}} cfg
 */
async function renderGeogebraLab(container, cfg) {
  if (!container || !cfg) return;

  const box = document.createElement("div");
  box.className = "ggb-box";

  if (cfg.caption) {
    const cap = document.createElement("p");
    cap.className = "ggb-caption";
    cap.textContent = `🧪 GeoGebra 실습: ${cfg.caption}`;
    box.appendChild(cap);
  }

  const host = document.createElement("div");
  box.appendChild(host);
  container.appendChild(box);

  try {
    await loadDeployGgb();
  } catch {
    host.textContent = "GeoGebra를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.";
    return;
  }

  const width = Math.min(container.clientWidth || 820, 900);
  // "3d"는 전용 앱 대신 Classic + 3D 보기(perspective "T")로 연다 (임베드 안정성)
  const is3d = cfg.app === "3d";
  const params = {
    appName: "classic",
    perspective: is3d ? "T" : undefined,
    width,
    height: 480,
    showToolBar: true,
    showAlgebraInput: true,
    showMenuBar: false,
    showResetIcon: true,
    language: "ko",
    appletOnLoad: (api) => {
      (cfg.commands || []).forEach((c) => {
        try { api.evalCommand(c); } catch { /* 명령 하나 실패해도 계속 */ }
      });
    },
  };

  const applet = new GGBApplet(params, true);
  applet.inject(host);
}
