// 통계 — 회원 가입/이탈 추이, AI 분석횟수 추이, 질병/직업 TOP 랭킹, 매칭 성사율, 변호사 풀 현황
// 전부 실제 API 연동 완료 (mock 데이터 없음)
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminBarChart from './AdminBarChart';
import {
  getMemberTrend, getMemberStats, getMatchStats, getLawyerStats,
  getAnalysisTrend, getAnalysisRanking, getTopJobKeywords, searchAnalysisCombo,
} from '../../api/adminStatsApi';
import './AdminPage.css';

const MEMBER_TREND_SERIES = [
  { key: 'signupCount', label: '가입', color: 'var(--color-primary)' },
  { key: 'withdrawalCount', label: '이탈', color: 'var(--color-danger-border)', variant: 'secondary' },
];

const ANALYSIS_TREND_SERIES = [{ key: 'count', color: 'var(--color-primary)' }];

function RankingList({ items, unit = '건' }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <div className="ad-empty">데이터가 없습니다.</div>;
  return (
    <div className="ad-ranking-list">
      {items.map((item, i) => (
        <div className="ad-ranking-row" key={item.label ?? i}>
          <span className="ad-ranking-rank">{i + 1}</span>
          <span className="ad-ranking-label">{item.label || '미상'}</span>
          <div className="ad-ranking-bar-track">
            <div className="ad-ranking-bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="ad-ranking-count">{item.count}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminStatisticsPage({ user, onLogout }) {
  const [range, setRange] = useState('daily');

  const [memberTrend, setMemberTrend] = useState([]);
  const [analysisTrend, setAnalysisTrend] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [matchStats, setMatchStats] = useState(null);
  const [lawyerStats, setLawyerStats] = useState(null);
  const [diseaseRanking, setDiseaseRanking] = useState([]);
  const [jobRanking, setJobRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 다중필터 조합 검색 — 날짜범위×구독여부×유저타입×직업. 위 daily/monthly range와 별개(7일/1개월/6개월)
  const [comboRange, setComboRange] = useState('week');
  const [comboSubscribe, setComboSubscribe] = useState(''); // ''=전체, '0'=Basic, '1'=Pro
  const [comboRole, setComboRole] = useState(''); // ''=전체, 'role_user', 'role_lawyer'
  const [comboJob, setComboJob] = useState(''); // ''=전체, 직업 키워드 TOP N 중 선택
  const [comboLimit, setComboLimit] = useState(100); // 후보 유저 상한, 0=전체
  const [jobKeywords, setJobKeywords] = useState([]);
  const [comboResult, setComboResult] = useState(null);
  const [comboLoading, setComboLoading] = useState(false);
  const [comboError, setComboError] = useState('');

  // 일별/월별 토글에 영향받는 추이 데이터
  useEffect(() => {
    let cancelled = false;
    async function loadTrends() {
      try {
        const [mt, at] = await Promise.all([getMemberTrend(range), getAnalysisTrend(range)]);
        if (cancelled) return;
        setMemberTrend(mt);
        setAnalysisTrend(at);
      } catch (err) {
        if (!cancelled) setError(err.message || '추이 데이터를 불러오지 못했습니다.');
      }
    }
    loadTrends();
    return () => { cancelled = true; };
  }, [range]);

  // 직업 필터 드롭다운 후보 — 최초 1회만 조회 (member.job이 자유입력이라 빈도 TOP N 단어로 대체)
  useEffect(() => {
    let cancelled = false;
    getTopJobKeywords(20).then((data) => { if (!cancelled) setJobKeywords(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // 검색 버튼 클릭 시에만 실행 — 필터를 자유롭게 조합한 뒤 한번에 조회
  async function handleComboSearch() {
    setComboLoading(true);
    setComboError('');
    try {
      const data = await searchAnalysisCombo({
        range: comboRange,
        subscribe: comboSubscribe === '' ? undefined : Number(comboSubscribe),
        role: comboRole === '' ? undefined : comboRole,
        job: comboJob === '' ? undefined : comboJob,
        limit: comboLimit,
      });
      setComboResult(data);
    } catch (err) {
      setComboError(err.message || '조합 검색에 실패했습니다.');
    } finally {
      setComboLoading(false);
    }
  }

  // 토글과 무관한 통계 — 최초 1회만 조회
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setLoading(true);
      setError('');
      try {
        const [ms, mas, ls, diseases, jobs] = await Promise.all([
          getMemberStats(),
          getMatchStats(),
          getLawyerStats(),
          getAnalysisRanking('disease', 10),
          getAnalysisRanking('job', 10),
        ]);
        if (cancelled) return;
        setMemberStats(ms);
        setMatchStats(mas);
        setLawyerStats(ls);
        setDiseaseRanking(diseases);
        setJobRanking(jobs);
      } catch (err) {
        if (!cancelled) setError(err.message || '통계 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  const proRate = memberStats && memberStats.totalCount > 0
    ? Math.round((memberStats.proCount / memberStats.totalCount) * 1000) / 10
    : 0;

  return (
    <AdminLayout
      title="통계"
      description="회원 가입/이탈, AI 분석 이용, 매칭 성사율, 변호사 풀 현황을 확인합니다."
      user={user}
      onLogout={onLogout}
    >
      {loading ? (
        <div className="ad-empty">통계를 불러오는 중...</div>
      ) : error ? (
        <div className="ad-empty">{error}</div>
      ) : (
        <>
          <div className="ad-stats-grid">
            <div className="ad-stat-card">
              <div className="ad-stat-card__label">전체 회원수</div>
              <div className="ad-stat-card__value">{(memberStats?.totalCount ?? 0).toLocaleString()}명</div>
              <div className="ad-stat-card__delta">Pro {proRate}%</div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-card__label">AI 무료횟수 소진율</div>
              <div className="ad-stat-card__value">{memberStats?.aiCountExhaustedRate ?? 0}%</div>
              <div className="ad-stat-card__delta">Basic 회원 중 3회 모두 사용</div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-card__label">의뢰글 매칭 성사율</div>
              <div className="ad-stat-card__value">{matchStats?.matchSuccessRate ?? 0}%</div>
              <div className="ad-stat-card__delta">전체 {matchStats?.totalCount ?? 0}건 중 {matchStats?.closedCount ?? 0}건 성사</div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-card__label">입찰 평균가</div>
              <div className="ad-stat-card__value">
                {matchStats?.avgBidPrice != null ? `₩${Math.round(matchStats.avgBidPrice).toLocaleString()}` : '—'}
              </div>
              <div className="ad-stat-card__delta">전체 입찰 기준</div>
            </div>
          </div>

          <div className="ad-tag-group" style={{ marginBottom: 16 }}>
            <button className={`ad-tag${range === 'daily' ? ' ad-tag--active' : ''}`} onClick={() => setRange('daily')}>일별</button>
            <button className={`ad-tag${range === 'monthly' ? ' ad-tag--active' : ''}`} onClick={() => setRange('monthly')}>월별</button>
          </div>

          <section className="ad-section">
            <div className="ad-section__head">
              <div>
                <div className="ad-section__title">회원 가입 / 이탈 추이</div>
                <div className="ad-section__desc">{range === 'daily' ? '최근 7일' : '최근 6개월'} 기준</div>
              </div>
            </div>
            <div className="ad-section__body">
              <AdminBarChart data={memberTrend} series={MEMBER_TREND_SERIES} />
            </div>
          </section>

          <section className="ad-section">
            <div className="ad-section__head">
              <div>
                <div className="ad-section__title">AI 분석횟수 추이</div>
                <div className="ad-section__desc">{range === 'daily' ? '최근 7일' : '최근 6개월'} 분석 요청 건수</div>
              </div>
            </div>
            <div className="ad-section__body">
              <AdminBarChart data={analysisTrend} series={ANALYSIS_TREND_SERIES} barWidth={22} />
            </div>
          </section>

          <div className="ad-grid-2">
            <section className="ad-section">
              <div className="ad-section__head">
                <div>
                  <div className="ad-section__title">질병 TOP 10</div>
                  <div className="ad-section__desc">분석 요청이 많은 질병 순</div>
                </div>
              </div>
              <div className="ad-section__body">
                <RankingList items={diseaseRanking} />
              </div>
            </section>

            <section className="ad-section">
              <div className="ad-section__head">
                <div>
                  <div className="ad-section__title">직업 TOP 10</div>
                  <div className="ad-section__desc">분석 요청이 많은 직업 순</div>
                </div>
              </div>
              <div className="ad-section__body">
                <RankingList items={jobRanking} />
              </div>
            </section>
          </div>

          <section className="ad-section">
            <div className="ad-section__head">
              <div>
                <div className="ad-section__title">다중필터 조합 검색</div>
                <div className="ad-section__desc">날짜범위·구독여부·유저타입·직업을 조합해 조건에 맞는 회원의 AI 분석 이용량을 조회합니다.</div>
              </div>
            </div>
            <div className="ad-section__body">
              <div className="ad-tag-group" style={{ marginBottom: 10 }}>
                <button className={`ad-tag${comboRange === 'week' ? ' ad-tag--active' : ''}`} onClick={() => setComboRange('week')}>최근 7일</button>
                <button className={`ad-tag${comboRange === 'month' ? ' ad-tag--active' : ''}`} onClick={() => setComboRange('month')}>1개월</button>
                <button className={`ad-tag${comboRange === 'halfyear' ? ' ad-tag--active' : ''}`} onClick={() => setComboRange('halfyear')}>6개월</button>
              </div>

              <div className="ad-toolbar" style={{ marginBottom: 10 }}>
                <select className="ad-select" value={comboSubscribe} onChange={(e) => setComboSubscribe(e.target.value)}>
                  <option value="">구독여부 전체</option>
                  <option value="1">Pro</option>
                  <option value="0">Basic</option>
                </select>
                <select className="ad-select" value={comboRole} onChange={(e) => setComboRole(e.target.value)}>
                  <option value="">유저타입 전체</option>
                  <option value="role_user">일반유저</option>
                  <option value="role_lawyer">변호사</option>
                </select>
                <select className="ad-select" value={comboJob} onChange={(e) => setComboJob(e.target.value)}>
                  <option value="">직업 전체</option>
                  {jobKeywords.map((k) => (
                    <option key={k.label} value={k.label}>{k.label} ({k.count})</option>
                  ))}
                </select>
              </div>

              <div className="ad-tag-group" style={{ marginBottom: 12 }}>
                <button className={`ad-tag${comboLimit === 100 ? ' ad-tag--active' : ''}`} onClick={() => setComboLimit(100)}>후보 100명</button>
                <button className={`ad-tag${comboLimit === 500 ? ' ad-tag--active' : ''}`} onClick={() => setComboLimit(500)}>후보 500명</button>
                <button className={`ad-tag${comboLimit === 1000 ? ' ad-tag--active' : ''}`} onClick={() => setComboLimit(1000)}>후보 1000명</button>
                <button className={`ad-tag${comboLimit === 0 ? ' ad-tag--active' : ''}`} onClick={() => setComboLimit(0)}>전체</button>
              </div>

              <button className="ad-tag ad-tag--active" onClick={handleComboSearch} disabled={comboLoading} style={{ marginBottom: 12 }}>
                {comboLoading ? '검색 중...' : '검색'}
              </button>

              {comboError && <div className="ad-empty">{comboError}</div>}

              {comboResult && (
                <div className="ad-stats-grid">
                  <div className="ad-stat-card">
                    <div className="ad-stat-card__label">조건에 맞는 회원 수</div>
                    <div className="ad-stat-card__value">{comboResult.sampleSize.toLocaleString()}명</div>
                  </div>
                  <div className="ad-stat-card">
                    <div className="ad-stat-card__label">기간 내 총 분석 요청</div>
                    <div className="ad-stat-card__value">{comboResult.totalAnalysisCount.toLocaleString()}건</div>
                  </div>
                  <div className="ad-stat-card">
                    <div className="ad-stat-card__label">작성한 의뢰글 수</div>
                    <div className="ad-stat-card__value">{comboResult.matchCount.toLocaleString()}건</div>
                  </div>
                  <div className="ad-stat-card">
                    <div className="ad-stat-card__label">매칭 성사율</div>
                    <div className="ad-stat-card__value">{comboResult.matchSuccessRate}%</div>
                    <div className="ad-stat-card__delta">{comboResult.matchCount.toLocaleString()}건 중 {comboResult.matchClosedCount.toLocaleString()}건 성사</div>
                  </div>
                  <div className="ad-stat-card">
                    <div className="ad-stat-card__label">낙찰 총액</div>
                    <div className="ad-stat-card__value">₩{comboResult.totalBidAmount.toLocaleString()}</div>
                    <div className="ad-stat-card__delta">성사된 의뢰글 기준</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="ad-section">
            <div className="ad-section__head">
              <div>
                <div className="ad-section__title">변호사 풀 현황</div>
                <div className="ad-section__desc">
                  등록 변호사 {lawyerStats?.totalCount ?? 0}명 · 평균 경력{' '}
                  {lawyerStats?.avgExperienceYears != null ? `${Math.round(lawyerStats.avgExperienceYears * 10) / 10}년` : '—'}
                </div>
              </div>
            </div>
            <div className="ad-section__body ad-grid-2">
              <div>
                <div className="ad-section__title" style={{ fontSize: 12, marginBottom: 10 }}>지역별 분포</div>
                <RankingList items={lawyerStats?.bySido ?? []} unit="명" />
              </div>
              <div>
                <div className="ad-section__title" style={{ fontSize: 12, marginBottom: 10 }}>전문분야별 분포</div>
                <RankingList items={lawyerStats?.bySpecialty ?? []} unit="명" />
              </div>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
