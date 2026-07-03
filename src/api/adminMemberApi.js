import { request } from './http';

// 책임: 관리자 회원상태관리 API 호출 함수 모음
//       회원 목록 조회, 구독 변경, AI 횟수 초기화, 강제 로그아웃을 담당

export const ADMIN_MEMBER_ROLES = {
    USER: 'role_user',
    LAWYER: 'role_lawyer',
    ADMIN: 'role_admin',
};

export const ADMIN_MEMBER_STATUS = {
    ACTIVE: 'ACTIVE',
    LOGIN_RESTRICTED: 'LOGIN_RESTRICTED',
    WITHDRAWN: 'WITHDRAWN',
};

// Input:  { page, size, keyword, role, subscribe, status }
// Output: ApiResponse<AdminMemberPageResponseDto>
// 책임:   관리자 회원 목록 조회
export async function getAdminMembers({
    page = 1,
    size = 10,
    keyword,
    role,
    subscribe,
    status,
} = {}) {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    if (keyword?.trim()) {
        params.set('keyword', keyword.trim());
    }

    if (role) {
        params.set('role', role);
    }

    if (subscribe !== undefined && subscribe !== null && subscribe !== '') {
        params.set('subscribe', String(subscribe));
    }

    if (status) {
        params.set('status', status);
    }

    const res = await request(`/api/admin/members?${params.toString()}`);

    return res?.data ?? {
        content: [],
        page,
        size,
        totalCount: 0,
        totalPages: 1,
    };
}

// Input:  userId, subscribe
// Output: ApiResponse<Void>
// 책임:   회원 구독 상태 변경
export function updateAdminMemberSubscription(userId, subscribe) {
    return request(`/api/admin/members/${userId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subscribe,
        }),
    });
}

// Input:  userId
// Output: ApiResponse<Void>
// 책임:   회원 AI 사용횟수 초기화
export function resetAdminMemberAiCount(userId) {
    return request(`/api/admin/members/${userId}/ai-count/reset`, {
        method: 'PATCH',
    });
}

// Input:  userIds, subscribe
// Output: [{ userId, success, message }]
// 책임:   선택 회원 구독 상태 일괄 변경
export async function bulkUpdateAdminMemberSubscription(userIds, subscribe) {
    const results = [];

    for (const userId of userIds) {
        try {
            await updateAdminMemberSubscription(userId, subscribe);

            results.push({
                userId,
                success: true,
            });
        } catch (error) {
            results.push({
                userId,
                success: false,
                message: error.message || '구독 상태 변경 실패',
            });
        }
    }

    return results;
}

// Input:  userIds
// Output: [{ userId, success, message }]
// 책임:   선택 회원 AI 사용횟수 일괄 초기화
export async function bulkResetAdminMemberAiCount(userIds) {
    const results = [];

    for (const userId of userIds) {
        try {
            await resetAdminMemberAiCount(userId);

            results.push({
                userId,
                success: true,
            });
        } catch (error) {
            results.push({
                userId,
                success: false,
                message: error.message || 'AI 횟수 초기화 실패',
            });
        }
    }

    return results;
}