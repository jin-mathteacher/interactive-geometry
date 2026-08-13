// 3-1 탐구 1: 정육면체 탐험 — 모서리 AB와의 세 가지 위치 관계
// yaw/pitch 슬라이더로 정육면체를 회전(평행투영)하고,
// 드롭다운으로 '평행 / 수직으로 만남 / 꼬인 위치'를 고르면 해당 모서리가 색으로 강조됨.

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 640;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const SCALE = 90;

// 정점 좌표 — 위 면 ABCD, 아래 면 EFGH
const VERTS = {
  A: [-1, 1, -1], B: [1, 1, -1], C: [1, 1, 1], D: [-1, 1, 1],
  E: [-1, -1, -1], F: [1, -1, -1], G: [1, -1, 1], H: [-1, -1, 1],
};

const EDGES = [
  "AB", "BC", "CD", "DA",
  "EF", "FG", "GH", "HE",
  "AE", "BF", "CG", "DH",
];

const BASE = "AB"; // 기준 모서리 (노랑)

// 기준 모서리 AB에 대한 관계별 모서리와 강조색
const RELATIONS = {
  parallel: {
    edges: ["CD", "EF", "GH"],
    color: "#8fd6a8",
    label: "평행한 모서리",
    desc: "평행(초록): CD, EF, GH — 방향이 같아 아무리 연장해도 만나지 않고, AB와 한 평면에 함께 담을 수 있습니다.",
  },
  meet: {
    edges: ["DA", "BC", "AE", "BF"],
    color: "#e8927c",
    label: "수직으로 만나는 모서리",
    desc: "만남(주황): DA, BC, AE, BF — 각각 점 A 또는 B에서 AB와 만나며, 정육면체이므로 모두 수직으로 만납니다.",
  },
  skew: {
    edges: ["CG", "DH", "HE", "FG"],
    color: "#e8927c",
    label: "꼬인 위치의 모서리",
    desc: "꼬인 위치: CG, DH, HE, FG — 만나지도 않고 평행하지도 않아 AB와 한 평면에 담을 수 없습니다. 3차원 공간에서만 존재하는 관계!",
  },
};

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// yaw → pitch 회전 후 평행투영
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

export function mount(container) {
  container.innerHTML = "";
  container.classList.add("mounted");

  const wrap = document.createElement("div");

  const controls = document.createElement("div");
  controls.className = "sim-controls";

  const yawLabel = document.createElement("label");
  yawLabel.textContent = "좌우 회전(yaw): ";
  const yawInput = document.createElement("input");
  yawInput.type = "range";
  yawInput.min = "-90";
  yawInput.max = "90";
  yawInput.step = "1";
  yawInput.value = "28";
  yawLabel.appendChild(yawInput);

  const pitchLabel = document.createElement("label");
  pitchLabel.textContent = "상하 회전(pitch): ";
  const pitchInput = document.createElement("input");
  pitchInput.type = "range";
  pitchInput.min = "-60";
  pitchInput.max = "60";
  pitchInput.step = "1";
  pitchInput.value = "22";
  pitchLabel.appendChild(pitchInput);

  const selLabel = document.createElement("label");
  selLabel.textContent = "AB와의 관계: ";
  const select = document.createElement("select");
  [
    { value: "none", text: "선택하세요" },
    { value: "parallel", text: "평행한 모서리" },
    { value: "meet", text: "수직으로 만나는 모서리" },
    { value: "skew", text: "꼬인 위치의 모서리" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.text;
    select.appendChild(o);
  });
  selLabel.appendChild(select);

  controls.appendChild(yawLabel);
  controls.appendChild(pitchLabel);
  controls.appendChild(selLabel);

  const info = document.createElement("div");
  info.className = "sim-info";
  info.textContent = "기준 모서리 AB(노랑)를 두고, 드롭다운에서 관계를 골라 강조된 모서리를 관찰하세요. 회전시키면 꼬인 위치가 왜 '만나 보이기만' 하는지 알 수 있습니다.";

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}` });

  wrap.appendChild(controls);
  wrap.appendChild(info);
  wrap.appendChild(svg);
  container.appendChild(wrap);

  function render() {
    svg.innerHTML = "";
    const yaw = (parseFloat(yawInput.value) * Math.PI) / 180;
    const pitch = (parseFloat(pitchInput.value) * Math.PI) / 180;
    const rel = select.value;
    const relation = RELATIONS[rel] || null;

    // 배경
    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "#1b2a24", rx: 8 }));

    const P = {};
    Object.entries(VERTS).forEach(([name, v]) => { P[name] = project(v, yaw, pitch); });

    // 모서리 — 뒤쪽은 점선·흐리게, 기준은 노랑, 관계 모서리는 강조색
    EDGES.forEach((e) => {
      const p1 = P[e[0]], p2 = P[e[1]];
      const isBack = (p1.depth + p2.depth) / 2 > 0.15;
      let stroke = isBack ? "#f2efe633" : "#c3cfc2";
      let width = 1.8;
      let highlighted = false;
      if (e === BASE) { stroke = "#f5d76e"; width = 4; highlighted = true; }
      else if (relation && relation.edges.includes(e)) {
        stroke = relation.color; width = 3.5; highlighted = true;
      }
      const attrs = {
        x1: p1.X, y1: p1.Y, x2: p2.X, y2: p2.Y,
        stroke, "stroke-width": width, "stroke-linecap": "round",
      };
      if (isBack && !highlighted) attrs["stroke-dasharray"] = "6 5";
      if (isBack && highlighted) attrs["stroke-dasharray"] = "10 4"; // 강조 모서리도 뒤에 있으면 긴 점선
      svg.appendChild(el("line", attrs));
    });

    // 꼭짓점 라벨
    Object.entries(P).forEach(([name, p]) => {
      svg.appendChild(el("circle", { cx: p.X, cy: p.Y, r: 2.8, fill: "#f2efe6" }));
      const t = el("text", {
        x: p.X + (p.X < CX ? -17 : 7),
        y: p.Y + (p.Y < CY ? -7 : 17),
        fill: "#f2efe6", "font-size": 14,
      });
      t.textContent = name;
      svg.appendChild(t);
    });

    if (relation) {
      info.textContent = relation.desc;
    }
  }

  yawInput.addEventListener("input", render);
  pitchInput.addEventListener("input", render);
  select.addEventListener("change", render);
  render();
}
