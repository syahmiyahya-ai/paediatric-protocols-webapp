import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { PdfTemplate, Placement } from './pdfEngine';
GlobalWorkerOptions.workerSrc=workerUrl;
type Viewport = { width:number; height:number; convertToPdfPoint:(x:number,y:number)=>number[]; convertToViewportPoint:(x:number,y:number)=>number[] };
export default function PdfCanvas({template,pageIndex,onPlace}:{template:PdfTemplate;pageIndex:number;onPlace?:(rect:Omit<Placement,'id'|'key'|'kind'>)=>void}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const start=useRef<number[]|null>(null);
  const [viewport,setViewport]=useState<Viewport|null>(null);
  const [message,setMessage]=useState('');
  useEffect(()=>{
    let cancelled=false;
    const task=getDocument({data:template.bytes.slice()});
    task.promise.then(async doc=>{
      try {
        const page=await doc.getPage(pageIndex+1);
        const view=page.getViewport({scale:1.2});
        if(cancelled || !canvas.current)return;
        canvas.current.width=view.width;canvas.current.height=view.height;
        await page.render({canvas:canvas.current,viewport:view}).promise;
        if(!cancelled){setViewport(view);setMessage('');}
      } catch(e){if(!cancelled)setMessage(e instanceof Error?e.message:'PDF rendering failed.');}
    }).catch(()=>{if(!cancelled)setMessage('Unable to render this PDF. Try a repaired blank PDF.');});
    return ()=>{cancelled=true;void task.destroy();};
  },[template.hash,pageIndex]);
  function point(e:React.PointerEvent<HTMLDivElement>) {
    const r=e.currentTarget.getBoundingClientRect();
    return viewport?.convertToPdfPoint((e.clientX-r.left)*viewport.width/r.width,(e.clientY-r.top)*viewport.height/r.height)||[0,0];
  }
  return <div>
    {message && <p role="alert">{message}</p>}
    <div className="pdf-sheet" style={{position:'relative',touchAction:onPlace?'none':'auto'}}
      onPointerDown={e=>{if(!onPlace||!viewport)return;e.currentTarget.setPointerCapture(e.pointerId);start.current=point(e);}}
      onPointerUp={e=>{if(!start.current||!onPlace)return;const end=point(e),begin=start.current;start.current=null;
        const width=Math.abs(end[0]-begin[0]),height=Math.abs(end[1]-begin[1]);
        if(width<10||height<10)return;
        onPlace({page:pageIndex,x:Math.min(begin[0],end[0]),y:Math.min(begin[1],end[1]),width,height});}}
      onPointerCancel={()=>{start.current=null;}}>
      <canvas ref={canvas} aria-label={template.name+' page '+(pageIndex+1)} style={{width:'100%',height:'auto',display:'block'}}/>
      {viewport && template.placements.filter(p=>p.page===pageIndex).map(p=>{
        const r=[...viewport.convertToViewportPoint(p.x,p.y),...viewport.convertToViewportPoint(p.x+p.width,p.y+p.height)];
        return <div key={p.id} style={{position:'absolute',pointerEvents:'none',border:'1px solid #147d64',background:'#147d6418',
          left:Math.min(r[0],r[2])/viewport.width*100+'%',top:Math.min(r[1],r[3])/viewport.height*100+'%',
          width:Math.abs(r[2]-r[0])/viewport.width*100+'%',height:Math.abs(r[3]-r[1])/viewport.height*100+'%',fontSize:10,overflow:'hidden'}}>{p.key}</div>;
      })}
    </div>
  </div>;
}
