export function todayKL() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function ageAt(dob: string, today = todayKL()) {
  const b = dob.split('-').map(Number), t = today.split('-').map(Number);
  if (b.length !== 3 || !b.every(Number.isFinite) || dob > today) return '';
  const date = new Date(Date.UTC(b[0], b[1]-1, b[2]));
  if (date.getUTCFullYear() !== b[0] || date.getUTCMonth() !== b[1]-1 || date.getUTCDate() !== b[2]) return '';
  const dateAt=(months:number) => {
    const year=b[0]+Math.floor((b[1]-1+months)/12), month=(b[1]-1+months)%12;
    return new Date(Date.UTC(year,month,Math.min(b[2],new Date(Date.UTC(year,month+1,0)).getUTCDate())));
  };
  const todayDate=new Date(Date.UTC(t[0],t[1]-1,t[2]));
  let months=(t[0]-b[0])*12+t[1]-b[1];
  if(dateAt(months)>todayDate) months--;
  const d=Math.floor((todayDate.getTime()-dateAt(months).getTime())/86400000);
  return Math.floor(months/12)+'Y '+months%12+'M '+d+'D';
}
export function decodeIC(raw: string) {
  const digits=raw.replace(/[-\s]/g,'');
  if(!/^\d{12}$/.test(digits)) return null;
  const today=todayKL(), current=Number(today.slice(0,4));
  let year=Math.floor(current/100)*100+Number(digits.slice(0,2));
  if(year>current) year-=100;
  const dob=year+'-'+digits.slice(2,4)+'-'+digits.slice(4,6);
  if(!ageAt(dob,today)) return null;
  return { child_dob:dob, child_age:ageAt(dob,today), child_gender:Number(digits[11])%2 ? 'Male' : 'Female' };
}
export function identityUpdate(values: Record<string,string>, key: string, value: string) {
  const next={...values,[key]:value};
  if(key==='child_id_type' || key==='child_id'){
    if((next.child_id_type || 'Malaysian IC')==='Malaysian IC') {
      const parsed=decodeIC(next.child_id || '');
      Object.assign(next, parsed || {child_dob:'',child_age:'',child_gender:''});
    } else if(key==='child_id_type') Object.assign(next,{child_dob:'',child_age:'',child_gender:''});
  }
  if(key==='child_dob') next.child_age=ageAt(value);
  return next;
}
