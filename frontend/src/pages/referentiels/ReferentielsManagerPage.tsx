import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import api from "../../api/axios";

/**
 * Référentiels génériques : une seule table `referentiel_valeurs`.
 * Le champ technique `actif` peut rester en base mais il n’est jamais affiché ici.
 */
type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

type RefValue = {
  id: string;
  categorie: string;
  code: string;
  libelle: string;
  ordre?: number;
  actif?: boolean;
};

const CATEGORIES = [
  { code: "corps_metier", label: "Corps de métier" },
  { code: "type_maintenance", label: "Type de maintenance" },
  { code: "periodicite", label: "Périodicité" },
  { code: "type_arret", label: "Type d'arrêt" },
  { code: "profil", label: "Profil" },
  { code: "statut_gamme", label: "Statut de la gamme" },
  { code: "type_redaction", label: "Type de rédaction" },
];

function extractResults<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

function makeCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Transforme les erreurs DRF/Axios en message lisible. */
function apiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length) return `${field} : ${String(value[0])}`;
    if (typeof value === "string") return `${field} : ${value}`;
  }
  return fallback;
}

export default function ReferentielsManagerPage() {
  const [categorie, setCategorie] = useState(CATEGORIES[0].code);
  const [items, setItems] = useState<RefValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", libelle: "", ordre: 0 });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentCategory = useMemo(
    () => CATEGORIES.find((item) => item.code === categorie) ?? CATEGORIES[0],
    [categorie],
  );

  /** Recharge uniquement la catégorie choisie depuis Supabase. */
  const loadItems = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<RefValue[] | PaginatedResponse<RefValue>>(
        `/v2/referentiels/?categorie=${encodeURIComponent(categorie)}&include_inactive=true`,
      );

      setItems(
        extractResults(response.data)
          .filter((item) => item && item.categorie === categorie)
          .slice()
          .sort((a, b) => {
            const order = Number(a.ordre ?? 0) - Number(b.ordre ?? 0);
            return order !== 0 ? order : a.libelle.localeCompare(b.libelle, "fr");
          }),
      );
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Impossible de charger cette liste."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [categorie]);

  /** Remet le formulaire d’édition à zéro sans toucher aux données Supabase. */
  const resetForm = () => {
    setEditingId(null);
    setForm({ code: "", libelle: "", ordre: 0 });
    setError("");
  };

  /** Actualiser = formulaire propre + relecture de la catégorie courante. */
  const handleRefresh = async () => {
    resetForm();
    setMessage("");
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  /** Prépare une valeur existante pour modification. */
  const startEdit = (item: RefValue) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      libelle: item.libelle,
      ordre: Number(item.ordre ?? 0),
    });
    setError("");
  };

  /** Ajoute ou modifie une valeur dans la table unique `referentiel_valeurs`. */
  const saveItem = async () => {
    const libelle = form.libelle.trim();

    if (!libelle) {
      setError("Le libellé est obligatoire.");
      return;
    }

    const payload = {
      categorie,
      code: form.code.trim() || makeCode(libelle),
      libelle,
      ordre: Number(form.ordre) || 0,
      actif: true,
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.patch(`/v2/referentiels/${editingId}/`, payload);
      } else {
        await api.post("/v2/referentiels/", payload);
      }

      setMessage(editingId ? "Valeur modifiée." : "Valeur ajoutée.");
      resetForm();
      await loadItems();
    } catch (err: any) {
      console.error(err);
      setError(apiErrorMessage(err, "Impossible d’enregistrer la valeur."));
    } finally {
      setSaving(false);
    }
  };

  /** Supprime réellement une valeur ; le backend peut refuser si elle est utilisée. */
  const deleteItem = async (item: RefValue) => {
    if (!window.confirm(`Supprimer « ${item.libelle} » ?`)) return;

    try {
      setMessage("");
      await api.delete(`/v2/referentiels/${item.id}/`);
      if (editingId === item.id) resetForm();
      setMessage("Valeur supprimée.");
      await loadItems();
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Impossible de supprimer cette valeur."));
    }
  };

  return (
    <div style={{ width: "100%", color: "#172B2A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22 }}>
        <div>
          <p style={{ margin: 0, color: "#007F5F", fontWeight: 800, fontSize: 12 }}>Administration</p>
          <h1 style={{ margin: "6px 0", color: "#063D32" }}>Listes déroulantes</h1>
          <p style={{ margin: 0, color: "#64748B" }}>
            Une seule base de référentiels : ajouter, modifier ou supprimer les valeurs utilisées dans le Wizard.
          </p>
        </div>
        <button type="button" onClick={() => void handleRefresh()} disabled={refreshing || saving} style={secondaryButtonStyle}>
          <RefreshCw size={16} className={refreshing ? "spin" : undefined} /> Actualiser
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: 18 }}>
        <aside style={{ padding: 10, border: "1px solid #DDE7E3", borderRadius: 14, background: "#FFF" }}>
          {CATEGORIES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setCategorie(item.code);
                resetForm();
                setMessage("");
              }}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 9,
                padding: "11px 12px",
                marginBottom: 5,
                background: categorie === item.code ? "#DDF7EE" : "transparent",
                color: categorie === item.code ? "#007F5F" : "#405A55",
                fontWeight: categorie === item.code ? 800 : 650,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main>
          <section style={{ padding: 20, border: "1px solid #DDE7E3", borderRadius: 14, background: "#FFF", marginBottom: 18 }}>
            <h2 style={{ margin: "0 0 16px", color: "#063D32" }}>
              {editingId ? "Modifier" : "Ajouter"} — {currentCategory.label}
            </h2>

            {error && (
              <div style={{ marginBottom: 14, padding: 11, border: "1px solid #FECDD3", borderRadius: 9, background: "#FFF1F2", color: "#B4232F" }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{ marginBottom: 14, padding: 11, border: "1px solid #B8E8D6", borderRadius: 9, background: "#F1FBF7", color: "#007F5F" }}>
                {message}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 100px", gap: 12 }}>
              <label>
                <span>Code</span>
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="Auto si vide"
                  style={inputStyle}
                />
              </label>

              <label>
                <span>Libellé *</span>
                <input
                  value={form.libelle}
                  onChange={(event) => setForm((current) => ({ ...current, libelle: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <label>
                <span>Ordre</span>
                <input
                  type="number"
                  value={form.ordre}
                  onChange={(event) => setForm((current) => ({ ...current, ordre: Number(event.target.value) || 0 }))}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
              <button type="button" onClick={() => void saveItem()} disabled={saving} style={primaryButtonStyle}>
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {editingId ? "Enregistrer" : "Ajouter"}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm} style={secondaryButtonStyle}>
                  <X size={16} /> Annuler
                </button>
              )}
            </div>
          </section>

          <section style={{ border: "1px solid #DDE7E3", borderRadius: 14, background: "#FFF", overflow: "hidden" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #DDE7E3" }}>
              <h2 style={{ margin: 0, color: "#063D32" }}>{currentCategory.label}</h2>
            </div>

            {loading ? (
              <div style={{ padding: 30 }}><LoaderCircle className="spin" size={17} /> Chargement...</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 30 }}>Aucune valeur enregistrée.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F1FBF7" }}>
                    <th style={cellStyle}>Code</th>
                    <th style={cellStyle}>Libellé</th>
                    <th style={cellStyle}>Ordre</th>
                    <th style={cellStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ borderTop: "1px solid #EDF2F0" }}>
                      <td style={cellStyle}>{item.code}</td>
                      <td style={cellStyle}>{item.libelle}</td>
                      <td style={cellStyle}>{item.ordre ?? 0}</td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: 7 }}>
                          <button type="button" title="Modifier" onClick={() => startEdit(item)} style={iconButtonStyle}>
                            <Pencil size={15} />
                          </button>
                          <button type="button" title="Supprimer" onClick={() => void deleteItem(item)} style={{ ...iconButtonStyle, color: "#DC3545" }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 42,
  padding: "9px 11px",
  border: "1px solid #DDE7E3",
  borderRadius: 9,
  background: "#FFF",
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 40,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "0 14px",
  border: 0,
  borderRadius: 8,
  background: "#00966D",
  color: "#FFF",
  fontWeight: 750,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  border: "1px solid #DDE7E3",
  background: "#FFF",
  color: "#475D57",
};

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #DDE7E3",
  borderRadius: 8,
  background: "#FFF",
  cursor: "pointer",
};

const cellStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  color: "#344A46",
};
