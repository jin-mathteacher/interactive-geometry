// 소단원 활동 페이지 공통 렌더러
// URL 예: lesson.html?u=1&l=1  (u=대단원 id, l=소단원 id)

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ---- 학습 진도 저장 (로그인 없이 localStorage에 기록) ----
function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("geoProgress") || "[]");
  } catch {
    return [];
  }
}

function markDone(tag) {
  const list = loadProgress();
  if (!list.includes(tag)) {
    list.push(tag);
    try {
      localStorage.setItem("geoProgress", JSON.stringify(list));
    } catch {
      /* 시크릿 모드 등 저장 불가 환경은 조용히 무시 */
    }
  }
}

/** 정답 비교: 공백/대소문자/전각-반각 차이를 무시하고 비교 */
function normalizeAnswer(str) {
  return String(str || "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

let progressPrefix = "";

function renderProblem(problem, index) {
  const card = document.createElement("div");
  card.className = "problem-card";

  const prompt = document.createElement("div");
  prompt.className = "prompt";
  prompt.textContent = `${index + 1}. ${problem.prompt}`;
  card.appendChild(prompt);

  const row = document.createElement("div");
  row.className = "answer-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "답을 입력하세요";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "확인";

  row.appendChild(input);
  row.appendChild(checkBtn);
  card.appendChild(row);

  const feedback = document.createElement("div");
  feedback.className = "feedback";
  card.appendChild(feedback);

  checkBtn.addEventListener("click", () => {
    // answer가 배열이면 어느 표기든 정답 처리 (예: "-3/2"와 "-1.5")
    const answers = Array.isArray(problem.answer) ? problem.answer : [problem.answer];
    const isCorrect = answers.some((a) => normalizeAnswer(input.value) === normalizeAnswer(a));
    feedback.className = `feedback ${isCorrect ? "correct" : "wrong"}`;
    feedback.textContent = isCorrect
      ? `정답입니다! ${problem.explanation || ""}`
      : "다시 한 번 생각해 보세요. 아래 힌트를 참고할 수 있어요.";
    if (isCorrect) markDone(`${progressPrefix}:p:${problem.id}`);
  });

  if (problem.hints && problem.hints.length) {
    const hintList = document.createElement("div");
    hintList.className = "hint-list";

    const hintBtn = document.createElement("button");
    hintBtn.className = "hint-btn";
    let revealed = 0;
    hintBtn.textContent = `힌트 보기 (${revealed}/${problem.hints.length})`;

    hintBtn.addEventListener("click", () => {
      if (revealed >= problem.hints.length) return;
      const item = document.createElement("div");
      item.className = "hint-item";
      item.textContent = `힌트 ${revealed + 1}. ${problem.hints[revealed]}`;
      hintList.appendChild(item);
      revealed += 1;
      hintBtn.textContent = `힌트 보기 (${revealed}/${problem.hints.length})`;
      if (revealed >= problem.hints.length) hintBtn.disabled = true;
    });

    card.appendChild(hintBtn);
    card.appendChild(hintList);
  }

  return card;
}

/**
 * 브릴리언트식 단계형 탐구 렌더러.
 * 한 번에 한 단계씩: 질문 → 선택 → 즉시 피드백 → 다음 단계.
 */
function renderSteps(steps) {
  const box = document.createElement("div");
  box.className = "steps-box";

  let current = 0;

  function showStep(idx) {
    box.innerHTML = "";
    const step = steps[idx];

    const progress = document.createElement("div");
    progress.className = "steps-progress";
    const label = document.createElement("span");
    label.textContent = `STEP ${idx + 1} / ${steps.length}`;
    const dots = document.createElement("div");
    dots.className = "steps-dots";
    steps.forEach((_, i) => {
      const dot = document.createElement("i");
      if (i < idx) dot.classList.add("done");
      if (i === idx) dot.classList.add("now");
      dots.appendChild(dot);
    });
    progress.appendChild(label);
    progress.appendChild(dots);
    box.appendChild(progress);

    const prompt = document.createElement("div");
    prompt.className = "steps-prompt";
    prompt.textContent = step.prompt;
    box.appendChild(prompt);

    const choiceGrid = document.createElement("div");
    choiceGrid.className = "steps-choices";

    const feedback = document.createElement("div");
    feedback.className = "steps-feedback";

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn";
    nextBtn.textContent = idx + 1 < steps.length ? "다음 단계 →" : "탐구 완료! 🎉";
    nextBtn.hidden = true;

    step.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "steps-choice";
      btn.textContent = choice.label;
      btn.addEventListener("click", () => {
        if (choice.correct) {
          choiceGrid.querySelectorAll("button").forEach((b) => (b.disabled = true));
          btn.classList.add("right");
          feedback.className = "steps-feedback show good";
          feedback.textContent = step.feedback || "정답입니다!";
          nextBtn.hidden = false;
        } else {
          btn.classList.add("miss");
          btn.disabled = true;
          feedback.className = "steps-feedback show bad";
          feedback.textContent = "음... 다시 한 번 생각해 볼까요?";
        }
      });
      choiceGrid.appendChild(btn);
    });

    box.appendChild(choiceGrid);
    box.appendChild(feedback);
    box.appendChild(nextBtn);

    nextBtn.addEventListener("click", () => {
      if (idx + 1 < steps.length) {
        showStep(idx + 1);
      } else {
        markDone(`${progressPrefix}:steps`);
        box.innerHTML = "";
        const doneMsg = document.createElement("div");
        doneMsg.className = "steps-feedback show good";
        doneMsg.textContent = "🎉 모든 단계를 통과했습니다!";
        const retry = document.createElement("button");
        retry.className = "hint-btn";
        retry.textContent = "처음부터 다시 하기";
        retry.addEventListener("click", () => showStep(0));
        box.appendChild(doneMsg);
        box.appendChild(retry);
      }
    });
  }

  showStep(current);
  return box;
}

