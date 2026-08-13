// 1-2 탐구 1: 직선과 포물선의 위치 관계 — 판별식 D의 부호 관찰
// 포물선 y² = 4x, 직선 y = mx + n. D = (2mn−4)² − 4m²n² = 16(1 − mn)

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 380;
const OX = 120;
const OY = H / 2;
const SCALE = 38;

function sx(x) { return OX + x * SCALE; }
function sy(y) { return OY - y * SCALE; }

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

export function mount(container) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "sim-controls";

  const mLabel = document.createElement("label");
  mLabel.textContent = "기울기 m: ";
  const mInput = document.createElement("input");
  mInput.type = "range";
  mInput.min = "0.2";
  mInput.max = "2";
  mInput.step = "0.05";
  mInput.value = "1";
  mLabel.appendChild(mInput);

  const nLabel = document.createElement("label");
  nLabel.textContent = "y절편 n: ";
  const nInput = document.createElement("input");
  nInput.type = "range";
  nInput.min = "-2";
  nInput.max = "4";
  nInput.step = "0.05";
  nInput.value = "0";
  nLabel.appendChild(nInput);

  controls.appendChild(mLabel);
  controls.appendChild(nLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const m = parseFloat(mInput.value);
    const n = parseFloat(nInput.value);

    // 축
    svg.appendChild(el("line", { x1: 0, y1: OY, x2: W, y2: OY, stroke: "#f2efe633" }));
    svg.appendChild(el("line", { x1: OX, y1: 0, x2: OX, y2: H, stroke: "#f2efe633" }));

    // 포물선
    let d = "";
    for (let y = -4.8; y <= 4.8; y += 0.1) {
      const x = (y * y) / 4;
      d += (y <= -4.79 ? "M" : "L") + sx(x) + " " + sy(y) + " ";
    }
    svg.appendChild(el("path", { d, fill: "none", stroke: "#f5d76e", "stroke-width": 2 }));

    // 직선
    const x1 = -3, x2 = 14;
    svg.appendChild(
      el("line", {
        x1: sx(x1), y1: sy(m * x1 + n),
        x2: sx(x2), y2: sy(m * x2 + n),
        stroke: "#f2efe6", "stroke-width": 1.5,
      })
    );

    // 교점
    const A = m * m;
    const B = 2 * m * n - 4;
    const C = n * n;
    const D = 16 * (1 - m * n);

    const points = [];
    if (D >= 0 && A > 0) {
      const r = Math.sqrt(B * B - 4 * A * C < 0 ? 0 : B * B - 4 * A * C);
      [(-B + r) / (2 * A), (-B - r) / (2 * A)].forEach((x) => {
        if (x >= 0 && x <= 14) points.push({ x, y: m * x + n });
      });
    }
    const unique = [];
    points.forEach((pt) => {
      if (!unique.some((u) => Math.abs(u.x - pt.x) < 1e-6)) unique.push(pt);
    });

    unique.forEach((pt) => {
      svg.appendChild(el("circle", { cx: sx(pt.x), cy: sy(pt.y), r: 6, fill: "none", stroke: "#8fd6a8", "stroke-width": 2 }));
      svg.appendChild(el("circle", { cx: sx(pt.x), cy: sy(pt.y), r: 2.5, fill: "#8fd6a8" }));
    });

    const state =
      Math.abs(D) < 0.5
        ? "≈ 0 → 접한다! (교점 1개)"
        : D > 0
          ? "> 0 → 서로 다른 두 점에서 만난다"
          : "< 0 → 만나지 않는다";
    info.textContent = `y = ${m.toFixed(2)}x + ${n.toFixed(2)} 대입 → 판별식 D = 16(1 − mn) = ${D.toFixed(1)} ${state}`;
  }

  mInput.addEventListener("input", render);
  nInput.addEventListener("input", render);
  render();
}
