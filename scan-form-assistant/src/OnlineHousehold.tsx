import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import { backendUrl } from './BackendSettings';
import IdentityFields, { identityKeys } from './IdentityFields';
export type Portal = { id: string; token: string; doctorToken: string; expiresAt: number; caseId: string };
export function readPortal(): Portal | null {
  try { return JSON.parse(sessionStorage.getItem('scan-online-portal') || 'null'); } catch { return null; }
}
export function rememberPortal(value: Portal | null) {
  if (value) sessionStorage.setItem('scan-online-portal', JSON.stringify(value));
  else sessionStorage.removeItem('scan-online-portal');
}
export function OnlineHousehold({ fields }: { fields: string[][] }) {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const id = params.get('household') || '';
  const token = params.get('token') || '';
  const endpoint=params.get('backend');
  if(endpoint) { try { const u=new URL(endpoint); if(u.protocol==='https:' && !u.username && !u.password && !u.search && !u.hash) localStorage.setItem('scan-backend-url',endpoint); } catch { /* Invalid backend remains disconnected. */ } }
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [dummy, setDummy] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.post('/api/household-open', { id, token }).then(({ data }) => setState(data.submitted ? 'submitted' : 'open')).catch(() => { setState('unavailable'); setMessage('This link is invalid, expired or closed. Please contact the attending doctor.'); });
  }, [id, token]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!confirmed || !dummy) { setMessage('Please confirm your account and dummy information.'); return; }
    setBusy(true); setMessage('');
    try {
      await api.post('/api/household-submit', { id, token, fields: Object.fromEntries(fields.map(([k]) => [k, answers[k] || ''])), confirmed, dummyOnly: dummy });
      setState('submitted'); setAnswers({});
    } catch { setMessage('Could not submit. Check your name, relationship and connection, then retry. If already submitted or expired, contact the doctor.'); }
    finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 760, margin: 'auto' }}><div className="eyebrow">CHILD AND FAMILY INFORMATION</div><h1>Help us complete the picture.</h1><div className="banner">Dummy-data pilot. Use fictional information only. Your answers are stored online for doctor review. The link expires after 24 hours; the doctor can delete the questionnaire and answers.</div>
    {state === 'loading' && <p>Opening questionnaire…</p>}
    {state === 'unavailable' && <div role="alert" className="notice">{message}</div>}
    {state === 'submitted' && <section className="card"><h2>Thank you. Your answers have been submitted.</h2><p>The attending doctor will review them. This does not submit an official report.</p></section>}
    {state === 'open' && <form className="card" onSubmit={submit}><h2>Child and Family Information Form</h2><p>Please provide your own account. Write unknown if unavailable. You do not need to download or return any files.</p><IdentityFields values={answers} change={next=>setAnswers(next)}/><div className="field-grid">{fields.filter(([key])=>!identityKeys.includes(key)).map(([key,label]) => <label key={key}>{label}<textarea required={key === 'respondent' || key === 'guardian_relationship'} value={answers[key] || ''} maxLength={5000} onChange={e => setAnswers(a => ({ ...a, [key]: e.target.value }))}/></label>)}</div><label className="check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>These answers reflect my account.</label><label className="check"><input type="checkbox" checked={dummy} onChange={e => setDummy(e.target.checked)}/>I am using fictional / dummy information only.</label>{message && <p role="alert" className="notice">{message}</p>}<button className="primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit answers'}</button></form>}
  </main>;
}
export function OnlineControls({ portal, setPortal, caseId, receive }: { portal: Portal | null; setPortal: (p: Portal | null) => void; caseId: string; receive: (response: unknown) => Promise<void> }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dummy, setDummy] = useState(false);
  const link = portal ? window.location.href.split('#')[0] + '#household=' + encodeURIComponent(portal.id) + '&token=' + encodeURIComponent(portal.token) + '&backend=' + encodeURIComponent(backendUrl()) : '';
  async function create() {
    if (!dummy) { setMessage('Confirm dummy information first.'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/api/household-links', { caseId, dummyOnly: true });
      setPortal(data); rememberPortal(data); setMessage('Link created. Share only the household link below.');
    } catch { setMessage('Unable to create link. Retry.'); }
    finally { setBusy(false); }
  }
  async function check() {
    if (!portal) return;
    setBusy(true);
    try {
      const { data } = await api.post('/api/household-response', { id: portal.id, doctorToken: portal.doctorToken });
      if (data.response) { await receive(data.response); setMessage('Answers received for doctor review.'); }
      else setMessage('Waiting for household answers. Check again after submission.');
    } catch { setMessage('Unable to retrieve answers. The link may be expired or closed; retry if connection failed.'); }
    finally { setBusy(false); }
  }
  async function revoke() {
    if (!portal || !window.confirm('Close this link and delete its online answers?')) return;
    setBusy(true);
    try { await api.post('/api/household-delete', { id: portal.id, doctorToken: portal.doctorToken }); rememberPortal(null); setPortal(null); setMessage('Link closed and online answers deleted. Imported doctor draft remains.'); }
    catch { setMessage('Deletion failed. Retry before leaving the session.'); }
    finally { setBusy(false); }
  }
  return <div><h3>Online household questionnaire</h3><p>Share the link below. The household answers directly online. Keep this doctor tab open; its access key is retained only in this tab session.</p>
    {!portal ? <><label className="check"><input type="checkbox" checked={dummy} onChange={e => setDummy(e.target.checked)}/>This questionnaire will use dummy information only.</label><button className="primary" disabled={busy} onClick={create}>Create online questionnaire</button></> : <><label>Household link<input readOnly value={link} onFocus={e => e.target.select()}/></label><p>Expires: {new Date(portal.expiresAt).toLocaleString()}</p><div className="actions"><button onClick={async () => { try { await navigator.clipboard.writeText(link); setMessage('Link copied.'); } catch { setMessage('Select the link above and copy it manually.'); } }}>Copy household link</button><a href={link} target="_blank" rel="noopener noreferrer">Open household form</a><button disabled={busy} onClick={check}>Check for answers</button><button disabled={busy} onClick={revoke}>Close link and delete answers</button></div></>}
    {message && <p role="status" className="notice">{message}</p>}<hr/>
  </div>;
}