async function initLessonPage() {
  const u = getQueryParam("u");
  const l = getQueryParam("l");
  progressPrefix = `${u}-${l}`;

  if (!u || !l) {
    document.querySelector("main.container").innerHTML =
      '<p>잘못된 접근입니다. <a href="index.html">홈으로 돌아가기</a></p>';
    return;
  }

  const [units, lesson] = await Promise.all([
    fetch("content/units.json").then((r) => r.json()),
    fetch(`content/lessons/${u}-${l}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const unit = units.units.find((x) => x.id === u);
  const lessonMeta = unit?.lessons.find((x) => x.id === l);

  document.title = `${lessonMeta ? lessonMeta.title : "소단원"} - 인터랙티브 기하`;

  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb && unit && lessonMeta) {
    breadcrumb.innerHTML = `<a href="unit.html?u=${u}">${unit.title}</a> &gt; ${lessonMeta.title}`;
  }

  if (!lesson) {
    document.getElementById("lesson-content").innerHTML =
      "<p>이 소단원 콘텐츠는 아직 준비 중입니다.</p>";
    return;
  }

  document.getElementById("lesson-title").textContent = lesson.title;

  // ⓪ 들어가기 (도입 훅): 게임을 깨거나 건너뛰면 본 활동이 열린다
  const lessonContent = document.getElementById("lesson-content");
  const exportBar = document.querySelector(".export-bar");
  if (lesson.hook && lesson.hook.gameModule) {
    const hookSection = document.getElementById("hook-section");
    const continueBtn = document.getElementById("hook-continue");
    const skipBtn = document.getElementById("hook-skip");

    hookSection.hidden = false;
    lessonContent.hidden = true;
    if (exportBar) exportBar.hidden = true;
    document.getElementById("hook-title").textContent = lesson.hook.title || "";
    document.getElementById("hook-text").textContent = lesson.hook.text || "";

    const revealLesson = () => {
      lessonContent.hidden = false;
      if (exportBar) exportBar.hidden = false;
      continueBtn.hidden = true;
      skipBtn.hidden = true;
      lessonContent.scrollIntoView({ behavior: "smooth" });
    };

    continueBtn.addEventListener("click", revealLesson);
    skipBtn.addEventListener("click", revealLesson);

    try {
      const mod = await import(`../${lesson.hook.gameModule}`);
      if (mod && typeof mod.mount === "function") {
        // 게임 성공 시: 오늘 배울 개념과 연결하는 메시지 + 계속하기 버튼 공개
        mod.mount(document.getElementById("hook-game"), () => {
          markDone(`${progressPrefix}:hook`);
          continueBtn.hidden = false;
          const msg = document.createElement("p");
          msg.className = "hook-reveal";
          msg.textContent =
            lesson.hook.revealText ||
            "🎉 성공! 방금 체험한 것이 바로 오늘 수업의 핵심입니다. 계속하기를 눌러 확인해 보세요.";
          document.getElementById("hook-game").after(msg);
        });
      }
    } catch {
      // 게임 로드 실패 시 훅 없이 바로 본 활동 표시
      revealLesson();
      hookSection.hidden = true;
    }
  }

  // ① 개념 열기
  if (lesson.intro) {
    document.getElementById("intro-text").textContent = lesson.intro.text || "";
    renderEmbed(document.getElementById("intro-embed"), lesson.intro.youtube, "youtube");
  }

  // ② 원리 탐구 (여러 활동: sim = 조작형 시뮬레이션, steps = 단계형 선택 탐구)
  if (lesson.explore) {
    document.getElementById("explore-text").textContent = lesson.explore.text || "";
    const exploreList = document.getElementById("explore-list");

    // 구버전(단일 simulationModule) 호환
    const activities = lesson.explore.activities
      ? lesson.explore.activities
      : lesson.explore.simulationModule
        ? [{ type: "sim", title: "", text: "", module: lesson.explore.simulationModule }]
        : [];

    for (const act of activities) {
      const block = document.createElement("div");
      block.className = "explore-block";

      if (act.title) {
        const h3 = document.createElement("h3");
        h3.textContent = act.title;
        block.appendChild(h3);
      }
      if (act.text) {
        const p = document.createElement("p");
        p.textContent = act.text;
        block.appendChild(p);
      }

      if (act.type === "steps") {
        block.appendChild(renderSteps(act.steps || []));
      } else {
        const simWrap = document.createElement("div");
        simWrap.className = "sim-canvas-wrap";
        simWrap.textContent = "불러오는 중...";
        block.appendChild(simWrap);
        try {
          const mod = await import(`../${act.module}`);
          if (mod && typeof mod.mount === "function") {
            mod.mount(simWrap);
          } else {
            simWrap.textContent = "시뮬레이션 준비 중입니다.";
          }
        } catch {
          simWrap.textContent = "시뮬레이션 준비 중입니다.";
        }
      }

      exploreList.appendChild(block);
    }
  }

  // ③ 문제 풀이
  const problemList = document.getElementById("problem-list");
  if (lesson.practice && lesson.practice.problems) {
    lesson.practice.problems.forEach((p, i) => {
      problemList.appendChild(renderProblem(p, i));
    });
  }

  // ④ 실생활 적용
  if (lesson.apply) {
    document.getElementById("apply-text").textContent = lesson.apply.text || "";
    renderEmbed(document.getElementById("apply-embed"), lesson.apply.algeomath, "algeomath");
  }

  // 수식 렌더링 (KaTeX): 콘텐츠 텍스트에 \( ... \) 또는 $$ ... $$ 로 수식을 쓰면 자동 렌더링
  if (window.renderMathInElement) {
    window.renderMathInElement(document.querySelector("main.container"), {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
  }

  // ⑤ PDF 다운로드
  bindExportButton(
    document.getElementById("export-btn"),
    document.getElementById("lesson-content"),
    () => `${lesson.title}_활동결과.pdf`
  );
}

document.addEventListener("DOMContentLoaded", initLessonPage);
