import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CopyPlus, Save, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { extractResults, formatStatus, type Gamme, type GammeVersion, type PaginatedResponse } from "./types";
import "./Gammes.css";

type FormState = {
  type_maintenance: string; periodicite: string; main_oeuvre: number; modifications: string;
  referentiel: boolean; rapport: boolean; production: boolean; arret: boolean; degrade: boolean;
};
const empty: FormState = { type_maintenance:"preventif", periodicite:"", main_oeuvre:1, modifications:"", referentiel:false, rapport:false, production:false, arret:false, degrade:false };

export default function GammeEdit() {
  const { id } = useParams(); const navigate = useNavigate();
  const [gamme,setGamme]=useState<Gamme|null>(null); const [versions,setVersions]=useState<GammeVersion[]>([]); const [working,setWorking]=useState<GammeVersion|null>(null); const [form,setForm]=useState<FormState>(empty); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  const latest=useMemo(()=>versions.slice().sort((a,b)=>Number(b.numero_version??0)-Number(a.numero_version??0))[0]??null,[versions]);
  const fill=(v:GammeVersion)=>setForm({type_maintenance:v.type_maintenance||"preventif",periodicite:v.periodicite||"",main_oeuvre:Number(v.main_oeuvre??1),modifications:v.modifications||"",referentiel:!!v.referentiel,rapport:!!v.rapport,production:!!v.production,arret:!!v.arret,degrade:!!v.degrade});

  useEffect(()=>{ if(!id)return; (async()=>{try{const[g,v]=await Promise.all([api.get<Gamme>(`/gammes/${id}/`),api.get<GammeVersion[]|PaginatedResponse<GammeVersion>>(`/gammes/${id}/versions/`)]); const items=extractResults(v.data); setGamme(g.data);setVersions(items);const l=items.slice().sort((a,b)=>Number(b.numero_version??0)-Number(a.numero_version??0))[0]; if(l){fill(l); if(l.statut==="brouillon") setWorking(l);}}catch(e){console.error(e);setError("Impossible de charger la gamme.");}finally{setLoading(false);}})();},[id]);

  const clone=async()=>{if(!latest)return;try{setBusy(true);setError("");const r=await api.post<GammeVersion>(`/versions/${latest.id}/clone/`,{modifications:form.modifications||"Nouvelle révision"});setWorking(r.data);setVersions(x=>[...x,r.data]);fill(r.data);setMessage(`${r.data.code_version} créée avec succès.`);}catch(e){console.error(e);setError("Impossible de créer la nouvelle version.");}finally{setBusy(false);}};
  const save=async(e:FormEvent)=>{e.preventDefault();if(!working){setError("Créez d'abord une nouvelle version brouillon.");return;}try{setBusy(true);const r=await api.patch<GammeVersion>(`/versions/${working.id}/`,form);setWorking(r.data);setVersions(x=>x.map(v=>v.id===r.data.id?r.data:v));setMessage("Version enregistrée.");}catch(e){console.error(e);setError("Impossible d'enregistrer la version.");}finally{setBusy(false);}};
  const submit=async()=>{if(!working)return;try{setBusy(true);const r=await api.post<GammeVersion>(`/versions/${working.id}/submit/`,{});setWorking(r.data);setMessage("Version envoyée en validation.");}catch(e){console.error(e);setError("Envoi en validation impossible. Vérifiez les éléments obligatoires.");}finally{setBusy(false);}};

  if(loading)return <div className="module-loading"><div className="module-spinner"/><strong>Chargement...</strong></div>;
  if(!gamme)return <div className="module-error">{error||"Gamme introuvable."}</div>;

  return <div className="module-page"><button className="back-link" onClick={()=>navigate(`/gammes/${gamme.id}`)}><ArrowLeft size={18}/>Retour à la fiche</button>
    <header className="module-header"><div><span className="hero-code">{gamme.code}</span><h1>Modifier la gamme</h1><p>Une version validée n'est jamais écrasée : une nouvelle révision est créée.</p></div>{!working&&latest&&<button className="module-button module-button-primary" disabled={busy} onClick={clone}><CopyPlus size={18}/>Créer la nouvelle version</button>}</header>
    {error&&<div className="module-error">{error}</div>}{message&&<div className="module-success">{message}</div>}
    <section className="module-card edit-summary"><div><span>Dernière version</span><strong>{latest?.code_version||"—"}</strong></div><div><span>Statut</span><strong>{formatStatus(latest?.statut)}</strong></div><div><span>Version de travail</span><strong>{working?.code_version||"À créer"}</strong></div></section>
    <form className="module-card edit-form" onSubmit={save}><h2>Paramètres de la version</h2><div className="form-grid">
      <label><span>Type de maintenance</span><select disabled={!working||busy} value={form.type_maintenance} onChange={e=>setForm(x=>({...x,type_maintenance:e.target.value}))}><option value="preventif">Préventive</option><option value="correctif">Corrective</option><option value="amelioratif">Améliorative</option></select></label>
      <label><span>Périodicité</span><input disabled={!working||busy} value={form.periodicite} onChange={e=>setForm(x=>({...x,periodicite:e.target.value}))}/></label>
      <label><span>Main d'œuvre</span><input type="number" min="1" disabled={!working||busy} value={form.main_oeuvre} onChange={e=>setForm(x=>({...x,main_oeuvre:Number(e.target.value)}))}/></label>
      <label className="wide"><span>Modifications</span><textarea rows={4} disabled={!working||busy} value={form.modifications} onChange={e=>setForm(x=>({...x,modifications:e.target.value}))}/></label>
    </div><div className="checks">{([['referentiel','Référentiel'],['rapport','Rapport'],['production','Production'],['arret','Arrêt'],['degrade','Mode dégradé']] as const).map(([k,l])=><label key={k}><input type="checkbox" disabled={!working||busy} checked={form[k]} onChange={e=>setForm(x=>({...x,[k]:e.target.checked}))}/>{l}</label>)}</div>
    <div className="form-actions"><button className="module-button module-button-blue" disabled={!working||busy} type="submit"><Save size={18}/>Enregistrer</button><button className="module-button module-button-green" disabled={!working||busy||working.statut!=="brouillon"} type="button" onClick={submit}><Send size={18}/>Envoyer en validation</button></div></form>
  </div>;
}
