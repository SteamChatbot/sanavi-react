// AgentPage/AnalysisDetailPage의 PDF 리포트 다운로드가 공통으로 쓰는 캔버스→PDF 페이지 변환 로직
// 캔버스 하나를 A4 페이지 높이 단위로 잘라 PDF에 순서대로 추가한다.
// (섹션 하나가 A4 한 장을 넘길 만큼 길 때만 여기서 추가 페이지로 자연스럽게 이어짐)
export function addCanvasAsPages(pdf, canvas, isFirstPageOfDoc) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const pageCanvasHeight = Math.floor((canvasWidth * pageHeight) / pageWidth);

  let renderedHeight = 0;
  let sliceIndex = 0;

  while (renderedHeight < canvasHeight) {
    const pageCanvas = document.createElement('canvas');
    const pageContext = pageCanvas.getContext('2d');

    pageCanvas.width = canvasWidth;
    pageCanvas.height = Math.min(pageCanvasHeight, canvasHeight - renderedHeight);

    pageContext.drawImage(
      canvas,
      0, renderedHeight, canvasWidth, pageCanvas.height,
      0, 0, canvasWidth, pageCanvas.height
    );

    const imageData = pageCanvas.toDataURL('image/png');
    const imageHeight = (pageCanvas.height * pageWidth) / canvasWidth;

    if (!(isFirstPageOfDoc && sliceIndex === 0)) {
      pdf.addPage();
    }

    pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, imageHeight);

    renderedHeight += pageCanvasHeight;
    sliceIndex += 1;
  }
}

export const PDF_KOREAN_FONT_STACK = "'Malgun Gothic','Apple SD Gothic Neo',sans-serif";
