import { useState, useEffect } from 'react';
import { api } from './api';
import { FIELDS } from './fields';
import PdfWorkspace from './PdfWorkspace';
import CaseStorage, { readDraft, type CaseDraft } from './CaseStorage';
import {
  ClipboardList,
  ShieldCheck,
  FileText,
  ArrowRight,
  Download,
  CheckCircle2,
} from 'lucide-react';
import './scan.css';
import BackendSettings from './BackendSettings';
import IdentityFields, { identityKeys } from './IdentityFields';
import { OnlineHousehold, OnlineControls, readPortal, rememberPortal, type Portal } from './OnlineHousehold';

type Values = Record<string, string>;
const sample =
  'DUMMY CASE. Alleged scald injury involving the hand after the child dipped his hand into hot Maggi soup at approximately 9.00 PM yesterday. Father reportedly witnessed the incident and attempted to stop the child unsuccessfully. Father immediately removed the hand and cooled it with running water. The child attended a clinic and was brought to A&E today for further evaluation. Possible environmental safety concern documented; intention unclear.';
const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  );
function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export default function ScanApp() {
  const [initial] = useState(() => readDraft());
  const [tab, setTab] = useState(window.location.hash === '#templates' ? 'PDF templates' : 'History');
  const [notes, setNotes] = useState(initial.notes || '');
  const [values, setValues] = useState<Values>(initial.values || {});
  const [sources, setSources] = useState<Values>(initial.sources || {});
  const [household, setHousehold] = useState<Values>(initial.household || {});
  const [resolved, setResolved] = useState<Values>(initial.resolved || {});
  const [dummy, setDummy] = useState(initial.dummy === true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [status, setStatus] = useState('Draft');
  const [recipient, setRecipient] = useState('');
  const [method, setMethod] = useState('');
  const [sentAt, setSentAt] = useState('');
  const [sentLog, setSentLog] = useState('');
  const [portal, setPortal] = useState<Portal | null>(() => readPortal());
  const [caseId, setCaseId] = useState(() => initial.caseId || readPortal()?.caseId || crypto.randomUUID());
  const draft: CaseDraft = { version:2, caseId, notes, values, sources, household, resolved, portal, dummy, sentLog };
  useEffect(() => {
    if (new URLSearchParams(window.location.hash.slice(1)).has('household')) return;
    try { sessionStorage.setItem('scan-case-draft', JSON.stringify(draft)); } catch { /* Backups remain available if storage is full. */ }
  }, [caseId,notes,values,sources,household,resolved,portal,dummy,sentLog]);
  async function restoreCase(next:CaseDraft) {
    if (!window.confirm('Replace the case in this tab? Download a backup first if needed.')) throw new Error('Restore cancelled.');
    if (portal && (next.portal as Portal|null)?.id !== portal.id) {
      await api.post('/api/household-delete',{id:portal.id,doctorToken:portal.doctorToken});
    }
    const nextPortal=next.portal as Portal|null;
    setPortal(nextPortal);rememberPortal(nextPortal);
    setCaseId(next.caseId);setNotes(next.notes);setValues(next.values);setSources(next.sources);
    setHousehold(next.household);setResolved(next.resolved);setDummy(next.dummy);setSentLog(next.sentLog);
    setReviewed(false);setStatus('Draft');setTab('Information');
  }
  const invalidate = () => {
    setReviewed(false);
    setStatus('Draft');
    setSentLog('');
  };
  useEffect(() => {
    const signedOut=()=>{
      rememberPortal(null);setPortal(null);sessionStorage.removeItem('scan-case-draft');
      setNotes('');setValues({});setSources({});setHousehold({});setResolved({});
      setCaseId(crypto.randomUUID());setReviewed(false);setStatus('Draft');setSentLog('');setTab('History');
      setMessage('Signed out. Case data has been cleared from this tab; saved account cases remain private.');
    };
    window.addEventListener('scan-signed-out',signedOut);
    return ()=>window.removeEventListener('scan-signed-out',signedOut);
  },[]);
  const setValue = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }));
    setResolved(r => { const next={...r}; delete next[key]; return next; });
    setSources(s => ({ ...s, [key]: 'Doctor entry' }));
    invalidate();
  };
  const conflicts = FIELDS.filter(
    ([key]) =>
      household[key] &&
      values[key] &&
      household[key].trim() !== values[key].trim() &&
      !resolved[key]
  );
  const missing = FIELDS.filter(([key]) => !values[key]?.trim());
  async function extract() {
    if (!dummy || !notes.trim()) {
      setMessage('Confirm dummy data and paste a history first.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const { data } = await api.post('/api/extract', {
        notes,
        dummyOnly: dummy,
      });
      const next: Values = {};
      for (const [key] of FIELDS)
        next[key] =
          typeof data.fields?.[key] === 'string' ? data.fields[key] : '';
      setValues(next);
      setSources(
        Object.fromEntries(
          FIELDS.map(([k]) => [k, 'AI draft from pasted notes'])
        )
      );
      setHousehold({});
      setResolved({});
      invalidate();
      setTab('Information');
      setMessage('Draft extracted. Confirm dates and attribution before use.');
    } catch {
      setMessage(
        'Extraction failed. Retry or use Information to enter fields manually.'
      );
    } finally {
      setBusy(false);
    }
  }
  function questionnaire() {
    const inputs = FIELDS.filter(f => f[2] === 'household')
      .map(
        ([key, label]) =>
          '<label>' +
          escapeHtml(label) +
          '<textarea name="' +
          key +
          '">' +
          escapeHtml(values[key] || '') +
          '</textarea></label>'
      )
      .join('');
    const html =
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Child and Family Information Form</title><style>body{font:16px system-ui;background:#f5f7fa;color:#172638;max-width:680px;margin:24px auto;padding:20px}label{display:block;margin:18px 0}textarea{box-sizing:border-box;display:block;width:100%;min-height:64px;padding:12px;border:1px solid #bbc8d3;border-radius:8px;font:inherit}button{background:#12665e;color:white;border:0;border-radius:8px;padding:14px;font:inherit}</style></head><body><h1>Child and Family Information Form</h1><p>Dummy-data pilot. This form supports the child’s assessment and documentation. Confirm or correct the supplied account. Write unknown if unavailable. Answers remain on this device until you download and return the response file to the attending doctor.</p><form id="f">' +
      inputs +
      '<label><input type="checkbox" id="confirm" required> I confirm these answers reflect my account.</label><button>Download answers</button></form><p id="msg"></p><script>document.getElementById("f").onsubmit=function(e){e.preventDefault();const fields=Object.fromEntries(new FormData(e.target));const payload={version:1,caseId:' +
      JSON.stringify(caseId) +
      ',fields,confirmed:true};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));a.download="household-answers.json";a.click();document.getElementById("msg").textContent="Answers downloaded. Return the file to the attending doctor."};</script></body></html>';
    download(html.replace('</body>', "<script>const form=document.getElementById(\"f\");const type=document.createElement(\"select\");type.name=\"child_id_type\";type.innerHTML=\"<option>Malaysian IC</option><option>Passport</option><option>Other document</option>\";const typeOld=form.elements.namedItem(\"child_id_type\");if(typeOld)typeOld.replaceWith(type);function recalc(){const raw=form.elements.namedItem(\"child_id\").value.replace(/[-\\\\s]/g,\"\");const dob=form.elements.namedItem(\"child_dob\");const age=form.elements.namedItem(\"child_age\");const sex=form.elements.namedItem(\"child_gender\");if(type.value!==\"Malaysian IC\"||!/^\\\\d{12}$/.test(raw)){dob.value=\"\";age.value=\"\";sex.value=\"\";return;}const today=new Intl.DateTimeFormat(\"en-CA\",{timeZone:\"Asia/Kuala_Lumpur\",year:\"numeric\",month:\"2-digit\",day:\"2-digit\"}).format(new Date());let year=2000+Number(raw.slice(0,2));if(year>Number(today.slice(0,4)))year-=100;const value=year+\"-\"+raw.slice(2,4)+\"-\"+raw.slice(4,6);const date=new Date(value+\"T00:00:00Z\");if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value||value>today){dob.value=\"\";age.value=\"\";sex.value=\"\";return;}dob.value=value;let years=Number(today.slice(0,4))-year;if(today.slice(5)<value.slice(5))years--;age.value=years+\" years\";sex.value=Number(raw[11])%2?\"Male\":\"Female\";}form.elements.namedItem(\"child_id\").addEventListener(\"input\",recalc);type.addEventListener(\"change\",recalc);</script>" + '</body>'), 'household-questionnaire.html', 'text/html');
    setMessage(
      'Household questionnaire downloaded. It contains household fields only.'
    );
  }
  async function importAnswers(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (
        parsed.caseId !== caseId ||
        parsed.confirmed !== true ||
        !parsed.fields ||
        typeof parsed.fields !== 'object'
      )
        throw new Error();
      const next: Values = {};
      for (const [k, , role] of FIELDS)
        if (role === 'household' && typeof parsed.fields[k] === 'string')
          next[k] = parsed.fields[k];
      setHousehold(next);
      setResolved({});
      setValues(old => {
        const v = { ...old };
        for (const k of Object.keys(next)) if (!v[k]) v[k] = next[k];
        return v;
      });
      setSources(old => {
        const s = { ...old };
        for (const k of Object.keys(next))
          if (!values[k]) s[k] = 'Household response';
        return s;
      });
      invalidate();
      setTab('Review');
      setMessage(
        'Answers imported. Differences remain visible for doctor review.'
      );
    } catch {
      setMessage(
        'Invalid response file or case mismatch. No answers imported.'
      );
    }
  }
  async function clear() {
    if (!window.confirm('Clear this case and all answers from this session?'))
      return;
    if (portal) {
      try { await api.post('/api/household-delete', { id: portal.id, doctorToken: portal.doctorToken }); }
      catch { setMessage('Could not delete online questionnaire. Retry Clear case.'); return; }
      rememberPortal(null); setPortal(null);
    }
    setNotes('');
    setValues({});
    setSources({});
    setHousehold({});
    setResolved({});
    setCaseId(crypto.randomUUID());
    setReviewed(false);
    setStatus('Draft');
    setSentLog('');
    setRecipient('');
    setMethod('');
    setSentAt('');
    setMessage('Case cleared.');
    setTab('History');
  }
  if (new URLSearchParams(window.location.hash.slice(1)).has('household')) {
    return <OnlineHousehold fields={FIELDS.filter(f => f[2] === 'household')} />;
  }
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <ShieldCheck size={30} />
          <span>
            SCAN<span className="brand-sub">FORM ASSISTANT</span>
          </span>
        </div>
        <div className="workspace-label">CASE WORKSPACE</div>
        {['History', 'Information', 'Household', 'Review', 'PDF templates'].map(
          (s, i) => (
            <button
              className={'nav ' + (tab === s ? 'active' : '')}
              key={s}
              onClick={() => setTab(s)}
            >
              <span className="step">{i + 1}</span>
              {s}
            </button>
          )
        )}
        <div className="sidebar-foot">
          <span className="pill">DUMMY-DATA PILOT</span>
          <p>
            One case. One reviewed record.
            <br />
            Two official forms.
          </p>
          <button className="clear" onClick={clear}>
            Clear case
          </button>
        </div>
      </aside>
      <main><BackendSettings/>
        <CaseStorage draft={draft} restore={restoreCase}/>
        <header>
          <div>
            <div className="eyebrow">CHILD PROTECTION · BORANG 9 + JKM</div>
            <h1>
              {tab === 'History'
                ? 'Start with the story.'
                : tab === 'Information'
                  ? 'Fill the gaps.'
                  : tab === 'Household'
                    ? 'Let the family answer.'
                    : tab === 'Review'
                      ? 'Review the whole picture.'
                      : 'Prepare the official forms.'}
            </h1>
            <p className="subtitle">
              Paste once. Collect missing details. Review before generating.
            </p>
          </div>
          <button type="button" onClick={()=>setTab('PDF templates')}>Upload PDFs</button>
          <span className="status">
            <span /> {status}
          </span>
        </header>
        <div className="banner">
          <ShieldCheck size={18} />
          <span>
            Fictional information only. AI extraction sends notes to the hosted
            service. Case answers stay in this tab session, including after refresh. Online answers and account saves expire after 24 hours. This pilot has no clinical approval.
          </span>
        </div>
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        {tab === 'History' && (
          <div className="layout">
            <section className="card">
              <div className="card-head">
                <ClipboardList size={20} />
                <h2>Clinical history</h2>
                <button
                  className="text-button"
                  onClick={() => {
                    setNotes(sample);
                    setDummy(true);
                  }}
                >
                  Load scald example
                </button>
              </div>
              <p>
                Paste the documented history, findings and actions. Unknown
                information stays unknown.
              </p>
              <textarea
                aria-label="Clinical history"
                className="notes"
                value={notes}
                onChange={e => {
                  setNotes(e.target.value);
                  invalidate();
                }}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={dummy}
                  onChange={e => setDummy(e.target.checked)}
                />{' '}
                I am using fictional / dummy information only.
              </label>
              <div className="actions">
                <button className="primary" disabled={busy} onClick={extract}>
                  {busy ? 'Extracting…' : 'Identify required information'}
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => setTab('Information')}>
                  Enter manually
                </button>
              </div>
            </section>
            <section className="card guide">
              <div className="eyebrow">YOUR WORKFLOW</div>
              <h2>From notes to a reviewed draft</h2>
              {[
                'Extract documented facts',
                'Separate household and doctor fields',
                'Collect household answers',
                'Resolve differences and review',
                'Map, preview and export PDFs',
              ].map((s, i) => (
                <div className="guide-step" key={s}>
                  <span>{i + 1}</span>
                  {s}
                </div>
              ))}
              <div className="callout">
                Household reports, clinical findings and safeguarding
                interpretation keep their own sources.
              </div>
            </section>
          </div>
        )}
        {tab === 'Information' && (
          <section className="card">
            <div className="card-head">
              <h2>Shared case record</h2>
              <span className="pill">
                {missing.length} fields to complete or mark unknown
              </span>
            </div>
            <div className="field-grid">
              <IdentityFields values={values} change={(next,key) => {
                setValues(next);
                setResolved(r => Object.fromEntries(Object.entries(r).filter(([k]) => !identityKeys.includes(k))));
                setSources(s => ({...s, ...Object.fromEntries(identityKeys.map(k=>[k, key==='child_id' && next.child_id_type !== 'Passport' ? 'Derived from IC - confirm' : 'Doctor entry']))}));
                invalidate();
              }} />
              {FIELDS.filter(([key])=>!identityKeys.includes(key)).map(([key, label, role]) => (
                <label key={key}>
                  {label}
                  <span className="field-meta">
                    {role} · {sources[key] || 'Not supplied'}
                  </span>
                  <textarea
                    aria-label={label}
                    value={values[key] || ''}
                    onChange={e => setValue(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <button className="primary" onClick={() => setTab('Household')}>
              Prepare household questionnaire
              <ArrowRight size={16} />
            </button>
          </section>
        )}
        {tab === 'Household' && (
          <div className="layout">
            <section className="card">
              <h2>Child and Family Information Form</h2>
              <OnlineControls portal={portal} setPortal={setPortal} caseId={caseId} receive={async response => {
                await importAnswers(new File([JSON.stringify(response)], 'household-answers.json', { type: 'application/json' }));
              }} />
              <p>
                The downloaded form contains household details and their
                reported account only. Clinical findings and internal
                safeguarding notes are excluded.
              </p>
              <p>
                Optional offline method: download the questionnaire, let
                the household complete it, then import their downloaded answer
                file here. Keep this doctor session open.
              </p>
              <button className="primary" onClick={questionnaire}>
                <Download size={17} />
                Download household questionnaire
              </button>
              <hr />
              <label className="upload">
                Import household answers
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={e => importAnswers(e.target.files?.[0])}
                />
              </label>
            </section>
            <section className="card">
              <h2>Questions included</h2>
              {FIELDS.filter(f => f[2] === 'household').map(([key, label]) => (
                <div className="question" key={key}>
                  {label}
                  <span>{values[key] ? 'Confirm / correct' : 'Missing'}</span>
                </div>
              ))}
            </section>
          </div>
        )}
        {tab === 'Review' && (
          <section className="card">
            <h2>Doctor review</h2>
            <p>
              {conflicts.length} unresolved differences · {missing.length} blank
              fields. Enter unknown, not obtained or not applicable explicitly
              where appropriate.
            </p>
            {FIELDS.filter(
              ([k]) =>
                household[k] &&
                values[k] &&
                household[k].trim() !== values[k].trim()
            ).map(([k, label]) => (
              <div className="conflict" key={k}>
                <strong>{label}</strong>
                <div className="field-grid">
                  <div>
                    Doctor / notes<p>{values[k]}</p>
                  </div>
                  <div>
                    Household account<p>{household[k]}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setValues(v => ({ ...v, [k]: household[k] }));
                    setSources(s => ({
                      ...s,
                      [k]: 'Household response selected by doctor',
                    }));
                    setResolved(r => ({ ...r, [k]: 'Household selected' }));
                    invalidate();
                  }}
                >
                  Use household answer
                </button>
                <button
                  onClick={() => {
                    setResolved(r => ({
                      ...r,
                      [k]: 'Doctor retained original',
                    }));
                    invalidate();
                  }}
                >
                  Retain original
                </button>
                {resolved[k] && <span> {resolved[k]}</span>}
              </div>
            ))}
            <div className="review-list">
              {FIELDS.map(([k, label]) => (
                <div key={k}>
                  <strong>{label}</strong>
                  <span>{values[k] || 'Not supplied'}</span>
                  <small>{sources[k] || 'Missing'}</small>
                </div>
              ))}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={reviewed}
                disabled={conflicts.length > 0}
                onChange={e => {
                  setReviewed(e.target.checked);
                  setStatus(e.target.checked ? 'Reviewed' : 'Draft');
                }}
              />
              <span>
                I checked identities, dates, attribution, findings, missing
                fields and actions. This confirms review, not signature or
                notification.
              </span>
            </label>
            <div className="actions">
              <button
                className="primary"
                onClick={() => setTab('PDF templates')}
              >
                Open PDF templates
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() =>
                  download(
                    JSON.stringify(
                      {
                        version: 2,
                        caseId,
                        notes,
                        values,
                        sources,
                        household,
                        resolved,
                        status,
                        sentLog,
                        dummy,
                      },
                      null,
                      2
                    ),
                    'reviewed-case.json',
                    'application/json'
                  )
                }
              >
                Download case record
              </button>
            </div>
          </section>
        )}
        {tab === 'PDF templates' && (<div>
          <PdfWorkspace values={values} reviewed={reviewed} conflicts={conflicts.length} invalidate={invalidate} exported={()=>setStatus('Exported')}/>
          <section className="card">
            <hr />
            <h2>Record actual delivery</h2>
            <p>
              PDF generation does not submit a report. Record delivery only
              after it has happened.
            </p>
            <div className="field-grid">
              <label>
                Recipient
                <input
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                />
              </label>
              <label>
                Method
                <input
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                />
              </label>
              <label>
                Date and time
                <input
                  type="datetime-local"
                  value={sentAt}
                  onChange={e => setSentAt(e.target.value)}
                />
              </label>
            </div>
            <button
              disabled={
                status !== 'Exported' ||
                !recipient.trim() ||
                !method.trim() ||
                !sentAt
              }
              onClick={() => {
                setStatus('Sent');
                setSentLog(recipient + ' · ' + method + ' · ' + sentAt);
              }}
            >
              Record as sent
            </button>
            {sentLog && (
              <p>
                <CheckCircle2 size={16} />
                {sentLog}
              </p>
            )}
          </section></div>
        )}
        <footer>SCAN case workflow · Draft → Reviewed → Exported → Sent</footer>
      </main>
    </div>
  );
}
