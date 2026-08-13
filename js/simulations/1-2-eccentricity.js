// 1-2 탐구: 이심률 — 원에서 길쭉한 타원까지, 그리고 행성들의 진짜 궤도
// e = c/a. e가 0에 가까우면 원, 1에 가까우면 길쭉한 타원.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const SCALE = 55;

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

const PRESETS = [
  { name: "완전한 원", e: 0 },
  { name: "지구 궤도", e: 0.017 },
  { name: "화성 궤도", e: 0.093 },
  { name: "명왕성 궤도", e: 0.25 },
  { name: "핼리 혜성", e: 0.93 },
];

export function mount(container) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "sim-controls";

  const eLabel = document.createElement("label");
  eLabel.textContent = "이심률 e: ";
  const eInput = document.createElement("input");
  eInput.type = "range";
  eInput.min = "0";
  eInput.max = "0.97";
  eInput.step = "0.001";
  eInput.value = "0.5";
  eLabel.appendChild(eInput);

  controls.appendChild(eLabel);

  const presetRow = document.createElement("div");
  presetRow.className = "sim-controls";
  PRESETS.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "hint-btn";
    btn.textContent = p.name;
    btn.addEventListener("click", () => {
      eInput.value = String(p.e);
      render();
    });
    presetRow.appendChild(btn);
  });

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(presetRow);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const e = parseFloat(eInput.value);
    const a = 4.2;
    const c = e * a;
    const b = Math.sqrt(a * a - c * c);

    // 축
    svg.appendChild(el("line", { x1: 0, y1: CY, x2: W, y2: CY, stroke: "#f2efe622" }));

    // 비교용 원 (반지름 a, 흐리게)
    svg.appendChild(el("circle", {
      cx: CX, cy: CY, r: a * SCALE,
      fill: "none", stroke: "#f2efe633", "stroke-width": 1, "stroke-dasharray": "4 5",
    }));

    // 타원 궤도
    svg.appendChild(el("ellipse", {
      cx: CX, cy: CY, rx: a * SCALE, ry: b * SCALE,
      fill: "none", stroke: "#f5d76e", "stroke-width": 2.5,
    }));

    // 초점 2개 — 한쪽에 태양
    const fx = CX + c * SCALE;
    const fpx = CX - c * SCALE;
    svg.appendChild(el("circle", { cx: fx, cy: CY, r: 9, fill: "#e8927c" }));
    const sunLab = el("text", { x: fx + 13, y: CY + 4, "font-size": 12, fill: "#e8927c" });
    sunLab.textContent = "☀ 태양 (초점)";
    svg.appendChild(sunLab);
    svg.appendChild(el("circle", { cx: fpx, cy: CY, r: 4, fill: "none", stroke: "#c3cfc2", "stroke-width": 1.5 }));

    const shape =
      e < 0.05 ? "거의 완벽한 원이에요. 행성 궤도가 '타원'이라지만 사실 이 정도!" :
      e < 0.3 ? "살짝 눌린 타원 — 두 초점이 구분되기 시작합니다." :
      e < 0.7 ? "제법 길쭉해졌어요. 태양이 한쪽으로 치우친 게 보이나요?" :
      "핼리 혜성급! 태양 근처를 스치듯 지나갔다가 아주 멀리 날아갑니다.";

    info.textContent = `e = c/a = ${e.toFixed(3)} (c = ${c.toFixed(2)}, a = ${a}) — ${shape}`;
  }

  eInput.addEventListener("input", render);
  render();
}
