// 3-1 도입 훅: 꼬인 위치를 찾아라!
// 정육면체 ABCD-EFGH(위 ABCD, 아래 EFGH)를 회전 슬라이더로 돌려 보며,
// 노랑으로 강조된 모서리 AB와 '꼬인 위치'에 있는 모서리 4개(CG, DH, HE, FG)를 모두 찾으면 성공.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 720;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const SCALE = 95;

// 정점 좌표 (x: 오른쪽, y: 위, z: 안쪽) — 위 면 ABCD, 아래 면 EFGH
const VERTS = {
  A: [-1, 1, -1], B: [1, 1, -1], C: [1, 1, 1], D: [-1, 1, 1],
  E: [-1, -1, -1], F: [1, -1, -1], G: [1, -1, 1], H: [-1, -1, 1],
};

const EDGES = [
  "AB", "BC", "CD", "DA",
  "EF", "FG", "GH", "HE",
  "AE", "BF", "CG", "DH",
];

// 기준 모서리 AB에 대한 분류
const BASE = "AB";
const SKEW = ["CG", "DH", "HE", "FG"]; // 꼬인 위치
const PARALLEL = ["CD", "EF", "GH"];    // 평행
// 나머지(DA, BC, AE, BF)는 한 점에서 만남

// 버튼으로 제시할 보기 8개 (꼬인 위치 4 + 평행 2 + 만남 2)
const CHOICES = ["CG", "DH", "HE", "FG", "EF", "GH", "BC", "AE"];

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// yaw(세로축 회전) → pitch(가로축 회전) 순서로 회전한 뒤 평행투영
function project(v, yaw, pitch) {
  const [x, y, z] = v;
  const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = x * cy_ + z * sy_;
  const z1 = -x * sy_ + z * cy_;
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  return { X: CX + x1 * SCALE, Y: CY - y2 * SCALE, depth: z2 };
}

// 만나는 모서리의 공유 꼭짓점 찾기 (오답 안내용)
function sharedVertex(e1, e2) {
  for (const c of e1) if (e2.includes(c)) return c;
  return null;
}

export function mount(container, onCleared) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  // 회전 슬라이더
  const controls = document.createElement("div");
  controls.className = "hook-controls";

  const yawLabel = document.createElement("label");
  yawLabel.textContent = "좌우 회전 ";
  const yawInput = document.createElement("input");
  yawInput.type = "range";
  yawInput.min = "-90";
  yawInput.max = "90";
  yawInput.step = "1";
  yawInput.value = "28";
  yawLabel.appendChild(yawInput);

  const pitchLabel = document.createElement("label");
  pitchLabel.textContent = "상하 회전 ";
  const pitchInput = document.createElement("input");
  pitchInput.type = "range";
  pitchInput.min = "-60";
  pitchInput.max = "60";
  pitchInput.step = "1";
  pitchInput.value = "22";
  pitchLabel.appendChild(pitchInput);

  controls.appendChild(yawLabel);
  controls.appendChild(pitchLabel);

  // 모서리 선택 버튼
  const buttonBox = document.createElement("div");
  buttonBox.className = "hook-controls";
  const buttons = {};
  CHOICES.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "모서리 " + name;
    buttonBox.appendChild(btn);
    buttons[name] = btn;
  });

  const status = document.createElement("div");
  status.className = "hook-status";
  status.textContent = `노란 모서리 ${BASE}와 꼬인 위치에 있는 모서리 4개를 모두 골라 보세요. (회전시켜서 확인!)`;

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(buttonBox);
  wrap.appendChild(status);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  const found = new Set(); // 찾아낸 꼬인 위치 모서리
  let cleared = false;

  function render() {
    svg.innerHTML = "";
    const yaw = (parseFloat(yawInput.value) * Math.PI) / 180;
    const pitch = (parseFloat(pitchInput.value) * Math.PI) / 180;

    // 배경
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    const P = {};
    Object.entries(VERTS).forEach(([name, v]) => { P[name] = project(v, yaw, pitch); });

    // 모서리 그리기 — 뒤쪽(depth 큰 쪽)은 점선·흐리게
    EDGES.forEach((e) => {
      const p1 = P[e[0]], p2 = P[e[1]];
      const isBack = (p1.depth + p2.depth) / 2 > 0.15;
      let stroke = isBack ? "#f2efe633" : "#c3cfc2";
      let width = 2;
      if (e === BASE) { stroke = "#f5d76e"; width = 4; }
      else if (found.has(e)) { stroke = "#8fd6a8"; width = 3.5; }
      const attrs = {
        x1: p1.X, y1: p1.Y, x2: p2.X, y2: p2.Y,
        stroke, "stroke-width": width, "stroke-linecap": "round",
      };
      if (isBack && e !== BASE && !found.has(e)) attrs["stroke-dasharray"] = "6 5";
      svg.appendChild(el("line", attrs));
    });

    // 꼭짓점 라벨
    Object.entries(P).forEach(([name, p]) => {
      svg.appendChild(el("circle", { cx: p.X, cy: p.Y, r: 3, fill: "#f2efe6" }));
      const t = el("text", {
        x: p.X + (p.X < CX ? -18 : 8),
        y: p.Y + (p.Y < CY ? -8 : 18),
        fill: "#f2efe6", "font-size": 15,
      });
      t.textContent = name;
      svg.appendChild(t);
    });
  }

  function updateButtons() {
    CHOICES.forEach((name) => {
      const btn = buttons[name];
      if (found.has(name)) {
        btn.disabled = true;
        btn.style.background = "#8fd6a8";
        btn.style.color = "#1b2a24";
      }
    });
  }

  function handlePick(name) {
    if (cleared) return;
    if (SKEW.includes(name)) {
      found.add(name);
      updateButtons();
      render();
      if (found.size === SKEW.length) {
        status.textContent = `✨ 완벽! ${SKEW.join(", ")} — 네 모서리 모두 ${BASE}와 만나지도, 평행하지도 않습니다. 이것이 '꼬인 위치'!`;
        cleared = true;
        setTimeout(() => {
          if (typeof onCleared === "function") onCleared();
        }, 600);
      } else {
        status.textContent = `⭕ 맞아요! ${name}은(는) ${BASE}와 꼬인 위치입니다. (${found.size}/${SKEW.length} 발견 — 남은 것도 찾아보세요!)`;
      }
    } else if (PARALLEL.includes(name)) {
      status.textContent = `❌ ${name}은(는) ${BASE}와 평행합니다. 방향이 같아서 한 평면에 함께 담을 수 있어요. 만나지도 평행하지도 않는 모서리를 찾으세요!`;
    } else {
      const v = sharedVertex(BASE, name);
      status.textContent = `❌ ${name}은(는) ${BASE}와 점 ${v}에서 만납니다. 회전시켜서 정말 만나지 않는 모서리를 찾아보세요!`;
    }
  }

  CHOICES.forEach((name) => {
    buttons[name].addEventListener("click", () => handlePick(name));
  });
  yawInput.addEventListener("input", render);
  pitchInput.addEventListener("input", render);
  render();
}
