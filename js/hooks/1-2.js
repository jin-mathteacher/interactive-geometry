// 1-2 도입 훅: 레이저로 곡선 스치기 (접선 만들기 게임)
// 포물선 y² = 4x (p=1)에 직선 y = mx + n이 '딱 한 점'에서 접하면 성공.
// 판별식: (mx+n)² = 4x → m²x² + (2mn−4)x + n² = 0, D = 16(1 − mn)
// → 접선 조건은 mn = 1

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;
const OX = 140;
const OY = H / 2;
const SCALE = 42;

function sx(x) { return OX + x * SCALE; }
function sy(y) { return OY - y * SCALE; }

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

  const mLabel = document.createElement("label");
  mLabel.textContent = "기울기 m ";
  const mInput = document.createElement("input");
  mInput.type = "range";
  mInput.min = "0.2";
  mInput.max = "2";
  mInput.step = "0.05";
  mInput.value = "1.5";
  const mVal = document.createElement("span");
  mLabel.appendChild(mInput);
  mLabel.appendChild(mVal);

  const nLabel = document.createElement("label");
  nLabel.textContent = "높이(y절편) n ";
  const nInput = document.createElement("input");
  nInput.type = "range";
  nInput.min = "0";
  nInput.max = "5";
  nInput.step = "0.05";
  nInput.value = "3";
  const nVal = document.createElement("span");
  nLabel.appendChild(nInput);
  nLabel.appendChild(nVal);

  controls.appendChild(mLabel);
  controls.appendChild(nLabel);

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
    const m = parseFloat(mInput.value);
    const n = parseFloat(nInput.value);
    mVal.textContent = m.toFixed(2);
    nVal.textContent = n.toFixed(2);

    // 배경
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    // 축
    svg.appendChild(el("line", { x1: 0, y1: OY, x2: W, y2: OY, stroke: "#f2efe622" }));
    svg.appendChild(el("line", { x1: OX, y1: 0, x2: OX, y2: H, stroke: "#f2efe622" }));

    // 포물선 y² = 4x (x = y²/4)
    let d = "";
    for (let y = -4.6; y <= 4.6; y += 0.1) {
      const x = (y * y) / 4;
      d += (y <= -4.59 ? "M" : "L") + sx(x) + " " + sy(y) + " ";
    }
    svg.appendChild(el("path", { d, fill: "none", stroke: "#f5d76e", "stroke-width": 2.5 }));

    // 레이저 직선 y = mx + n
    const x1 = -3.5, x2 = 13;
    svg.appendChild(
      el("line", {
        x1: sx(x1), y1: sy(m * x1 + n),
        x2: sx(x2), y2: sy(m * x2 + n),
        stroke: "#e8927c", "stroke-width": 2,
      })
    );

    // 교점 계산: m²x² + (2mn−4)x + n² = 0
    const A = m * m;
    const B = 2 * m * n - 4;
    const C = n * n;
    const D = B * B - 4 * A * C; // = 16(1 − mn)

    const points = [];
    if (D >= 0) {
      const r = Math.sqrt(D);
      [(-B + r) / (2 * A), (-B - r) / (2 * A)].forEach((x) => {
        if (x >= 0) points.push({ x, y: m * x + n });
      });
    }
    // D=0이면 중근 하나만
    const unique = [];
    points.forEach((pt) => {
      if (!unique.some((u) => Math.abs(u.x - pt.x) < 1e-6)) unique.push(pt);
    });

    unique.forEach((pt) => {
      svg.appendChild(el("circle", { cx: sx(pt.x), cy: sy(pt.y), r: 7, fill: "none", stroke: "#8fd6a8", "stroke-width": 2 }));
      svg.appendChild(el("circle", { cx: sx(pt.x), cy: sy(pt.y), r: 3, fill: "#8fd6a8" }));
    });

    // 접선 판정: mn = 1 (허용 오차)
    const closeness = Math.abs(1 - m * n);

    if (closeness < 0.025) {
      status.textContent = "✨ 딱 한 점에서 스쳤습니다! 완벽한 접선!";
      if (!cleared) {
        cleared = true;
        setTimeout(() => {
          if (typeof onCleared === "function") onCleared();
        }, 600);
      }
    } else if (unique.length >= 2) {
      status.textContent = `교점 ${unique.length}개 — 레이저가 곡선을 뚫고 지나갔어요. 조금 올리거나 눕혀 보세요. (힌트: 지금 m×n = ${(m * n).toFixed(2)}, 목표에 ${closeness < 0.2 ? "거의 다 왔어요!" : "가까워지면 알려줄게요"})`;
    } else if (unique.length === 1) {
      status.textContent = "교점 1개 — 하지만 이건 그냥 한 번 만난 것. 스치는 느낌이 나야 해요!";
    } else {
      status.textContent = `교점 0개 — 레이저가 곡선을 완전히 빗나갔어요. 조금 내려 보세요. (지금 m×n = ${(m * n).toFixed(2)})`;
    }
  }

  mInput.addEventListener("input", render);
  nInput.addEventListener("input", render);
  render();
}
