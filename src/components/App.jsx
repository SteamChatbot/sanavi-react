// 루트 라우터 — 로그인 상태에 따른 페이지 라우팅 및 전역 인증 상태 관리
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '../styles/global.css';

import LandingPage        from '../pages/LandingPage';
import LoginPage          from '../pages/LoginPage';
import SignupPage         from '../pages/SignupPage';
import AgentPage          from '../pages/AgentPage';
import BoardListPage      from '../pages/BoardListPage';
import BoardDetailPage    from '../pages/BoardDetailPage';
import BoardWritePage     from '../pages/BoardWritePage';
import SubscribePage      from '../pages/SubscribePage';
import { LawyerVerifyPage } from '../pages/LawyerVerifyPage';
import MatchBoardPage       from '../pages/MatchBoardPage';
import MatchWritePage       from '../pages/MatchWritePage';
import MatchBidListPage     from '../pages/MatchBidListPage';
import MyPage               from '../pages/MyPage';
import AnalysisDetailPage   from '../pages/AnalysisDetailPage';
import LawyerListPage       from '../pages/LawyerListPage';
import LawyerDetailPage     from '../pages/LawyerDetailPage';
import LawyerRequestWritePage from '../pages/LawyerRequestWritePage';
import MyLawyerRequestsPage from '../pages/MyLawyerRequestsPage';
import DirectRequestDetailPage from '../pages/DirectRequestDetailPage';
import LawyerReceivedRequestsPage from '../pages/LawyerReceivedRequestsPage';
import AdminDashboardPage   from '../pages/admin/AdminDashboardPage';
import AdminMemberPage      from '../pages/admin/AdminMemberPage';
import AdminStatisticsPage  from '../pages/admin/AdminStatisticsPage';
import AdminAnalysisPage    from '../pages/admin/AdminAnalysisPage';
import AdminBoardPage       from '../pages/admin/AdminBoardPage';
import AdminMatchBoardPage  from '../pages/admin/AdminMatchBoardPage';
import AdminMemberRolePage  from '../pages/admin/AdminMemberRolePage';
import AdminMemberReportPage from '../pages/admin/AdminMemberReportPage';
import AdminSystemPage      from '../pages/admin/AdminSystemPage';
import AdminMailPage        from '../pages/admin/AdminMailPage';

// 새로고침 후에도 로그인 상태 유지 — localStorage에서 user 복원
// JSON 파싱 실패(손상된 데이터) 시 자동 초기화
function getSavedUser() {
  try {
    const saved = localStorage.getItem('sanaviUser');
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem('sanaviUser');
    return null;
  }
}

export default function App() {
  // user.role: 'role_user' | 'role_lawyer' | 'role_admin'
  const [user, setUser] = useState(getSavedUser);

  // 로그인 성공 시 백엔드 응답(user 객체)을 state + localStorage에 저장
  // atExpiresAt: 로그인 시점 + 50분(ms) — Navbar 타이머 기준값
  const handleLogin = (loginUser) => {
    const userWithExpiry = { ...loginUser, atExpiresAt: Date.now() + 3000000 };
    setUser(userWithExpiry);
    localStorage.setItem('sanaviUser', JSON.stringify(userWithExpiry));
  };

  // 로그아웃 — state 초기화 + localStorage 제거
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sanaviUser');
  };

  // 구독 변경·프로필 수정 등 user 정보가 바뀔 때 동기화
  const handleUpdateUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('sanaviUser', JSON.stringify(nextUser));
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 공통 */}
        <Route path="/"               element={<LandingPage     user={user} />} />
        <Route path="/login"          element={<LoginPage        onLogin={handleLogin} />} />
        <Route path="/signup"         element={<SignupPage       onLogin={handleLogin} />} />
        <Route path="/agent"          element={<AgentPage        user={user} onLogout={handleLogout} />} />

        {/* 커뮤니티 게시판 */}
        <Route path="/board"          element={<BoardListPage    user={user} />} />
        <Route path="/board/:id"      element={<BoardDetailPage  user={user} />} />
        <Route path="/board/:id/edit" element={<BoardWritePage   user={user} />}/>
        <Route path="/board/write"    element={<BoardWritePage   user={user} />} />

        {/* 구독·인증 */}
        <Route path="/subscribe"      element={<SubscribePage    user={user} onUserUpdate={handleUpdateUser} />} />
        <Route path="/lawyer/verify"  element={<LawyerVerifyPage user={user} />} />

        {/* 변호사 매칭 의뢰글 */}
        <Route path="/matchboard"              element={<MatchBoardPage   user={user} />} />
        <Route path="/matchboard/write"        element={<MatchWritePage   user={user} />} />
        <Route path="/matchboard/:id"          element={<MatchBidListPage user={user} />} />

        {/* 변호사 직접 연결 */}
        <Route path="/lawyers"                            element={<LawyerListPage          user={user} onLogout={handleLogout} />}/>
        <Route path="/lawyers/:lawyerId"                  element={<LawyerDetailPage        user={user} onLogout={handleLogout} />}/>
        <Route path="/lawyers/:lawyerId/request"          element={<LawyerRequestWritePage  user={user} onLogout={handleLogout} />}/>
        <Route path="/my-lawyer-requests"                 element={<MyLawyerRequestsPage    user={user} onLogout={handleLogout} />}/>
        <Route path="/requestlist/requests/:matchId"      element={<DirectRequestDetailPage user={user} onLogout={handleLogout} />}/>
        <Route path="/lawyer/requests"                    element={<LawyerReceivedRequestsPage user={user} onLogout={handleLogout} />}/>

        {/* 마이페이지·분석 결과 */}
        <Route path="/mypage"       element={<MyPage             user={user} onLogout={handleLogout} onUserUpdate={handleUpdateUser}/>} />
        <Route path="/analysis/:id" element={<AnalysisDetailPage user={user} />} />

        {/* 운영(관리자) 페이지 */}
        <Route path="/admin"             element={<AdminDashboardPage  user={user} onLogout={handleLogout} />} />
        <Route path="/admin/members"     element={<AdminMemberPage     user={user} onLogout={handleLogout} />} />
        <Route path="/admin/members/reports" element={<AdminMemberReportPage user={user} onLogout={handleLogout} />} />
        <Route path="/admin/members/roles" element={<AdminMemberRolePage user={user} onLogout={handleLogout} />} />
        <Route path="/admin/statistics"  element={<AdminStatisticsPage user={user} onLogout={handleLogout} />} />
        <Route path="/admin/analysis"    element={<AdminAnalysisPage   user={user} onLogout={handleLogout} />} />
        <Route path="/admin/board"       element={<AdminBoardPage      user={user} onLogout={handleLogout} />} />
        <Route path="/admin/board/match" element={<AdminMatchBoardPage user={user} onLogout={handleLogout} />} />
        <Route path="/admin/system"      element={<AdminSystemPage     user={user} onLogout={handleLogout} />} />
        <Route path="/admin/mail"        element={<AdminMailPage       user={user} onLogout={handleLogout} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
