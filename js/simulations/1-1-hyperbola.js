// 1-1 탐구 3: 쌍곡선 — 두 초점까지 거리의 차가 일정
// a·c를 조절하고 점 P를 움직이면서 |PF - PF'| = 2a 확인, 점근선도 표시

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
  aLabel.textContent = "거리의 차 2a: ";
  const aInput = document.createElement("input");
  aInput.type = "range";
  aInput.min = "0.6";
  aInput.max = "2.2";
  aInput.step = "0.1";
  aInput.value = "1.2";
  aLabel.appendChild(aInput);

  const cLabel = document.createElement("label");
  cLabel.textContent = "초점 사이 거리: ";
  const cInput = document.createElement("input");
  cInput.type = "range";
  cInput.min = "1.4";
  cInput.max = "3";
  cInput.step = "0.1";
  cInput.value = "2";
  cLabel.appendChild(cInput);

  const tLabel = document.createElement("label");
  tLabel.textContent = "점 P 움직이기: ";
  const tInput = document.createElement("input");
  tInput.type = "range";
  tInput.min = "-2.2";
  tInput.max = "2.2";
  tInput.step = "0.05";
  tInput.value = "1";
  tLabel.appendChild(tInput);

  const sideBtn = document.createElement("button");
  sideBtn.className = "hint-btn";
  sideBtn.textContent = "반대쪽 가지로";
  let side = 1; // 1: 오른쪽 가지, -1: 왼쪽 가지

  controls.appendChild(aLabel);
  controls.appendChild(cLabel);
  controls.appendChild(tLabel);
  controls.appendChild(sideBtn);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function branchPath(a, b, sign) {
    // x = ±a·cosh(u), y = b·sinh(u)
    let d = "";
    for (let u = -2.4; u <= 2.4; u += 0.05) {
      const x = CX + sign * a * Math.cosh(u) * SCALE;
      const y = CY - b * Math.sinh(u) * SCALE;
      d += (u <= -2.39 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    return d;
  }

  function render() {
    svg.innerHTML = "";
    let a = parseFloat(aInput.value) / 2; // 입력은 2a
    let c = parseFloat(cInput.value);
    // 쌍곡선 조건 c > a 유지
    if (c <= a + 0.1) c = a + 0.1;
    const b = Math.sqrt(c * c - a * a);
    const u = parseFloat(tInput.value);

    // 축
    svg.appendChild(el("line", { x1: 0, y1: CY, x2: W, y2: CY, stroke: "#f2efe633" }));
    svg.appendChild(el("line", { x1: CX, y1: 0, x2: CX, y2: H, stroke: "#f2efe633" }));

    // 점근선 y = ±(b/a)x
    const slope = b / a;
    const dx = W / 2;
    svg.appendChild(
      el("line", {
        x1: CX - dx, y1: CY + slope * dx,
        x2: CX + dx, y2: CY - slope * dx,
        stroke: "#8fd6a866", "stroke-width": 1.5, "stroke-dasharray": "6 5",
      })
    );
    svg.appendChild(
      el("line", {
        x1: CX - dx, y1: CY - slope * dx,
        x2: CX + dx, y2: CY + slope * dx,
        stroke: "#8fd6a866", "stroke-width": 1.5, "stroke-dasharray": "6 5",
      })
    );
    const asymLabel = el("text", { x: W - 130, y: 22, "font-size": 11, fill: "#8fd6a8" });
    asymLabel.textContent = "점선 = 점근선";
    svg.appendChild(asymLabel);

    // 두 가지
    svg.appendChild(el("path", { d: branchPath(a, b, 1), fill: "none", stroke: "#f5d76e", "stroke-width": 2 }));
    svg.appendChild(el("path", { d: branchPath(a, b, -1), fill: "none", stroke: "#f5d76e", "stroke-width": 2 }));

    // 초점
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

    // 점 P
    const px = CX + side * a * Math.cosh(u) * SCALE;
    const py = CY - b * Math.sinh(u) * SCALE;

    svg.appendChild(el("line", { x1: px, y1: py, x2: fx, y2: CY, stroke: "#f2efe6", "stroke-width": 1.5 }));
    svg.appendChild(el("line", { x1: px, y1: py, x2: fpx, y2: CY, stroke: "#f2efe6", "stroke-width": 1.5 }));

    svg.appendChild(el("circle", { cx: px, cy: py, r: 5, fill: "#f2efe6" }));
    const pLabel = el("text", { x: px + 9, y: py - 9, "font-size": 13, fill: "#f2efe6" });
    pLabel.textContent = "P";
    svg.appendChild(pLabel);

    const pf = Math.hypot((px - fx) / SCALE, (py - CY) / SCALE);
    const pfp = Math.hypot((px - fpx) / SCALE, (py - CY) / SCALE);
    info.textContent = `PF = ${pf.toFixed(2)}, PF′ = ${pfp.toFixed(2)} → |차| = ${Math.abs(pf - pfp).toFixed(2)} (항상 2a = ${(2 * a).toFixed(2)})`;
  }

  sideBtn.addEventListener("click", () => {
    side *= -1;
    render();
  });
  aInput.addEventListener("input", render);
  cInput.addEventListener("input", render);
  tInput.addEventListener("input", render);
  render();
}
