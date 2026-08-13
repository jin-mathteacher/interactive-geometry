// 3-1 탐구 2: 정사영 — 기울어진 선분의 그림자 길이는 L·cosθ
// 바닥 평면(격자) 위에 한 끝을 둔 길이 L의 선분이 각도 θ로 기울어져 있음.
// 태양 광선(수직 점선)이 만드는 정사영(그림자)의 길이 L·cosθ를 실시간 표시.
// 3D 표현: yaw/pitch 회전행렬 후 평행투영.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const CX = W / 2;
const CY = H / 2 + 40;
const SCALE = 42;
const L = 6; // 선분의 길이 (단위 길이)

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

  const thetaLabel = document.createElement("label");
  thetaLabel.textContent = "기울기 각 θ: ";
  const thetaInput = document.createElement("input");
  thetaInput.type = "range";
  thetaInput.min = "0";
  thetaInput.max = "90";
  thetaInput.step = "1";
  thetaInput.value = "35";
  const thetaVal = document.createElement("span");
  thetaLabel.appendChild(thetaInput);
  thetaLabel.appendChild(thetaVal);

  const yawLabel = document.createElement("label");
  yawLabel.textContent = "시점 회전: ";
  const yawInput = document.createElement("input");
  yawInput.type = "range";
  yawInput.min = "-60";
  yawInput.max = "60";
  yawInput.step = "1";
  yawInput.value = "20";
  yawLabel.appendChild(yawInput);

  controls.appendChild(thetaLabel);
  controls.appendChild(yawLabel);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const theta = (parseFloat(thetaInput.value) * Math.PI) / 180;
    const thetaDeg = parseFloat(thetaInput.value);
    const yaw = (parseFloat(yawInput.value) * Math.PI) / 180;
    const pitch = (25 * Math.PI) / 180; // 바닥이 보이도록 살짝 내려다보는 고정 시점
    const project = makeProjector(yaw, pitch);

    thetaVal.textContent = ` ${thetaDeg}°`;

    // 배경
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // 바닥 평면 격자 (y = 0, x·z ∈ [-3.2, 7.2] × [-3.2, 3.2])
    const gx0 = -3, gx1 = 7, gz0 = -3, gz1 = 3;
    for (let gx = gx0; gx <= gx1; gx++) {
      const p1 = project(gx, 0, gz0);
      const p2 = project(gx, 0, gz1);
      svg.appendChild(el("line", { x1: p1.X, y1: p1.Y, x2: p2.X, y2: p2.Y, stroke: "#f2efe633" }));
    }
    for (let gz = gz0; gz <= gz1; gz++) {
      const p1 = project(gx0, 0, gz);
      const p2 = project(gx1, 0, gz);
      svg.appendChild(el("line", { x1: p1.X, y1: p1.Y, x2: p2.X, y2: p2.Y, stroke: "#f2efe633" }));
    }

    // 선분 AB: A(0,0,0) 바닥 위, B(L·cosθ, L·sinθ, 0) — x-y 평면 안에서 기울어짐
    const bx = L * Math.cos(theta);
    const by = L * Math.sin(theta);
    const A = project(0, 0, 0);
    const B = project(bx, by, 0);
    const Bfoot = project(bx, 0, 0); // B의 수선의 발 B'

    // 태양 광선: 수직 점선 여러 개 (선분 위 점 → 바닥) — 직관 강화
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      const top = project(bx * t, by * t + 1.3, 0); // 선분 위쪽 하늘에서
      const hit = project(bx * t, by * t, 0);       // 선분 위의 점까지
      svg.appendChild(el("line", {
        x1: top.X, y1: top.Y, x2: hit.X, y2: hit.Y,
        stroke: "#f5d76e", "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.6,
      }));
    }

    // B에서 바닥으로 내리는 수선 (점선)
    svg.appendChild(el("line", {
      x1: B.X, y1: B.Y, x2: Bfoot.X, y2: Bfoot.Y,
      stroke: "#c3cfc2", "stroke-width": 1.4, "stroke-dasharray": "5 4",
    }));

    // 그림자(정사영) A → B' : 초록 굵은 선
    svg.appendChild(el("line", {
      x1: A.X, y1: A.Y, x2: Bfoot.X, y2: Bfoot.Y,
      stroke: "#8fd6a8", "stroke-width": 5, "stroke-linecap": "round", opacity: 0.9,
    }));

    // 원래 선분 AB : 노랑 굵은 선
    svg.appendChild(el("line", {
      x1: A.X, y1: A.Y, x2: B.X, y2: B.Y,
      stroke: "#f5d76e", "stroke-width": 4, "stroke-linecap": "round",
    }));

    // 각 θ 호 표시
    const arcR = 1.1;
    let arc = "";
    for (let a = 0; a <= theta + 1e-9; a += Math.PI / 60) {
      const p = project(arcR * Math.cos(a), arcR * Math.sin(a), 0);
      arc += (a === 0 ? "M" : "L") + p.X + " " + p.Y + " ";
    }
    if (theta > 0.02) {
      svg.appendChild(el("path", { d: arc, fill: "none", stroke: "#e8927c", "stroke-width": 1.6 }));
      const mid = project(1.55 * Math.cos(theta / 2), 1.55 * Math.sin(theta / 2), 0);
      const t = el("text", { x: mid.X - 6, y: mid.Y + 5, fill: "#e8927c", "font-size": 14 });
      t.textContent = "θ";
      svg.appendChild(t);
    }

    // 라벨
    const labA = el("text", { x: A.X - 16, y: A.Y + 18, fill: "#f2efe6", "font-size": 14 });
    labA.textContent = "A";
    svg.appendChild(labA);
    const labB = el("text", { x: B.X + 8, y: B.Y - 6, fill: "#f5d76e", "font-size": 14 });
    labB.textContent = "B";
    svg.appendChild(labB);
    const labBf = el("text", { x: Bfoot.X + 8, y: Bfoot.Y + 16, fill: "#8fd6a8", "font-size": 14 });
    labBf.textContent = "B′";
    svg.appendChild(labBf);

    // 길이 정보
    const shadow = L * Math.cos(theta);
    info.textContent =
      `원래 길이 L = ${L}, 기울기 θ = ${thetaDeg}° → 정사영(그림자) 길이 = L·cosθ = ${L} × ${Math.cos(theta).toFixed(3)} = ${shadow.toFixed(2)}` +
      (thetaDeg === 0 ? " (평면과 나란하면 그림자 = 원래 길이!)" : thetaDeg === 90 ? " (수직으로 서면 그림자는 점이 됩니다!)" : "");
  }

  thetaInput.addEventListener("input", render);
  yawInput.addEventListener("input", render);
  render();
}
