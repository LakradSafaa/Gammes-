import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api from "../../api/axios";
import "./Modules.css";

type Version = {
  id: string;
  code_version?: string | null;
  numero_version?: number | null;
  statut?: string | null;
  date_version?: string | null;
  redacteur?: string | null;
  valideur?: string | null;
  duree_minutes?: number | null;
  gamme?: string | null;
  gamme_detail?: {
    code?: string | null;
    designation?: string | null;
  } | null;
};

function results<T>(data: T[] | { results?: T[] }): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

function statusLabel(value?: string | null) {
  switch (value) {
    case "brouillon": return "Brouillon";
    case "en_validation": return "En validation";
    case "validee": return "Validée";
    case "archivee": return "Archivée";
    default: return value || "—";
  }
}

export default function VersionsPage() {
  const [items, setItems] = useState<Version[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/versions/");
        setItems(results<Version>(response.data));
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les versions.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <div className="module-page-v3">
      <header className="module-v3-header">
        <div>
          <h1>Versions</h1>
          <p>Historique et statut des versions de gammes opératoires</p>
        </div>
      </header>

      {error && <div className="module-v3-error">{error}</div>}

      <section className="module-v3-card">
        <div className="module-v3-toolbar">
          <div className="module-v3-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une version..."
            />
          </div>
        </div>

        {loading ? (
          <div className="module-v3-loading">Chargement...</div>
        ) : (
          <table className="module-v3-table">
            <thead>
              <tr>
                <th>Gamme</th>
                <th>Version</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Rédacteur</th>
                <th>Valideur</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="module-v3-name">
                    {item.gamme_detail?.code || item.gamme || "—"}
                  </td>
                  <td>{item.code_version || `V${item.numero_version ?? "—"}`}</td>
                  <td>
                    <span className="module-v3-badge">
                      {statusLabel(item.statut)}
                    </span>
                  </td>
                  <td>{item.date_version || "—"}</td>
                  <td>{item.redacteur || "—"}</td>
                  <td>{item.valideur || "—"}</td>
                  <td>{item.duree_minutes ?? 0} min</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="module-v3-empty">
                    Aucune version.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
