// 2-2 탐구 2: 내적과 사잇각 — a·b = |a||b|cosθ
// 두 벡터의 방향(각도)과 크기를 슬라이더로 조절하면 내적이 실시간으로 계산된다.
// 예각이면 양수(초록), 90°이면 0(노랑), 둔각이면 음수(주황)로 색을 바꿔 강조하고,
// b를 a 방향으로 정사영한 그림자(점선)도 함께 보여준다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 420;
const OX = W / 2;
const OY = H / 2 + 20;
const SCALE = 40;

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

  // 벡터 a는 x축 양의 방향으로 고정, b의 각도(사잇각 θ)와 두 벡터의 크기를 조절
  const tLabel = document.createElement("label");
  tLabel.textContent = "사잇각 θ(도): ";
  const tInput = document.createElement("input");
  tInput.type = "range";
  tInput.min = "0";
  tInput.max = "180";
  tInput.step = "1";
  tInput.value = "45";
  tLabel.appendChild(tInput);

  const aLabel = document.createElement("label");
  aLabel.textContent = "|a|: ";
  const aInput = document.createElement("input");
  aInput.type = "range";
  aInput.min = "1";
  aInput.max = "4";
  aInput.step = "0.5";
  aInput.value = "3";
  aLabel.appendChild(aInput);

  const bLabel = document.createElement("label");
  bLabel.textContent = "|b|: ";
  const bInput = document.createElement("input");
  bInput.type = "range";
  bInput.min = "1";
  bInput.max = "4";
  bInput.step = "0.5";
  bInput.value = "2.5";
  bLabel.appendChild(bInput);

  controls.appendChild(tLabel);
  controls.appendChild(aLabel);
  controls.appendChild(bLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const deg = parseFloat(tInput.value);
    const rad = (deg * Math.PI) / 180;
    const magA = parseFloat(aInput.value);
    const magB = parseFloat(bInput.value);

    // 내적과 부호에 따른 색
    const cos = Math.cos(rad);
    const dot = magA * magB * cos;
    const isZero = Math.abs(deg - 90) < 0.5;
    const signColor = isZero ? "#f5d76e" : dot > 0 ? "#8fd6a8" : "#e8927c";

    // 축
    svg.appendChild(el("line", { x1: 0, y1: OY, x2: W, y2: OY, stroke: "#f2efe633" }));
    svg.appendChild(el("line", { x1: OX, y1: 0, x2: OX, y2: H, stroke: "#f2efe633" }));

    // 벡터 b의 끝점 (사잇각 θ 방향)
    const bx = magB * Math.cos(rad);
    const by = magB * Math.sin(rad);

    // 정사영 그림자: b를 a 방향(x축)으로 내린 그림자 = |b|cosθ
    const proj = magB * cos;
    // 수선 (점선)
    svg.appendChild(el("line", {
      x1: sx(bx), y1: sy(by), x2: sx(proj), y2: sy(0),
      stroke: "#c3cfc2", "stroke-width": 1, "stroke-dasharray": "4 4",
    }));
    // 그림자 (a 방향 위의 굵은 점선, 부호 색상)
    if (Math.abs(proj) > 0.05) {
      svg.appendChild(el("line", {
        x1: sx(0), y1: sy(0) + 10, x2: sx(proj), y2: sy(0) + 10,
        stroke: signColor, "stroke-width": 4, "stroke-dasharray": "7 4", opacity: 0.85,
      }));
      const shText = el("text", { x: sx(proj / 2), y: sy(0) + 28, fill: signColor, "font-size": 12, "text-anchor": "middle" });
      shText.textContent = `그림자 |b|cosθ = ${proj.toFixed(2)}`;
      svg.appendChild(shText);
    }

    // 사잇각 호
    const arcR = 30;
    svg.appendChild(el("path", {
      d: `M ${sx(0) + arcR} ${sy(0)} A ${arcR} ${arcR} 0 ${deg > 180 ? 1 : 0} 0 ${OX + arcR * Math.cos(rad)} ${OY - arcR * Math.sin(rad)}`,
      fill: "none", stroke: "#c3cfc2", "stroke-width": 1.2,
    }));
    const angText = el("text", {
      x: OX + (arcR + 16) * Math.cos(rad / 2),
      y: OY - (arcR + 16) * Math.sin(rad / 2) + 4,
      fill: "#c3cfc2", "font-size": 12, "text-anchor": "middle",
    });
    angText.textContent = `θ=${deg}°`;
    svg.appendChild(angText);

    // 벡터 a (노랑, x축 방향 고정)
    arrow(svg, sx(0), sy(0), sx(magA), sy(0), "#f5d76e", 3);
    const aText = el("text", { x: sx(magA) + 8, y: sy(0) - 10, fill: "#f5d76e", "font-size": 14 });
    aText.textContent = "a";
    svg.appendChild(aText);

    // 벡터 b (주황)
    arrow(svg, sx(0), sy(0), sx(bx), sy(by), "#e8927c", 3);
    const bText = el("text", { x: sx(bx) + 8, y: sy(by) - 8, fill: "#e8927c", "font-size": 14 });
    bText.textContent = "b";
    svg.appendChild(bText);

    // 내적 값 표시 (부호 색상 강조)
    const dotBox = el("text", { x: W - 20, y: 34, fill: signColor, "font-size": 18, "text-anchor": "end", "font-weight": "bold" });
    dotBox.textContent = `a·b = ${dot.toFixed(2)}`;
    svg.appendChild(dotBox);

    const state = isZero
      ? "θ = 90° → cosθ = 0 → 내적 0. 두 벡터는 수직!"
      : dot > 0
        ? "예각(θ < 90°) → cosθ > 0 → 내적은 양수"
        : "둔각(θ > 90°) → cosθ < 0 → 내적은 음수";
    info.textContent = `a·b = |a||b|cosθ = ${magA} × ${magB} × cos${deg}° = ${magA} × ${magB} × ${cos.toFixed(3)} = ${dot.toFixed(2)}  |  ${state}`;
  }

  tInput.addEventListener("input", render);
  aInput.addEventListener("input", render);
  bInput.addEventListener("input", render);
  render();
}
