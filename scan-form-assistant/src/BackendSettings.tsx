import { useState } from 'react';
export function backendUrl() {
  return (localStorage.getItem('scan-backend-url') || '').replace(/\/$/, '');
}
export default function BackendSettings() {
  const [url,setUrl]=useState(backendUrl);
  const [message,setMessage]=useState('');
  return <details className="card" style={{marginBottom:20}}><summary>Backend connection settings</summary><p>GitHub Pages hosts this interface. AI extraction and online household answers require a separate approved backend implementing the SCAN API. No data is sent until you configure it. Manual entry and local PDF filling remain available.</p><label>Approved backend HTTPS URL<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://your-approved-server.example"/></label><button onClick={()=>{
    try { if(url){const u=new URL(url);if(u.protocol!=='https:' || u.username || u.password || u.search || u.hash)throw new Error();}localStorage.setItem('scan-backend-url',url.replace(/\/$/,''));setMessage('Connection setting saved. This does not verify backend approval or connectivity.'); }
    catch {setMessage('Use a valid HTTPS server URL without credentials, query or fragment.');}
  }}>Save backend URL</button><button onClick={()=>{localStorage.removeItem('scan-backend-url');setUrl('');setMessage('Backend disconnected.');}}>Disconnect</button><p role="status">{message}</p></details>;
}
