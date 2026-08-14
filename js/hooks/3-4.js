// 3-4 도입 훅: 행성 방어막을 펼쳐라! (구의 중심·반지름으로 위성 3개 감싸기)
// 3D 공간(yaw 회전 가능)에 아군 위성 3개가 격자점에 떠 있다.
// 방어막(구)의 중심 (x, y, z)와 반지름 r을 조절해 위성 3개를 모두 구 안에 넣되,
// 반지름은 제한값(필요 최소보다 약간 여유) 이하여야 성공.
// '중심에서 거리 r 이내'라는 조작이 그대로 구의 방정식임을 발견하게 한다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 440;
const CX = W / 2;
const CY = H / 2 + 30;
const SCALE = 40;

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

function dist3(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

// 위성 3개를 격자점에 랜덤 배치 (서로 거리 2 이상, 너무 멀지 않게)
function placeSatellites() {
  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  for (let attempt = 0; attempt < 200; attempt++) {
    const sats = [];
    while (sats.length < 3) {
      const cand = { x: randInt(-2, 2), y: randInt(1, 3), z: randInt(-2, 2) };
      if (sats.every((s) => dist3(s, cand) >= 2)) sats.push(cand);
    }
    const maxPair = Math.max(dist3(sats[0], sats[1]), dist3(sats[1], sats[2]), dist3(sats[0], sats[2]));
    if (maxPair <= 5.5) return sats;
  }
  // 만일을 위한 고정 배치
  return [{ x: -2, y: 1, z: 0 }, { x: 1, y: 3, z: 1 }, { x: 2, y: 1, z: -1 }];
}

// 반지름 제한값: '가장 먼 두 위성의 중점'에 중심을 두면 달성 가능한 반지름 + 여유
function computeLimit(sats) {
  let best = Infinity;
  const pairs = [[0, 1], [1, 2], [0, 2]];
  pairs.forEach(([i, j]) => {
    const mid = {
      x: (sats[i].x + sats[j].x) / 2,
      y: (sats[i].y + sats[j].y) / 2,
      z: (sats[i].z + sats[j].z) / 2,
    };
    const need = Math.max(dist3(mid, sats[0]), dist3(mid, sats[1]), dist3(mid, sats[2]));
    if (need < best) best = need;
  });
  // 0.1 단위로 올림 + 0.5 여유
  return Math.ceil((best + 0.5) * 10) / 10;
}

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const sats = placeSatellites();
  const R_LIMIT = computeLimit(sats);
  let cleared = false;

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
    label.appendChild(input);
    controls.appendChild(label);
    return input;
  }

  const cxInput = makeSlider("중심 x ", -3, 3, 0.1, 0);
  const cyInput = makeSlider("중심 y ", 0, 4, 0.1, 2);
  const czInput = makeSlider("중심 z ", -3, 3, 0.1, 0);
  const rInput = makeSlider("반지름 r ", 0.5, 6, 0.1, 1.5);
  const yawInput = makeSlider("시점 회전 ", -80, 80, 1, 25);

  const shieldBtn = document.createElement("button");
  shieldBtn.className = "btn";
  shieldBtn.textContent = "방어막 가동! 🛡️";
  controls.appendChild(shieldBtn);

  const status = document.createElement("div");
  status.className = "hook-status";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function currentCenter() {
    return {
      x: parseFloat(cxInput.value),
      y: parseFloat(cyInput.value),
      z: parseFloat(czInput.value),
    };
  }

  function render() {
    svg.innerHTML = "";
    const center = currentCenter();
    const r = parseFloat(rInput.value);
    const yaw = (parseFloat(yawInput.value) * Math.PI) / 180;
    const pitch = (24 * Math.PI) / 180;
    const project = makeProjector(yaw, pitch);

    // 배경 우주
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // 바닥 격자 (행성 표면, y = 0)
    for (let gx = -3; gx <= 3; gx++) {
      const a = project(gx, 0, -3);
      const b = project(gx, 0, 3);
      svg.appendChild(el("line", { x1: a.X, y1: a.Y, x2: b.X, y2: b.Y, stroke: "#f2efe633" }));
    }
    for (let gz = -3; gz <= 3; gz++) {
      const a = project(-3, 0, gz);
      const b = project(3, 0, gz);
      svg.appendChild(el("line", { x1: a.X, y1: a.Y, x2: b.X, y2: b.Y, stroke: "#f2efe633" }));
    }

    // 방어막(구): 평행투영에서 구는 반지름 r의 원으로 보인다
    const pC = project(center.x, center.y, center.z);
    svg.appendChild(el("circle", {
      cx: pC.X, cy: pC.Y, r: r * SCALE,
      fill: "#f5d76e", "fill-opacity": 0.06,
      stroke: "#f5d76e", "stroke-width": 2, "stroke-dasharray": cleared ? "none" : "7 5",
    }));
    // 구의 적도선(수평 단면 원) — 입체감
    let eq = "";
    for (let a = 0; a <= Math.PI * 2 + 1e-9; a += Math.PI / 36) {
      const p = project(center.x + r * Math.cos(a), center.y, center.z + r * Math.sin(a));
      eq += (a === 0 ? "M" : "L") + p.X + " " + p.Y + " ";
    }
    svg.appendChild(el("path", { d: eq, fill: "none", stroke: "#f5d76e", "stroke-width": 1, opacity: 0.45 }));

    // 중심 표시
    svg.appendChild(el("circle", { cx: pC.X, cy: pC.Y, r: 3.5, fill: "#f5d76e" }));
    const cLab = el("text", { x: pC.X + 8, y: pC.Y - 8, fill: "#f5d76e", "font-size": 12 });
    cLab.textContent = `중심 (${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)})`;
    svg.appendChild(cLab);

    // 위성 3개 + 중심까지의 거리
    const dists = sats.map((s) => dist3(center, s));
    sats.forEach((s, i) => {
      const p = project(s.x, s.y, s.z);
      const inside = dists[i] <= r;
      // 바닥으로 내리는 위치 안내선
      const foot = project(s.x, 0, s.z);
      svg.appendChild(el("line", { x1: p.X, y1: p.Y, x2: foot.X, y2: foot.Y, stroke: "#f2efe633", "stroke-dasharray": "3 4" }));
      // 위성 본체
      svg.appendChild(el("rect", {
        x: p.X - 6, y: p.Y - 6, width: 12, height: 12, rx: 2,
        fill: inside ? "#8fd6a8" : "#e8927c",
      }));
      svg.appendChild(el("line", { x1: p.X - 12, y1: p.Y, x2: p.X + 12, y2: p.Y, stroke: inside ? "#8fd6a8" : "#e8927c", "stroke-width": 2 }));
      const lab = el("text", { x: p.X + 14, y: p.Y - 8, fill: inside ? "#8fd6a8" : "#e8927c", "font-size": 12 });
      lab.textContent = `위성${i + 1} · 거리 ${dists[i].toFixed(2)}`;
      svg.appendChild(lab);
    });

    if (!cleared) {
      const insideCount = dists.filter((d) => d <= r).length;
      status.textContent =
        `보호 중인 위성 ${insideCount}/3 · 반지름 r = ${r.toFixed(1)} (에너지 제한: r ≤ ${R_LIMIT.toFixed(1)}) — ` +
        (insideCount < 3
          ? "중심을 옮기거나 r을 키워 셋을 모두 감싸세요."
          : r <= R_LIMIT
            ? "✨ 조건 충족! '방어막 가동!'을 누르세요!"
            : "셋 다 들어왔지만 r이 너무 큽니다. 중심을 잘 잡으면 더 작은 r로도 가능해요.");
    }
  }

  shieldBtn.addEventListener("click", () => {
    if (cleared) return;
    const center = currentCenter();
    const r = parseFloat(rInput.value);
    const dists = sats.map((s) => dist3(center, s));
    const allInside = dists.every((d) => d <= r);
    if (allInside && r <= R_LIMIT) {
      cleared = true;
      status.textContent =
        `🛡️ 방어막 가동 성공! 위성 3대 모두 '중심에서 거리 ${r.toFixed(1)} 이내' — 이 조건이 바로 구의 방정식입니다.`;
      render();
      setTimeout(() => { if (typeof onCleared === "function") onCleared(); }, 600);
    } else if (!allInside) {
      status.textContent = "⚡ 방어막 밖에 위성이 있습니다! 주황색 위성까지의 거리를 보며 중심과 r을 다시 조절하세요.";
    } else {
      status.textContent =
        `⚡ 에너지 초과! r = ${r.toFixed(1)} > 제한 ${R_LIMIT.toFixed(1)} — 위성들의 '한가운데'에 중심을 두면 r을 줄일 수 있습니다.`;
    }
  });

  [cxInput, cyInput, czInput, rInput, yawInput].forEach((input) => {
    input.addEventListener("input", render);
  });
  render();
}
