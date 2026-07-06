import { request } from './http';

// 책임: 관리자 신고관리 API 호출 함수 모음
//       신고 목록 조회, 로그인 제한, 강제탈퇴, 반려 처리를 담당

export const ADMIN_REPORT_STATUS = {
    PENDING: 'PENDING',
    LOGIN_RESTRICTED: 'LOGIN_RESTRICTED',
    WITHDRAWN: 'WITHDRAWN',
    DISMISSED: 'DISMISSED',
};

export const ADMIN_REPORT_TARGET_TYPES = {
    MEMBER: 'MEMBER',
    LAWYER: 'LAWYER',
    BOARD: 'BOARD',
    BOARD_COMMENT: 'BOARD_COMMENT',
    MATCH: 'MATCH',
};

// Input:  { page, size, status, targetType, keyword }
// Output: ApiResponse<AdminReportPageResponseDto>
// 책임:   관리자 신고 목록 조회
export async function getAdminReports({
    page = 1,
    size = 10,
    status,
    targetType,
    keyword,
} = {}) {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    if (status) {
        params.set('status', status);
    }

    if (targetType) {
        params.set('targetType', targetType);
    }

    if (keyword?.trim()) {
        params.set('keyword', keyword.trim());
    }

    const res = await request(`/api/admin/reports?${params.toString()}`);
    return res?.data ?? {
        content: [],
        page,
        size,
        totalCount: 0,
        totalPages: 1,
    };
}

// Input:  reportId, { days, reason }
// Output: ApiResponse<Void>
// 책임:   신고 대상 회원 로그인 제한 처리
export function restrictReportLogin(reportId, { days, reason }) {
    return request(`/api/admin/reports/${reportId}/login-restrict`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            days,
            reason,
        }),
    });
}

// Input:  reportId, { reason }
// Output: ApiResponse<Void>
// 책임:   신고 대상 회원 강제탈퇴 처리
export function withdrawReportedUser(reportId, { reason }) {
    return request(`/api/admin/reports/${reportId}/withdraw`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reason,
        }),
    });
}

// Input:  reportId, { reason }
// Output: ApiResponse<Void>
// 책임:   신고 반려 처리
export function dismissAdminReport(reportId, { reason }) {
    return request(`/api/admin/reports/${reportId}/dismiss`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reason,
        }),
    });
}

// Input:  reportIds, { days, reason }
// Output: [{ reportId, success, message }]
// 책임:   선택 신고 로그인 제한 일괄 처리
export async function bulkRestrictReportLogin(reportIds, { days, reason }) {
    const results = [];

    for (const reportId of reportIds) {
        try {
            await restrictReportLogin(reportId, {
                days,
                reason,
            });

            results.push({
                reportId,
                success: true,
            });
        } catch (error) {
            results.push({
                reportId,
                success: false,
                message: error.message || '로그인 제한 처리 실패',
            });
        }
    }

    return results;
}

// Input:  reportIds, { reason }
// Output: [{ reportId, success, message }]
// 책임:   선택 신고 강제탈퇴 일괄 처리
export async function bulkWithdrawReportedUsers(reportIds, { reason }) {
    const results = [];

    for (const reportId of reportIds) {
        try {
            await withdrawReportedUser(reportId, {
                reason,
            });

            results.push({
                reportId,
                success: true,
            });
        } catch (error) {
            results.push({
                reportId,
                success: false,
                message: error.message || '강제탈퇴 처리 실패',
            });
        }
    }

    return results;
}

// Input:  reportIds, { reason }
// Output: [{ reportId, success, message }]
// 책임:   선택 신고 반려 일괄 처리
export async function bulkDismissAdminReports(reportIds, { reason }) {
    const results = [];

    for (const reportId of reportIds) {
        try {
            await dismissAdminReport(reportId, {
                reason,
            });

            results.push({
                reportId,
                success: true,
            });
        } catch (error) {
            results.push({
                reportId,
                success: false,
                message: error.message || '반려 처리 실패',
            });
        }
    }

    return results;
}