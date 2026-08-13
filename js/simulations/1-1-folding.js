// 1-1 탐구: 종이접기로 포물선 만들기 (교과서 생각열기 재현)
// 준선 위의 점 D를 초점 F 위로 포개지게 접으면, 접힌 자국(FD의 수직이등분선)이
// 포물선의 접선이 된다. 접은 자국이 쌓이면 포물선이 '떠오른다'.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const CX = W / 2;
const CY = H / 2 + 60;
const SCALE = 40;

function sx(x) { return CX + x * SCALE; }
function sy(y) { return CY - y * SCALE; }

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

  const nLabel = document.createElement("label");
  nLabel.textContent = "접은 횟수: ";
  const nInput = document.createElement("input");
  nInput.type = "range";
  nInput.min = "1";
  nInput.max = "40";
  nInput.step = "1";
  nInput.value = "8";
  nLabel.appendChild(nInput);

  const dLabel = document.createElement("label");
  dLabel.textContent = "지금 접는 점 D: ";
  const dInput = document.createElement("input");
  dInput.type = "range";
  dInput.min = "-5";
  dInput.max = "5";
  dInput.step = "0.1";
  dInput.value = "2";
  dLabel.appendChild(dInput);

  controls.appendChild(nLabel);
  controls.appendChild(dLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  const p = 1; // 초점 (0, 1), 준선 y = -1

  // FD의 수직이등분선을 화면 가로 범위만큼 그린다
  function foldLine(d) {
    // F(0, p), D(d, -p). 수직이등분선: 중점 M(d/2, 0), 기울기 = d/(2p)
    const mx = d / 2;
    const my = 0;
    const slope = d / (2 * p);
    const x1 = -8, x2 = 8;
    return { x1, y1: my + slope * (x1 - mx), x2, y2: my + slope * (x2 - mx) };
  }

  function render() {
    svg.innerHTML = "";
    const n = parseInt(nInput.value, 10);
    const d = parseFloat(dInput.value);

    // 준선 y = -1
    svg.appendChild(el("line", {
      x1: 0, y1: sy(-p), x2: W, y2: sy(-p),
      stroke: "#e8927c", "stroke-width": 2, "stroke-dasharray": "6 4",
    }));
    const dirLabel = el("text", { x: 12, y: sy(-p) - 8, "font-size": 12, fill: "#e8927c" });
    dirLabel.textContent = "준선 (종이의 아래 끝)";
    svg.appendChild(dirLabel);

    // 접은 자국들 (흐린 분필)
    for (let i = 0; i < n; i++) {
      const di = -5 + (10 * i) / Math.max(n - 1, 1);
      const L = foldLine(di);
      svg.appendChild(el("line", {
        x1: sx(L.x1), y1: sy(L.y1), x2: sx(L.x2), y2: sy(L.y2),
        stroke: "#f2efe6", "stroke-width": 1, opacity: 0.28,
      }));
    }

    // 지금 접는 자국 (강조)
    const L = foldLine(d);
    svg.appendChild(el("line", {
      x1: sx(L.x1), y1: sy(L.y1), x2: sx(L.x2), y2: sy(L.y2),
      stroke: "#f5d76e", "stroke-width": 2,
    }));

    // D → F 이동 표시
    svg.appendChild(el("line", {
      x1: sx(d), y1: sy(-p), x2: sx(0), y2: sy(p),
      stroke: "#8fd6a8", "stroke-width": 1.2, "stroke-dasharray": "3 4",
    }));
    svg.appendChild(el("circle", { cx: sx(d), cy: sy(-p), r: 5, fill: "#8fd6a8" }));
    const dLab = el("text", { x: sx(d) + 8, y: sy(-p) + 16, "font-size": 12, fill: "#8fd6a8" });
    dLab.textContent = "D";
    svg.appendChild(dLab);

    // 초점 F
    svg.appendChild(el("circle", { cx: sx(0), cy: sy(p), r: 5, fill: "#f5d76e" }));
    const fLab = el("text", { x: sx(0) + 9, y: sy(p) - 8, "font-size": 12, fill: "#f5d76e" });
    fLab.textContent = "F (초점)";
    svg.appendChild(fLab);

    // 접점 (접선이 포물선에 닿는 점): x = d, y = d²/4p
    const tx = d, ty = (d * d) / (4 * p);
    svg.appendChild(el("circle", { cx: sx(tx), cy: sy(ty), r: 4, fill: "none", stroke: "#f5d76e", "stroke-width": 1.5 }));

    info.textContent = `접은 자국 ${n}개 — 자국이 쌓일수록 곡선이 떠오릅니다. 각 자국은 포물선의 '접선'이고, D를 움직이면 접점(작은 원)도 따라 움직여요. (접은 자국 = FD를 접는 수직이등분선)`;
  }

  nInput.addEventListener("input", render);
  dInput.addEventListener("input", render);
  render();
}
