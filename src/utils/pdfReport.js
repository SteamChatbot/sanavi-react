// AgentPage/AnalysisDetailPage의 "PDF 리포트 다운로드"가 공통으로 쓰는 PDF 생성 로직.
// 화면을 캡처한 이미지가 아니라 jsPDF로 텍스트를 직접 그리는 방식 — 선택/검색 가능한 진짜 텍스트 PDF.
// jsPDF 기본 폰트는 한글을 지원하지 않아서, Windows 기본 맑은고딕(malgun.ttf)에서 실제 쓰는 글자만
// 추려낸 서브셋(13MB → 2.17MB, public/fonts/MalgunGothic-subset.ttf)을 PDF 생성 시점에만 fetch해서 내장한다.
// 주의: 이 폰트엔 한글 완성형 음절(가~힣) + 영문/숫자/기본 문장부호만 있고 이모지 글리프는 없음 —
//       섹션 제목 등에 이모지(⚠️📋📎)를 쓰면 빈 칸/깨진 문자로 나오니 절대 넣지 말 것.
import jsPDF from 'jspdf';

const FONT_URL = '/fonts/MalgunGothic-subset.ttf';
const FONT_NAME = 'MalgunGothic';

const BRAND_GREEN = [26, 92, 56];
const TEXT_DARK = [26, 26, 26];
const TEXT_GRAY = [120, 120, 120];
const TEXT_LIGHT_GRAY = [153, 153, 153];
const DIVIDER_GRAY = [232, 232, 232];

let cachedFontBase64 = null;

// ArrayBuffer -> base64 (jsPDF의 addFileToVFS가 base64 문자열을 요구함)
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadKoreanFontBase64() {
  if (cachedFontBase64) return cachedFontBase64;
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error('PDF용 한글 폰트를 불러오지 못했습니다.');
  const buffer = await res.arrayBuffer();
  cachedFontBase64 = arrayBufferToBase64(buffer);
  return cachedFontBase64;
}

async function createKoreanPdf() {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const fontBase64 = await loadKoreanFontBase64();
  pdf.addFileToVFS(`${FONT_NAME}.ttf`, fontBase64);
  pdf.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal');
  pdf.setFont(FONT_NAME, 'normal');
  return pdf;
}

// 현재 y 위치에서 requiredMm만큼 더 쓸 공간이 없으면 새 페이지로 넘기고 y를 초기화
function ensureSpace(ctx, requiredMm) {
  if (ctx.y + requiredMm > ctx.pageHeight - ctx.margin) {
    ctx.pdf.addPage();
    ctx.y = ctx.margin;
  }
}

function drawSectionTitle(ctx, text) {
  ensureSpace(ctx, 16);
  ctx.pdf.setFontSize(13);
  ctx.pdf.setTextColor(...TEXT_DARK);
  ctx.pdf.text(text, ctx.margin, ctx.y);
  ctx.y += 3;
  ctx.pdf.setDrawColor(...DIVIDER_GRAY);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.pageWidth - ctx.margin, ctx.y);
  ctx.y += 8;
}

function drawParagraph(ctx, text, { fontSize = 10.5, color = TEXT_DARK, lineHeight = 5.2, indent = 0 } = {}) {
  ctx.pdf.setFontSize(fontSize);
  ctx.pdf.setTextColor(...color);
  const lines = ctx.pdf.splitTextToSize(text, ctx.contentWidth - indent);
  lines.forEach((line) => {
    ensureSpace(ctx, lineHeight);
    ctx.pdf.text(line, ctx.margin + indent, ctx.y);
    ctx.y += lineHeight;
  });
}

function drawKeyValueRow(ctx, pairs) {
  ensureSpace(ctx, 6);
  const colWidth = ctx.contentWidth / pairs.length;
  ctx.pdf.setFontSize(11);
  pairs.forEach(([label, value], i) => {
    const x = ctx.margin + colWidth * i;
    ctx.pdf.setTextColor(...TEXT_LIGHT_GRAY);
    ctx.pdf.text(label, x, ctx.y);
    ctx.pdf.setTextColor(...TEXT_DARK);
    ctx.pdf.text(String(value), x + ctx.pdf.getTextWidth(label) + 4, ctx.y);
  });
  ctx.y += 8;
}

