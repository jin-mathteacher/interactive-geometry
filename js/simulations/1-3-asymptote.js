// 1-3 탐구: 점근선 — 닿을 듯 닿지 않는 직선
// 점 P를 멀리 보낼수록 쌍곡선이 점근선에 한없이 가까워지는 것을 수치로 확인한다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const CX = W / 2;
const CY = H / 2;

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

  const uLabel = document.createElement("label");
  uLabel.textContent = "점 P를 멀리 보내기: ";
  const uInput = document.createElement("input");
  uInput.type = "range";
  uInput.min = "0";
  uInput.max = "4.6";
  uInput.step = "0.05";
  uInput.value = "0.8";
  uLabel.appendChild(uInput);

  controls.appendChild(uLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  const a = 1, b = 0.8;

  function render() {
    svg.innerHTML = "";
    const u = parseFloat(uInput.value);

    // P가 멀어질수록 화면을 축소(줌아웃)해서 전체 모습을 보여준다
    const px = a * Math.cosh(u);
    const py = b * Math.sinh(u);
    const SCALE = Math.min(120, (W / 2 - 40) / Math.max(px, 2.2));

    const sx = (x) => CX + x * SCALE;
    const sy = (y) => CY - y * SCALE;

    // 축
    svg.appendChild(el("line", { x1: 0, y1: CY, x2: W, y2: CY, stroke: "#f2efe622" }));
    svg.appendChild(el("line", { x1: CX, y1: 0, x2: CX, y2: H, stroke: "#f2efe622" }));

    // 점근선 y = ±(b/a)x
    const slope = b / a;
    const dxx = W;
    svg.appendChild(el("line", {
      x1: CX - dxx, y1: CY + slope * dxx * 1, x2: CX + dxx, y2: CY - slope * dxx * 1,
      stroke: "#8fd6a8", "stroke-width": 1.5, "stroke-dasharray": "7 5", opacity: 0.8,
    }));
    svg.appendChild(el("line", {
      x1: CX - dxx, y1: CY - slope * dxx * 1, x2: CX + dxx, y2: CY + slope * dxx * 1,
      stroke: "#8fd6a8", "stroke-width": 1.5, "stroke-dasharray": "7 5", opacity: 0.8,
    }));

    // 쌍곡선 두 가지
    [1, -1].forEach((sign) => {
      let d = "";
      for (let t = -5; t <= 5; t += 0.05) {
        const hx = sign * a * Math.cosh(t);
        const hy = b * Math.sinh(t);
        const X = sx(hx), Y = sy(hy);
        if (X < -50 || X > W + 50 || Y < -50 || Y > H + 50) { continue; }
        d += (d === "" ? "M" : "L") + X.toFixed(1) + " " + Y.toFixed(1) + " ";
      }
      svg.appendChild(el("path", { d, fill: "none", stroke: "#f5d76e", "stroke-width": 2 }));
    });

    // 점 P와, P에서 점근선까지의 수직 거리
    const dist = Math.abs(slope * px - py) / Math.hypot(slope, 1);
    // 점근선 위의 수선의 발
    const footX = (px + slope * py) / (1 + slope * slope) * 1;
    const footY = slope * footX;

    svg.appendChild(el("line", {
      x1: sx(px), y1: sy(py), x2: sx(footX), y2: sy(footY),
      stroke: "#e8927c", "stroke-width": 1.5,
    }));
    svg.appendChild(el("circle", { cx: sx(px), cy: sy(py), r: 5, fill: "#f2efe6" }));
    const pLab = el("text", { x: sx(px) + 9, y: sy(py) - 9, "font-size": 12, fill: "#f2efe6" });
    pLab.textContent = "P";
    svg.appendChild(pLab);

    info.textContent = `P (${px.toFixed(1)}, ${py.toFixed(1)}) 에서 점근선까지 거리 = ${dist.toFixed(4)} — 멀리 갈수록 0에 가까워지지만, 절대 0이 되지는 않습니다!`;
  }

  uInput.addEventListener("input", render);
  render();
}
