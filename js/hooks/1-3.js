// 1-3 도입 훅: 비밀 신호 기지를 찾아라! (거리 차로 곡선 발견하기)
// 두 관측소 A, B가 같은 신호를 받았는데 도착 시간 차이가 일정하다.
// "거리 차가 4인 지점"을 여러 개 찾다 보면... 점들이 곡선을 이룬다!

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const SCALE = 55;

const C = 2.5;      // 관측소 A(-c, 0), B(c, 0)
const TARGET = 3;   // 목표 거리 차 (= 2a)

function sx(x) { return CX + x * SCALE; }
function sy(y) { return CY - y * SCALE; }

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

  const xLabel = document.createElement("label");
  xLabel.textContent = "탐색 지점 ← → ";
  const xInput = document.createElement("input");
  xInput.type = "range";
  xInput.min = "-5.5";
  xInput.max = "5.5";
  xInput.step = "0.05";
  xInput.value = "3";
  xLabel.appendChild(xInput);

  const yLabel = document.createElement("label");
  yLabel.textContent = "탐색 지점 ↑ ↓ ";
  const yInput = document.createElement("input");
  yInput.type = "range";
  yInput.min = "-3.2";
  yInput.max = "3.2";
  yInput.step = "0.05";
  yInput.value = "1";
  yLabel.appendChild(yInput);

  const markBtn = document.createElement("button");
  markBtn.className = "btn";
  markBtn.textContent = "여기다! 📍";

  controls.appendChild(xLabel);
  controls.appendChild(yLabel);
  controls.appendChild(markBtn);

  const status = document.createElement("div");
  status.className = "hook-status";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  const found = []; // 찾아낸 지점들
  let cleared = false;

  function diffAt(x, y) {
    const dA = Math.hypot(x + C, y);
    const dB = Math.hypot(x - C, y);
    return Math.abs(dA - dB);
  }

  function render() {
    svg.innerHTML = "";
    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);

    // 배경 바다
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#16281f", rx: 8 }));

    // 성공 후: 진짜 쌍곡선 공개
    if (cleared) {
      const a = TARGET / 2;
      const b = Math.sqrt(C * C - a * a);
      [1, -1].forEach((sign) => {
        let d = "";
        for (let u = -1.9; u <= 1.9; u += 0.05) {
          const hx = sign * a * Math.cosh(u);
          const hy = b * Math.sinh(u);
          d += (u <= -1.89 ? "M" : "L") + sx(hx) + " " + sy(hy) + " ";
        }
        svg.appendChild(el("path", { d, fill: "none", stroke: "#f5d76e", "stroke-width": 2, opacity: 0.9 }));
      });
    }

    // 관측소 A, B
    [{ x: -C, name: "관측소 A" }, { x: C, name: "관측소 B" }].forEach(({ x: ox, name }) => {
      svg.appendChild(el("circle", { cx: sx(ox), cy: sy(0), r: 7, fill: "#e8927c" }));
      svg.appendChild(el("path", {
        d: `M ${sx(ox) - 5} ${sy(0) - 8} L ${sx(ox)} ${sy(0) - 18} L ${sx(ox) + 5} ${sy(0) - 8}`,
        fill: "none", stroke: "#e8927c", "stroke-width": 1.5,
      }));
      const lab = el("text", { x: sx(ox) - 24, y: sy(0) + 24, "font-size": 12, fill: "#e8927c" });
      lab.textContent = name;
      svg.appendChild(lab);
    });

    // 이미 찾은 지점들
    found.forEach((pt) => {
      svg.appendChild(el("circle", { cx: sx(pt.x), cy: sy(pt.y), r: 5, fill: "#8fd6a8" }));
    });

    // 현재 탐색 지점
    const dA = Math.hypot(x + C, y);
    const dB = Math.hypot(x - C, y);
    svg.appendChild(el("line", { x1: sx(x), y1: sy(y), x2: sx(-C), y2: sy(0), stroke: "#f2efe655", "stroke-width": 1, "stroke-dasharray": "4 4" }));
    svg.appendChild(el("line", { x1: sx(x), y1: sy(y), x2: sx(C), y2: sy(0), stroke: "#f2efe655", "stroke-width": 1, "stroke-dasharray": "4 4" }));
    svg.appendChild(el("circle", { cx: sx(x), cy: sy(y), r: 6, fill: "none", stroke: "#f2efe6", "stroke-width": 2 }));
    svg.appendChild(el("circle", { cx: sx(x), cy: sy(y), r: 1.5, fill: "#f2efe6" }));

    const diff = Math.abs(dA - dB);
    const gap = Math.abs(diff - TARGET);
    if (!cleared) {
      status.textContent =
        `A까지 ${dA.toFixed(2)}, B까지 ${dB.toFixed(2)} → 거리 차 = ${diff.toFixed(2)} ` +
        (gap < 0.1 ? "✨ 딱 3.00! 지금 '여기다!'를 누르세요!" : `(목표: 3.00 — ${gap < 0.4 ? "거의 다 왔어요!" : "신호 차가 3.00이 되는 곳을 찾으세요"}) · 찾은 곳 ${found.length}/4`);
    }
  }

  markBtn.addEventListener("click", () => {
    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);
    const diff = diffAt(x, y);
    if (Math.abs(diff - TARGET) < 0.12) {
      // 이미 찾은 곳과 너무 가까우면 다른 곳을 찾게 유도
      const tooClose = found.some((pt) => Math.hypot(pt.x - x, pt.y - y) < 0.7);
      if (tooClose) {
        status.textContent = "여긴 이미 표시했어요! 조금 떨어진 곳에서 또 거리 차 3.00을 찾아보세요.";
        return;
      }
      found.push({ x, y });
      if (found.length >= 4 && !cleared) {
        cleared = true;
        status.textContent = "📡 찾은 점 4개를 이어 보니... 곡선이다! 거리 차가 일정한 점들은 '쌍곡선'을 이룹니다.";
        render();
        setTimeout(() => { if (typeof onCleared === "function") onCleared(); }, 600);
        return;
      }
      status.textContent = `📍 포착! (${found.length}/4) — 거리 차 3.00인 곳이 여기뿐일까요? 다른 곳도 찾아보세요.`;
      render();
    } else {
      status.textContent = `여기는 거리 차가 ${diff.toFixed(2)} — 3.00이 아니에요. 지점을 옮겨 보세요.`;
    }
  });

  xInput.addEventListener("input", render);
  yInput.addEventListener("input", render);
  render();
}
