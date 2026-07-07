import { request } from './http';

// 책임: 관리자 의뢰글게시판관리 API 호출 함수 모음
// 백엔드 엔드포인트:
// GET   /api/admin/matches/posts
// GET   /api/admin/matches/bids
// PATCH /api/admin/matches/posts/{matchId}/close
// PATCH /api/admin/matches/posts/{matchId}/delete
// PATCH /api/admin/matches/posts/{matchId}/restore
// PATCH /api/admin/matches/bids/{bidId}/delete
// PATCH /api/admin/matches/bids/{bidId}/restore

function buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.set(key, value);
    });

    return query.toString();
}

export async function getAdminMatchPosts(params = {}) {
    const query = buildQuery(params);
    const res = await request(`/api/admin/matches/posts${query ? `?${query}` : ''}`);

    return res?.data ?? {
        contents: [],
        page: 1,
        size: 10,
        totalElements: 0,
        totalPages: 0,
    };
}

export async function getAdminMatchBids(params = {}) {
    const query = buildQuery(params);
    const res = await request(`/api/admin/matches/bids${query ? `?${query}` : ''}`);

    return res?.data ?? {
        contents: [],
        page: 1,
        size: 10,
        totalElements: 0,
        totalPages: 0,
    };
}

export async function closeAdminMatchPost(matchId) {
    const res = await request(`/api/admin/matches/posts/${matchId}/close`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}

export async function deleteAdminMatchPost(matchId) {
    const res = await request(`/api/admin/matches/posts/${matchId}/delete`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}

export async function restoreAdminMatchPost(matchId) {
    const res = await request(`/api/admin/matches/posts/${matchId}/restore`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}

export async function deleteAdminMatchBid(bidId) {
    const res = await request(`/api/admin/matches/bids/${bidId}/delete`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}

export async function restoreAdminMatchBid(bidId) {
    const res = await request(`/api/admin/matches/bids/${bidId}/restore`, {
        method: 'PATCH',
    });

    return res?.data ?? null;
}