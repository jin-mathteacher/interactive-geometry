// 3-2 탐구 2: 구의 방정식 — 중심 (a, b, c), 반지름 r인 구를 와이어프레임(위도/경도 원)으로 표현
// 구 위의 점 P를 각도 슬라이더로 굴려도 중심까지 거리는 항상 r임을 확인.
// (x−a)² + (y−b)² + (z−c)² = r²

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

// 부호 붙은 항 문자열: (x−a)² 형태
function term(v, c) {
  if (c === 0) return `${v}²`;
  return c > 0 ? `(${v}−${c})²` : `(${v}+${-c})²`;
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

  const aIn = makeSlider("중심 a: ", -3, 3, 1, 0);
  const bIn = makeSlider("중심 b: ", -3, 3, 1, 0);
  const cIn = makeSlider("중심 c: ", -3, 3, 1, 1);
  const rIn = makeSlider("반지름 r: ", 0.5, 3, 0.5, 2);
  const thIn = makeSlider("점 P 경도: ", 0, 360, 5, 40);
  const phIn = makeSlider("점 P 위도: ", 10, 170, 5, 60);
  const yawIn = makeSlider("시점 회전: ", -90, 90, 1, -30);
  const pitchIn = makeSlider("시점 기울기: ", 5, 80, 1, 28);

  const info = document.createElement("div");
  info.className = "sim-info";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  // 3D 폴리라인을 투영해 path로 추가
  function drawCurve(proj, pts, color, width, dash) {
    let d = "";
    pts.forEach((p, i) => {
      const q = proj(p[0], p[1], p[2]);
      d += (i === 0 ? "M" : "L") + q.X.toFixed(1) + " " + q.Y.toFixed(1) + " ";
    });
    const attrs = { d, fill: "none", stroke: color, "stroke-width": width };
    if (dash) attrs["stroke-dasharray"] = dash;
    svg.appendChild(el("path", attrs));
  }

  function render() {
    svg.innerHTML = "";
    const a = parseFloat(aIn.value);
    const b = parseFloat(bIn.value);
    const c = parseFloat(cIn.value);
    const r = parseFloat(rIn.value);
    const th = (parseFloat(thIn.value) * Math.PI) / 180;
    const ph = (parseFloat(phIn.value) * Math.PI) / 180;
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

    // 와이어프레임 구: 위도 원 3개 + 경도 원 4개
    const STEPS = 48;
    // 위도 원 (z 고정): phi = 45°, 90°, 135°
    [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].forEach((phi) => {
      const pts = [];
      const rr = r * Math.sin(phi);
      const zz = c + r * Math.cos(phi);
      for (let i = 0; i <= STEPS; i += 1) {
        const t = (i / STEPS) * 2 * Math.PI;
        pts.push([a + rr * Math.cos(t), b + rr * Math.sin(t), zz]);
      }
      drawCurve(proj, pts, "#c3cfc2", 1, "3 3");
    });
    // 경도 원 (세로 대원): theta = 0°, 45°, 90°, 135°
    [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].forEach((t0) => {
      const pts = [];
      for (let i = 0; i <= STEPS; i += 1) {
        const u = (i / STEPS) * 2 * Math.PI;
        pts.push([
          a + r * Math.sin(u) * Math.cos(t0),
          b + r * Math.sin(u) * Math.sin(t0),
          c + r * Math.cos(u),
        ]);
      }
      drawCurve(proj, pts, "#c3cfc2", 1, "3 3");
    });

    // 중심
    const O = proj(a, b, c);
    svg.appendChild(el("circle", { cx: O.X, cy: O.Y, r: 4, fill: "#f5d76e" }));
    const ol = el("text", { x: O.X + 8, y: O.Y - 8, fill: "#f5d76e", "font-size": 13 });
    ol.textContent = `중심 (${a}, ${b}, ${c})`;
    svg.appendChild(ol);

    // 구 위의 점 P
    const Px = a + r * Math.sin(ph) * Math.cos(th);
    const Py = b + r * Math.sin(ph) * Math.sin(th);
    const Pz = c + r * Math.cos(ph);
    const Pp = proj(Px, Py, Pz);

    // 반지름 선분 (중심 → P)
    svg.appendChild(el("line", { x1: O.X, y1: O.Y, x2: Pp.X, y2: Pp.Y, stroke: "#8fd6a8", "stroke-width": 2 }));
    svg.appendChild(el("circle", { cx: Pp.X, cy: Pp.Y, r: 5, fill: "#8fd6a8" }));
    const pl = el("text", { x: Pp.X + 8, y: Pp.Y + 14, fill: "#8fd6a8", "font-size": 13 });
    pl.textContent = `P(${Px.toFixed(1)}, ${Py.toFixed(1)}, ${Pz.toFixed(1)})`;
    svg.appendChild(pl);

    // 중심까지 거리 검증 (항상 r)
    const dist = Math.sqrt((Px - a) ** 2 + (Py - b) ** 2 + (Pz - c) ** 2);
    const rSq = r * r;
    info.textContent =
      `구의 방정식: ${term("x", a)} + ${term("y", b)} + ${term("z", c)} = ${Number.isInteger(rSq) ? rSq : rSq.toFixed(2)}  (r = ${r})` +
      `  |  점 P에서 중심까지의 거리 = ${dist.toFixed(2)} — 점을 아무리 굴려도 항상 r = ${r} 입니다!`;
  }

  [aIn, bIn, cIn, rIn, thIn, phIn, yawIn, pitchIn].forEach((s) => s.addEventListener("input", render));
  render();
}
