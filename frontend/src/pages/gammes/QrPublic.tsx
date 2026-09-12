import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, QrCode as QrIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import axios from "axios";
import type { QrResolveResponse } from "./types";
import "./Gammes.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function QrPublic() {
  const { code } = useParams();
  const [data,setData]=useState<QrResolveResponse|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{ if(!code)return; (async()=>{try{const r=await axios.get<QrResolveResponse>(`${API_URL}/qr/${encodeURIComponent(code)}/`);setData(r.data);}catch(e){console.error(e);setError("Aucune version validée disponible pour cette gamme.");}finally{setLoading(false);}})();},[code]);

  if(loading)return <main className="qr-page"><div className="module-spinner"/><p>Chargement...</p></main>;
  if(error||!data)return <main className="qr-page"><section className="qr-card"><QrIcon size={40}/><h1>Gamme indisponible</h1><p>{error}</p></section></main>;

  return <main className="qr-page"><section className="qr-card">
    <div className="qr-brand"><span><QrIcon size={22}/></span><div><strong>Gammes</strong><small>Maintenance</small></div></div>
    <div className="qr-code"><QRCode value={window.location.href} size={190}/></div>
    <div className="qr-valid"><CheckCircle2 size={18}/>Version validée disponible</div>
    <span className="hero-code">{data.code}</span><h1>{data.designation}</h1>
    <div className="qr-version"><span>Version active</span><strong>{data.version}</strong></div>
    <Link className="module-button module-button-primary qr-open" to={`/gammes/${data.gamme}`}>Ouvrir la fiche<ArrowRight size={18}/></Link>
    <p className="qr-note">Le QR reste lié à la gamme et pointe vers la dernière version validée.</p>
  </section></main>;
}
