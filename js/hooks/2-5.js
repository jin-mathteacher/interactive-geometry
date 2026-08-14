// 2-5 도입 훅: 썰매 끌기 대작전!
// 끄는 힘의 크기는 100으로 고정, 학생은 각도 θ만 조절한다.
// 썰매는 '수평 성분 100·cosθ'에 비례해 전진 — 각도가 크면 헛심(위로 드는 힘)이 된다.
// 3번의 기회 안에 결승선 통과 시 클리어. 힘·거리·cosθ의 곱 = 내적의 씨앗.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;
const GROUND_Y = 300;
const START_X = 60;
const FINISH_X = 560; // 결승선 (이동 거리 500 필요)
const MAX_PULL = 190; // θ = 0°일 때 1회 전진 픽셀 (190×3 = 570 > 500)

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

  const aLabel = document.createElement("label");
  aLabel.textContent = "끄는 각도 θ ";
  const aInput = document.createElement("input");
  aInput.type = "range";
  aInput.min = "0";
  aInput.max = "85";
  aInput.step = "1";
  aInput.value = "45";
  const aVal = document.createElement("span");
  aLabel.appendChild(aInput);
  aLabel.appendChild(aVal);

  const pullBtn = document.createElement("button");
  pullBtn.className = "btn";
  pullBtn.textContent = "끌기! 🛷";

  controls.appendChild(aLabel);
  controls.appendChild(pullBtn);

  const status = document.createElement("div");
  status.className = "hook-status";
  status.textContent = "힘은 100으로 고정! 각도만 골라 3번 안에 썰매를 결승선까지 끌고 가세요. 어떤 각도가 가장 '알찬' 힘일까요?";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  let sledX = START_X;
  let pulls = 0;
  let cleared = false;
  let anim = null;
  let rafId = null;

  function drawArrow(x, y, dx, dy, color, width, dashed) {
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const x2 = x + dx, y2 = y + dy;
    const ux = dx / len, uy = dy / len;
    const hs = 8;
    const attrs = { x1: x, y1: y, x2, y2, stroke: color, "stroke-width": width };
    if (dashed) attrs["stroke-dasharray"] = "5 4";
    svg.appendChild(el("line", attrs));
    svg.appendChild(el("path", {
      d: `M ${x2} ${y2} L ${x2 - hs * ux + hs * 0.6 * uy} ${y2 - hs * uy - hs * 0.6 * ux} L ${x2 - hs * ux - hs * 0.6 * uy} ${y2 - hs * uy + hs * 0.6 * ux} Z`,
      fill: color,
    }));
  }

  function draw(x) {
    svg.innerHTML = "";
    // 하늘과 눈밭
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24" }));
    svg.appendChild(el("rect", { x: 0, y: GROUND_Y, width: W, height: H - GROUND_Y, fill: "#f2efe6", opacity: 0.15 }));
    svg.appendChild(el("line", { x1: 0, y1: GROUND_Y, x2: W, y2: GROUND_Y, stroke: "#f2efe6", "stroke-width": 2 }));

    // 결승선
    svg.appendChild(el("line", { x1: FINISH_X, y1: GROUND_Y - 90, x2: FINISH_X, y2: GROUND_Y, stroke: "#e8927c", "stroke-width": 3, "stroke-dasharray": "8 6" }));
    const flag = el("text", { x: FINISH_X - 6, y: GROUND_Y - 98, "font-size": 20 });
    flag.textContent = "🏁";
    svg.appendChild(flag);

    // 썰매
    const sled = el("text", { x: x - 16, y: GROUND_Y - 6, "font-size": 28 });
    sled.textContent = "🛷";
    svg.appendChild(sled);

    // 힘 벡터 분해 표시
    const th = (parseFloat(aInput.value) * Math.PI) / 180;
    const scale = 1.1; // 힘 100 → 110px
    const fx = 100 * Math.cos(th) * scale;
    const fy = 100 * Math.sin(th) * scale;
    const ox = x + 14, oy = GROUND_Y - 18;
    // 수평 성분 (초록)
    drawArrow(ox, oy, fx, 0, "#8fd6a8", 3, false);
    // 수직 성분 (주황 점선) — 수평 성분 끝에서 위로
    drawArrow(ox + fx, oy, 0, -fy, "#e8927c", 2, true);
    // 힘 벡터 (노랑)
    drawArrow(ox, oy, fx, -fy, "#f5d76e", 3.5, false);

    const fLab = el("text", { x: ox + fx * 0.55 + 6, y: oy - fy * 0.55 - 8, "font-size": 12, fill: "#f5d76e" });
    fLab.textContent = "힘 100";
    svg.appendChild(fLab);
    const hLab = el("text", { x: ox + fx * 0.35, y: oy + 18, "font-size": 12, fill: "#8fd6a8" });
    hLab.textContent = `전진 성분 ${(100 * Math.cos(th)).toFixed(0)}`;
    svg.appendChild(hLab);
    if (fy > 8) {
      const vLab = el("text", { x: ox + fx + 8, y: oy - fy * 0.5, "font-size": 12, fill: "#e8927c" });
      vLab.textContent = `헛심(들어 올림) ${(100 * Math.sin(th)).toFixed(0)}`;
      svg.appendChild(vLab);
    }

    // 남은 기회
    const info = el("text", { x: 20, y: 30, "font-size": 14, fill: "#c3cfc2" });
    info.textContent = `남은 기회: ${3 - pulls}번`;
    svg.appendChild(info);
  }

  function pull() {
    if (anim || cleared) return;
    if (pulls >= 3) return;
    const th = (parseFloat(aInput.value) * Math.PI) / 180;
    const advance = MAX_PULL * Math.cos(th);
    const from = sledX;
    const to = sledX + advance;
    pulls += 1;
    const start = performance.now();
    const DUR = 800;
    anim = true;
    function frame(t) {
      const p = Math.min((t - start) / DUR, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      draw(from + (to - from) * ease);
      if (p < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        sledX = to;
        anim = null;
        judge(th);
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  function judge(th) {
    const deg = Math.round((th * 180) / Math.PI);
    if (sledX >= FINISH_X) {
      if (!cleared) {
        cleared = true;
        status.textContent = "🎉 결승선 통과!! 같은 힘 100인데, 각도를 낮출수록 훨씬 멀리 갔죠? 썰매를 움직인 건 '나란한 성분'뿐이었습니다!";
        draw(sledX);
        setTimeout(() => { if (typeof onCleared === "function") onCleared(); }, 600);
      }
      return;
    }
    if (pulls >= 3) {
      status.textContent = `아쉽다! 3번을 다 썼는데 결승선에 못 닿았어요. 처음부터 다시 — 이번엔 각도를 더 낮춰서 '전진 성분'을 키워 보세요!`;
      sledX = START_X;
      pulls = 0;
      setTimeout(() => draw(sledX), 1200);
      draw(sledX);
      return;
    }
    status.textContent = deg >= 50
      ? `θ = ${deg}°... 힘의 대부분이 썰매를 '들어 올리는' 헛심이 됐어요! 전진 성분은 ${(100 * Math.cos(th)).toFixed(0)}뿐. (${pulls}번 사용)`
      : `θ = ${deg}°로 전진 성분 ${(100 * Math.cos(th)).toFixed(0)}만큼 전진! (${pulls}번 사용) 계속 가 봅시다.`;
    draw(sledX);
  }

  pullBtn.addEventListener("click", pull);
  aInput.addEventListener("input", () => {
    aVal.textContent = ` θ = ${aInput.value}°`;
    if (!anim) draw(sledX);
  });

  aVal.textContent = ` θ = ${aInput.value}°`;
  draw(sledX);

  return () => cancelAnimationFrame(rafId);
}
