import { decodeIC, identityUpdate } from './identity';
export default function IdentityFields({ values, change }: { values: Record<string,string>; change: (next: Record<string,string>, key: string) => void }) {
  const type=values.child_id_type || 'Malaysian IC';
  const update=(key:string,value:string)=>change(identityUpdate(values,key,value),key);
  return <div className="field-grid">
    <label>Identification type<select value={type} onChange={e=>update('child_id_type',e.target.value)}><option>Malaysian IC</option><option>Passport</option><option>Other document</option></select></label>
    <label>{type==='Malaysian IC'?'IC number':'Passport / document number'}<input value={values.child_id || ''} onChange={e=>update('child_id',e.target.value)} placeholder={type==='Malaysian IC'?'YYMMDD-PB-####':''}/>{type==='Malaysian IC' && <small>{decodeIC(values.child_id || '')?'DOB, age and sex inserted from IC. Confirm the century and sex against the document.':'Enter a complete 12-digit IC with a valid birth date.'}</small>}</label>
    <label>Date of birth<input type="date" value={values.child_dob || ''} onChange={e=>update('child_dob',e.target.value)}/></label>
    <label>Age<input value={values.child_age || ''} onChange={e=>update('child_age',e.target.value)}/><small>Calculated as of today in Malaysia.</small></label>
    <label>Gender / sex<select value={values.child_gender || ''} onChange={e=>update('child_gender',e.target.value)}><option value="">Select / unknown</option><option>Male</option><option>Female</option><option>Unknown</option></select></label>
  </div>;
}
export const identityKeys=['child_id_type','child_id','child_dob','child_age','child_gender'];
