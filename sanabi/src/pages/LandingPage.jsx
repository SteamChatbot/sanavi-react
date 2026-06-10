import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import './LandingPage.css';

const FEATURES = [
  { icon: '⚡', title: 'AI 승인율 분석', desc: '직업·질병 조합 통계 기반 승인 가능성을 실시간으로 예측합니다.' },
  { icon: '📋', title: '증거 체크리스트', desc: '판례 기반 필요 서류를 자동으로 생성해 드립니다.' },
  { icon: '⚖️', title: '변호사 매칭',    desc: '산재 전문 변호사와 직접 연결해 드립니다.' },
];

const STATS = [
  { num: '113만+', label: '분석 데이터' },
  { num: '78%',    label: '평균 승인율' },
  { num: '4.9★',  label: '사용자 만족도' },
];

const REVIEWS = [
  { star: 5, text: 'AI 분석 덕분에 놓쳤던 서류를 발견했어요. 결국 승인 받았습니다!', name: '건설업 종사자 김○○', color: '#e0e7ff' },
  { star: 5, text: '어떤 서류를 준비해야 할지 막막했는데 체크리스트가 큰 도움이 됐어요.', name: '제조업 이○○', color: '#fde68a' },
  { star: 4, text: '변호사 매칭까지 한 번에 해결해서 너무 편리했습니다.', name: '서비스업 박○○', color: '#bbf7d0' },
];

export default function LandingPage({ user }) {
  return (
    <div className="landing">
      <Navbar user={user} />

      {/* HERO */}
      <section className="hero">
        <div className="hero__inner">
          <span className="hero__badge">113만 건 데이터 기반 AI 분석</span>
          <h1 className="hero__h1">산재, 혼자 싸우지<br />마세요</h1>
          <p className="hero__sub">AI가 증거 준비부터 승인율 예측까지<br />산재 신청의 전 과정을 도와드립니다.</p>
          <div className="hero__btns">
            <Link to="/agent"><Button variant="primary" size="lg">무료로 분석 시작</Button></Link>
            <button className="hero__btn-ghost">서비스 소개 보기</button>
          </div>
          <div className="hero__stats">
            {STATS.map(s => (
              <div key={s.label} className="hero__stat">
                <div className="hero__stat-num">{s.num}</div>
                <div className="hero__stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="section__inner">
          <h2 className="section__title">산내비가 도와드리는 것</h2>
          <div className="feature-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section section--gray">
        <div className="section__inner">
          <h2 className="section__title">실제 사용자 후기</h2>
          <div className="review-grid">
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-card__stars">{'★'.repeat(r.star)}{'☆'.repeat(5 - r.star)}</div>
                <p className="review-card__text">{r.text}</p>
                <div className="review-card__author">
                  <div className="review-card__avatar" style={{ background: r.color }} />
                  <span className="review-card__name">{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="section__inner" style={{ textAlign: 'center' }}>
          <h2 className="cta-banner__title">지금 바로 무료로 분석해보세요</h2>
          <p className="cta-banner__sub">가입 없이도 1회 무료 분석이 가능합니다</p>
          <Link to="/agent"><Button variant="primary" size="lg">무료 분석 시작하기</Button></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="section__inner">
          <p>© 2026 SANNAVI AI. 113만 건의 데이터를 기반으로 정밀 분석합니다.</p>
        </div>
      </footer>
    </div>
  );
}
