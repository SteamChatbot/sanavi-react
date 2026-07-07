import { request } from './http';

// 책임: 관리자 게시판관리 API 호출 함수 모음
// 백엔드 엔드포인트:
// GET   /api/admin/boards/posts
// GET   /api/admin/boards/comments
// PATCH /api/admin/boards/posts/{boardId}/delete
// PATCH /api/admin/boards/posts/{boardId}/restore
// PATCH /api/admin/boards/comments/{commentId}/delete
// PATCH /api/admin/boards/comments/{commentId}/restore

function buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.set(key, value);
    });

    return query.toString();
}

export async function getAdminBoardPosts(params = {}) {
    const query = buildQuery(params);
    const res = await request(`/api/admin/boards/posts${query ? `?${query}` : ''}`);

    return res?.data ?? {
        contents: [],
        page: 1,
        size: 10,
        totalElements: 0,
        totalPages: 0,
    };
}

export async function getAdminBoardComments(params = {}) {
    const query = buildQuery(params);
    const res = await request(`/api/admin/boards/comments${query ? `?${query}` : ''}`);

    return res?.data ?? {
        contents: [],
        page: 1,
        size: 10,
        totalElements: 0,
        totalPages: 0,
    };
}

export async function deleteAdminBoardPost(boardId) {
    const res = await request(`/api/admin/boards/posts/${boardId}/delete`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}

export async function restoreAdminBoardPost(boardId) {
    const res = await request(`/api/admin/boards/posts/${boardId}/restore`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}

export async function deleteAdminBoardComment(commentId) {
    const res = await request(`/api/admin/boards/comments/${commentId}/delete`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}

export async function restoreAdminBoardComment(commentId) {
    const res = await request(`/api/admin/boards/comments/${commentId}/restore`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}