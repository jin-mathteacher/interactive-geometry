// 2-1 도입 훅: 쌍둥이 벡터를 찾아라!
// 화면에 흩어진 화살표들 중에서 기준 벡터와 '크기·방향이 모두 같은' 쌍둥이 2개를 찾는다.
// 위치가 달라도 크기와 방향이 같으면 같은 벡터 — 오늘 수업의 문이 되는 발견.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 기준 벡터의 이동량 (픽셀): 오른쪽 80, 위로 50
const REF = { dx: 80, dy: -50 };

// 후보 화살표들 — 위치는 제각각, 정답은 2개(기준과 dx·dy가 완전히 같음)
const CANDIDATES = [
  { label: "가", x: 90, y: 300, dx: 80, dy: -50, twin: true, why: "" },
  { label: "나", x: 560, y: 120, dx: -80, dy: 50, twin: false, why: "크기는 같지만 방향이 정반대예요. 이건 기준 벡터의 -1배, 즉 반대 벡터입니다." },
  { label: "다", x: 250, y: 140, dx: 40, dy: -25, twin: false, why: "방향은 똑같은데 크기(길이)가 절반밖에 안 돼요. 방향만 같아서는 부족합니다." },
  { label: "라", x: 470, y: 330, dx: 80, dy: -50, twin: true, why: "" },
  { label: "마", x: 340, y: 250, dx: 50, dy: 80, twin: false, why: "크기(길이)는 기준과 같지만 방향이 달라요. 크기만 같아서는 부족합니다." },
  { label: "바", x: 600, y: 280, dx: 120, dy: -75, twin: false, why: "방향은 같지만 크기가 1.5배로 더 커요. 길이까지 정확히 같아야 쌍둥이!" },
  { label: "사", x: 160, y: 200, dx: 94, dy: 0, twin: false, why: "크기는 거의 같지만 방향이 수평이라 달라요. 기울기까지 봐야 합니다." },
];

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "hook-controls";

  const status = document.createElement("div");
  status.className = "hook-status";
  status.textContent = "노란 화살표가 기준 벡터! 위치는 달라도 좋으니, 크기와 방향이 모두 같은 쌍둥이 2개를 골라 보세요.";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  const found = new Set(); // 찾은 쌍둥이 label
  const tried = new Set(); // 이미 눌러 본 오답 label
  let cleared = false;

  // 후보마다 선택 버튼 생성
  const buttons = {};
  CANDIDATES.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = c.label;
    btn.addEventListener("click", () => pick(c, btn));
    buttons[c.label] = btn;
    controls.appendChild(btn);
  });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  // 화살표 그리기 (시점 x,y에서 dx,dy만큼)
  function drawArrow(x, y, dx, dy, color, width, label) {
    const x2 = x + dx;
    const y2 = y + dy;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    // 화살촉
    const hs = 10;
    const hx1 = x2 - hs * ux + hs * 0.6 * uy;
    const hy1 = y2 - hs * uy - hs * 0.6 * ux;
    const hx2 = x2 - hs * ux - hs * 0.6 * uy;
    const hy2 = y2 - hs * uy + hs * 0.6 * ux;

    svg.appendChild(el("line", { x1: x, y1: y, x2, y2, stroke: color, "stroke-width": width }));
    svg.appendChild(el("path", { d: `M ${x2} ${y2} L ${hx1} ${hy1} L ${hx2} ${hy2} Z`, fill: color }));

    if (label) {
      const t = el("text", { x: x - 6, y: y + 18, "font-size": 14, fill: color, "font-weight": "bold" });
      t.textContent = label;
      svg.appendChild(t);
    }
  }

  function draw() {
    svg.innerHTML = "";

    // 칠판 배경 느낌의 테두리
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", stroke: "#f2efe633", "stroke-width": 1 }));

    // 기준 벡터 (노랑)
    drawArrow(60, 100, REF.dx, REF.dy, "#f5d76e", 3.5, "기준");

    // 후보들
    CANDIDATES.forEach((c) => {
      let color = "#c3cfc2";
      let width = 2.5;
      if (found.has(c.label)) { color = "#8fd6a8"; width = 3.5; }
      else if (tried.has(c.label)) { color = "#e8927c"; width = 2; }
      drawArrow(c.x, c.y, c.dx, c.dy, color, width, c.label);
    });
  }

  function pick(c, btn) {
    if (cleared) return;
    if (c.twin) {
      if (found.has(c.label)) return;
      found.add(c.label);
      btn.disabled = true;
      if (found.size >= 2) {
        cleared = true;
        status.textContent = "🎉 쌍둥이를 모두 찾았습니다! 셋 다 화면의 전혀 다른 곳에 있는데... 왜 '같은 벡터'일까요?";
        draw();
        setTimeout(() => { if (typeof onCleared === "function") onCleared(); }, 600);
        return;
      }
      status.textContent = `✅ '${c.label}'는 쌍둥이 맞아요! 크기도 방향도 기준과 똑같습니다. 하나 더 남았어요.`;
    } else {
      tried.add(c.label);
      status.textContent = `❌ '${c.label}'는 아니에요. ${c.why}`;
    }
    draw();
  }

  draw();
}
