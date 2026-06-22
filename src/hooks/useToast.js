import { useState } from 'react';

// 토스트 알림 상태를 관리하는 커스텀 훅
// 컴포넌트에서 { toasts, showError, removeToast } = useToast() 형태로 사용
export function useToast() {
  // 현재 화면에 표시 중인 토스트 목록
  const [toasts, setToasts] = useState([]);

  // 에러 토스트 추가 — Date.now()로 고유 id 생성
  const showError = (message) => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type: 'error' }]);
  };

  // id에 해당하는 토스트 제거 (닫기 버튼 또는 자동 타이머에서 호출)
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  return { toasts, showError, removeToast };
}
