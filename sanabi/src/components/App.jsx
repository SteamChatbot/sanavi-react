import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '../styles/global.css';

import LandingPage        from '../pages/LandingPage';
import LoginPage          from '../pages/LoginPage';
import SignupPage         from '../pages/SignupPage';
import AgentPage          from '../pages/AgentPage';
import BoardListPage      from '../pages/BoardListPage';
import BoardDetailPage    from '../pages/BoardDetailPage';
import SubscribePage      from '../pages/SubscribePage';
import { LawyerVerifyPage } from '../pages/LawyerVerifyPage';
import MatchPage            from '../pages/MatchPage';
import MatchWritePage       from '../pages/MatchWritePage';
import MatchBidListPage     from '../pages/MatchBidListPage';
import MyPage               from '../pages/MyPage';
import AnalysisDetailPage   from '../pages/AnalysisDetailPage';

export default function App() {
  const [user, setUser] = useState(null);
  // 개발용 빠른 토글
  // setUser({ name:'김', role:'USER' })  → 로그인
  // setUser({ name:'관', role:'ADMIN' }) → 관리자

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<LandingPage     user={user} />} />
        <Route path="/login"          element={<LoginPage        onLogin={setUser} />} />
        <Route path="/signup"         element={<SignupPage       onLogin={setUser} />} />
        <Route path="/agent"          element={<AgentPage        user={user} />} />
        <Route path="/board"          element={<BoardListPage    user={user} />} />
        <Route path="/board/:id"      element={<BoardDetailPage  user={user} />} />
        <Route path="/subscribe"      element={<SubscribePage    user={user} />} />
        <Route path="/lawyer/verify"      element={<LawyerVerifyPage   user={user} />} />
        <Route path="/match"              element={<MatchPage        user={user} />} />
        <Route path="/match/write"        element={<MatchWritePage   user={user} />} />
        <Route path="/match/:id/bids"     element={<MatchBidListPage user={user} />} />
        <Route path="/mypage"             element={<MyPage           user={user} />} />
        <Route path="/analysis/:id"       element={<AnalysisDetailPage user={user} />} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
