// 메일발송 — 관리자가 조건별로 대상 회원을 골라 템플릿 기반 메일을 일괄 발송
// ?userIds=a,b,c 로 들어오면(회원관리 페이지에서 선택 후 연동하는 통로 — 아직 회원관리 쪽 미구현) 필터 대신 그 목록을 그대로 대상으로 씀
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import AdminLayout from './AdminLayout';
import { getMailJobOptions, getMailAudienceCount, sendBulkMail } from '../../api/adminMailApi';
import './AdminPage.css';
import './AdminMailPage.css';

const BRAND_HEADER = `
  <div style="background:#1a5c38; padding: 28px 32px;">
    <h1 style="color:#fff; font-size:20px; margin:0;">산내비</h1>
    <p style="color:#a8d5bc; font-size:13px; margin:6px 0 0;">산업재해 보험금 청구 AI 분석 서비스</p>
  </div>`;

// MatchNotificationService의 HTML 이메일 스타일(브랜드 헤더, #1a5c38) 재사용 — 고정 템플릿, 선택 후 자유 편집 가능
const MAIL_TEMPLATES = [
  {
    key: 'thanks',
    label: '구독감사+혜택안내',
    subject: '[산내비] 구독해주셔서 감사합니다',
    body: `${BRAND_HEADER}
  <div style="padding: 36px 32px; font-family:'Apple SD Gothic Neo',sans-serif; color:#222;">
    <h2 style="font-size:18px; margin:0 0 8px;">구독해주셔서 감사합니다</h2>
    <p style="color:#555; font-size:14px; line-height:1.8;">
      안녕하세요, 산내비 Pro를 구독해 주셔서 진심으로 감사드립니다.<br>
      Pro 구독 중에는 AI 분석 횟수 제한 없이 자유롭게 이용하실 수 있습니다.
    </p>
    <p style="font-size:13px; color:#888; line-height:1.8; border-top:1px solid #eee; padding-top:20px; margin-top:28px;">
      궁금하신 점은 산내비 고객센터로 문의해 주세요.<br><br>
      감사합니다.<br><strong>산내비 팀 드림</strong>
    </p>
  </div>`,
  },
  {
    key: 'promo',
    label: '프로모션',
    subject: '[산내비] 지금 Pro로 업그레이드하고 무제한으로 이용하세요',
    body: `${BRAND_HEADER}
  <div style="padding: 36px 32px; font-family:'Apple SD Gothic Neo',sans-serif; color:#222;">
    <h2 style="font-size:18px; margin:0 0 8px;">Pro 구독 안내</h2>
    <p style="color:#555; font-size:14px; line-height:1.8;">
      안녕하세요, 산내비입니다.<br>
      Pro로 업그레이드하시면 AI 분석 횟수 제한 없이 이용하실 수 있습니다.
    </p>
    <p style="font-size:13px; color:#888; line-height:1.8; border-top:1px solid #eee; padding-top:20px; margin-top:28px;">
      감사합니다.<br><strong>산내비 팀 드림</strong>
    </p>
  </div>`,
  },
  {
    key: 'notice',
    label: '공지',
    subject: '[산내비] 안내드립니다',
    body: `${BRAND_HEADER}
  <div style="padding: 36px 32px; font-family:'Apple SD Gothic Neo',sans-serif; color:#222;">
    <h2 style="font-size:18px; margin:0 0 8px;">안내드립니다</h2>
    <p style="color:#555; font-size:14px; line-height:1.8;">
      안녕하세요, 산내비입니다.<br>
      내용을 여기에 작성해 주세요.
    </p>
    <p style="font-size:13px; color:#888; line-height:1.8; border-top:1px solid #eee; padding-top:20px; margin-top:28px;">
      감사합니다.<br><strong>산내비 팀 드림</strong>
    </p>
  </div>`,
  },
];

const SUBSCRIBE_TAGS = [
  { value: '', label: '전체' },
  { value: '0', label: 'Basic' },
  { value: '1', label: 'Pro' },
];

const ROLE_TAGS = [
  { value: '', label: '전체' },
  { value: 'role_user', label: '일반회원' },
  { value: 'role_lawyer', label: '변호사' },
];

