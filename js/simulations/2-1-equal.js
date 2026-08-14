// 2-1 탐구: 벡터 평행이동 실험 — 언제 '같은 벡터'가 될까?
// 기준 벡터 AB(노랑, 고정)와 자유 벡터(시점 위치·방향·크기 조절).
// 시점이 어디든, 크기와 방향만 일치하면 초록으로 변하며 "같은 벡터!" — 위치는 조건에 없다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const SCALE = 55;

// 기준 벡터: 시점 A(-3.4, -1.6), 방향 30°, 크기 2
const REF = { x: -3.4, y: -1.6, deg: 30, mag: 2 };

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

  function makeSlider(text, min, max, step, value) {
    const label = document.createElement("label");
    label.textContent = text;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    label.appendChild(input);
    controls.appendChild(label);
    return input;
  }

  const pxInput = makeSlider("시점 x ", -1, 4, 0.1, 1.5);
  const pyInput = makeSlider("시점 y ", -2.5, 2.5, 0.1, 0.5);
  const dirInput = makeSlider("방향(°) ", 0, 359, 1, 120);
  const magInput = makeSlider("크기 ", 0.5, 3.5, 0.1, 1.2);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function drawArrow(x1, y1, deg, mag, color, width) {
    const th = (deg * Math.PI) / 180;
    const x2 = x1 + mag * Math.cos(th);
    const y2 = y1 + mag * Math.sin(th);
    const X1 = sx(x1), Y1 = sy(y1), X2 = sx(x2), Y2 = sy(y2);
    const dx = X2 - X1, dy = Y2 - Y1;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const hs = 10;
    svg.appendChild(el("line", { x1: X1, y1: Y1, x2: X2, y2: Y2, stroke: color, "stroke-width": width }));
    svg.appendChild(el("path", {
      d: `M ${X2} ${Y2} L ${X2 - hs * ux + hs * 0.6 * uy} ${Y2 - hs * uy - hs * 0.6 * ux} L ${X2 - hs * ux - hs * 0.6 * uy} ${Y2 - hs * uy + hs * 0.6 * ux} Z`,
      fill: color,
    }));
  }

  // 방향 차이 (0~180°)
  function angleDiff(a, b) {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
  }

  function render() {
    svg.innerHTML = "";

    const fx = parseFloat(pxInput.value);
    const fy = parseFloat(pyInput.value);
    const fdeg = parseFloat(dirInput.value);
    const fmag = parseFloat(magInput.value);

    const dDiff = angleDiff(fdeg, REF.deg);
    const mDiff = Math.abs(fmag - REF.mag);
    const same = dDiff <= 1.5 && mDiff <= 0.05;

    // 모눈 배경
    for (let gx = -5; gx <= 5; gx++) {
      svg.appendChild(el("line", { x1: sx(gx), y1: 0, x2: sx(gx), y2: H, stroke: "#f2efe633", "stroke-width": gx === 0 ? 1.2 : 0.5 }));
    }
    for (let gy = -3; gy <= 3; gy++) {
      svg.appendChild(el("line", { x1: 0, y1: sy(gy), x2: W, y2: sy(gy), stroke: "#f2efe633", "stroke-width": gy === 0 ? 1.2 : 0.5 }));
    }

    // 기준 벡터 AB (노랑)
    drawArrow(REF.x, REF.y, REF.deg, REF.mag, "#f5d76e", 3.5);
    const refLab = el("text", { x: sx(REF.x) - 8, y: sy(REF.y) + 22, "font-size": 13, fill: "#f5d76e" });
    refLab.textContent = "기준 AB";
    svg.appendChild(refLab);

    // 자유 벡터
    const freeColor = same ? "#8fd6a8" : "#c3cfc2";
    drawArrow(fx, fy, fdeg, fmag, freeColor, 3.5);
    svg.appendChild(el("circle", { cx: sx(fx), cy: sy(fy), r: 3.5, fill: freeColor }));

    if (same) {
      const badge = el("text", { x: sx(fx) + 8, y: sy(fy) - 12, "font-size": 16, fill: "#8fd6a8", "font-weight": "bold" });
      badge.textContent = "같은 벡터! 🎉";
      svg.appendChild(badge);
    }

    const hint =
      same ? "시점이 어디에 있든 상관없죠? 크기와 방향만 같으면 '같은 벡터'입니다. 시점 슬라이더를 움직여도 초록이 유지되는지 확인해 보세요!" :
      dDiff <= 1.5 ? "방향은 일치! 이제 크기를 기준에 맞춰 보세요." :
      mDiff <= 0.05 ? "크기는 일치! 이제 방향을 기준에 맞춰 보세요." :
      "슬라이더로 자유 벡터의 방향과 크기를 기준(방향 30°, 크기 2.0)에 맞춰 보세요.";

    info.textContent =
      `기준: 크기 ${REF.mag.toFixed(1)}, 방향 ${REF.deg}° | ` +
      `자유: 크기 ${fmag.toFixed(1)}, 방향 ${Math.round(fdeg)}° — ${hint}`;
  }

  [pxInput, pyInput, dirInput, magInput].forEach((input) => input.addEventListener("input", render));
  render();
}
