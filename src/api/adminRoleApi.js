import { request } from './http';

// 책임: 관리자 권한관리 API 호출 함수 모음
//       최고관리자만 관리자 역할 조회, 후보 조회, 권한 템플릿 조회, 역할 변경/해제를 수행한다

export const ADMIN_ROLE_TYPES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
    SUPPORT_ADMIN: 'SUPPORT_ADMIN',
};

export const ADMIN_ROLE_LABELS = {
    SUPER_ADMIN: '최고관리자',
    OPERATIONS_ADMIN: '운영관리자',
    SUPPORT_ADMIN: '고객지원관리자',
};

export const ADMIN_ROLE_OPTIONS = [
    {
        value: ADMIN_ROLE_TYPES.SUPER_ADMIN,
        label: ADMIN_ROLE_LABELS.SUPER_ADMIN,
    },
    {
        value: ADMIN_ROLE_TYPES.OPERATIONS_ADMIN,
        label: ADMIN_ROLE_LABELS.OPERATIONS_ADMIN,
    },
    {
        value: ADMIN_ROLE_TYPES.SUPPORT_ADMIN,
        label: ADMIN_ROLE_LABELS.SUPPORT_ADMIN,
    },
];

// Input:  keyword
// Output: ApiResponse<List<AdminRoleAssignmentResponseDto>>
// 책임:   현재 관리자 역할 배정 목록 조회
export async function getAdminRoleAssignments(keyword = '') {
    const params = new URLSearchParams();

    if (keyword?.trim()) {
        params.set('keyword', keyword.trim());
    }

    const queryString = params.toString();
    const url = queryString
        ? `/api/admin/roles/assignments?${queryString}`
        : '/api/admin/roles/assignments';

    const res = await request(url);
    return res?.data ?? [];
}

// Input:  { page, size, keyword }
// Output: ApiResponse<AdminRoleCandidatePageResponseDto>
// 책임:   관리자 승격 후보 회원 목록 조회
export async function getAdminRoleCandidates({
    page = 1,
    size = 10,
    keyword = '',
} = {}) {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    if (keyword?.trim()) {
        params.set('keyword', keyword.trim());
    }

    const res = await request(`/api/admin/roles/candidates?${params.toString()}`);

    return res?.data ?? {
        content: [],
        page,
        size,
        totalCount: 0,
        totalPages: 1,
    };
}

// Input:  없음
// Output: ApiResponse<AdminPermissionResponseDto>
// 책임:   고정 관리자 역할/권한 템플릿 조회
export async function getAdminRolePermissions() {
    const res = await request('/api/admin/roles/permissions');

    return res?.data ?? {
        roles: [],
        permissions: [],
    };
}

// Input:  userId, { adminRoleType, reason }
// Output: ApiResponse<Void>
// 책임:   관리자 역할 부여 또는 변경
export function updateAdminRoleAssignment(userId, { adminRoleType, reason }) {
    return request(`/api/admin/roles/assignments/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            adminRoleType,
            reason,
        }),
    });
}

// Input:  userId, { reason }
// Output: ApiResponse<Void>
// 책임:   관리자 권한 해제
export function revokeAdminRoleAssignment(userId, { reason }) {
    return request(
        `/api/admin/roles/assignments/${encodeURIComponent(userId)}/revoke`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reason,
            }),
        }
    );
}

export const ADMIN_PERMISSION_CODES = {
    MEMBER_READ: 'MEMBER_READ',
    MEMBER_STATUS_MANAGE: 'MEMBER_STATUS_MANAGE',
    SUBSCRIPTION_MANAGE: 'SUBSCRIPTION_MANAGE',

    REPORT_READ: 'REPORT_READ',
    REPORT_PROCESS: 'REPORT_PROCESS',
    REPORT_CONTENT_HIDE: 'REPORT_CONTENT_HIDE',

    ADMIN_ROLE_MANAGE: 'ADMIN_ROLE_MANAGE',

    BOARD_MANAGE: 'BOARD_MANAGE',
    MATCH_BOARD_MANAGE: 'MATCH_BOARD_MANAGE',

    AI_ANALYSIS_MANAGE: 'AI_ANALYSIS_MANAGE',
    STATISTICS_READ: 'STATISTICS_READ',

    MAIL_SEND: 'MAIL_SEND',
    SYSTEM_MONITOR: 'SYSTEM_MONITOR',

    ADMIN_ACTION_LOG_READ: 'ADMIN_ACTION_LOG_READ',
};

// Input:  없음
// Output: AdminRoleMeResponseDto
// 책임:   현재 로그인한 관리자 역할과 권한 코드 목록 조회
// 백엔드 /api/admin/roles/me 미구현 — role_admin은 모든 권한 부여
// 추후 JWT + 관리자 역할 세분화 구현 시 아래 API 호출 코드로 교체할 것
export async function getMyAdminPermissions() {
    try {
        const res = await request('/api/admin/roles/me', { skipAuthRefresh: true });
        if (res?.data?.permissionCodes?.length) {
            return res.data;
        }
    } catch {
        // 엔드포인트 미구현 또는 오류 시 폴백
    }

    return {
        adminRoleType: ADMIN_ROLE_TYPES.SUPER_ADMIN,
        adminRoleLabel: ADMIN_ROLE_LABELS.SUPER_ADMIN,
        permissionCodes: Object.values(ADMIN_PERMISSION_CODES),
    };
}