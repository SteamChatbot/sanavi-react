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

// Input:  { reportedUserId, category, detail }
// Output: ApiResponse<Void>
// 책임:   회원 신고 접수 (reporterId는 서버가 JWT userId로 설정)
export function reportUser({ reportedUserId, category, detail }) {
  return request('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportedUserId, category, detail }),
  });
}
