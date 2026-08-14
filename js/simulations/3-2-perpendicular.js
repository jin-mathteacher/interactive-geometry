// 3-2 탐구 1: 삼수선 정리 관찰 — PO⊥평면, OH⊥l 이면 PH⊥l
// 3D 장면: 바닥 평면(격자), 평면 위의 직선 l(주황), 평면 밖의 점 P(노랑).
// P에서 평면에 내린 수선 PO(노랑 점선), O에서 l에 내린 수선 OH(초록), PH(분필흰).
// 어떤 시점·높이·위치에서도 PH와 l 사이의 각이 항상 90°임을 실시간 표시.
// 3D 표현: yaw/pitch 회전행렬 후 평행투영.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 420;
const CX = W / 2;
const CY = H / 2 + 30;
const SCALE = 46;
const LINE_Z = 2; // 직선 l: 바닥 평면(y=0) 위에서 z = LINE_Z, x축 방향으로 뻗은 직선

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// yaw → pitch 회전 후 평행투영 (y가 위쪽)
function makeProjector(yaw, pitch) {
  const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return function project(x, y, z) {
    const x1 = x * cy_ + z * sy_;
    const z1 = -x * sy_ + z * cy_;
    const y2 = y * cp - z1 * sp;
    return { X: CX + x1 * SCALE, Y: CY - y2 * SCALE };
  };
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

  const yawInput = makeSlider("시점 회전(좌우): ", -70, 70, 1, 25);
  const pitchInput = makeSlider("시점 회전(상하): ", 10, 60, 1, 26);
  const heightInput = makeSlider("P의 높이: ", 0.5, 3.5, 0.05, 2.4);
  const posInput = makeSlider("l 방향 위치 이동: ", -2.5, 2.5, 0.05, 0.8);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  // 3D 벡터 도우미
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function norm(a) { return Math.sqrt(dot(a, a)); }

  // 직각 표시 기호: 꼭짓점 corner에서 두 방향 u, v로 작은 ㄱ자 그리기
  function rightAngleMark(project, corner, u, v, size, color) {
    const lu = norm(u), lv = norm(v);
    if (lu < 1e-9 || lv < 1e-9) return null;
    const s = size;
    const p1 = { x: corner.x + (u.x / lu) * s, y: corner.y + (u.y / lu) * s, z: corner.z + (u.z / lu) * s };
    const p2 = { x: p1.x + (v.x / lv) * s, y: p1.y + (v.y / lv) * s, z: p1.z + (v.z / lv) * s };
    const p3 = { x: corner.x + (v.x / lv) * s, y: corner.y + (v.y / lv) * s, z: corner.z + (v.z / lv) * s };
    const q1 = project(p1.x, p1.y, p1.z);
    const q2 = project(p2.x, p2.y, p2.z);
    const q3 = project(p3.x, p3.y, p3.z);
    return el("path", {
      d: `M ${q1.X} ${q1.Y} L ${q2.X} ${q2.Y} L ${q3.X} ${q3.Y}`,
      fill: "none", stroke: color, "stroke-width": 1.6,
    });
  }

  function render() {
    svg.innerHTML = "";
    const yaw = (parseFloat(yawInput.value) * Math.PI) / 180;
    const pitch = (parseFloat(pitchInput.value) * Math.PI) / 180;
    const h = parseFloat(heightInput.value);   // P의 높이
    const px = parseFloat(posInput.value);     // l 방향(x축) 위치
    const project = makeProjector(yaw, pitch);

    // 점 구성: P(px, h, 0), 수선의 발 O(px, 0, 0), l 위의 수선의 발 H(px, 0, LINE_Z)
    const P = { x: px, y: h, z: 0 };
    const O = { x: px, y: 0, z: 0 };
    const Hpt = { x: px, y: 0, z: LINE_Z };
    const lDir = { x: 1, y: 0, z: 0 }; // 직선 l의 방향

    // 배경
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // 바닥 평면 격자 (y = 0)
    const gx0 = -4, gx1 = 4, gz0 = -2, gz1 = 4;
    for (let gx = gx0; gx <= gx1; gx++) {
      const a = project(gx, 0, gz0);
      const b = project(gx, 0, gz1);
      svg.appendChild(el("line", { x1: a.X, y1: a.Y, x2: b.X, y2: b.Y, stroke: "#f2efe633" }));
    }
    for (let gz = gz0; gz <= gz1; gz++) {
      const a = project(gx0, 0, gz);
      const b = project(gx1, 0, gz);
      svg.appendChild(el("line", { x1: a.X, y1: a.Y, x2: b.X, y2: b.Y, stroke: "#f2efe633" }));
    }

    // 직선 l (주황) — 평면 위 z = LINE_Z, x축 방향
    const l1 = project(gx0, 0, LINE_Z);
    const l2 = project(gx1, 0, LINE_Z);
    svg.appendChild(el("line", { x1: l1.X, y1: l1.Y, x2: l2.X, y2: l2.Y, stroke: "#e8927c", "stroke-width": 3.5, "stroke-linecap": "round" }));
    const lLab = el("text", { x: l2.X - 18, y: l2.Y - 8, fill: "#e8927c", "font-size": 14 });
    lLab.textContent = "l";
    svg.appendChild(lLab);

    const pP = project(P.x, P.y, P.z);
    const pO = project(O.x, O.y, O.z);
    const pH = project(Hpt.x, Hpt.y, Hpt.z);

    // PO: P에서 평면에 내린 수선 (노랑 점선)
    svg.appendChild(el("line", {
      x1: pP.X, y1: pP.Y, x2: pO.X, y2: pO.Y,
      stroke: "#f5d76e", "stroke-width": 2, "stroke-dasharray": "6 4",
    }));

    // OH: O에서 l에 내린 수선 (초록)
    svg.appendChild(el("line", {
      x1: pO.X, y1: pO.Y, x2: pH.X, y2: pH.Y,
      stroke: "#8fd6a8", "stroke-width": 3, "stroke-linecap": "round",
    }));

    // PH (분필흰)
    svg.appendChild(el("line", {
      x1: pP.X, y1: pP.Y, x2: pH.X, y2: pH.Y,
      stroke: "#f2efe6", "stroke-width": 3, "stroke-linecap": "round",
    }));

    // 직각 표시 3개: O에서 (PO⊥OH), H에서 (OH⊥l), H에서 (PH⊥l — 결론!)
    const mark1 = rightAngleMark(project, O, sub(P, O), sub(Hpt, O), 0.28, "#f5d76e");
    if (mark1) svg.appendChild(mark1);
    const mark2 = rightAngleMark(project, Hpt, sub(O, Hpt), lDir, 0.28, "#8fd6a8");
    if (mark2) svg.appendChild(mark2);
    const mark3 = rightAngleMark(project, Hpt, sub(P, Hpt), { x: -lDir.x, y: -lDir.y, z: -lDir.z }, 0.32, "#f2efe6");
    if (mark3) svg.appendChild(mark3);

    // 점 P, O, H
    svg.appendChild(el("circle", { cx: pP.X, cy: pP.Y, r: 6, fill: "#f5d76e" }));
    svg.appendChild(el("circle", { cx: pO.X, cy: pO.Y, r: 4.5, fill: "#f5d76e", opacity: 0.85 }));
    svg.appendChild(el("circle", { cx: pH.X, cy: pH.Y, r: 4.5, fill: "#8fd6a8" }));

    // 라벨
    const labP = el("text", { x: pP.X + 10, y: pP.Y - 6, fill: "#f5d76e", "font-size": 14 });
    labP.textContent = "P";
    svg.appendChild(labP);
    const labO = el("text", { x: pO.X - 18, y: pO.Y + 16, fill: "#f5d76e", "font-size": 14 });
    labO.textContent = "O";
    svg.appendChild(labO);
    const labH = el("text", { x: pH.X + 8, y: pH.Y + 16, fill: "#8fd6a8", "font-size": 14 });
    labH.textContent = "H";
    svg.appendChild(labH);

    // PH와 l 사이의 각 실시간 계산 (내적 이용)
    const PH = sub(Hpt, P);
    const cosAngle = Math.abs(dot(PH, lDir)) / (norm(PH) * norm(lDir));
    const angleDeg = (Math.acos(Math.min(1, cosAngle)) * 180) / Math.PI;

    info.textContent =
      `PO⊥평면 (노랑 점선), OH⊥l (초록) → 그렇다면 PH(흰 선)와 l 사이의 각 = ${angleDeg.toFixed(2)}° — ` +
      `P의 높이 ${h.toFixed(2)}, 위치를 아무리 바꿔도 언제나 90°! 이것이 삼수선 정리입니다.`;
  }

  [yawInput, pitchInput, heightInput, posInput].forEach((input) => {
    input.addEventListener("input", render);
  });
  render();
}
