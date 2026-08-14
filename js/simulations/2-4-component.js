// 2-2 탐구 1: 벡터의 성분과 크기 — 성분 (a₁, a₂)와 |a| = √(a₁² + a₂²)
// 벡터 끝점을 슬라이더로 조절하면 성분과 크기가 실시간으로 계산된다.
// 직각삼각형 보조선(점선)으로 피타고라스 정리와 연결한다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const OX = W / 2;
const OY = H / 2;
const SCALE = 34;

function sx(x) { return OX + x * SCALE; }
function sy(y) { return OY - y * SCALE; }

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 화살표(선분 + 머리) 그리기
function arrow(svg, x1, y1, x2, y2, color, width) {
  if (Math.abs(x1 - x2) < 0.5 && Math.abs(y1 - y2) < 0.5) return;
  svg.appendChild(el("line", { x1, y1, x2, y2, stroke: color, "stroke-width": width }));
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const s = 9;
  svg.appendChild(el("polygon", {
    points: `${x2},${y2} ${x2 - s * Math.cos(ang - 0.45)},${y2 - s * Math.sin(ang - 0.45)} ${x2 - s * Math.cos(ang + 0.45)},${y2 - s * Math.sin(ang + 0.45)}`,
    fill: color,
  }));
}

export function mount(container) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "sim-controls";

  const xLabel = document.createElement("label");
  xLabel.textContent = "x성분 a₁: ";
  const xInput = document.createElement("input");
  xInput.type = "range";
  xInput.min = "-5";
  xInput.max = "5";
  xInput.step = "0.5";
  xInput.value = "3";
  xLabel.appendChild(xInput);

  const yLabel = document.createElement("label");
  yLabel.textContent = "y성분 a₂: ";
  const yInput = document.createElement("input");
  yInput.type = "range";
  yInput.min = "-5";
  yInput.max = "5";
  yInput.step = "0.5";
  yInput.value = "4";
  yLabel.appendChild(yInput);

  controls.appendChild(xLabel);
  controls.appendChild(yLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const a1 = parseFloat(xInput.value);
    const a2 = parseFloat(yInput.value);

    // 격자
    for (let g = -9; g <= 9; g++) {
      svg.appendChild(el("line", { x1: sx(g), y1: 0, x2: sx(g), y2: H, stroke: "#f2efe633", "stroke-width": 0.5 }));
      svg.appendChild(el("line", { x1: 0, y1: sy(g), x2: W, y2: sy(g), stroke: "#f2efe633", "stroke-width": 0.5 }));
    }
    // 축
    svg.appendChild(el("line", { x1: 0, y1: OY, x2: W, y2: OY, stroke: "#c3cfc2", "stroke-width": 1 }));
    svg.appendChild(el("line", { x1: OX, y1: 0, x2: OX, y2: H, stroke: "#c3cfc2", "stroke-width": 1 }));

    // 직각삼각형 보조선 (점선): 가로 변 + 세로 변
    svg.appendChild(el("line", {
      x1: sx(0), y1: sy(0), x2: sx(a1), y2: sy(0),
      stroke: "#e8927c", "stroke-width": 1.5, "stroke-dasharray": "5 4",
    }));
    svg.appendChild(el("line", {
      x1: sx(a1), y1: sy(0), x2: sx(a1), y2: sy(a2),
      stroke: "#8fd6a8", "stroke-width": 1.5, "stroke-dasharray": "5 4",
    }));

    // 직각 표시
    if (Math.abs(a1) > 0.2 && Math.abs(a2) > 0.2) {
      const q = 8;
      const dxs = a1 > 0 ? -1 : 1;
      const dys = a2 > 0 ? -1 : 1;
      svg.appendChild(el("path", {
        d: `M ${sx(a1) + dxs * q} ${sy(0)} L ${sx(a1) + dxs * q} ${sy(0) + dys * q} L ${sx(a1)} ${sy(0) + dys * q}`,
        fill: "none", stroke: "#c3cfc2", "stroke-width": 1,
      }));
    }

    // 벡터 a (노랑, 주인공)
    arrow(svg, sx(0), sy(0), sx(a1), sy(a2), "#f5d76e", 3);

    // 끝점
    svg.appendChild(el("circle", { cx: sx(a1), cy: sy(a2), r: 4, fill: "#f5d76e" }));
    const pt = el("text", { x: sx(a1) + 10, y: sy(a2) - 8, fill: "#f2efe6", "font-size": 13 });
    pt.textContent = `(${a1}, ${a2})`;
    svg.appendChild(pt);

    // 성분 라벨
    const lx = el("text", { x: sx(a1 / 2), y: sy(0) + (a2 >= 0 ? 18 : -10), fill: "#e8927c", "font-size": 12, "text-anchor": "middle" });
    lx.textContent = `a₁ = ${a1}`;
    svg.appendChild(lx);
    const ly = el("text", { x: sx(a1) + (a1 >= 0 ? 8 : -8), y: sy(a2 / 2), fill: "#8fd6a8", "font-size": 12, "text-anchor": a1 >= 0 ? "start" : "end" });
    ly.textContent = `a₂ = ${a2}`;
    svg.appendChild(ly);

    // 크기 계산
    const mag = Math.sqrt(a1 * a1 + a2 * a2);
    const nice = Number.isInteger(mag) ? String(mag) : mag.toFixed(2);
    info.textContent = `벡터 a = (${a1}, ${a2}) · 크기 |a| = √(${a1}² + ${a2}²) = √${(a1 * a1 + a2 * a2).toFixed(2).replace(/\.00$/, "")} = ${nice}  — 빗변의 길이(피타고라스 정리)와 같습니다.`;
  }

  xInput.addEventListener("input", render);
  yInput.addEventListener("input", render);
  render();
}
