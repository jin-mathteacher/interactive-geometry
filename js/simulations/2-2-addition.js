// 2-1 탐구 1: 벡터의 덧셈 — 평행사변형법과 삼각형법
// 두 벡터 a, b의 크기·방향을 슬라이더로 조절하면 합 벡터 a+b가 실시간으로 그려진다.
// 점선 보조선으로 평행사변형법(양쪽 평행 이동)과 삼각형법(이어 붙이기)을 함께 표시.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const OX = 260;   // 원점 화면 x
const OY = 260;   // 원점 화면 y
const SCALE = 42; // 1단위 → 42px

function sx(x) { return OX + x * SCALE; }
function sy(y) { return OY - y * SCALE; }

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 수학 좌표로 화살표 그리기
function arrow(svg, x1, y1, x2, y2, color, width, dash) {
  const X1 = sx(x1), Y1 = sy(y1), X2 = sx(x2), Y2 = sy(y2);
  const attrs = { x1: X1, y1: Y1, x2: X2, y2: Y2, stroke: color, "stroke-width": width || 2.5 };
  if (dash) attrs["stroke-dasharray"] = dash;
  svg.appendChild(el("line", attrs));
  if (dash) return; // 보조선은 화살촉 생략
  const ang = Math.atan2(Y2 - Y1, X2 - X1);
  const size = 9;
  const p1 = `${X2},${Y2}`;
  const p2 = `${X2 - size * Math.cos(ang - 0.42)},${Y2 - size * Math.sin(ang - 0.42)}`;
  const p3 = `${X2 - size * Math.cos(ang + 0.42)},${Y2 - size * Math.sin(ang + 0.42)}`;
  svg.appendChild(el("polygon", { points: `${p1} ${p2} ${p3}`, fill: color }));
}

function slider(labelText, min, max, step, value) {
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  label.appendChild(input);
  return { label, input };
}

export function mount(container) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "sim-controls";

  const aMag = slider("|a| 크기: ", 0.5, 3, 0.05, 2);
  const aAng = slider("a 방향(°): ", 0, 180, 1, 25);
  const bMag = slider("|b| 크기: ", 0.5, 3, 0.05, 1.5);
  const bAng = slider("b 방향(°): ", 0, 180, 1, 100);

  controls.appendChild(aMag.label);
  controls.appendChild(aAng.label);
  controls.appendChild(bMag.label);
  controls.appendChild(bAng.label);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";

    const ra = (parseFloat(aAng.input.value) * Math.PI) / 180;
    const rb = (parseFloat(bAng.input.value) * Math.PI) / 180;
    const ma = parseFloat(aMag.input.value);
    const mb = parseFloat(bMag.input.value);

    const a = { x: ma * Math.cos(ra), y: ma * Math.sin(ra) };
    const b = { x: mb * Math.cos(rb), y: mb * Math.sin(rb) };
    const s = { x: a.x + b.x, y: a.y + b.y };
    const smag = Math.hypot(s.x, s.y);

    // 축
    svg.appendChild(el("line", { x1: 0, y1: OY, x2: W, y2: OY, stroke: "#f2efe633" }));
    svg.appendChild(el("line", { x1: OX, y1: 0, x2: OX, y2: H, stroke: "#f2efe633" }));

    // 평행사변형 보조 점선:
    // a의 끝점에서 b를 평행이동(삼각형법 경로이기도 함)
    arrow(svg, a.x, a.y, a.x + b.x, a.y + b.y, "#e8927c", 1.5, "5 4");
    // b의 끝점에서 a를 평행이동
    arrow(svg, b.x, b.y, b.x + a.x, b.y + a.y, "#f5d76e", 1.5, "5 4");

    // 벡터 a (노랑), b (주황) — 원점에서 출발
    arrow(svg, 0, 0, a.x, a.y, "#f5d76e", 3);
    arrow(svg, 0, 0, b.x, b.y, "#e8927c", 3);
    // 합 벡터 a+b (초록) = 평행사변형의 대각선
    arrow(svg, 0, 0, s.x, s.y, "#8fd6a8", 3.5);

    // 라벨
    const labels = [
      { v: a, name: "a", color: "#f5d76e" },
      { v: b, name: "b", color: "#e8927c" },
      { v: s, name: "a+b", color: "#8fd6a8" },
    ];
    labels.forEach(({ v, name, color }) => {
      const t = el("text", {
        x: sx(v.x * 0.55) + 10, y: sy(v.y * 0.55) - 8,
        fill: color, "font-size": 15, "font-weight": "bold",
      });
      t.textContent = name;
      svg.appendChild(t);
    });

    // 안내 문구
    const guide = el("text", { x: 14, y: H - 14, fill: "#c3cfc2", "font-size": 12 });
    guide.textContent = "점선 = 평행사변형(a 끝에 b를, b 끝에 a를 평행이동). 초록 대각선이 합 a+b — 어느 길로 가도 도착점은 같다!";
    svg.appendChild(guide);

    info.textContent =
      `a = (${a.x.toFixed(2)}, ${a.y.toFixed(2)}),  b = (${b.x.toFixed(2)}, ${b.y.toFixed(2)})  →  ` +
      `a+b = (${s.x.toFixed(2)}, ${s.y.toFixed(2)}),  |a+b| = ${smag.toFixed(2)}`;
  }

  [aMag, aAng, bMag, bAng].forEach(({ input }) => input.addEventListener("input", render));
  render();
}
