import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, QrCode, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ExportButtons from "./ExportButtons";
import { extractResults, formatDate, formatStatus, type Gamme, type GammeVersion, type PaginatedResponse } from "./types";
import "./Gammes.css";

export default function GammesList() {
  const navigate = useNavigate();
  const [gammes, setGammes] = useState<Gamme[]>([]);
  const [versions, setVersions] = useState<GammeVersion[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [g, v] = await Promise.all([
          api.get<Gamme[] | PaginatedResponse<Gamme>>("/gammes/"),
          api.get<GammeVersion[] | PaginatedResponse<GammeVersion>>("/versions/"),
        ]);
        setGammes(extractResults(g.data));
        setVersions(extractResults(v.data));
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les gammes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const latest = (gammeId: string) => versions.filter(v => v.gamme === gammeId).sort((a,b) => Number(b.numero_version ?? 0) - Number(a.numero_version ?? 0))[0] ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gammes;
    return gammes.filter(g => [g.code, g.designation, g.abreviation ?? "", g.equipement_detail?.nom ?? "", g.equipement_detail?.code ?? ""].some(x => x.toLowerCase().includes(q)));
  }, [gammes, search]);

  if (loading) return <div className="module-loading"><div className="module-spinner"/><strong>Chargement des gammes...</strong></div>;

  return (
    <div className="module-page">
      <header className="module-header">
        <div><h1>Gammes opératoires</h1><p>Consultez, créez, versionnez et exportez les procédures de maintenance.</p></div>
        <button className="module-button module-button-primary" type="button" onClick={() => navigate("/gammes/nouvelle")}><Plus size={18}/>Nouvelle gamme</button>
      </header>

      <section className="module-card">
        <div className="module-toolbar">
          <label className="module-search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par code, désignation ou équipement..."/></label>
          <span className="module-count">{filtered.length} gamme{filtered.length > 1 ? "s" : ""}</span>
        </div>
        {error && <div className="module-error">{error}</div>}
        {!error && <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Code</th><th>Désignation</th><th>Équipement</th><th>Version</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead><tbody>
          {filtered.map(g => { const v = latest(g.id); return <tr key={g.id}>
            <td><span className="code-pill">{g.code}</span></td>
            <td><div className="stacked-cell"><strong>{g.designation}</strong><span>{g.abreviation || "—"}</span></div></td>
            <td><div className="stacked-cell"><strong>{g.equipement_detail?.nom || "—"}</strong><span>{g.equipement_detail?.code || "—"}</span></div></td>
            <td><span className="version-pill">{v?.code_version || "—"}</span></td>
            <td><span className={`status-pill status-${v?.statut || "brouillon"}`}>{formatStatus(v?.statut)}</span></td>
            <td>{formatDate(v?.date_version)}</td>
            <td><div className="row-actions">
              <button className="icon-button icon-blue" title="Consulter" onClick={() => navigate(`/gammes/${g.id}`)}><Eye size={17}/></button>
              <button className="icon-button icon-salmon" title="Modifier" onClick={() => navigate(`/gammes/${g.id}/modifier`)}><Pencil size={17}/></button>
              {v && <ExportButtons versionId={v.id} compact/>}
              <button className="icon-button icon-green" title="QR Code" onClick={() => navigate(`/qr/${g.code}`)}><QrCode size={17}/></button>
            </div></td>
          </tr>; })}
        </tbody></table></div>}
      </section>
    </div>
  );
}
