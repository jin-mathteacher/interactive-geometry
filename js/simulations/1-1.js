// 1-1 이차곡선(포물선) 원리탐구 시뮬레이션
// y^2 = 4px 꼴 포물선에서 초점 F, 준선, 포물선 위 점 P를 조작하며
// PF(초점까지 거리)와 PH(준선까지 거리)가 항상 같음을 확인한다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 380;
const ORIGIN_X = 200; // 화면 좌표 원점
const ORIGIN_Y = H / 2;
const SCALE = 30; // 1 단위 = 30px

function toScreenX(x) {
  return ORIGIN_X + x * SCALE;
}
function toScreenY(y) {
  return ORIGIN_Y - y * SCALE;
}

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

export function mount(container) {
  container.innerHTML = "";
  container.classList.remove("sim-canvas-wrap");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "24px";
  controls.style.flexWrap = "wrap";
  controls.style.marginBottom = "12px";
  controls.style.fontSize = "0.85rem";

  const pControl = document.createElement("label");
  pControl.textContent = "초점 거리 p: ";
  const pInput = document.createElement("input");
  pInput.type = "range";
  pInput.min = "0.5";
  pInput.max = "3";
  pInput.step = "0.1";
  pInput.value = "1.5";
  pControl.appendChild(pInput);

  const tControl = document.createElement("label");
  tControl.textContent = "점 P의 위치: ";
  const tInput = document.createElement("input");
  tInput.type = "range";
  tInput.min = "-4";
  tInput.max = "4";
  tInput.step = "0.1";
  tInput.value = "2";
  tControl.appendChild(tInput);

  controls.appendChild(pControl);
  controls.appendChild(tControl);

  const info = document.createElement("div");
  info.style.fontSize = "0.85rem";
  info.style.marginBottom = "8px";
  info.style.color = "#c3cfc2";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const p = parseFloat(pInput.value);
    const yP = parseFloat(tInput.value);
    const xP = (yP * yP) / (4 * p);

    // 축
    svg.appendChild(el("line", { x1: 0, y1: ORIGIN_Y, x2: W, y2: ORIGIN_Y, stroke: "#f2efe633" }));
    svg.appendChild(el("line", { x1: ORIGIN_X, y1: 0, x2: ORIGIN_X, y2: H, stroke: "#f2efe633" }));

    // 준선 x = -p
    const directrixX = toScreenX(-p);
    svg.appendChild(
      el("line", {
        x1: directrixX,
        y1: 0,
        x2: directrixX,
        y2: H,
        stroke: "#e8927c",
        "stroke-width": 2,
        "stroke-dasharray": "6 4",
      })
    );

    // 포물선 경로
    let d = "";
    for (let y = -6; y <= 6; y += 0.1) {
      const x = (y * y) / (4 * p);
      const sx = toScreenX(x);
      const sy = toScreenY(y);
      d += (y === -6 ? "M" : "L") + sx + " " + sy + " ";
    }
    svg.appendChild(el("path", { d, fill: "none", stroke: "#f5d76e", "stroke-width": 2 }));

    // 초점 F
    const fx = toScreenX(p);
    const fy = toScreenY(0);
    svg.appendChild(el("circle", { cx: fx, cy: fy, r: 5, fill: "#f5d76e" }));
    svg.appendChild(el("text", { x: fx + 8, y: fy - 8, "font-size": 12, fill: "#f5d76e" })).textContent = "F";

    // 점 P
    const px = toScreenX(xP);
    const py = toScreenY(yP);
    svg.appendChild(el("circle", { cx: px, cy: py, r: 5, fill: "#f2efe6" }));
    svg.appendChild(el("text", { x: px + 8, y: py - 8, "font-size": 12, fill: "#f2efe6" })).textContent = "P";

    // PF 선분
    svg.appendChild(el("line", { x1: px, y1: py, x2: fx, y2: fy, stroke: "#f2efe6", "stroke-width": 1.5 }));

    // PH 선분 (준선까지 수선)
    svg.appendChild(
      el("line", {
        x1: px,
        y1: py,
        x2: directrixX,
        y2: py,
        stroke: "#f2efe6",
        "stroke-width": 1.5,
        "stroke-dasharray": "3 3",
      })
    );

    const pf = Math.hypot(xP - p, yP - 0);
    const ph = xP - -p;
    info.textContent = `PF = ${pf.toFixed(2)}, PH = ${ph.toFixed(2)} → PF와 PH가 항상 같습니다 (포물선의 정의).`;
  }

  pInput.addEventListener("input", render);
  tInput.addEventListener("input", render);
  render();
}
