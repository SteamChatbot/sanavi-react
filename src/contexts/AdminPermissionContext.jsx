// 관리자 권한 컨텍스트 — 현재 로그인한 관리자의 세부 역할과 권한 코드를 전역으로 제공
// 사이드바 메뉴 노출, 라우트 접근 제한, 버튼 표시 여부 판단에 사용한다
// 관리자 권한 조회는 /admin 경로에서만 수행해 일반 페이지 렌더링에 영향을 주지 않도록 한다
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useLocation } from 'react-router-dom';

import { getMyAdminPermissions } from '../api/adminRoleApi';

const AdminPermissionContext = createContext(null);

export function AdminPermissionProvider({ user, children }) {
    const { pathname } = useLocation();

    const [adminPermission, setAdminPermission] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const normalizedRole = String(user?.role || '').trim().toLowerCase();

    const isAdmin =
        normalizedRole === 'role_admin' ||
        normalizedRole === 'admin';
    const isAdminPath = pathname.startsWith('/admin');

    const shouldLoadAdminPermission = isAdmin && isAdminPath;

    const fetchPermissions = useCallback(async () => {
        // 일반 페이지에서는 관리자 권한 API를 호출하지 않는다
        if (!shouldLoadAdminPermission) {
            setAdminPermission(null);
            setLoading(false);
            setErrorMessage('');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const result = await getMyAdminPermissions();
            setAdminPermission(result);
        } catch (error) {
            console.error(error);
            setAdminPermission(null);
            setErrorMessage(error.message || '관리자 권한 정보를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [shouldLoadAdminPermission]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const permissionCodes = adminPermission?.permissionCodes ?? [];

    const hasPermission = useCallback(
        (permissionCode) => {
            if (!permissionCode) {
                return true;
            }

            return permissionCodes.includes(permissionCode);
        },
        [permissionCodes]
    );

    const value = useMemo(
        () => ({
            isAdmin,
            isAdminPath,
            loading,
            errorMessage,
            adminPermission,
            permissionCodes,
            hasPermission,
            refreshPermissions: fetchPermissions,
        }),
        [
            isAdmin,
            isAdminPath,
            loading,
            errorMessage,
            adminPermission,
            permissionCodes,
            hasPermission,
            fetchPermissions,
        ]
    );

    return (
        <AdminPermissionContext.Provider value={value}>
            {children}
        </AdminPermissionContext.Provider>
    );
}

export function useAdminPermissions() {
    const context = useContext(AdminPermissionContext);

    if (!context) {
        throw new Error('useAdminPermissions must be used inside AdminPermissionProvider');
    }

    return context;
}