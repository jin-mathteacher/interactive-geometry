// 2-3 도입 훅: 로켓 부스터 조종!
// 추진 벡터 a의 방향은 고정 — 학생은 실수 k만 조절해 우주선을 ka만큼 이동시킨다.
// 양수 목표 1회 + 음수 목표 1회 도킹 성공 시 클리어. k < 0이면 반대로 간다는 것을 몸으로 체험.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;
const CX = W / 2;
const CY = H / 2;

// 추진 벡터 a (픽셀 단위, 오른쪽 위로 살짝)
const AX = 70;
const AY = -28;

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "hook-controls";

  const kLabel = document.createElement("label");
  kLabel.textContent = "실수 k ";
  const kInput = document.createElement("input");
  kInput.type = "range";
  kInput.min = "-3";
  kInput.max = "3";
  kInput.step = "0.1";
  kInput.value = "1";
  const kVal = document.createElement("span");
  kLabel.appendChild(kInput);
  kLabel.appendChild(kVal);

  const fireBtn = document.createElement("button");
  fireBtn.className = "btn";
  fireBtn.textContent = "분사! 🚀";

  controls.appendChild(kLabel);
  controls.appendChild(fireBtn);

  const status = document.createElement("div");
  status.className = "hook-status";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  // 라운드: 1라운드 목표 2.5a, 2라운드 목표 -1.5a
  const ROUNDS = [
    { target: 2.5, name: "정거장 α" },
    { target: -1.5, name: "정거장 β" },
  ];
  let round = 0;
  let shipM = 0; // 우주선의 현재 위치 = shipM · a
  let cleared = false;
  let anim = null; // { from, to }
  let rafId = null;

  function px(m) { return { x: CX - 100 + m * AX, y: CY + 40 + m * AY }; }

  function setStatus() {
    const r = ROUNDS[round];
    status.textContent =
      `${round + 1}라운드: ${r.name}에 도킹하세요! ` +
      (r.target < 0 ? "어라, 정거장이 추진 방향의 '반대쪽'에 있네요... k를 어떻게 해야 할까요?" : "k를 골라 '분사!'를 누르면 우주선이 ka만큼 이동합니다.");
  }

  function drawArrow(x, y, dx, dy, color, width) {
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const x2 = x + dx, y2 = y + dy;
    const ux = dx / len, uy = dy / len;
    const hs = 9;
    svg.appendChild(el("line", { x1: x, y1: y, x2, y2, stroke: color, "stroke-width": width }));
    svg.appendChild(el("path", {
      d: `M ${x2} ${y2} L ${x2 - hs * ux + hs * 0.6 * uy} ${y2 - hs * uy - hs * 0.6 * ux} L ${x2 - hs * ux - hs * 0.6 * uy} ${y2 - hs * uy + hs * 0.6 * ux} Z`,
      fill: color,
    }));
  }

  function draw(shipPos) {
    svg.innerHTML = "";
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24" }));

    // 별들 (고정 배경)
    for (let i = 0; i < 24; i++) {
      const sx = (i * 137 + 53) % W;
      const sy = (i * 211 + 31) % H;
      svg.appendChild(el("circle", { cx: sx, cy: sy, r: 1.2, fill: "#f2efe633" }));
    }

    // a 방향의 직선 (갈 수 있는 모든 곳 — 흐린 점선)
    const p1 = px(-3.4), p2 = px(4.4);
    svg.appendChild(el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#f2efe633", "stroke-width": 1.5, "stroke-dasharray": "5 6" }));

    // 목표 정거장
    const r = ROUNDS[round];
    const tp = px(r.target);
    svg.appendChild(el("circle", { cx: tp.x, cy: tp.y, r: 16, fill: "none", stroke: "#e8927c", "stroke-width": 2.5 }));
    const stLab = el("text", { x: tp.x - 14, y: tp.y - 24, "font-size": 18 });
    stLab.textContent = "🛰️";
    svg.appendChild(stLab);
    const nameLab = el("text", { x: tp.x - 26, y: tp.y + 34, "font-size": 12, fill: "#e8927c" });
    nameLab.textContent = r.name;
    svg.appendChild(nameLab);

    // 원점 표시와 추진 벡터 a (노랑)
    const o = px(0);
    svg.appendChild(el("circle", { cx: o.x, cy: o.y, r: 3, fill: "#c3cfc2" }));
    drawArrow(o.x, o.y, AX, AY, "#f5d76e", 3);
    const aLab = el("text", { x: o.x + AX * 0.5 + 8, y: o.y + AY * 0.5 + 16, "font-size": 13, fill: "#f5d76e" });
    aLab.textContent = "a (추진 벡터)";
    svg.appendChild(aLab);

    // 예상 이동 ka (조준선, 초록 점선)
    if (!anim && !cleared) {
      const k = parseFloat(kInput.value);
      const sp = px(shipM);
      drawArrow(sp.x, sp.y, k * AX, k * AY, "#8fd6a8", 2);
    }

    // 우주선
    const sp = px(shipPos);
    const ship = el("text", { x: sp.x - 12, y: sp.y + 8, "font-size": 24 });
    ship.textContent = "🚀";
    svg.appendChild(ship);
  }

  function animateTo(newM) {
    const from = shipM;
    const start = performance.now();
    const DUR = 900;
    anim = true;
    function frame(t) {
      const p = Math.min((t - start) / DUR, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      draw(from + (newM - from) * ease);
      if (p < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        shipM = newM;
        anim = null;
        checkDock();
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  function checkDock() {
    const r = ROUNDS[round];
    if (Math.abs(shipM - r.target) < 0.15) {
      if (round === 0) {
        round = 1;
        shipM = 0;
        status.textContent = `🎉 ${r.name} 도킹 성공! 이제 2라운드 — 우주선을 원점으로 되돌렸습니다. 이번 정거장은 반대쪽입니다!`;
        setTimeout(() => { setStatus(); draw(shipM); }, 1600);
        draw(shipM);
        return;
      }
      if (!cleared) {
        cleared = true;
        status.textContent = "🎉 도킹 성공!! 음수 k로 벡터를 '뒤집어서' 갔네요. 숫자 하나로 벡터를 자유자재로 조종했습니다!";
        draw(shipM);
        setTimeout(() => { if (typeof onCleared === "function") onCleared(); }, 600);
        return;
      }
    } else {
      status.textContent = shipM > r.target
        ? `아깝다! 정거장을 지나쳤어요 (현재 위치 = ${shipM.toFixed(1)}a). k를 조절해 다시 분사해 보세요.`
        : `아직 못 미쳤어요 (현재 위치 = ${shipM.toFixed(1)}a). k를 조절해 다시 분사해 보세요.`;
      draw(shipM);
    }
  }

  fireBtn.addEventListener("click", () => {
    if (anim || cleared) return;
    const k = parseFloat(kInput.value);
    animateTo(shipM + k);
  });

  kInput.addEventListener("input", () => {
    kVal.textContent = ` k = ${parseFloat(kInput.value).toFixed(1)}`;
    if (!anim) draw(shipM);
  });

  kVal.textContent = ` k = ${parseFloat(kInput.value).toFixed(1)}`;
  setStatus();
  draw(shipM);

  return () => cancelAnimationFrame(rafId);
}
