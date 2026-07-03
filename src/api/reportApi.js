import { request } from './http';

// 책임: /api/reports 엔드포인트 호출 함수 모음
//       유저신고 접수 (의뢰글 작성자/입찰자, 변호사 신고 버튼이 호출)

export const REPORT_CATEGORIES = [
  '욕설/비방',
  '허위사실유포',
  '시세조작',
  '성적콘텐츠포함',
  '스팸/광고',
  '기타',
];

export const REPORT_TARGET_TYPES = {
  MEMBER: 'MEMBER',
  LAWYER: 'LAWYER',
  BOARD: 'BOARD',
  BOARD_COMMENT: 'BOARD_COMMENT',
  MATCH: 'MATCH',
};

// Input:  { reportedUserId, targetType, category, detail }
// Output: ApiResponse<Void>
// 책임:   회원/변호사 신고 접수
//         reporterId는 서버가 JWT userId로 설정
export function reportUser({
  reportedUserId,
  targetType = REPORT_TARGET_TYPES.MEMBER,
  category,
  detail,
}) {
  return request('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportedUserId,
      targetType,
      targetId: reportedUserId,
      category,
      detail,
    }),
  });
}

// 변호사 신고
export function reportLawyer({ lawyerUserId, category, detail }) {
  return reportUser({
    reportedUserId: lawyerUserId,
    targetType: REPORT_TARGET_TYPES.LAWYER,
    category,
    detail,
  });
}

// Input:  { targetType, targetId }
// Output: ApiResponse<Void>
// 책임:   게시글/댓글/의뢰글 신고 접수
//         신고자는 서버가 JWT userId로 설정
export function reportContent({ targetType, targetId }) {
  return request('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetType,
      targetId: String(targetId),
    }),
  });
}

// 게시글 신고
export function reportBoard(boardId) {
  return reportContent({
    targetType: REPORT_TARGET_TYPES.BOARD,
    targetId: boardId,
  });
}

// 댓글 신고
export function reportBoardComment(commentId) {
  return reportContent({
    targetType: REPORT_TARGET_TYPES.BOARD_COMMENT,
    targetId: commentId,
  });
}

// 의뢰글 신고
export function reportMatch(matchId) {
  return reportContent({
    targetType: REPORT_TARGET_TYPES.MATCH,
    targetId: matchId,
  });
}