// 3-2 탐구 1: 두 점 사이의 거리 — 직육면체 대각선 시각화
// 두 점 P, Q를 마주 보는 꼭짓점으로 하는 직육면체(점선)를 그려
// PQ = √(가로²+세로²+높이²)임을 보인다. yaw/pitch 회전 가능.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 420;
const CX = W / 2;
const CY = H / 2 + 15;
const SCALE = 34;
const RANGE = 4;

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 3D → 2D 평행투영: yaw(z축 둘레 회전) 후 pitch(내려다보기)
function makeProjector(yawDeg, pitchDeg) {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return function project(x, y, z) {
    const xr = x * cy - y * sy;
    const yr = x * sy + y * cy;
    return { X: CX + xr * SCALE, Y: CY - (z * cp + yr * sp) * SCALE };
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

  const px = makeSlider("P의 x: ", -RANGE, RANGE, 1, -2);
  const py = makeSlider("P의 y: ", -RANGE, RANGE, 1, -1);
  const pz = makeSlider("P의 z: ", -RANGE, RANGE, 1, -1);
  const qx = makeSlider("Q의 x: ", -RANGE, RANGE, 1, 1);
  const qy = makeSlider("Q의 y: ", -RANGE, RANGE, 1, 3);
  const qz = makeSlider("Q의 z: ", -RANGE, RANGE, 1, 2);
  const yawIn = makeSlider("시점 회전: ", -90, 90, 1, -30);
  const pitchIn = makeSlider("시점 기울기: ", 5, 80, 1, 28);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const P1 = { x: parseFloat(px.value), y: parseFloat(py.value), z: parseFloat(pz.value) };
    const P2 = { x: parseFloat(qx.value), y: parseFloat(qy.value), z: parseFloat(qz.value) };
    const proj = makeProjector(parseFloat(yawIn.value), parseFloat(pitchIn.value));

    // 배경
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // xy평면 격자 (흐린선)
    for (let i = -RANGE; i <= RANGE; i += 1) {
      const a1 = proj(i, -RANGE, 0), a2 = proj(i, RANGE, 0);
      const b1 = proj(-RANGE, i, 0), b2 = proj(RANGE, i, 0);
      svg.appendChild(el("line", { x1: a1.X, y1: a1.Y, x2: a2.X, y2: a2.Y, stroke: "#f2efe633", "stroke-width": 0.6 }));
      svg.appendChild(el("line", { x1: b1.X, y1: b1.Y, x2: b2.X, y2: b2.Y, stroke: "#f2efe633", "stroke-width": 0.6 }));
    }

    // 좌표축: x 주황, y 초록, z 노랑
    [
      { to: [RANGE + 1, 0, 0], color: "#e8927c", name: "x" },
      { to: [0, RANGE + 1, 0], color: "#8fd6a8", name: "y" },
      { to: [0, 0, RANGE + 1], color: "#f5d76e", name: "z" },
    ].forEach((ax) => {
      const o = proj(0, 0, 0);
      const t = proj(ax.to[0], ax.to[1], ax.to[2]);
      svg.appendChild(el("line", { x1: o.X, y1: o.Y, x2: t.X, y2: t.Y, stroke: ax.color, "stroke-width": 1.5 }));
      const label = el("text", { x: t.X + 6, y: t.Y + 4, fill: ax.color, "font-size": 13 });
      label.textContent = ax.name;
      svg.appendChild(label);
    });

    // 직육면체(점선): P1, P2를 마주 보는 꼭짓점으로 하는 상자
    const xs = [P1.x, P2.x], ys = [P1.y, P2.y], zs = [P1.z, P2.z];
    const corners = [];
    for (let i = 0; i < 2; i += 1)
      for (let j = 0; j < 2; j += 1)
        for (let k = 0; k < 2; k += 1) corners.push([xs[i], ys[j], zs[k]]);
    // 좌표가 한 성분만 다른 꼭짓점 쌍이 모서리
    for (let a = 0; a < corners.length; a += 1) {
      for (let b = a + 1; b < corners.length; b += 1) {
        const diff =
          (corners[a][0] !== corners[b][0] ? 1 : 0) +
          (corners[a][1] !== corners[b][1] ? 1 : 0) +
          (corners[a][2] !== corners[b][2] ? 1 : 0);
        if (diff === 1) {
          const A = proj(corners[a][0], corners[a][1], corners[a][2]);
          const B = proj(corners[b][0], corners[b][1], corners[b][2]);
          svg.appendChild(el("line", { x1: A.X, y1: A.Y, x2: B.X, y2: B.Y, stroke: "#c3cfc2", "stroke-width": 1, "stroke-dasharray": "4 4", opacity: 0.7 }));
        }
      }
    }

    // 밑면 대각선(피타고라스 1단계): P1 → (Q.x, Q.y, P1.z)
    const mid = proj(P2.x, P2.y, P1.z);
    const A = proj(P1.x, P1.y, P1.z);
    const B = proj(P2.x, P2.y, P2.z);
    svg.appendChild(el("line", { x1: A.X, y1: A.Y, x2: mid.X, y2: mid.Y, stroke: "#8fd6a8", "stroke-width": 1.5, "stroke-dasharray": "6 3" }));
    svg.appendChild(el("line", { x1: mid.X, y1: mid.Y, x2: B.X, y2: B.Y, stroke: "#8fd6a8", "stroke-width": 1.5, "stroke-dasharray": "6 3" }));

    // 대각선 PQ (강조)
    svg.appendChild(el("line", { x1: A.X, y1: A.Y, x2: B.X, y2: B.Y, stroke: "#f5d76e", "stroke-width": 2.5 }));

    // 두 점
    svg.appendChild(el("circle", { cx: A.X, cy: A.Y, r: 5, fill: "#e8927c" }));
    svg.appendChild(el("circle", { cx: B.X, cy: B.Y, r: 5, fill: "#e8927c" }));
    const lp = el("text", { x: A.X + 8, y: A.Y - 8, fill: "#f2efe6", "font-size": 13 });
    lp.textContent = `P(${P1.x}, ${P1.y}, ${P1.z})`;
    svg.appendChild(lp);
    const lq = el("text", { x: B.X + 8, y: B.Y - 8, fill: "#f2efe6", "font-size": 13 });
    lq.textContent = `Q(${P2.x}, ${P2.y}, ${P2.z})`;
    svg.appendChild(lq);

    // 거리 계산 과정 표시
    const dx = P2.x - P1.x, dy = P2.y - P1.y, dz = P2.z - P1.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(d2);
    const distStr = Number.isInteger(dist) ? String(dist) : `√${d2} ≈ ${dist.toFixed(2)}`;
    info.textContent =
      `가로 ${Math.abs(dx)}, 세로 ${Math.abs(dy)}, 높이 ${Math.abs(dz)} → ` +
      `PQ = √(${dx}² + ${dy}² + ${dz}²) = √(${dx * dx}+${dy * dy}+${dz * dz}) = √${d2} = ${distStr}` +
      ` — 노란 대각선은 점선 상자의 대각선입니다.`;
  }

  [px, py, pz, qx, qy, qz, yawIn, pitchIn].forEach((s) => s.addEventListener("input", render));
  render();
}
