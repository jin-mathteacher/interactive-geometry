// 3-2 도입 훅: 우주 정거장 도킹 게임
// 3차원 공간의 격자점 (a, b, c)에 떠 있는 정거장에 우주선을 x, y, z 슬라이더로 이동시켜 도킹.
// 남은 거리 √((x−a)²+(y−b)²+(z−c)²)를 거리 게이지로 표시 — 이것이 공간에서 두 점 사이의 거리.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 440;
const CX = W / 2;
const CY = H / 2 + 20;
const SCALE = 34;
const RANGE = 5; // 좌표 범위 −5 ~ 5

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 3D → 2D 평행투영: yaw(z축 둘레 회전) 후 pitch(기울여 내려다보기)
function makeProjector(yawDeg, pitchDeg) {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return function project(x, y, z) {
    const xr = x * cy - y * sy;      // 회전된 가로 성분
    const yr = x * sy + y * cy;      // 회전된 깊이 성분
    return {
      X: CX + xr * SCALE,
      Y: CY - (z * cp + yr * sp) * SCALE,
      depth: yr * cp - z * sp,       // 깊이(멀수록 큼) — 크기 조절용
    };
  };
}

function randCoord() {
  // −4 ~ 4의 0이 아닌 정수 위주로 목표 좌표 생성
  const v = Math.floor(Math.random() * 9) - 4;
  return v === 0 ? (Math.random() < 0.5 ? -2 : 2) : v;
}

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  // 목표 정거장 좌표 (격자점)
  const target = { a: randCoord(), b: randCoord(), c: randCoord() };

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "hook-controls";

  function makeSlider(text, min, max, step, value) {
    const label = document.createElement("label");
    label.textContent = text;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    const val = document.createElement("span");
    label.appendChild(input);
    label.appendChild(val);
    controls.appendChild(label);
    return { input, val };
  }

  const xS = makeSlider("우주선 x ", -RANGE, RANGE, 1, 0);
  const yS = makeSlider("우주선 y ", -RANGE, RANGE, 1, 0);
  const zS = makeSlider("우주선 z ", -RANGE, RANGE, 1, 0);
  const yawS = makeSlider("시점 회전 ", -90, 90, 1, -30);
  const pitchS = makeSlider("시점 기울기 ", 5, 80, 1, 28);

  const status = document.createElement("div");
  status.className = "hook-status";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  let cleared = false;

  function render() {
    svg.innerHTML = "";
    const x = parseFloat(xS.input.value);
    const y = parseFloat(yS.input.value);
    const z = parseFloat(zS.input.value);
    xS.val.textContent = " " + x;
    yS.val.textContent = " " + y;
    zS.val.textContent = " " + z;
    yawS.val.textContent = " " + yawS.input.value + "°";
    pitchS.val.textContent = " " + pitchS.input.value + "°";

    const P = makeProjector(parseFloat(yawS.input.value), parseFloat(pitchS.input.value));

    // 배경
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // xy평면 격자 (흐린선)
    for (let i = -RANGE; i <= RANGE; i += 1) {
      const g1a = P(i, -RANGE, 0), g1b = P(i, RANGE, 0);
      const g2a = P(-RANGE, i, 0), g2b = P(RANGE, i, 0);
      svg.appendChild(el("line", { x1: g1a.X, y1: g1a.Y, x2: g1b.X, y2: g1b.Y, stroke: "#f2efe633", "stroke-width": i === 0 ? 0 : 0.6 }));
      svg.appendChild(el("line", { x1: g2a.X, y1: g2a.Y, x2: g2b.X, y2: g2b.Y, stroke: "#f2efe633", "stroke-width": i === 0 ? 0 : 0.6 }));
    }

    // 좌표축: x 주황, y 초록, z 노랑
    const axes = [
      { to: [RANGE + 1, 0, 0], color: "#e8927c", name: "x" },
      { to: [0, RANGE + 1, 0], color: "#8fd6a8", name: "y" },
      { to: [0, 0, RANGE + 1], color: "#f5d76e", name: "z" },
    ];
    axes.forEach((ax) => {
      const o = P(0, 0, 0);
      const t = P(ax.to[0], ax.to[1], ax.to[2]);
      svg.appendChild(el("line", { x1: o.X, y1: o.Y, x2: t.X, y2: t.Y, stroke: ax.color, "stroke-width": 1.6 }));
      const label = el("text", { x: t.X + 6, y: t.Y + 4, fill: ax.color, "font-size": 14 });
      label.textContent = ax.name;
      svg.appendChild(label);
    });

    // 정거장 (목표) — 그림자 안내선 + 본체
    const st = P(target.a, target.b, target.c);
    const stFoot = P(target.a, target.b, 0);
    svg.appendChild(el("line", { x1: st.X, y1: st.Y, x2: stFoot.X, y2: stFoot.Y, stroke: "#f5d76e", "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.5 }));
    svg.appendChild(el("rect", { x: st.X - 9, y: st.Y - 9, width: 18, height: 18, fill: "none", stroke: "#f5d76e", "stroke-width": 2, transform: `rotate(45 ${st.X} ${st.Y})` }));
    svg.appendChild(el("circle", { cx: st.X, cy: st.Y, r: 3.5, fill: "#f5d76e" }));
    const stLabel = el("text", { x: st.X + 14, y: st.Y - 10, fill: "#f5d76e", "font-size": 13 });
    stLabel.textContent = `정거장 (${target.a}, ${target.b}, ${target.c})`;
    svg.appendChild(stLabel);

    // 우주선 — 그림자 안내선 + 본체
    const sh = P(x, y, z);
    const shFoot = P(x, y, 0);
    svg.appendChild(el("line", { x1: sh.X, y1: sh.Y, x2: shFoot.X, y2: shFoot.Y, stroke: "#e8927c", "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.5 }));

    // 남은 거리
    const dist = Math.sqrt((x - target.a) ** 2 + (y - target.b) ** 2 + (z - target.c) ** 2);
    const docked = dist < 1e-9;
    const shipColor = docked ? "#8fd6a8" : "#e8927c";

    // 우주선(삼각형)과 정거장을 잇는 점선
    svg.appendChild(el("line", { x1: sh.X, y1: sh.Y, x2: st.X, y2: st.Y, stroke: "#c3cfc2", "stroke-width": 1, "stroke-dasharray": "5 5", opacity: 0.7 }));
    svg.appendChild(el("polygon", {
      points: `${sh.X},${sh.Y - 10} ${sh.X - 8},${sh.Y + 7} ${sh.X + 8},${sh.Y + 7}`,
      fill: shipColor,
    }));
    const shLabel = el("text", { x: sh.X + 12, y: sh.Y + 18, fill: shipColor, "font-size": 13 });
    shLabel.textContent = `우주선 (${x}, ${y}, ${z})`;
    svg.appendChild(shLabel);

    // 거리 게이지 (상단)
    const maxDist = Math.sqrt(3) * 2 * RANGE;
    const gaugeW = 260;
    const ratio = Math.min(dist / maxDist, 1);
    const gaugeColor = docked ? "#8fd6a8" : dist < 3 ? "#8fd6a8" : dist < 7 ? "#f5d76e" : "#e8927c";
    svg.appendChild(el("rect", { x: 20, y: 16, width: gaugeW, height: 12, rx: 6, fill: "none", stroke: "#c3cfc2", "stroke-width": 1 }));
    svg.appendChild(el("rect", { x: 20, y: 16, width: Math.max(gaugeW * ratio, docked ? 0 : 4), height: 12, rx: 6, fill: gaugeColor, opacity: 0.85 }));
    const gaugeText = el("text", { x: 20 + gaugeW + 12, y: 26, fill: gaugeColor, "font-size": 13 });
    gaugeText.textContent = `남은 거리 = √(${(x - target.a) ** 2}+${(y - target.b) ** 2}+${(z - target.c) ** 2}) = ${dist.toFixed(2)}`;
    svg.appendChild(gaugeText);

    // 상태 메시지 및 성공 판정
    if (docked) {
      status.textContent = "✨ 도킹 성공! 세 숫자 (x, y, z)가 정확히 일치했습니다!";
      if (!cleared) {
        cleared = true;
        setTimeout(() => {
          if (typeof onCleared === "function") onCleared();
        }, 600);
      }
    } else if (dist < 2.5) {
      status.textContent = `거의 다 왔어요! 남은 거리 ${dist.toFixed(2)} — 어떤 슬라이더가 아직 안 맞았는지 좌표를 비교해 보세요.`;
    } else {
      status.textContent = `정거장 좌표 (${target.a}, ${target.b}, ${target.c})를 향해 이동하세요. 남은 거리 ${dist.toFixed(2)} — 시점을 돌려 보면 위치가 더 잘 보여요.`;
    }
  }

  [xS, yS, zS, yawS, pitchS].forEach((s) => s.input.addEventListener("input", render));
  render();
}
