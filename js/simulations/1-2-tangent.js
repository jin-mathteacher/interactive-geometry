// 1-2 탐구 2: 곡선 위의 점에서 접선 그리기
// 포물선 y² = 4x 위의 점 P(t², 2t)에서의 접선: ty = x + t²  (즉 y = x/t + t)

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

  const tLabel = document.createElement("label");
  tLabel.textContent = "점 P 움직이기: ";
  const tInput = document.createElement("input");
  tInput.type = "range";
  tInput.min = "-2.2";
  tInput.max = "2.2";
  tInput.step = "0.05";
  tInput.value = "1";
  tLabel.appendChild(tInput);

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
    let t = parseFloat(tInput.value);
    // t = 0 근처는 접선이 수직(x=0)이 되므로 살짝 비켜 간다
    if (Math.abs(t) < 0.15) t = t >= 0 ? 0.15 : -0.15;

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

    // 점 P(t², 2t)
    const pxu = t * t;
    const pyu = 2 * t;

    // 접선 y = x/t + t
    const slope = 1 / t;
    const x1 = -3, x2 = 14;
    svg.appendChild(
      el("line", {
        x1: sx(x1), y1: sy(slope * x1 + t),
        x2: sx(x2), y2: sy(slope * x2 + t),
        stroke: "#8fd6a8", "stroke-width": 1.8,
      })
    );

    svg.appendChild(el("circle", { cx: sx(pxu), cy: sy(pyu), r: 5.5, fill: "#f2efe6" }));
    const pLabel = el("text", { x: sx(pxu) + 10, y: sy(pyu) - 10, "font-size": 13, fill: "#f2efe6" });
    pLabel.textContent = `P(${pxu.toFixed(1)}, ${pyu.toFixed(1)})`;
    svg.appendChild(pLabel);

    info.textContent = `접선의 기울기 = ${slope.toFixed(2)} → 접선: y = ${slope.toFixed(2)}x + ${t.toFixed(2)}  (공식 ty = x + t²을 정리한 것)`;
  }

  tInput.addEventListener("input", render);
  render();
}
