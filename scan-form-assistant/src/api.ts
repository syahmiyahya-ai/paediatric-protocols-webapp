import { backendUrl } from './BackendSettings';
const bridgeOrigin='https://scan-form-assistant-t0kucv.v2.appdeploy.ai';
let frame:HTMLIFrameElement | null=null;
let ready:Promise<void> | null=null;
const pending=new Map<string,{resolve:(data:unknown)=>void;reject:(e:Error)=>void;timer:number}>();
function connect() {
  if(ready) return ready;
  ready=new Promise<void>((resolve,reject)=>{
    frame=document.createElement('iframe');
    frame.title='SCAN backend transport';
    frame.style.display='none';
    const timer=window.setTimeout(()=>{ready=null;frame?.remove();frame=null;reject(new Error('Backend connection timed out. Reload and retry.'));},30000);
    window.addEventListener('message',event=>{
      if(event.origin!==bridgeOrigin || event.source!==frame?.contentWindow) return;
      if(event.data?.type==='scan-backend-ready'){window.clearTimeout(timer);resolve();}
      if(event.data?.type==='scan-backend-response'){
        const p=pending.get(event.data.id);if(!p)return;
        pending.delete(event.data.id);window.clearTimeout(p.timer);
        if(event.data.ok)p.resolve(event.data.data);else p.reject(new Error(event.data.error || 'Backend request failed.'));
      }
    });
    frame.src=bridgeOrigin+'/#backend-bridge';
    document.body.appendChild(frame);
  });
  return ready;
}
async function post(path:string,body:unknown):Promise<{data:any}> {
  const base=backendUrl();
  if(!base) throw new Error('Backend disconnected.');
  if(base===bridgeOrigin){
    await connect();
    const id=crypto.randomUUID();
    const data=await new Promise<unknown>((resolve,reject)=>{
      const timer=window.setTimeout(()=>{pending.delete(id);reject(new Error('Backend request timed out. Retry.'));},90000);
      pending.set(id,{resolve,reject,timer});
      frame!.contentWindow!.postMessage({type:'scan-backend-request',id,path,body},bridgeOrigin);
    });
    return {data};
  }
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error || data.message || 'Request failed');
  return {data};
}
export const api={post};
