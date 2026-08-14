// 3-2 도입 훅: 그림자 저격수! (기울기 각으로 그림자 길이 맞추기)
// 태양이 머리 바로 위. 길이 6인 막대의 기울기 θ만 조절해
// 목표 그림자 길이(6·cosθ)를 오차 0.15 이내로 맞추면 명중.
// 2라운드 연속 성공 시 클리어 → 정사영 공식 L·cosθ의 발견으로 연결.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;
const GROUND_Y = 330;       // 땅의 화면 y좌표
const BASE_X = 200;         // 막대가 꽂힌 지점의 화면 x좌표
const SCALE = 52;           // 단위 길이 → 픽셀
const POLE_LEN = 6;         // 막대 길이
const TOLERANCE = 0.15;     // 허용 오차
const ROUNDS_TO_CLEAR = 2;  // 연속 성공 목표

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 2~5 사이 0.5 단위의 목표 그림자 길이 (직전 목표와 다르게)
function pickTarget(prev) {
  const candidates = [];
  for (let v = 2; v <= 5 + 1e-9; v += 0.5) {
    if (Math.abs(v - prev) > 0.01) candidates.push(v);
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "hook-controls";

  const angleLabel = document.createElement("label");
  angleLabel.textContent = "막대 기울기 θ ";
  const angleInput = document.createElement("input");
  angleInput.type = "range";
  angleInput.min = "0";
  angleInput.max = "90";
  angleInput.step = "1";
  angleInput.value = "30";
  const angleVal = document.createElement("span");
  angleLabel.appendChild(angleInput);
  angleLabel.appendChild(angleVal);

  const fireBtn = document.createElement("button");
  fireBtn.className = "btn";
  fireBtn.textContent = "확인! 🎯";

  controls.appendChild(angleLabel);
  controls.appendChild(fireBtn);

  const status = document.createElement("div");
  status.className = "hook-status";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  let target = pickTarget(-1); // 목표 그림자 길이
  let hits = 0;                // 성공 라운드 수
  let cleared = false;

  function shadowLen() {
    const theta = (parseFloat(angleInput.value) * Math.PI) / 180;
    return POLE_LEN * Math.cos(theta);
  }

  function render() {
    svg.innerHTML = "";
    const thetaDeg = parseFloat(angleInput.value);
    const theta = (thetaDeg * Math.PI) / 180;
    angleVal.textContent = ` ${thetaDeg}°`;

    // 배경 (밤이 아니라 한낮의 사막 느낌의 칠판)
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // 땅
    svg.appendChild(el("line", { x1: 30, y1: GROUND_Y, x2: W - 30, y2: GROUND_Y, stroke: "#c3cfc2", "stroke-width": 2 }));

    // 태양 (머리 바로 위)
    const sunX = BASE_X + (POLE_LEN * Math.cos(theta) * SCALE) / 2;
    svg.appendChild(el("circle", { cx: sunX, cy: 46, r: 18, fill: "#f5d76e" }));
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      svg.appendChild(el("line", {
        x1: sunX + Math.cos(a) * 24, y1: 46 + Math.sin(a) * 24,
        x2: sunX + Math.cos(a) * 32, y2: 46 + Math.sin(a) * 32,
        stroke: "#f5d76e", "stroke-width": 2,
      }));
    }

    // 막대: 밑동 (BASE_X, GROUND_Y), 끝 (BASE_X + Lcosθ, GROUND_Y - Lsinθ)
    const tipX = BASE_X + POLE_LEN * Math.cos(theta) * SCALE;
    const tipY = GROUND_Y - POLE_LEN * Math.sin(theta) * SCALE;

    // 수직 태양광선 (점선): 막대 위의 점들에서 땅으로 곧장
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      const px = BASE_X + (tipX - BASE_X) * t;
      const py = GROUND_Y + (tipY - GROUND_Y) * t;
      svg.appendChild(el("line", {
        x1: px, y1: 70, x2: px, y2: py,
        stroke: "#f5d76e", "stroke-width": 1, "stroke-dasharray": "3 5", opacity: 0.55,
      }));
      svg.appendChild(el("line", {
        x1: px, y1: py, x2: px, y2: GROUND_Y,
        stroke: "#c3cfc2", "stroke-width": 1, "stroke-dasharray": "3 5", opacity: 0.5,
      }));
    }

    // 목표 그림자 표시 (흐린 분필 눈금)
    const targetX = BASE_X + target * SCALE;
    svg.appendChild(el("line", { x1: targetX, y1: GROUND_Y - 12, x2: targetX, y2: GROUND_Y + 12, stroke: "#e8927c", "stroke-width": 2.5 }));
    const tLab = el("text", { x: targetX - 34, y: GROUND_Y + 30, fill: "#e8927c", "font-size": 13 });
    tLab.textContent = `목표 ${target.toFixed(2)}`;
    svg.appendChild(tLab);

    // 그림자 (초록 굵은 선)
    const shadow = shadowLen();
    svg.appendChild(el("line", {
      x1: BASE_X, y1: GROUND_Y, x2: BASE_X + shadow * SCALE, y2: GROUND_Y,
      stroke: "#8fd6a8", "stroke-width": 6, "stroke-linecap": "round", opacity: 0.9,
    }));

    // 막대 (노랑 굵은 선)
    svg.appendChild(el("line", {
      x1: BASE_X, y1: GROUND_Y, x2: tipX, y2: tipY,
      stroke: "#f5d76e", "stroke-width": 5, "stroke-linecap": "round",
    }));

    // 라벨
    const poleLab = el("text", { x: tipX + 10, y: tipY - 6, fill: "#f5d76e", "font-size": 13 });
    poleLab.textContent = `막대 (길이 ${POLE_LEN})`;
    svg.appendChild(poleLab);
    const shLab = el("text", { x: BASE_X + (shadow * SCALE) / 2 - 20, y: GROUND_Y + 48, fill: "#8fd6a8", "font-size": 13 });
    shLab.textContent = "그림자";
    svg.appendChild(shLab);

    if (!cleared) {
      status.textContent =
        `라운드 ${hits + 1}/${ROUNDS_TO_CLEAR} · 목표 그림자 길이 = ${target.toFixed(2)} — ` +
        `θ를 조절한 뒤 '확인!'을 누르세요. (성공 ${hits}/${ROUNDS_TO_CLEAR})`;
    }
  }

  fireBtn.addEventListener("click", () => {
    if (cleared) return;
    const shadow = shadowLen();
    const gap = Math.abs(shadow - target);
    if (gap <= TOLERANCE) {
      hits += 1;
      if (hits >= ROUNDS_TO_CLEAR) {
        cleared = true;
        status.textContent =
          `🎯 2연속 명중! 현재 그림자 = ${shadow.toFixed(2)} — 혹시 눈치챘나요? 그림자 = 6 × cosθ, 매번 공식이 정답이었습니다.`;
        render();
        setTimeout(() => { if (typeof onCleared === "function") onCleared(); }, 600);
        return;
      }
      target = pickTarget(target);
      status.textContent = `🎯 명중! (${hits}/${ROUNDS_TO_CLEAR}) 새 목표가 나왔습니다 — 한 번 더!`;
      render();
    } else {
      status.textContent =
        `아깝다! 현재 그림자 = ${shadow.toFixed(2)}, 목표 = ${target.toFixed(2)} (차이 ${gap.toFixed(2)}) — ` +
        (shadow > target ? "그림자가 너무 길어요. 막대를 더 세워 보세요." : "그림자가 너무 짧아요. 막대를 더 눕혀 보세요.");
    }
  });

  angleInput.addEventListener("input", render);
  render();
}
