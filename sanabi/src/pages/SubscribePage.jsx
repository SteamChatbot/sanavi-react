import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Badge from '../components/Badge';
import './SubscribePage.css';

const PLANS = [
  {
    id: 'basic', name: 'Basic', price: '₩0', period: '/ 월', badge: '무료', badgeType: 'primary', featured: false,
    features: [
      { text: 'AI 분석 3회 / 월', ok: true },
      { text: '증거 체크리스트 제공', ok: true },
      { text: '대화 내역 저장', ok: false },
      { text: 'PDF 리포트 다운로드', ok: false },
    ],
    cta: '현재 플랜', ctaVariant: 'outline',
  },
  {
    id: 'pro', name: 'Pro', price: '₩9,900', period: '/ 월', badge: '인기', badgeType: 'pro', featured: true,
    features: [
      { text: 'AI 분석 무제한', ok: true },
      { text: '대화 내역 저장', ok: true },
      { text: 'PDF 리포트 다운로드', ok: true },
      { text: '우선 고객 지원', ok: true },
    ],
    cta: 'Pro 시작하기', ctaVariant: 'primary',
  },
];

export default function SubscribePage({ user }) {
  const [current, setCurrent] = useState('basic');

  return (
    <div className="subscribe-page">
      <Navbar user={user} />
      <div className="subscribe-container">
        <div className="subscribe-header">
          <h1>당신에게 맞는 플랜을 선택하세요</h1>
          <p>구독 여부에 따라 AI 사용 횟수 및 기능이 달라집니다</p>
        </div>
        <div className="plan-grid">
          {PLANS.map(plan => (
            <div key={plan.id} className={`plan-card${plan.featured ? ' plan-card--featured' : ''}`}>
              <Badge type={plan.badgeType}>{plan.badge}</Badge>
              <h2 className="plan-card__name">{plan.name}</h2>
              <div className="plan-card__price">
                {plan.price} <span>{plan.period}</span>
              </div>
              <div className="plan-card__divider" />
              <ul className="plan-card__features">
                {plan.features.map((f, i) => (
                  <li key={i} className={`plan-feature${f.ok ? ' plan-feature--ok' : ' plan-feature--no'}`}>
                    <span className="plan-feature__icon">{f.ok ? '✓' : '✗'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.ctaVariant}
                size="md"
                fullWidth
                onClick={() => setCurrent(plan.id)}
                disabled={current === plan.id}
              >
                {current === plan.id ? '현재 플랜' : plan.cta}
              </Button>
            </div>
          ))}
        </div>
        <p className="subscribe-note">결제 취소는 언제든지 가능하며, 취소 후에도 기간 만료까지 Pro 기능을 이용할 수 있습니다.</p>
      </div>
    </div>
  );
}
