import { useEffect, useState } from 'react';
import { api } from './api';
import { FIELDS } from './fields';
import PdfCanvas from './PdfCanvas';
import { inspectTemplate, fillTemplate, templateStore, saveDownload, type PdfTemplate } from './pdfEngine';
type Props = { values: Record<string,string>; reviewed: boolean; conflicts: number; invalidate:()=>void; exported:()=>void };
export default function PdfWorkspace({values,reviewed,conflicts,invalidate,exported}:Props) {
  const [templates,setTemplates]=useState<PdfTemplate[]>([]);
  const [active,setActive]=useState('');
  const [page,setPage]=useState(0);
  const [key,setKey]=useState('child_name');
  const [kind,setKind]=useState<'text'|'checkbox'|'strike'>('text');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [preview,setPreview]=useState<PdfTemplate|null>(null);
  const selected=templates.find(t=>t.name===active);
  useEffect(()=>{templateStore('read').then(ts=>{setTemplates(ts);setActive(ts[0]?.name||'');}).catch(()=>setMessage('Blank-template storage unavailable. PDFs can still be used in this session.'));},[]);
  async function update(t:PdfTemplate,changed=true) {
    setTemplates(ts=>[...ts.filter(x=>x.name!==t.name),t]);
    setActive(t.name);
    if(changed){invalidate();setPreview(null);}
    try{await templateStore('write',t);}catch{setMessage('Template works in this session but could not be saved on this device.');}
  }
  async function load(bytes:Uint8Array,name:string) {
    const t=await inspectTemplate(bytes,name);
    const previous=templates.find(x=>x.hash===t.hash);
    await update(previous?{...previous,name}:t);
    setPage(0);setMessage(name+' loaded: '+t.pages.length+' pages. Map and verify every fill area.');
  }
  async function upload(file:File|undefined,name:string) {
    if(!file)return;setBusy(true);
    try{await load(new Uint8Array(await file.arrayBuffer()),name);}
    catch(e){setMessage(e instanceof Error?e.message:'Unable to load PDF.');}
    finally{setBusy(false);}
  }
  async function resources() {
    setBusy(true);setMessage('');
    try {
      for(const [path,name] of [['resources/borang9.pdf','Borang 9'],['resources/jkm.pdf','JKM referral']]){
        const {data}=await api.post('/bridge/resource',{path});
        const bytes=Uint8Array.from(atob(data.base64),(c:string)=>c.charCodeAt(0));
        await load(bytes,name);
      }
    }catch{setMessage('The two template PDFs have not been uploaded yet. Use the Borang 9 and JKM upload controls below, or AppDeploy Resources.');}
    finally{setBusy(false);}
  }
  async function exportOne(t:PdfTemplate,download=true) {
    const bytes=await fillTemplate(t,values);
    if(download)saveDownload(bytes as BlobPart,t.name.replace(/ /g,'_')+'_reviewed.pdf','application/pdf');
    const checked=await inspectTemplate(bytes,t.name+' completed preview');
    setPreview(checked);
    return bytes;
  }
  async function exportAll() {
    if(!reviewed||conflicts)return;
    setBusy(true);
    try {
      const borang=templates.find(t=>t.name==='Borang 9'),jkm=templates.find(t=>t.name==='JKM referral');
      if(!borang||!jkm)throw new Error('Load both Borang 9 and JKM templates first.');
      // Validate both before any download.
      const b=await fillTemplate(borang,values),j=await fillTemplate(jkm,values);
      saveDownload(b as BlobPart,'Borang_9_reviewed.pdf','application/pdf');
      saveDownload(j as BlobPart,'JKM_referral_reviewed.pdf','application/pdf');
      setPreview(await inspectTemplate(b,'Borang 9 completed preview'));
      exported();setMessage('Both forms exported. Check every page and continuation, then sign and send through your usual reporting channel.');
    }catch(e){setMessage(e instanceof Error?e.message:'Export failed.');}
    finally{setBusy(false);}
  }
  async function importMapping(file:File|undefined) {
    if(!file||!selected)return;
    try{
      const m=JSON.parse(await file.text());
      if(m.version!==1||m.hash!==selected.hash||!Array.isArray(m.placements)||m.placements.length>250||!m.mapping||typeof m.mapping!=='object')throw new Error('Mapping belongs to a different blank PDF.');
      const valid=new Set(FIELDS.map(([k])=>k));
      for(const p of m.placements){
        const s=selected.pages[p.page];
        if(!s||typeof p.id!=='string'||!valid.has(p.key)||!['text','checkbox','strike'].includes(p.kind)||
          ![p.x,p.y,p.width,p.height].every(Number.isFinite)||p.x<0||p.y<0||p.width<10||p.height<10||p.x+p.width>s.width+.1||p.y+p.height>s.height+.1)throw new Error('Invalid placement in mapping.');
      }
      for(const [name,value] of Object.entries(m.mapping)){
        if(!selected.fields.some(f=>f.name===name)||typeof value!=='string'||(value!==''&&!valid.has(value)&&!['__checked','__unchecked'].includes(value)))throw new Error('Invalid Acrobat mapping.');
      }
      if(new Set(m.placements.map((p:{id:string})=>p.id)).size!==m.placements.length)throw new Error('Duplicate placement IDs.');
      await update({...selected,mapping:m.mapping,placements:m.placements,confirmed:false});
      setMessage('Mapping restored. Inspect all pages and confirm placement.');
    }catch(e){setMessage(e instanceof Error?e.message:'Invalid mapping file.');}
  }
  return <section className="card">
    <h2>Official PDF templates</h2>
    <p>Use your exact blank forms. Acrobat fields are detected automatically. For scanned or non-fillable PDFs, select a field and drag a box over its fill area. Blank templates and mappings stay on this device; patient values are kept separately.</p>
    <div className="actions"><button disabled={busy} onClick={resources}>Load Borang 9 + JKM resources</button>
      <label className="upload">Upload Borang 9<input aria-label="Upload Borang 9" type="file" accept=".pdf,application/pdf" onChange={e=>void upload(e.target.files?.[0],'Borang 9')}/></label>
      <label className="upload">Upload JKM referral<input aria-label="Upload JKM referral" type="file" accept=".pdf,application/pdf" onChange={e=>void upload(e.target.files?.[0],'JKM referral')}/></label>
    </div>
    {message&&<p className="notice" role="status">{message}</p>}
    {!templates.length&&<p className="empty">Upload both blank PDFs to set up the official forms.</p>}
    {!!templates.length&&<label>Template<select value={active} onChange={e=>{setActive(e.target.value);setPage(0);setPreview(null);}}>{templates.map(t=><option key={t.name}>{t.name}</option>)}</select></label>}
    {selected&&<div className="template">
      <h3>{selected.name} · {selected.pages.length} pages · {selected.fields.length} Acrobat fields · {selected.placements.length} placed fields</h3>
      <div className="actions"><button onClick={()=>saveDownload(JSON.stringify({version:1,hash:selected.hash,mapping:selected.mapping,placements:selected.placements},null,2),selected.name.replace(/ /g,'_')+'_mapping.json','application/json')}>Download mapping</button>
        <label className="upload">Restore mapping<input aria-label="Restore mapping" type="file" accept=".json,application/json" onChange={e=>void importMapping(e.target.files?.[0])}/></label>
        <button onClick={async()=>{if(!window.confirm('Remove this blank template and its mapping from this device?'))return;await templateStore('delete',undefined,selected.name);setTemplates(ts=>ts.filter(x=>x.name!==selected.name));setActive('');invalidate();}}>Remove template</button>
      </div>
      {!!selected.fields.length&&<details open><summary>Acrobat field mappings</summary><div className="mapping">{selected.fields.map(f=><label key={f.name}>{f.name} ({f.kind})
        <select aria-label={'Map '+f.name} disabled={f.kind==='manual'} value={selected.mapping[f.name]||''} onChange={e=>void update({...selected,mapping:{...selected.mapping,[f.name]:e.target.value},confirmed:false})}>
          <option value="">Leave blank / signature / manual</option>
          {f.kind==='checkbox'&&<><option value="__checked">Checked</option><option value="__unchecked">Unchecked</option></>}
          {FIELDS.map(([k,label])=><option key={k} value={k}>{label}</option>)}
        </select></label>)}</div></details>}
      <details open={!selected.fields.length}><summary>Place fields on the original page</summary>
        <div className="field-grid"><label>Field to place<select aria-label="Field to place" value={key} onChange={e=>setKey(e.target.value)}>{FIELDS.map(([k,label])=><option value={k} key={k}>{label}</option>)}</select></label>
          <label>Placement type<select value={kind} onChange={e=>setKind(e.target.value as 'text'|'checkbox'|'strike')}><option value="text">Text</option><option value="checkbox">Checkbox: tick only when field says Yes</option><option value="strike">Strike text when selected field says No / Not applicable</option></select></label>
          <label>Page<select aria-label="Template page" value={page} onChange={e=>setPage(Number(e.target.value))}>{selected.pages.map((_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label></div>
        <p>Drag from the top-left to the bottom-right of the blank answer area. Leave signatures and official stamps untouched.</p>
        <PdfCanvas template={selected} pageIndex={page} onPlace={rect=>void update({...selected,placements:[...selected.placements,{...rect,id:crypto.randomUUID(),key,kind}],confirmed:false})}/>
        {selected.placements.map(p=><div className="placement-row" key={p.id}><strong>{FIELDS.find(([k])=>k===p.key)?.[1]} · page {p.page+1}</strong>
          {(['x','y','width','height'] as const).map(property=><label key={property}>{property}<input aria-label={p.key+' '+property} type="number" min="0" step=".5" value={Math.round(p[property]*10)/10} onChange={e=>void update({...selected,placements:selected.placements.map(x=>x.id===p.id?{...x,[property]:Number(e.target.value)}:x),confirmed:false})}/></label>)}
          <button onClick={()=>void update({...selected,placements:selected.placements.filter(x=>x.id!==p.id),confirmed:false})}>Remove placement</button></div>)}
      </details>
      <label className="check"><input type="checkbox" checked={selected.confirmed} onChange={e=>void update({...selected,confirmed:e.target.checked})}/>I checked every mapped field and placement on all pages.</label>
      <button className="primary" disabled={busy||!reviewed||!!conflicts||!selected.confirmed} onClick={async()=>{setBusy(true);try{await exportOne(selected);exported();setMessage('Exported with editable PDF fields. Long answers are preserved on continuation pages.');}catch(e){setMessage(e instanceof Error?e.message:'Export failed.');}finally{setBusy(false);}}}>Preview and download {selected.name}</button>
    </div>}
    <button className="primary" disabled={busy||!reviewed||!!conflicts||!templates.some(t=>t.name==='Borang 9'&&t.confirmed)||!templates.some(t=>t.name==='JKM referral'&&t.confirmed)} onClick={exportAll}>Download both official forms</button>
    {!reviewed&&<p className="callout">Confirm template mapping first, then complete Doctor review to enable export.</p>}
    {preview&&<details open><summary>Completed form preview - inspect every page</summary>{preview.pages.map((_,i)=><PdfCanvas key={i} template={preview} pageIndex={i}/>)}</details>}
  </section>;
}
