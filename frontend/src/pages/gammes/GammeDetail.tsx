import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, QrCode } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import ExportButtons from "./ExportButtons";
import { extractResults, formatDate, formatStatus, type Gamme, type GammeVersion, type PaginatedResponse } from "./types";
import "./Gammes.css";

export default function GammeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gamme, setGamme] = useState<Gamme | null>(null);
  const [versions, setVersions] = useState<GammeVersion[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [g, v] = await Promise.all([
          api.get<Gamme>(`/gammes/${id}/`),
          api.get<GammeVersion[] | PaginatedResponse<GammeVersion>>(`/gammes/${id}/versions/`),
        ]);
        const items = extractResults(v.data);
        setGamme(g.data);
        setVersions(items);
        const active = items.find(x => x.statut === "validee") ?? items.sort((a,b) => Number(b.numero_version ?? 0)-Number(a.numero_version ?? 0))[0];
        setSelectedId(active?.id ?? "");
      } catch (e) {
        console.error(e);
        setError("Impossible de charger la gamme.");
      } finally { setLoading(false); }
    })();
  }, [id]);

  const version = useMemo(() => versions.find(v => v.id === selectedId) ?? null, [versions, selectedId]);
  if (loading) return <div className="module-loading"><div className="module-spinner"/><strong>Chargement...</strong></div>;
  if (!gamme) return <div className="module-error">{error || "Gamme introuvable."}</div>;

  return <div className="module-page">
    <button className="back-link" onClick={() => navigate("/gammes")}><ArrowLeft size={18}/>Retour aux gammes</button>
    <header className="detail-hero">
      <div><span className="hero-code">{gamme.code}</span><h1>{gamme.designation}</h1><p>{gamme.description || "Aucune description."}</p></div>
      <div className="detail-actions">
        {version && <ExportButtons versionId={version.id}/>} 
        <button className="module-button module-button-green" onClick={() => navigate(`/qr/${gamme.code}`)}><QrCode size={18}/>QR Code</button>
        <button className="module-button module-button-primary" onClick={() => navigate(`/gammes/${gamme.id}/modifier`)}><Pencil size={18}/>Modifier</button>
      </div>
    </header>

    <section className="version-bar">
      <label>Version affichée<select value={selectedId} onChange={e => setSelectedId(e.target.value)}>{versions.slice().sort((a,b)=>Number(b.numero_version??0)-Number(a.numero_version??0)).map(v => <option value={v.id} key={v.id}>{v.code_version} — {formatStatus(v.statut)}</option>)}</select></label>
      {version && <span className={`status-pill status-${version.statut || "brouillon"}`}>{formatStatus(version.statut)}</span>}
    </section>

    {version && <>
      <div className="stats-grid">
        <div className="stat stat-blue"><span>Version</span><strong>{version.code_version}</strong></div>
        <div className="stat stat-salmon"><span>Durée</span><strong>{version.duree_minutes ?? 0} min</strong></div>
        <div className="stat stat-green"><span>EPI</span><strong>{(version.version_epis ?? version.epis ?? []).length}</strong></div>
        <div className="stat stat-red"><span>Risques</span><strong>{(version.version_risques ?? version.risques ?? []).length}</strong></div>
      </div>

      <div className="detail-grid">
        <section className="module-card detail-section"><h2>Informations générales</h2><dl className="detail-list">
          <div><dt>Code</dt><dd>{gamme.code}</dd></div><div><dt>Abréviation</dt><dd>{gamme.abreviation || "—"}</dd></div><div><dt>Équipement</dt><dd>{gamme.equipement_detail?.nom || "—"}</dd></div><div><dt>Constructeur</dt><dd>{gamme.equipement_detail?.constructeur || "—"}</dd></div><div><dt>Type</dt><dd>{gamme.equipement_detail?.type || "—"}</dd></div><div><dt>Référence</dt><dd>{gamme.equipement_detail?.reference || "—"}</dd></div>
        </dl></section>
        <section className="module-card detail-section"><h2>Maintenance</h2><dl className="detail-list">
          <div><dt>Type</dt><dd>{version.type_maintenance || "—"}</dd></div><div><dt>Périodicité</dt><dd>{version.periodicite || "—"}</dd></div><div><dt>Main d'œuvre</dt><dd>{version.main_oeuvre ?? "—"}</dd></div><div><dt>Date</dt><dd>{formatDate(version.date_version)}</dd></div><div><dt>Rédacteur</dt><dd>{version.redacteur || "—"}</dd></div><div><dt>Valideur</dt><dd>{version.valideur || "—"}</dd></div>
        </dl></section>
      </div>

      <section className="module-card detail-section"><h2>Étapes opératoires</h2><div className="steps-list">{(version.etapes ?? []).map((s,i)=><article className="step-card" key={s.id}><div className="step-number">{s.numero ?? i+1}</div><div><div className="step-title"><strong>{s.titre || `Étape ${i+1}`}</strong><span>{s.duree_minutes ?? 0} min</span></div><p>{s.description || ""}</p><ol>{(s.actions ?? []).map(a => <li key={a.id}>{a.contenu}</li>)}</ol></div></article>)}</div></section>

      <section className="module-card detail-section"><h2>Historique des versions</h2><div className="history-list">{versions.slice().sort((a,b)=>Number(b.numero_version??0)-Number(a.numero_version??0)).map(v => <button key={v.id} className={`history-item ${v.id===selectedId?"history-item-active":""}`} onClick={()=>setSelectedId(v.id)}><strong>{v.code_version}</strong><span>{formatDate(v.date_version)}</span><span>{v.redacteur || "—"}</span><span className={`status-pill status-${v.statut || "brouillon"}`}>{formatStatus(v.statut)}</span></button>)}</div></section>
    </>}
  </div>;
}