export default function AdminMailPage({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const preselectedUserIds = useMemo(() => {
    const raw = searchParams.get('userIds');
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : null;
  }, [searchParams]);

  const [templateKey, setTemplateKey] = useState(MAIL_TEMPLATES[0].key);
  const [subject, setSubject] = useState(MAIL_TEMPLATES[0].subject);
  const [htmlBody, setHtmlBody] = useState(MAIL_TEMPLATES[0].body);

  const [jobOptions, setJobOptions] = useState([]);
  const [subscribeFilter, setSubscribeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [jobs, setJobs] = useState([]);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [excludeBlacklist, setExcludeBlacklist] = useState(true);
  const [excludeLawyer, setExcludeLawyer] = useState(false);
  const [excludeAlreadyPro, setExcludeAlreadyPro] = useState(false);

  const [targetCount, setTargetCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMailJobOptions().then(setJobOptions).catch(() => {});
  }, []);

  function applyTemplate(key) {
    const template = MAIL_TEMPLATES.find((t) => t.key === key);
    setTemplateKey(key);
    setSubject(template.subject);
    setHtmlBody(template.body);
  }

  function buildFilter() {
    if (preselectedUserIds) {
      return { userIds: preselectedUserIds };
    }
    return {
      subscribe: subscribeFilter === '' ? null : Number(subscribeFilter),
      role: roleFilter || null,
      jobs,
      createdFrom: createdFrom || null,
      createdTo: createdTo || null,
      excludeBlacklist,
      excludeLawyer,
      excludeAlreadyPro,
    };
  }

  async function handleCountAudience() {
    setCountLoading(true);
    setError('');
    try {
      const { targetCount: count } = await getMailAudienceCount(buildFilter());
      setTargetCount(count);
    } catch (err) {
      setError(err.message || '대상 조회에 실패했습니다.');
    } finally {
      setCountLoading(false);
    }
  }

  async function handleSend() {
    if (targetCount === null) return;
    if (!window.confirm(`${targetCount}명에게 메일을 발송하시겠습니까?`)) return;

    setSending(true);
    setError('');
    try {
      const { targetCount: count } = await sendBulkMail({ filter: buildFilter(), subject, htmlBody });
      alert(`${count}명 대상 발송을 시작했습니다.`);
    } catch (err) {
      setError(err.message || '발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  // 선택된 회원(userIds) 모드는 "대상 조회" 단계가 없으므로 인원수를 그 자리에서 다시 확인 후 바로 확인창 → 발송
  async function handleSendPreselected() {
    setSending(true);
    setError('');
    try {
      const filter = buildFilter();
      const { targetCount: count } = await getMailAudienceCount(filter);
      if (!window.confirm(`${count}명에게 메일을 발송하시겠습니까?`)) return;
      const result = await sendBulkMail({ filter, subject, htmlBody });
      alert(`${result.targetCount}명 대상 발송을 시작했습니다.`);
    } catch (err) {
      setError(err.message || '발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminLayout
      title="메일발송"
      description="조건에 맞는 회원을 필터링해 템플릿 기반 메일을 일괄 발송합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">메일 내용</div>
            <div className="ad-section__desc">템플릿을 고르면 제목/본문이 채워집니다 — 그 다음 자유롭게 수정하세요.</div>
          </div>
        </div>
        <div className="ad-section__body">
          <div className="ad-tag-group" style={{ marginBottom: 16 }}>
            {MAIL_TEMPLATES.map((t) => (
              <button
                key={t.key}
                className={`ad-tag${templateKey === t.key ? ' ad-tag--active' : ''}`}
                onClick={() => applyTemplate(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="ad-select ad-mail__subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="제목"
          />
          <textarea
            className="ad-mail__body"
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            rows={12}
          />
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">발송 대상</div>
            <div className="ad-section__desc">
              {preselectedUserIds
                ? `선택된 회원 ${preselectedUserIds.length}명에게 발송합니다.`
                : '조건을 설정하고 "대상 조회"를 눌러 인원수를 확인한 뒤 발송하세요.'}
            </div>
          </div>
        </div>

        {!preselectedUserIds && (
          <div className="ad-section__body">
            <div className="ad-mail__filter-row">
              <div>
                <div className="ad-mail__filter-label">구독상태</div>
                <div className="ad-tag-group">
                  {SUBSCRIBE_TAGS.map((t) => (
                    <button
                      key={t.value}
                      className={`ad-tag${subscribeFilter === t.value ? ' ad-tag--active' : ''}`}
                      onClick={() => setSubscribeFilter(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="ad-mail__filter-label">유저타입</div>
                <div className="ad-tag-group">
                  {ROLE_TAGS.map((t) => (
                    <button
                      key={t.value}
                      className={`ad-tag${roleFilter === t.value ? ' ad-tag--active' : ''}`}
                      onClick={() => setRoleFilter(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="ad-mail__filter-label">직업</div>
                <MultiSelectDropdown options={jobOptions} selected={jobs} onChange={setJobs} placeholder="전체" />
              </div>
              <div>
                <div className="ad-mail__filter-label">가입기간</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="date" className="ad-select" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
                  <input type="date" className="ad-select" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="ad-mail__exclude-row">
              <label><input type="checkbox" checked={excludeBlacklist} onChange={(e) => setExcludeBlacklist(e.target.checked)} /> 블랙리스트 회원 제외</label>
              <label><input type="checkbox" checked={excludeLawyer} onChange={(e) => setExcludeLawyer(e.target.checked)} /> 변호사 계정 제외</label>
              <label><input type="checkbox" checked={excludeAlreadyPro} onChange={(e) => setExcludeAlreadyPro(e.target.checked)} /> 이미 Pro 구독중 제외</label>
            </div>

            <Button size="sm" variant="outline" loading={countLoading} onClick={handleCountAudience}>대상 조회</Button>
            {targetCount !== null && <span className="ad-mail__count">대상 {targetCount}명</span>}
          </div>
        )}

        {error && <div className="ad-empty">{error}</div>}

        <div className="ad-section__body" style={{ paddingTop: 0 }}>
          <Button
            loading={sending}
            disabled={preselectedUserIds ? false : targetCount === null}
            onClick={preselectedUserIds ? handleSendPreselected : handleSend}
          >
            발송
          </Button>
        </div>
      </section>
    </AdminLayout>
  );
}
