// 1-1 탐구 2: 타원 — 두 초점까지 거리의 합이 일정 (실 그리기 시뮬레이션)
// a(긴반지름)·c(초점 거리)를 조절하고 점 P를 돌리면서 PF + PF' = 2a 확인

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 380;
const CX = W / 2;
const CY = H / 2;
const SCALE = 34;

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

  const aLabel = document.createElement("label");
  aLabel.textContent = "실의 길이 2a: ";
  const aInput = document.createElement("input");
  aInput.type = "range";
  aInput.min = "2.5";
  aInput.max = "4.5";
  aInput.step = "0.1";
  aInput.value = "3.5";
  aLabel.appendChild(aInput);

  const cLabel = document.createElement("label");
  cLabel.textContent = "초점 사이 거리: ";
  const cInput = document.createElement("input");
  cInput.type = "range";
  cInput.min = "0.3";
  cInput.max = "2.4";
  cInput.step = "0.1";
  cInput.value = "1.8";
  cLabel.appendChild(cInput);

  const tLabel = document.createElement("label");
  tLabel.textContent = "점 P 돌리기: ";
  const tInput = document.createElement("input");
  tInput.type = "range";
  tInput.min = "0";
  tInput.max = "360";
  tInput.step = "1";
  tInput.value = "50";
  tLabel.appendChild(tInput);

  controls.appendChild(aLabel);
  controls.appendChild(cLabel);
  controls.appendChild(tLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    let a = parseFloat(aInput.value);
    let c = parseFloat(cInput.value);
    // 타원 조건 c < a 유지
    if (c >= a - 0.1) c = a - 0.1;
    const b = Math.sqrt(a * a - c * c);
    const t = (parseFloat(tInput.value) * Math.PI) / 180;

    // 축
    svg.appendChild(el("line", { x1: 0, y1: CY, x2: W, y2: CY, stroke: "#f2efe633" }));
    svg.appendChild(el("line", { x1: CX, y1: 0, x2: CX, y2: H, stroke: "#f2efe633" }));

    // 타원
    svg.appendChild(
      el("ellipse", {
        cx: CX,
        cy: CY,
        rx: a * SCALE,
        ry: b * SCALE,
        fill: "none",
        stroke: "#f5d76e",
        "stroke-width": 2,
      })
    );

    // 초점 F, F'
    const fx = CX + c * SCALE;
    const fpx = CX - c * SCALE;
    [
      { x: fx, name: "F" },
      { x: fpx, name: "F′" },
    ].forEach(({ x, name }) => {
      svg.appendChild(el("circle", { cx: x, cy: CY, r: 5, fill: "#e8927c" }));
      const label = el("text", { x: x - 8, y: CY + 20, "font-size": 13, fill: "#e8927c" });
      label.textContent = name;
      svg.appendChild(label);
    });

    // 점 P (타원 위)
    const px = CX + a * SCALE * Math.cos(t);
    const py = CY - b * SCALE * Math.sin(t);

    // 실 (PF, PF')
    svg.appendChild(el("line", { x1: px, y1: py, x2: fx, y2: CY, stroke: "#f2efe6", "stroke-width": 1.5 }));
    svg.appendChild(el("line", { x1: px, y1: py, x2: fpx, y2: CY, stroke: "#f2efe6", "stroke-width": 1.5 }));

    svg.appendChild(el("circle", { cx: px, cy: py, r: 5, fill: "#f2efe6" }));
    const pLabel = el("text", { x: px + 9, y: py - 9, "font-size": 13, fill: "#f2efe6" });
    pLabel.textContent = "P (연필)";
    svg.appendChild(pLabel);

    const pf = Math.hypot((px - fx) / SCALE, (py - CY) / SCALE);
    const pfp = Math.hypot((px - fpx) / SCALE, (py - CY) / SCALE);
    info.textContent = `PF = ${pf.toFixed(2)}, PF′ = ${pfp.toFixed(2)} → 합 = ${(pf + pfp).toFixed(2)} (항상 2a = ${(2 * a).toFixed(2)}, 실의 길이는 변하지 않아요!)`;
  }

  aInput.addEventListener("input", render);
  cInput.addEventListener("input", render);
  tInput.addEventListener("input", render);
  render();
}
