// 1-2 도입 훅: 타원 당구 게임
// 타원 당구대의 한 초점 F'에서 공을 친다. 벽에 한 번 튕긴 공은... 항상 반대 초점 F로!
// 어느 방향으로 쳐도 들어가는 신기함 → "왜?"가 오늘 수업의 문이 된다.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const SCALE = 60;

const A = 4.6, B = 3.0; // 타원 반지름 (a > b)
const C = Math.sqrt(A * A - B * B); // 초점 거리

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

  const aLabel = document.createElement("label");
  aLabel.textContent = "치는 방향 ";
  const aInput = document.createElement("input");
  aInput.type = "range";
  aInput.min = "0";
  aInput.max = "360";
  aInput.step = "1";
  aInput.value = "40";
  const aVal = document.createElement("span");
  aLabel.appendChild(aInput);
  aLabel.appendChild(aVal);

  const shootBtn = document.createElement("button");
  shootBtn.className = "btn";
  shootBtn.textContent = "치기! 🎱";

  controls.appendChild(aLabel);
  controls.appendChild(shootBtn);

  const status = document.createElement("div");
  status.className = "hook-status";
  status.textContent = "왼쪽 점(F′)에서 공을 칩니다. 어느 방향이든 좋아요 — 오른쪽 구멍(F)에 넣어 보세요!";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  const usedAngles = [];
  let cleared = false;
  let anim = null; // {seg1, seg2, t, total1, total2}
  let rafId = null;

  // F'에서 각도 θ로 나간 직선이 타원과 만나는 점
  function hitPoint(theta) {
    const ox = -C, oy = 0;
    const dx = Math.cos(theta), dy = Math.sin(theta);
    // ((ox+t·dx)/A)² + ((oy+t·dy)/B)² = 1 을 t에 대해 풀기
    const qa = (dx * dx) / (A * A) + (dy * dy) / (B * B);
    const qb = 2 * ((ox * dx) / (A * A) + (oy * dy) / (B * B));
    const qc = (ox * ox) / (A * A) + (oy * oy) / (B * B) - 1;
    const disc = qb * qb - 4 * qa * qc;
    const t = (-qb + Math.sqrt(disc)) / (2 * qa);
    return { x: ox + t * dx, y: oy + t * dy };
  }

  function draw(progress) {
    svg.innerHTML = "";

    // 당구대 (타원)
    svg.appendChild(el("ellipse", {
      cx: CX, cy: CY, rx: A * SCALE, ry: B * SCALE,
      fill: "#1f4030", stroke: "#f5d76e", "stroke-width": 3,
    }));

    // 지난 경로들 (흐리게)
    usedAngles.forEach((th) => {
      const P = hitPoint(th);
      svg.appendChild(el("path", {
        d: `M ${sx(-C)} ${sy(0)} L ${sx(P.x)} ${sy(P.y)} L ${sx(C)} ${sy(0)}`,
        fill: "none", stroke: "#f2efe6", "stroke-width": 1, opacity: 0.3, "stroke-dasharray": "4 4",
      }));
    });

    // 구멍 F (목표)
    svg.appendChild(el("circle", { cx: sx(C), cy: sy(0), r: 11, fill: "#12241b", stroke: "#e8927c", "stroke-width": 2 }));
    const fLab = el("text", { x: sx(C) - 8, y: sy(0) + 28, "font-size": 12, fill: "#e8927c" });
    fLab.textContent = "F";
    svg.appendChild(fLab);

    // 출발점 F'
    svg.appendChild(el("circle", { cx: sx(-C), cy: sy(0), r: 5, fill: "#f2efe6" }));
    const fpLab = el("text", { x: sx(-C) - 10, y: sy(0) + 28, "font-size": 12, fill: "#f2efe6" });
    fpLab.textContent = "F′";
    svg.appendChild(fpLab);

    // 조준선
    if (!anim) {
      const th = (parseFloat(aInput.value) * Math.PI) / 180;
      svg.appendChild(el("line", {
        x1: sx(-C), y1: sy(0),
        x2: sx(-C + Math.cos(th) * 1.2), y2: sy(Math.sin(th) * 1.2),
        stroke: "#f5d76e", "stroke-width": 1.5, "stroke-dasharray": "3 4",
      }));
    }

    // 진행 중인 공
    if (anim) {
      const { P } = anim;
      const d1 = Math.hypot(P.x + C, P.y);
      const d2 = Math.hypot(P.x - C, P.y);
      const total = d1 + d2;
      const s = progress * total;
      let bx, by;
      if (s <= d1) {
        const r = s / d1;
        bx = -C + (P.x + C) * r;
        by = P.y * r;
      } else {
        const r = (s - d1) / d2;
        bx = P.x + (C - P.x) * r;
        by = P.y * (1 - r);
      }
      // 지나온 경로
      svg.appendChild(el("path", {
        d: s <= d1
          ? `M ${sx(-C)} ${sy(0)} L ${sx(bx)} ${sy(by)}`
          : `M ${sx(-C)} ${sy(0)} L ${sx(P.x)} ${sy(P.y)} L ${sx(bx)} ${sy(by)}`,
        fill: "none", stroke: "#f5d76e", "stroke-width": 2,
      }));
      svg.appendChild(el("circle", { cx: sx(bx), cy: sy(by), r: 8, fill: "#f2efe6" }));
    }
  }

  function animate() {
    const start = performance.now();
    const DUR = 1400;
    function frame(t) {
      const progress = Math.min((t - start) / DUR, 1);
      draw(progress);
      if (progress < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        const th = anim.theta;
        usedAngles.push(th);
        anim = null;
        const distinct = new Set(usedAngles.map((x) => Math.round((x * 180) / Math.PI / 25))).size;
        if (usedAngles.length >= 2 && distinct >= 2 && !cleared) {
          cleared = true;
          status.textContent = "🎱 또 들어갔다!! 방향이 완전히 달랐는데도... 대체 왜 어느 방향으로 쳐도 들어갈까요?";
          setTimeout(() => { if (typeof onCleared === "function") onCleared(); }, 600);
        } else {
          status.textContent = `골인! (${usedAngles.length}번째) 이번엔 완전히 다른 방향으로 쳐 보세요. 그래도 들어갈까요?`;
        }
        draw(0);
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  shootBtn.addEventListener("click", () => {
    if (anim) return;
    const theta = (parseFloat(aInput.value) * Math.PI) / 180;
    anim = { theta, P: hitPoint(theta) };
    animate();
  });

  aInput.addEventListener("input", () => {
    aVal.textContent = `${aInput.value}°`;
    if (!anim) draw(0);
  });

  aVal.textContent = `${aInput.value}°`;
  draw(0);

  return () => cancelAnimationFrame(rafId);
}
