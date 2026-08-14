// 2-1 탐구 2: 벡터의 실수배 — k>0이면 같은 방향, k<0이면 반대 방향, 길이는 |k|배
// 벡터 a의 방향과 실수 k를 슬라이더로 조절하면 ka가 실시간으로 그려진다.
// k가 어떤 값이든 ka는 항상 a와 평행(같은 직선 위)임을 시각화.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 380;
const OX = W / 2;
const OY = H / 2;
const SCALE = 44; // 1단위 → 44px

function sx(x) { return OX + x * SCALE; }
function sy(y) { return OY - y * SCALE; }

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 수학 좌표로 화살표 그리기 (offsetPx: 겹침 방지용 수직 방향 화면 오프셋)
function arrow(svg, x1, y1, x2, y2, color, width, offsetPx) {
  let X1 = sx(x1), Y1 = sy(y1), X2 = sx(x2), Y2 = sy(y2);
  if (offsetPx) {
    const ang = Math.atan2(Y2 - Y1, X2 - X1);
    const ox = -Math.sin(ang) * offsetPx;
    const oy = Math.cos(ang) * offsetPx;
    X1 += ox; Y1 += oy; X2 += ox; Y2 += oy;
  }
  svg.appendChild(el("line", { x1: X1, y1: Y1, x2: X2, y2: Y2, stroke: color, "stroke-width": width || 2.5 }));
  const len = Math.hypot(X2 - X1, Y2 - Y1);
  if (len < 2) return; // 너무 짧으면(k≈0) 화살촉 생략
  const ang2 = Math.atan2(Y2 - Y1, X2 - X1);
  const size = 9;
  const p1 = `${X2},${Y2}`;
  const p2 = `${X2 - size * Math.cos(ang2 - 0.42)},${Y2 - size * Math.sin(ang2 - 0.42)}`;
  const p3 = `${X2 - size * Math.cos(ang2 + 0.42)},${Y2 - size * Math.sin(ang2 + 0.42)}`;
  svg.appendChild(el("polygon", { points: `${p1} ${p2} ${p3}`, fill: color }));
}

export function mount(container) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "sim-controls";

  const angLabel = document.createElement("label");
  angLabel.textContent = "a 방향(°): ";
  const angInput = document.createElement("input");
  angInput.type = "range";
  angInput.min = "0";
  angInput.max = "360";
  angInput.step = "1";
  angInput.value = "30";
  angLabel.appendChild(angInput);

  const kLabel = document.createElement("label");
  kLabel.textContent = "실수 k: ";
  const kInput = document.createElement("input");
  kInput.type = "range";
  kInput.min = "-2";
  kInput.max = "3";
  kInput.step = "0.1";
  kInput.value = "2";
  const kVal = document.createElement("span");
  kLabel.appendChild(kInput);
  kLabel.appendChild(kVal);

  controls.appendChild(angLabel);
  controls.appendChild(kLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  const MAG_A = 1.4; // |a| 고정

  function render() {
    svg.innerHTML = "";
    const deg = parseFloat(angInput.value);
    const k = parseFloat(kInput.value);
    kVal.textContent = ` ${k.toFixed(1)}`;

    const rad = (deg * Math.PI) / 180;
    const a = { x: MAG_A * Math.cos(rad), y: MAG_A * Math.sin(rad) };
    const ka = { x: k * a.x, y: k * a.y };

    // 축
    svg.appendChild(el("line", { x1: 0, y1: OY, x2: W, y2: OY, stroke: "#f2efe633" }));
    svg.appendChild(el("line", { x1: OX, y1: 0, x2: OX, y2: H, stroke: "#f2efe633" }));

    // a가 놓인 직선(평행 개념 강조) — 흐린 점선으로 양쪽 끝까지
    const L = 8;
    svg.appendChild(el("line", {
      x1: sx(-L * Math.cos(rad)), y1: sy(-L * Math.sin(rad)),
      x2: sx(L * Math.cos(rad)), y2: sy(L * Math.sin(rad)),
      stroke: "#f2efe633", "stroke-dasharray": "4 5",
    }));

    // ka (초록) — 살짝 아래로 비켜 그려서 a와 겹쳐도 둘 다 보이게
    arrow(svg, 0, 0, ka.x, ka.y, "#8fd6a8", 3.5, 7);
    // a (노랑)
    arrow(svg, 0, 0, a.x, a.y, "#f5d76e", 3);

    // 라벨
    const aText = el("text", { x: sx(a.x) + 10, y: sy(a.y) - 10, fill: "#f5d76e", "font-size": 15, "font-weight": "bold" });
    aText.textContent = "a";
    svg.appendChild(aText);
    if (Math.abs(k) > 0.05) {
      const kText = el("text", { x: sx(ka.x) + 10, y: sy(ka.y) + 20, fill: "#8fd6a8", "font-size": 15, "font-weight": "bold" });
      kText.textContent = `${k.toFixed(1)}a`;
      svg.appendChild(kText);
    }

    // 방향 설명
    let dirMsg;
    if (Math.abs(k) < 0.05) {
      dirMsg = "k = 0 → ka는 영벡터(크기 0). 방향을 말할 수 없어요.";
    } else if (k > 0) {
      dirMsg = `k > 0 → a와 같은 방향, 길이는 ${Math.abs(k).toFixed(1)}배`;
    } else {
      dirMsg = `k < 0 → a와 반대 방향, 길이는 ${Math.abs(k).toFixed(1)}배`;
    }

    const guide = el("text", { x: 14, y: H - 14, fill: "#c3cfc2", "font-size": 12 });
    guide.textContent = "ka는 항상 점선(a가 놓인 직선) 위에 있어요 — 0이 아닌 실수배 관계인 두 벡터는 서로 평행!";
    svg.appendChild(guide);

    info.textContent =
      `a = (${a.x.toFixed(2)}, ${a.y.toFixed(2)}), |a| = ${MAG_A.toFixed(1)}  →  ` +
      `${k.toFixed(1)}a = (${ka.x.toFixed(2)}, ${ka.y.toFixed(2)}), |${k.toFixed(1)}a| = ${(Math.abs(k) * MAG_A).toFixed(2)}.  ${dirMsg}`;
  }

  angInput.addEventListener("input", render);
  kInput.addEventListener("input", render);
  render();
}
