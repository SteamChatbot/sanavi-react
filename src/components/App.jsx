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
import MatchPage            from '../pages/MatchPage';
import MatchBoardPage       from '../pages/MatchBoardPage';
import MatchWritePage       from '../pages/MatchWritePage';
import MatchBidListPage     from '../pages/MatchBidListPage';
import MyPage               from '../pages/MyPage';
import AnalysisDetailPage   from '../pages/AnalysisDetailPage';

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
  const [user, setUser] = useState(getSavedUser);
  // 개발용 빠른 토글
  // setUser({ name:'김', role:'USER' })  → 로그인
  // setUser({ name:'관', role:'ADMIN' }) → 관리자

  const handleLogin = (loginUser) => {
    setUser(loginUser);
    localStorage.setItem('sanaviUser', JSON.stringify(loginUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sanaviUser');
  };

  const handleUpdateUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('sanaviUser', JSON.stringify(nextUser));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<LandingPage     user={user} />} />
        <Route path="/login"          element={<LoginPage        onLogin={setUser} />} />
        <Route path="/signup"         element={<SignupPage       onLogin={setUser} />} />
        <Route path="/agent"          element={<AgentPage        user={user} onLogout={handleLogout} />} />
        <Route path="/board"          element={<BoardListPage    user={user} />} />
        <Route path="/board/:id"      element={<BoardDetailPage  user={user} />} />
        <Route path="/board/:id/edit" element={<BoardWritePage user={user} />}/>
        <Route path="/board/write"    element={<BoardWritePage user={user} />} />
        <Route path="/subscribe"      element={<SubscribePage    user={user} />} />
        <Route path="/lawyer/verify"      element={<LawyerVerifyPage   user={user} />} />
        <Route path="/match"                    element={<MatchPage        user={user} />} />
        <Route path="/matchboard"               element={<MatchBoardPage   user={user} />} />
        <Route path="/matchboard/write"         element={<MatchWritePage   user={user} />} />
        <Route path="/matchboard/:id"           element={<MatchBidListPage user={user} />} />
        <Route path="/mypage"             element={<MyPage           user={user} onLogout={handleLogout}  onUserUpdate={handleUpdateUser}/>} />
        <Route path="/analysis/:id"       element={<AnalysisDetailPage user={user} />} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
