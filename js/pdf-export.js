// 활동 화면을 캡처해 클라이언트에서 바로 PDF로 저장 (서버 저장 없음)
// jsPDF, html2canvas는 lesson.html에서 CDN으로 불러온 뒤 사용한다.

async function exportSectionToPdf(sectionEl, fileName) {
  if (!sectionEl || !window.html2canvas || !window.jspdf) {
    alert("PDF 생성 기능을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.");
    return;
  }

  // 칠판 테마 배경색 그대로 캡처해야 분필 색 텍스트가 보인다
  const canvas = await window.html2canvas(sectionEl, { scale: 2, backgroundColor: "#22342c" });
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(fileName || "기하_활동결과.pdf");
}

function bindExportButton(buttonEl, sectionEl, fileNameFn) {
  if (!buttonEl) return;
  buttonEl.addEventListener("click", () => {
    const fileName = typeof fileNameFn === "function" ? fileNameFn() : fileNameFn;
    exportSectionToPdf(sectionEl, fileName);
  });
}
