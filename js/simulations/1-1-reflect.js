// 1-1 탐구: 포물선의 반사 성질 — 평행하게 들어온 빛이 전부 초점 한 점에 모인다
// 위성 안테나·자동차 전조등의 원리

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const OX = 150;
const OY = H / 2;
const SCALE = 40;

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

  const nLabel = document.createElement("label");
  nLabel.textContent = "전파(광선) 개수: ";
  const nInput = document.createElement("input");
  nInput.type = "range";
  nInput.min = "1";
  nInput.max = "15";
  nInput.step = "1";
  nInput.value = "7";
  nLabel.appendChild(nInput);

  const pLabel = document.createElement("label");
  pLabel.textContent = "안테나 깊이 p: ";
  const pInput = document.createElement("input");
  pInput.type = "range";
  pInput.min = "0.6";
  pInput.max = "2";
  pInput.step = "0.1";
  pInput.value = "1";
  pLabel.appendChild(pInput);

  controls.appendChild(nLabel);
  controls.appendChild(pLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const n = parseInt(nInput.value, 10);
    const p = parseFloat(pInput.value);

    // 포물선 y² = 4px (안테나 단면)
    let d = "";
    for (let y = -4.4; y <= 4.4; y += 0.1) {
      const x = (y * y) / (4 * p);
      d += (y <= -4.39 ? "M" : "L") + sx(x) + " " + sy(y) + " ";
    }
    svg.appendChild(el("path", { d, fill: "none", stroke: "#f5d76e", "stroke-width": 3 }));

    // 초점
    const fx = sx(p), fy = sy(0);

    // 평행 광선 → 반사 → 초점
    for (let i = 0; i < n; i++) {
      const k = -3.6 + (7.2 * i) / Math.max(n - 1, 1); // 광선의 y좌표
      if (Math.abs(k) < 0.15) continue; // 축과 겹치는 광선은 생략
      const hitX = (k * k) / (4 * p);

      // 들어오는 광선 (오른쪽 → 왼쪽, 수평)
      svg.appendChild(el("line", {
        x1: W, y1: sy(k), x2: sx(hitX), y2: sy(k),
        stroke: "#8fd6a8", "stroke-width": 1.3, opacity: 0.85,
      }));
      // 반사 광선 (반사 성질: 초점으로!)
      svg.appendChild(el("line", {
        x1: sx(hitX), y1: sy(k), x2: fx, y2: fy,
        stroke: "#8fd6a8", "stroke-width": 1.3, opacity: 0.85, "stroke-dasharray": "5 3",
      }));
      svg.appendChild(el("circle", { cx: sx(hitX), cy: sy(k), r: 2.5, fill: "#8fd6a8" }));
    }

    // 초점 (수신기)
    svg.appendChild(el("circle", { cx: fx, cy: fy, r: 7, fill: "#e8927c" }));
    svg.appendChild(el("circle", { cx: fx, cy: fy, r: 12, fill: "none", stroke: "#e8927c", "stroke-width": 1.5, opacity: 0.6 }));
    const fLab = el("text", { x: fx + 16, y: fy + 4, "font-size": 12, fill: "#e8927c" });
    fLab.textContent = "초점 F (수신기 위치!)";
    svg.appendChild(fLab);

    info.textContent = `멀리서 온 전파는 서로 평행하게 도착합니다. 포물면에 닿은 전파 ${n}개가 전부 초점 한 점으로 반사됩니다 — 그래서 위성 안테나의 수신기는 정확히 초점에 달려 있어요. p를 바꾸면 초점의 위치도 함께 움직이는 것을 확인해 보세요.`;
  }

  nInput.addEventListener("input", render);
  pInput.addEventListener("input", render);
  render();
}
