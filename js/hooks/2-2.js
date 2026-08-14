// 2-1 도입 훅: 강 건너기 게임 (벡터 덧셈 체험)
// 강물은 오른쪽으로 흐른다(물살 벡터 c). 학생은 배의 방향(각도)과 속력을 조절한다.
// 배는 (배 벡터 + 물살 벡터) = 합성 벡터 방향으로 실제 이동한다.
// 건너편 선착장에 도착하면 성공 → onCleared 호출.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 400;

// 강 영역: 위쪽 둑(0~70), 강물(70~330), 아래쪽 둑(330~400)
const BANK_TOP = 70;
const BANK_BOTTOM = 330;
const START = { x: 140, y: BANK_BOTTOM };
const DOCK_X = 470;          // 선착장 중심 x좌표
const DOCK_TOL = 24;         // 도착 허용 오차(px)
const CURRENT = 1.5;         // 물살 속력(단위: 속도단위, 오른쪽 방향)
const VSCALE = 45;           // 속도 1단위 → 45px 화살표

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// 화살표(선분 + 화살촉) 그리기
function arrow(svg, x1, y1, x2, y2, color, width, dash) {
  const attrs = { x1, y1, x2, y2, stroke: color, "stroke-width": width || 2.5 };
  if (dash) attrs["stroke-dasharray"] = dash;
  svg.appendChild(el("line", attrs));
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const size = 9;
  const p1 = `${x2},${y2}`;
  const p2 = `${x2 - size * Math.cos(ang - 0.42)},${y2 - size * Math.sin(ang - 0.42)}`;
  const p3 = `${x2 - size * Math.cos(ang + 0.42)},${y2 - size * Math.sin(ang + 0.42)}`;
  svg.appendChild(el("polygon", { points: `${p1} ${p2} ${p3}`, fill: color }));
}

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "hook-controls";

  const angLabel = document.createElement("label");
  angLabel.textContent = "배의 방향(각도) ";
  const angInput = document.createElement("input");
  angInput.type = "range";
  angInput.min = "30";
  angInput.max = "150";
  angInput.step = "1";
  angInput.value = "90";
  const angVal = document.createElement("span");
  angLabel.appendChild(angInput);
  angLabel.appendChild(angVal);

  const spdLabel = document.createElement("label");
  spdLabel.textContent = "배의 속력 ";
  const spdInput = document.createElement("input");
  spdInput.type = "range";
  spdInput.min = "0.5";
  spdInput.max = "4";
  spdInput.step = "0.05";
  spdInput.value = "2";
  const spdVal = document.createElement("span");
  spdLabel.appendChild(spdInput);
  spdLabel.appendChild(spdVal);

  const launchBtn = document.createElement("button");
  launchBtn.type = "button";
  launchBtn.textContent = "🚤 발사!";

  controls.appendChild(angLabel);
  controls.appendChild(spdLabel);
  controls.appendChild(launchBtn);

  const status = document.createElement("div");
  status.className = "hook-status";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  let cleared = false;
  let animating = false;
  let boat = { x: START.x, y: START.y }; // 배의 현재 위치
  let animId = null;

  // 현재 슬라이더 값으로 속도 벡터들 계산
  function vectors() {
    const deg = parseFloat(angInput.value);
    const s = parseFloat(spdInput.value);
    const rad = (deg * Math.PI) / 180;
    // 화면 좌표는 y가 아래로 증가하므로, '위로 건너감'은 y 성분 음수
    const bx = s * Math.cos(rad);
    const by = -s * Math.sin(rad);
    return { bx, by, cx: CURRENT, cy: 0, rx: bx + CURRENT, ry: by, deg, s };
  }

  function render() {
    svg.innerHTML = "";
    const v = vectors();
    angVal.textContent = ` ${v.deg}°`;
    spdVal.textContent = ` ${v.s.toFixed(2)}`;

    // 배경(둑)
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));
    // 강물
    svg.appendChild(el("rect", { x: 0, y: BANK_TOP, width: W, height: BANK_BOTTOM - BANK_TOP, fill: "#22453e" }));
    // 둑 경계선
    svg.appendChild(el("line", { x1: 0, y1: BANK_TOP, x2: W, y2: BANK_TOP, stroke: "#f2efe633", "stroke-width": 2 }));
    svg.appendChild(el("line", { x1: 0, y1: BANK_BOTTOM, x2: W, y2: BANK_BOTTOM, stroke: "#f2efe633", "stroke-width": 2 }));

    // 물결 무늬(물살이 오른쪽으로 흐름을 표시)
    for (let row = 0; row < 4; row++) {
      const y = BANK_TOP + 40 + row * 60;
      for (let i = 0; i < 6; i++) {
        const x = 40 + i * 120 + (row % 2) * 60;
        arrow(svg, x, y, x + 34, y, "#f2efe633", 1.5);
      }
    }

    // 선착장(목표 지점)
    svg.appendChild(el("rect", { x: DOCK_X - 30, y: BANK_TOP - 14, width: 60, height: 14, fill: "#8fd6a8", rx: 3 }));
    const dockText = el("text", { x: DOCK_X, y: BANK_TOP - 22, fill: "#8fd6a8", "font-size": 14, "text-anchor": "middle" });
    dockText.textContent = "🚩 선착장";
    svg.appendChild(dockText);

    // 출발점 표시
    const startText = el("text", { x: START.x, y: BANK_BOTTOM + 24, fill: "#c3cfc2", "font-size": 13, "text-anchor": "middle" });
    startText.textContent = "출발점";
    svg.appendChild(startText);

    // 배 (현재 위치)
    svg.appendChild(el("circle", { cx: boat.x, cy: boat.y, r: 10, fill: "#f5d76e", stroke: "#1b2a24", "stroke-width": 2 }));

    // 벡터 화살표 3개 (배 위치 기준)
    const ox = boat.x, oy = boat.y;
    // 물살 벡터(주황)
    arrow(svg, ox, oy, ox + v.cx * VSCALE, oy + v.cy * VSCALE, "#e8927c", 2.5);
    // 배 벡터(노랑)
    arrow(svg, ox, oy, ox + v.bx * VSCALE, oy + v.by * VSCALE, "#f5d76e", 2.5);
    // 삼각형법 보조 점선: 배 벡터 끝에서 물살 벡터를 이어 붙임
    arrow(svg, ox + v.bx * VSCALE, oy + v.by * VSCALE, ox + v.rx * VSCALE, oy + v.ry * VSCALE, "#e8927c", 1.5, "5 4");
    // 합성 벡터(초록)
    arrow(svg, ox, oy, ox + v.rx * VSCALE, oy + v.ry * VSCALE, "#8fd6a8", 3);

    // 범례
    const legend = [
      ["물살", "#e8927c"],
      ["배의 힘", "#f5d76e"],
      ["실제 이동(합)", "#8fd6a8"],
    ];
    legend.forEach(([name, color], i) => {
      const y = 20 + i * 18;
      svg.appendChild(el("line", { x1: 16, y1: y, x2: 46, y2: y, stroke: color, "stroke-width": 3 }));
      const t = el("text", { x: 52, y: y + 4, fill: "#c3cfc2", "font-size": 12 });
      t.textContent = name;
      svg.appendChild(t);
    });
  }

  function resetBoat() {
    boat = { x: START.x, y: START.y };
    render();
  }

  function finish(landingX) {
    animating = false;
    launchBtn.disabled = false;
    if (Math.abs(landingX - DOCK_X) < DOCK_TOL) {
      status.textContent = "🎉 선착장에 정확히 도착! 두 벡터의 합 방향이 완벽했어요!";
      if (!cleared) {
        cleared = true;
        setTimeout(() => {
          if (typeof onCleared === "function") onCleared();
        }, 600);
      }
    } else {
      const diff = landingX - DOCK_X;
      status.textContent =
        diff > 0
          ? `앗, 선착장보다 ${Math.round(Math.abs(diff))}px 오른쪽에 닿았어요. 물살에 덜 밀리도록 각도를 왼쪽(상류)으로 틀거나 속력을 올려 보세요.`
          : `앗, 선착장보다 ${Math.round(Math.abs(diff))}px 왼쪽에 닿았어요. 각도를 오른쪽으로 틀거나 속력을 줄여 보세요.`;
      setTimeout(resetBoat, 900);
    }
  }

  function launch() {
    if (animating) return;
    animating = true;
    launchBtn.disabled = true;
    boat = { x: START.x, y: START.y };
    status.textContent = "🚤 출발! 합성 벡터 방향으로 이동 중...";

    const v = vectors();
    const speedPxPerFrame = 3.2; // 프레임당 이동 거리(px)
    const mag = Math.hypot(v.rx, v.ry);
    const ux = v.rx / mag;
    const uy = v.ry / mag;

    function step() {
      if (!svg.isConnected) return; // 컨테이너가 교체되면 애니메이션 중단
      boat.x += ux * speedPxPerFrame;
      boat.y += uy * speedPxPerFrame;

      // 건너편 둑 도착 판정
      if (boat.y <= BANK_TOP) {
        // 정확한 착지점을 선형 보간으로 계산
        const t = (BANK_TOP - START.y) / (v.ry * VSCALE); // 비율
        const landingX = START.x + v.rx * VSCALE * t;
        boat.y = BANK_TOP;
        boat.x = landingX;
        render();
        finish(landingX);
        return;
      }
      // 화면 밖으로 떠내려간 경우
      if (boat.x > W - 10 || boat.x < 10) {
        render();
        animating = false;
        launchBtn.disabled = false;
        status.textContent = "😱 물살에 떠밀려 화면 밖으로! 속력을 올리거나 각도를 상류 쪽으로 틀어 보세요.";
        setTimeout(resetBoat, 900);
        return;
      }
      render();
      animId = requestAnimationFrame(step);
    }
    animId = requestAnimationFrame(step);
  }

  angInput.addEventListener("input", () => { if (!animating) render(); });
  spdInput.addEventListener("input", () => { if (!animating) render(); });
  launchBtn.addEventListener("click", launch);

  status.textContent = "각도와 속력을 정한 뒤 '발사!'를 눌러 보세요. 초록 화살표가 실제 이동 방향입니다.";
  render();
}
