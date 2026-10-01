import { useEffect, useRef, useState } from 'react';
import { api, mountAuth } from './api';
import { FIELDS } from './fields';
import { saveDownload } from './pdfEngine';
export type CaseDraft = {version:number;caseId:string;notes:string;values:Record<string,string>;sources:Record<string,string>;household:Record<string,string>;resolved:Record<string,string>;portal:unknown;dummy:boolean;sentLog:string};
export function readDraft(): Partial<CaseDraft> {
  try {const d=JSON.parse(sessionStorage.getItem('scan-case-draft')||'{}');return validateDraft(d);}catch{return {};}
}
export function validateDraft(d:unknown): CaseDraft {
  if(!d||typeof d!=='object')throw new Error('Invalid case record.');
  const x=d as CaseDraft;
  if(![1,2].includes(x.version)||typeof x.caseId!=='string'||x.caseId.length>100||typeof x.notes!=='string'||x.notes.length>20000)throw new Error('Invalid case record.');
  const valid=new Set(FIELDS.map(([k])=>k));
  const clean=(r:Record<string,string>)=>{
    if(!r||typeof r!=='object'||Array.isArray(r))throw new Error('Invalid case fields.');
    return Object.fromEntries(Object.entries(r).filter(([k])=>valid.has(k)).map(([k,v])=>{
      if(typeof v!=='string'||v.length>5000)throw new Error('Case field too long.');return [k,v];
    }));
  };
  return {version:2,caseId:x.caseId,notes:x.notes,values:clean(x.values),sources:clean(x.sources||{}),
    household:clean(x.household||{}),resolved:clean(x.resolved||{}),portal:x.portal||null,dummy:x.dummy===true,sentLog:typeof x.sentLog==='string'?x.sentLog:''};
}
export default function CaseStorage({draft,restore}:{draft:CaseDraft;restore:(d:CaseDraft)=>Promise<void>}) {
  const slot=useRef<HTMLDivElement>(null);
  const [user,setUser]=useState<{userId:string;name?:string;email?:string}|null>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [dummy,setDummy]=useState(false);
  const [records,setRecords]=useState<{id:string;caseId:string;childName:string;expiresAt:number}[]>([]);
  const [recordId,setRecordId]=useState('');
  useEffect(()=>{
    const refresh=()=>api.post('/bridge/session',{}).then(({data})=>setUser(data.user)).catch(()=>setUser(null));
    void refresh();
    window.addEventListener('scan-session-changed',refresh);
    return ()=>window.removeEventListener('scan-session-changed',refresh);
  },[]);
  useEffect(()=>{setRecordId('');},[draft.caseId]);
  async function list(){
    setBusy(true);
    try{const {data}=await api.post('/api/cases-list',{});setRecords(data.cases);setMessage(data.nextToken?'Showing the first 50 active cases.':'Saved cases loaded.');}
    catch{setMessage('Sign in to view your saved cases.');}finally{setBusy(false);}
  }
  async function save(){
    if(!dummy){setMessage('Confirm dummy information before saving.');return;}
    setBusy(true);
    try{
      const {data}=await api.post('/api/cases-save',{id:recordId||undefined,draft,dummyOnly:true});
      setRecordId(data.id);setMessage('Case saved privately to your account for 24 hours.');await list();
    }catch{setMessage('Save failed. Sign in and retry; the browser draft remains available.');}
    finally{setBusy(false);}
  }
  return <details className="case-tools"><summary>Save, resume and doctor account</summary>
    <p>The draft survives refresh in this tab. Download a backup to move it between devices. Cloud saves require sign-in and are private to that account; they expire after 24 hours.</p>
    <div className="actions"><button onClick={()=>{const {portal:_portal,...backup}=draft;saveDownload(JSON.stringify(backup,null,2),'SCAN_case_backup.json','application/json');}}>Download case backup</button>
      <label className="upload">Restore case backup<input aria-label="Restore case backup" type="file" accept=".json,application/json" onChange={async e=>{
        const file=e.target.files?.[0];if(!file)return;
        try{if(file.size>240000)throw new Error('Case backup too large.');const d=validateDraft(JSON.parse(await file.text()));d.portal=null;await restore(d);setMessage('Case restored. Repeat doctor review before export.');}
        catch(err){setMessage(err instanceof Error?err.message:'Unable to restore case.');}
      }}/></label>
      <button onClick={()=>{if(slot.current)mountAuth(slot.current);}}>Open doctor sign-in</button>
    </div><div ref={slot}/>
    {user&&<><p>Signed in as {user.name||user.email||'Doctor account'}</p><label className="check"><input type="checkbox" checked={dummy} onChange={e=>setDummy(e.target.checked)}/>This saved case contains dummy information only.</label>
      <div className="actions"><button disabled={busy} onClick={save}>Save case to my account</button><button disabled={busy} onClick={list}>Load my saved cases</button></div></>}
    {records.map(r=><div className="actions" key={r.id}><span>{r.childName||'Unnamed case'} · expires {new Date(r.expiresAt).toLocaleString()}</span>
      <button disabled={busy} onClick={async()=>{setBusy(true);try{const {data}=await api.post('/api/cases-get',{id:r.id});await restore(validateDraft(data.draft));setRecordId(r.id);setMessage('Private case restored. Repeat doctor review.');}catch{setMessage('Case could not be opened. It may have expired.');}finally{setBusy(false);}}}>Resume case</button>
      <button disabled={busy} onClick={async()=>{if(!window.confirm('Delete this cloud case? The draft in this tab stays available.'))return;try{await api.post('/api/cases-delete',{id:r.id});await list();}catch{setMessage('Deletion failed. Retry.');}}}>Delete saved case</button></div>)}
    {message&&<p className="notice" role="status">{message}</p>}
  </details>;
}
