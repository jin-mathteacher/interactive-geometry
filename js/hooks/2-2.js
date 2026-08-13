// 2-2 도입 훅: 드론 택배 게임 — 벡터의 성분으로 드론 조종하기
// 격자 도시 위에서 이동 벡터의 x성분·y성분을 조절해 목표 건물에 정확히 착륙시키면 성공.
// x성분(주황 가로 화살표) + y성분(초록 세로 화살표) = 합성 벡터(노랑 대각선)를 시각화한다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 440;
const CELL = 44;           // 격자 한 칸의 픽셀 크기
const OX = W / 2;          // 원점(출발 지점)의 화면 x
const OY = H / 2 + 40;     // 원점(출발 지점)의 화면 y

function sx(x) { return OX + x * CELL; }
function sy(y) { return OY - y * CELL; }

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 화살표(선분 + 삼각형 머리) 그리기
function arrow(svg, x1, y1, x2, y2, color, width, dash) {
  if (Math.abs(x1 - x2) < 0.5 && Math.abs(y1 - y2) < 0.5) return;
  const attrs = { x1, y1, x2, y2, stroke: color, "stroke-width": width };
  if (dash) attrs["stroke-dasharray"] = dash;
  svg.appendChild(el("line", attrs));
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const s = 9;
  const p1 = `${x2},${y2}`;
  const p2 = `${x2 - s * Math.cos(ang - 0.45)},${y2 - s * Math.sin(ang - 0.45)}`;
  const p3 = `${x2 - s * Math.cos(ang + 0.45)},${y2 - s * Math.sin(ang + 0.45)}`;
  svg.appendChild(el("polygon", { points: `${p1} ${p2} ${p3}`, fill: color }));
}

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "hook-controls";

  const xLabel = document.createElement("label");
  xLabel.textContent = "x성분 (가로) ";
  const xInput = document.createElement("input");
  xInput.type = "range";
  xInput.min = "-6";
  xInput.max = "6";
  xInput.step = "1";
  xInput.value = "2";
  const xVal = document.createElement("span");
  xLabel.appendChild(xInput);
  xLabel.appendChild(xVal);

  const yLabel = document.createElement("label");
  yLabel.textContent = "y성분 (세로) ";
  const yInput = document.createElement("input");
  yInput.type = "range";
  yInput.min = "-3";
  yInput.max = "3";
  yInput.step = "1";
  yInput.value = "1";
  const yVal = document.createElement("span");
  yLabel.appendChild(yInput);
  yLabel.appendChild(yVal);

  const moveBtn = document.createElement("button");
  moveBtn.type = "button";
  moveBtn.textContent = "이동!";

  controls.appendChild(xLabel);
  controls.appendChild(yLabel);
  controls.appendChild(moveBtn);

  const status = document.createElement("div");
  status.className = "hook-status";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  // 게임 상태
  let drone = { x: 0, y: 0 };       // 드론의 현재 격자 좌표
  let cleared = false;
  let animating = false;

  // 목표 건물: 원점이 아닌 랜덤 격자점
  function randomTarget() {
    let tx = 0, ty = 0;
    while (tx === 0 && ty === 0) {
      tx = Math.floor(Math.random() * 13) - 6;   // -6 ~ 6
      ty = Math.floor(Math.random() * 7) - 3;    // -3 ~ 3
    }
    return { x: tx, y: ty };
  }
  const target = randomTarget();

  // 장식용 건물들 (목표·원점과 겹치지 않게)
  const buildings = [];
  for (let i = 0; i < 10; i++) {
    const bx = Math.floor(Math.random() * 13) - 6;
    const by = Math.floor(Math.random() * 7) - 3;
    if ((bx === 0 && by === 0) || (bx === target.x && by === target.y)) continue;
    if (buildings.some((b) => b.x === bx && b.y === by)) continue;
    buildings.push({ x: bx, y: by, h: 10 + Math.random() * 16 });
  }

  // pos: 드론을 그릴 위치(애니메이션 중에는 실수 좌표)
  function render(pos) {
    svg.innerHTML = "";
    const vx = parseInt(xInput.value, 10);
    const vy = parseInt(yInput.value, 10);
    xVal.textContent = " " + vx;
    yVal.textContent = " " + vy;

    // 배경 (밤의 격자 도시)
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // 격자
    for (let gx = -8; gx <= 8; gx++) {
      svg.appendChild(el("line", { x1: sx(gx), y1: 0, x2: sx(gx), y2: H, stroke: "#f2efe633", "stroke-width": gx === 0 ? 1.5 : 0.5 }));
    }
    for (let gy = -4; gy <= 4; gy++) {
      svg.appendChild(el("line", { x1: 0, y1: sy(gy), x2: W, y2: sy(gy), stroke: "#f2efe633", "stroke-width": gy === 0 ? 1.5 : 0.5 }));
    }

    // 장식 건물
    buildings.forEach((b) => {
      svg.appendChild(el("rect", {
        x: sx(b.x) - 9, y: sy(b.y) - b.h, width: 18, height: b.h,
        fill: "none", stroke: "#c3cfc2", "stroke-width": 1, rx: 2,
      }));
    });

    // 출발 지점 (원점)
    svg.appendChild(el("circle", { cx: sx(0), cy: sy(0), r: 5, fill: "#c3cfc2" }));
    const homeText = el("text", { x: sx(0) + 8, y: sy(0) + 18, fill: "#c3cfc2", "font-size": 12 });
    homeText.textContent = "출발(0, 0)";
    svg.appendChild(homeText);

    // 목표 건물 (헬리패드 표시)
    svg.appendChild(el("rect", {
      x: sx(target.x) - 14, y: sy(target.y) - 26, width: 28, height: 26,
      fill: "#1b2a24", stroke: "#f5d76e", "stroke-width": 2, rx: 3,
    }));
    const hText = el("text", { x: sx(target.x), y: sy(target.y) - 8, fill: "#f5d76e", "font-size": 13, "text-anchor": "middle", "font-weight": "bold" });
    hText.textContent = "H";
    svg.appendChild(hText);
    const tText = el("text", { x: sx(target.x), y: sy(target.y) + 16, fill: "#f5d76e", "font-size": 12, "text-anchor": "middle" });
    tText.textContent = `목표(${target.x}, ${target.y})`;
    svg.appendChild(tText);

    // 예정 경로: 드론 현재 위치 기준 성분 화살표 + 합성 벡터
    const px = sx(drone.x), py = sy(drone.y);
    const ex = sx(drone.x + vx), ey = sy(drone.y + vy);
    // x성분 (주황 가로)
    arrow(svg, px, py, sx(drone.x + vx), py, "#e8927c", 2);
    // y성분 (초록 세로, x성분 끝에서 출발)
    arrow(svg, sx(drone.x + vx), py, ex, ey, "#8fd6a8", 2);
    // 합성 벡터 (노랑 대각선)
    arrow(svg, px, py, ex, ey, "#f5d76e", 2.5);

    // 드론 본체
    const dx = sx(pos.x), dy = sy(pos.y);
    svg.appendChild(el("line", { x1: dx - 10, y1: dy - 6, x2: dx + 10, y2: dy - 6, stroke: "#f2efe6", "stroke-width": 2 }));
    svg.appendChild(el("circle", { cx: dx - 10, cy: dy - 6, r: 4, fill: "none", stroke: "#f2efe6", "stroke-width": 1.5 }));
    svg.appendChild(el("circle", { cx: dx + 10, cy: dy - 6, r: 4, fill: "none", stroke: "#f2efe6", "stroke-width": 1.5 }));
    svg.appendChild(el("rect", { x: dx - 5, y: dy - 6, width: 10, height: 9, fill: "#f2efe6", rx: 2 }));
  }

  function updateStatus() {
    const vx = parseInt(xInput.value, 10);
    const vy = parseInt(yInput.value, 10);
    if (cleared) return;
    const needX = target.x - drone.x;
    const needY = target.y - drone.y;
    status.textContent = `드론 위치 (${drone.x}, ${drone.y}) · 이동 벡터 (${vx}, ${vy}) 준비 중 — 목표까지 남은 이동은 (${needX}, ${needY})만큼입니다.`;
  }

  // "이동!" 버튼: 드론이 합성 벡터를 따라 미끄러지듯 이동
  function move() {
    if (animating || cleared) return;
    const vx = parseInt(xInput.value, 10);
    const vy = parseInt(yInput.value, 10);
    if (vx === 0 && vy === 0) {
      status.textContent = "이동 벡터가 (0, 0)이면 드론이 제자리에 떠 있어요. 성분을 조절해 보세요!";
      return;
    }
    animating = true;
    const from = { x: drone.x, y: drone.y };
    const to = { x: drone.x + vx, y: drone.y + vy };
    const start = performance.now();
    const dur = 700;

    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - (1 - t) * (1 - t); // ease-out
      render({ x: from.x + (to.x - from.x) * ease, y: from.y + (to.y - from.y) * ease });
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        drone = to;
        animating = false;
        render(drone);
        if (drone.x === target.x && drone.y === target.y) {
          status.textContent = "🚁 정확히 착륙! (가로, 세로) 두 숫자만으로 드론을 조종했습니다!";
          if (!cleared) {
            cleared = true;
            setTimeout(() => {
              if (typeof onCleared === "function") onCleared();
            }, 600);
          }
        } else {
          const needX = target.x - drone.x;
          const needY = target.y - drone.y;
          status.textContent = `아직 목표가 아니에요. 지금 위치 (${drone.x}, ${drone.y}) → 목표까지 (${needX}, ${needY})만큼 더 이동하면 됩니다!`;
        }
      }
    }
    requestAnimationFrame(step);
  }

  xInput.addEventListener("input", () => { render(drone); updateStatus(); });
  yInput.addEventListener("input", () => { render(drone); updateStatus(); });
  moveBtn.addEventListener("click", move);

  render(drone);
  status.textContent = `택배 드론을 목표 건물 (${target.x}, ${target.y})의 H 패드에 착륙시키세요! x성분·y성분을 정하고 "이동!"을 누르면 됩니다.`;
}
