// 1-1 도입 훅: 농구 슛 게임
// 각도·세기를 조절해 공을 골대에 넣는다. 공의 자취(포물선)가 칠판에 남아
// "네가 방금 그린 곡선이 오늘 배울 포물선"이라는 메시지로 수업을 연다.

const W = 720;
const H = 400;
const GROUND_Y = H - 30;
const G = 320; // 중력 가속도 (px/s^2)

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  // 조작 패널
  const controls = document.createElement("div");
  controls.className = "hook-controls";

  const angleLabel = document.createElement("label");
  angleLabel.textContent = "각도 ";
  const angleInput = document.createElement("input");
  angleInput.type = "range";
  angleInput.min = "20";
  angleInput.max = "80";
  angleInput.value = "45";
  const angleVal = document.createElement("span");
  angleVal.textContent = "45°";
  angleLabel.appendChild(angleInput);
  angleLabel.appendChild(angleVal);

  const powerLabel = document.createElement("label");
  powerLabel.textContent = "세기 ";
  const powerInput = document.createElement("input");
  powerInput.type = "range";
  powerInput.min = "200";
  powerInput.max = "500";
  powerInput.value = "380";
  const powerVal = document.createElement("span");
  powerVal.textContent = "50%";
  powerLabel.appendChild(powerInput);
  powerLabel.appendChild(powerVal);

  const shootBtn = document.createElement("button");
  shootBtn.className = "btn";
  shootBtn.textContent = "슛! 🏀";

  controls.appendChild(angleLabel);
  controls.appendChild(powerLabel);
  controls.appendChild(shootBtn);

  const status = document.createElement("div");
  status.className = "hook-status";
  status.textContent = "던진 횟수 0 · 성공 0";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = "100%";
  canvas.style.borderRadius = "8px";
  const ctx = canvas.getContext("2d");

  wrap.appendChild(controls);
  wrap.appendChild(status);
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  // 게임 상태
  const startX = 70;
  const startY = GROUND_Y - 40;
  let hoopX = 520;
  const hoopY = 170;
  let trails = []; // 지난 자취들 (분필 자국)
  let ball = null; // {x, y, vx, vy, path:[]}
  let shots = 0;
  let hits = 0;
  let cleared = false;

  function randomizeHoop() {
    hoopX = 420 + Math.random() * 220;
  }

  function updateLabels() {
    angleVal.textContent = `${angleInput.value}°`;
    const pct = Math.round(((powerInput.value - 200) / 300) * 100);
    powerVal.textContent = `${pct}%`;
  }
  angleInput.addEventListener("input", updateLabels);
  powerInput.addEventListener("input", updateLabels);
  updateLabels();

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 칠판 배경
    ctx.fillStyle = "#1b2a24";
    ctx.fillRect(0, 0, W, H);

    // 바닥
    ctx.strokeStyle = "#f2efe655";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // 지난 자취 (흐린 분필 자국)
    trails.forEach((path, i) => {
      const isLast = i === trails.length - 1;
      ctx.strokeStyle = isLast ? "#f2efe6aa" : "#f2efe633";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      path.forEach((pt, j) => (j === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 발사대 (학생)
    ctx.fillStyle = "#f2efe6";
    ctx.beginPath();
    ctx.arc(startX, startY - 18, 8, 0, Math.PI * 2); // 머리
    ctx.fill();
    ctx.strokeStyle = "#f2efe6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY - 10);
    ctx.lineTo(startX, startY + 22); // 몸
    ctx.moveTo(startX, startY + 22);
    ctx.lineTo(startX - 10, GROUND_Y); // 다리
    ctx.moveTo(startX, startY + 22);
    ctx.lineTo(startX + 10, GROUND_Y);
    ctx.stroke();

    // 조준선 (발사 전 예상 방향)
    if (!ball) {
      const ang = (parseFloat(angleInput.value) * Math.PI) / 180;
      ctx.strokeStyle = "#f5d76e88";
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + Math.cos(ang) * 60, startY - Math.sin(ang) * 60);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 골대
    ctx.strokeStyle = "#e8927c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hoopX - 22, hoopY);
    ctx.lineTo(hoopX + 22, hoopY); // 림
    ctx.stroke();
    ctx.strokeStyle = "#e8927c88";
    ctx.lineWidth = 1.5;
    // 그물
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(hoopX + k * 10, hoopY);
      ctx.lineTo(hoopX + k * 6, hoopY + 26);
      ctx.stroke();
    }
    // 백보드 기둥
    ctx.strokeStyle = "#f2efe655";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hoopX + 30, hoopY - 24);
    ctx.lineTo(hoopX + 30, GROUND_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hoopX + 30, hoopY - 24);
    ctx.lineTo(hoopX + 30, hoopY + 4);
    ctx.stroke();

    // 공
    if (ball) {
      ctx.strokeStyle = "#f5d76e";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ball.path.forEach((pt, j) => (j === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#f5d76e";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
      ctx.fill();
      // 농구공 줄무늬
      ctx.strokeStyle = "#1b2a24";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 9, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
  }

  let rafId = null;
  let lastT = null;

  function step(t) {
    if (!lastT) lastT = t;
    const dt = Math.min((t - lastT) / 1000, 0.033);
    lastT = t;

    if (ball) {
      ball.vy += G * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.path.push({ x: ball.x, y: ball.y });

      // 골인 판정: 내려가는 중 림 통과
      if (ball.vy > 0 && ball.y >= hoopY - 4 && ball.y <= hoopY + 10 && Math.abs(ball.x - hoopX) < 20) {
        hits += 1;
        endShot(true);
      } else if (ball.y > GROUND_Y || ball.x > W + 20) {
        endShot(false);
      }
    }

    draw();
    rafId = requestAnimationFrame(step);
  }

  function endShot(success) {
    trails.push(ball.path);
    if (trails.length > 6) trails.shift();
    ball = null;
    status.textContent = `던진 횟수 ${shots} · 성공 ${hits}` + (success ? " — 🎉 골인!" : " — 아깝다!");

    if (success && !cleared) {
      cleared = true;
      randomizeHoop();
      setTimeout(() => {
        if (typeof onCleared === "function") onCleared();
      }, 600);
    } else if (success) {
      randomizeHoop();
    }
  }

  shootBtn.addEventListener("click", () => {
    if (ball) return;
    const ang = (parseFloat(angleInput.value) * Math.PI) / 180;
    const v = parseFloat(powerInput.value);
    shots += 1;
    ball = {
      x: startX,
      y: startY,
      vx: Math.cos(ang) * v,
      vy: -Math.sin(ang) * v,
      path: [{ x: startX, y: startY }],
    };
    status.textContent = `던진 횟수 ${shots} · 성공 ${hits}`;
  });

  rafId = requestAnimationFrame(step);

  return () => cancelAnimationFrame(rafId);
}
