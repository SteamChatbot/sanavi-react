// 관리자 권한 라우트 가드
// 관리자 로그인 여부와 세부 권한 코드를 확인해 URL 직접 접근을 제한한다
import React from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAdminPermissions } from '../../contexts/AdminPermissionContext';
import Button from '../Button';
import '../../pages/admin/AdminPage.css';

export default function RequireAdminPermission({
    user,
    permission,
    children,
}) {
    const {
        isAdmin,
        loading,
        errorMessage,
        hasPermission,
    } = useAdminPermissions();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const normalizedRole = String(user?.role || '').trim().toLowerCase();

    const isRoleAdmin =
        normalizedRole === 'role_admin' ||
        normalizedRole === 'admin';

    if (!isRoleAdmin || !isAdmin) {
        return (
            <div className="admin-access-denied">
                <h1>접근 권한이 없습니다.</h1>
                <p>관리자 계정으로 로그인해야 사용할 수 있는 페이지입니다.</p>

                <Link to="/">
                    <Button variant="primary" size="md">
                        홈으로 이동
                    </Button>
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-access-denied">
                <h1>관리자 권한 확인 중</h1>
                <p>잠시만 기다려 주세요.</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="admin-access-denied">
                <h1>권한 정보를 확인할 수 없습니다.</h1>
                <p>{errorMessage}</p>

                <Link to="/">
                    <Button variant="outline" size="md">
                        홈으로 이동
                    </Button>
                </Link>
            </div>
        );
    }

    if (!hasPermission(permission)) {
        return (
            <div className="admin-access-denied">
                <h1>접근 권한이 없습니다.</h1>
                <p>현재 관리자 역할로는 이 페이지를 사용할 수 없습니다.</p>

                <Link to="/admin">
                    <Button variant="primary" size="md">
                        관리자 홈으로 이동
                    </Button>
                </Link>
            </div>
        );
    }

    return children;
}