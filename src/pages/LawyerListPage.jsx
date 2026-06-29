// 책임: 변호사 찾기 목록 페이지 — DB에서 변호사 조회 + 왼쪽 사이드바 필터
//       Input:  user (로그인 유저)
//       Output: 사이드바(전문분야 체크박스·지역 select) + 변호사 카드 그리드
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { getLawyerList } from '../api/requestListApi';
import { SPECIALTY_LIST } from '../constants/specialties';
import { SIDO_LIST } from '../constants/regions';

import './LawyerPage.css';

export default function LawyerListPage({ user, onLogout }) {
  const [lawyers, setLawyers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterSido, setFilterSido]           = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const result = await getLawyerList({
          specialty: filterSpecialty || undefined,
          sido: filterSido || undefined,
        });
        if (!cancelled) setLawyers(result.data || []);
      } catch (error) {
        if (!cancelled) setErrorMessage(error.message || '변호사 목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [filterSpecialty, filterSido]);

  const resetFilter = () => { setFilterSpecialty(''); setFilterSido(''); };
  const hasFilter = filterSpecialty || filterSido;

  return (
    <div className="lawyer-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="lawyer-layout">
        {/* 사이드바 필터 */}
        <aside className="lawyer-sidebar">
          <h2 className="lawyer-sidebar__title">필터</h2>

          <div className="lawyer-filter-group">
            <div className="lawyer-filter-group__label">전문 분야</div>
            {SPECIALTY_LIST.map(s => (
              <label key={s} className={`lawyer-filter-check${filterSpecialty === s ? ' lawyer-filter-check--active' : ''}`}>
                <input
                  type="radio"
                  name="specialty"
                  checked={filterSpecialty === s}
                  onChange={() => setFilterSpecialty(prev => prev === s ? '' : s)}
                />
                {s}
              </label>
            ))}
          </div>

          <div className="lawyer-filter-group">
            <div className="lawyer-filter-group__label">활동 지역</div>
            <select
              className="lawyer-filter-select"
              value={filterSido}
              onChange={e => setFilterSido(e.target.value)}
            >
              <option value="">전체 지역</option>
              {SIDO_LIST.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {hasFilter && (
            <button className="lawyer-filter-reset" onClick={resetFilter}>
              필터 초기화
            </button>
          )}
        </aside>

        {/* 변호사 목록 */}
        <main className="lawyer-main">
          <div className="lawyer-header">
            <div>
              <h1>변호사 찾기</h1>
              <p>산재 사건 상담이 가능한 변호사를 확인하고 직접 의뢰할 수 있습니다.</p>
            </div>
          </div>

          {loading && (
            <div className="lawyer-state">변호사 목록을 불러오는 중입니다.</div>
          )}

          {!loading && errorMessage && (
            <div className="lawyer-state lawyer-state--error">{errorMessage}</div>
          )}

          {!loading && !errorMessage && lawyers.length === 0 && (
            <div className="lawyer-state">
              {hasFilter ? '조건에 맞는 변호사가 없습니다.' : '등록된 변호사가 없습니다.'}
            </div>
          )}

          {!loading && !errorMessage && lawyers.length > 0 && (
            <>
              <div className="lawyer-count">{lawyers.length}명의 변호사를 찾았습니다</div>
              <div className="lawyer-grid">
                {lawyers.map((lawyer) => (
                  <article key={lawyer.lawyerId} className="lawyer-card">
                    <div className="lawyer-card__top">
                      <div>
                        <h2>{lawyer.lawyerName}</h2>
                        <p>{lawyer.firmName}</p>
                      </div>
                      <span className="lawyer-card__badge">{lawyer.region}</span>
                    </div>

                    <div className="lawyer-card__info">
                      <span>경력 {lawyer.experienceYears || 0}년</span>
                      <span>{lawyer.specialty || '산재'}</span>
                    </div>

                    <Link to={`/lawyers/${lawyer.lawyerId}`}>
                      <Button variant="primary" size="sm" fullWidth>상세 보기</Button>
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