// Input: {
//   job, disease, inspector(선택), dateLabel,
//   score(0~100), checklist: [{ title, purpose(선택), method, reason }],
//   warnings: string[], metaContent: string[], filename,
// }
export async function downloadAnalysisPdf({
  job, disease, inspector, dateLabel,
  score, checklist, warnings, metaContent, filename,
}) {
  const pdf = await createKoreanPdf();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const ctx = { pdf, pageWidth, pageHeight, margin, contentWidth: pageWidth - margin * 2, y: margin };

  // 헤더
  pdf.setFontSize(10);
  pdf.setTextColor(...TEXT_LIGHT_GRAY);
  pdf.text('산내비 AI · 산업재해 분석 리포트', ctx.margin, ctx.y);
  ctx.y += 8;
  pdf.setFontSize(19);
  pdf.setTextColor(...BRAND_GREEN);
  pdf.text('AI 산재 승인율 분석 결과', ctx.margin, ctx.y);
  ctx.y += 7;
  pdf.setFontSize(9.5);
  pdf.setTextColor(...TEXT_LIGHT_GRAY);
  pdf.text(`분석일 ${dateLabel || '-'}`, ctx.margin, ctx.y);
  ctx.y += 3;
  pdf.setDrawColor(...BRAND_GREEN);
  pdf.setLineWidth(0.8);
  pdf.line(ctx.margin, ctx.y, pageWidth - ctx.margin, ctx.y);
  pdf.setLineWidth(0.2);
  ctx.y += 12;

  // 기본 정보
  drawSectionTitle(ctx, '기본 정보');
  drawKeyValueRow(ctx, [['직업', job || '-'], ['질병/부상명', disease || '-']]);
  ctx.y += 2;

  if (inspector) {
    ctx.pdf.setFontSize(11);
    ctx.pdf.setTextColor(...TEXT_DARK);
    ensureSpace(ctx, 6);
    ctx.pdf.text('사고 경위', ctx.margin, ctx.y);
    ctx.y += 6;
    drawParagraph(ctx, inspector, { fontSize: 10, lineHeight: 5, color: [51, 51, 51] });
    ctx.y += 4;
  }

  ctx.y += 4;

  // 승인율
  drawSectionTitle(ctx, 'AI 예측 산재 승인율');
  ensureSpace(ctx, 20);
  pdf.setFontSize(30);
  pdf.setTextColor(...BRAND_GREEN);
  pdf.text(`${score}%`, ctx.margin, ctx.y + 8);
  pdf.setFontSize(9.5);
  pdf.setTextColor(...TEXT_LIGHT_GRAY);
  pdf.text('통계·판례 기반 AI 예측치', ctx.margin + pdf.getTextWidth(`${score}%`) + 8, ctx.y + 8);
  ctx.y += 14;
  pdf.setFillColor(238, 238, 238);
  pdf.roundedRect(ctx.margin, ctx.y, ctx.contentWidth, 4, 2, 2, 'F');
  pdf.setFillColor(...BRAND_GREEN);
  pdf.roundedRect(ctx.margin, ctx.y, ctx.contentWidth * (Math.max(0, Math.min(100, score)) / 100), 4, 2, 2, 'F');
  ctx.y += 16;

  // 증거 보강 체크리스트 — 화면의 "자세히 보기"로 펼쳐야 보이는 목적/방법/사유를 전부 펼친 상태로 기재
  drawSectionTitle(ctx, `증거 보강 체크리스트 (${checklist.length}건)`);
  checklist.forEach((c, i) => {
    ensureSpace(ctx, 12);
    pdf.setFontSize(11.5);
    pdf.setTextColor(...TEXT_DARK);
    const titleLines = pdf.splitTextToSize(`${i + 1}. ${c.title}`, ctx.contentWidth);
    titleLines.forEach((line) => {
      ensureSpace(ctx, 6);
      pdf.text(line, ctx.margin, ctx.y);
      ctx.y += 6;
    });
    if (c.purpose) {
      drawParagraph(ctx, `목적 — ${c.purpose}`, { fontSize: 9.5, color: TEXT_GRAY, lineHeight: 4.6, indent: 3 });
    }
    drawParagraph(ctx, `확인 방법 — ${c.method}`, { fontSize: 9.5, color: TEXT_GRAY, lineHeight: 4.6, indent: 3 });
    drawParagraph(ctx, `사유 — ${c.reason}`, { fontSize: 9.5, color: TEXT_GRAY, lineHeight: 4.6, indent: 3 });
    ctx.y += 3;
    ensureSpace(ctx, 1);
    pdf.setDrawColor(...DIVIDER_GRAY);
    pdf.line(ctx.margin, ctx.y, pageWidth - ctx.margin, ctx.y);
    ctx.y += 6;
  });

  // 판례 기반 주의사항
  ctx.y += 2;
  drawSectionTitle(ctx, '판례 기반 주의사항');
  if (warnings.length === 0) {
    drawParagraph(ctx, '해당 없음', { fontSize: 10, color: TEXT_GRAY });
  }
  warnings.forEach((w) => drawParagraph(ctx, `· ${w}`, { fontSize: 10, lineHeight: 5 }));

  // 참고 판례
  if (metaContent.length > 0) {
    ctx.y += 4;
    drawSectionTitle(ctx, '참고 판례');
    metaContent.forEach((m, i) => drawParagraph(ctx, `판례 ${i + 1}. ${m}`, { fontSize: 10, lineHeight: 5 }));
  }

  // 하단 안내 문구 — 마지막 페이지에만
  pdf.setFontSize(8);
  pdf.setTextColor(...TEXT_LIGHT_GRAY);
  pdf.text(
    '본 리포트는 AI 통계·판례 분석에 기반한 참고 자료이며 법적 효력을 갖지 않습니다.',
    ctx.margin,
    pageHeight - 10
  );

  pdf.save(filename);
}
