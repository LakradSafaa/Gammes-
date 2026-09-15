import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";

type PaginatedResponse<T> = { results: T[] };
type RefValue = { id: string; categorie: string; code: string; libelle: string; ordre?: number; actif?: boolean | null };
type CategoryDefinition = { code: string; label: string };

const CATEGORIES: CategoryDefinition[] = [
  { code: "corps_metier", label: "Corps de métier" },
  { code: "type_maintenance", label: "Type de maintenance" },
  { code: "periodicite", label: "Périodicité" },
  { code: "type_arret", label: "Type d'arrêt" },
  { code: "profil", label: "Profil" },
  { code: "statut_gamme", label: "Statut de la gamme" },
  { code: "type_redaction", label: "Type de rédaction" },
];

/** Normalise une réponse API paginée ou non en tableau. */
function extractResults<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
}

/** Génère automatiquement un code technique propre depuis un libellé. */
function makeCode(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/** Transforme une erreur Axios/DRF en texte lisible pour l'utilisateur. */
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

/** Vérifie qu'une catégorie passée dans l'URL appartient bien aux listes gérées. */
function normalizeCategory(value: string | null): string {
  return CATEGORIES.find((item) => item.code === value)?.code ?? CATEGORIES[0].code;
}

/** Page unique de gestion des listes déroulantes stockées dans `referentiel_valeurs`. */
export default function ReferentielsManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = normalizeCategory(searchParams.get("categorie"));
  const [categorie, setCategorie] = useState(urlCategory);
  const [items, setItems] = useState<RefValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", libelle: "", ordre: 0 });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /** Retourne la définition d'affichage de la catégorie sélectionnée. */
  const currentCategory = useMemo(() => CATEGORIES.find((item) => item.code === categorie) ?? CATEGORIES[0], [categorie]);

  /** Synchronise la catégorie locale avec le lien cliqué dans la Sidebar. */
  useEffect(() => {
    setCategorie(urlCategory);
    setEditingId(null);
    setForm({ code: "", libelle: "", ordre: 0 });
    setError("");
    setMessage("");
  }, [urlCategory]);

  /** Relit uniquement la catégorie courante depuis Supabase. */
  const loadItems = async () => {
    setError("");
    try {
      const response = await api.get<RefValue[] | PaginatedResponse<RefValue>>(`/v2/referentiels/?categorie=${encodeURIComponent(categorie)}&include_inactive=true`);
      setItems(extractResults(response.data).filter((item) => item && item.categorie === categorie).slice().sort((a, b) => {
        const order = Number(a.ordre ?? 0) - Number(b.ordre ?? 0);
        return order !== 0 ? order : a.libelle.localeCompare(b.libelle, "fr");
      }));
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Impossible de charger cette liste."));
    }
  };

  /** Charge la liste lorsque la catégorie change. */
  useEffect(() => {
    const boot = async () => { setLoading(true); await loadItems(); setLoading(false); };
    void boot();
  }, [categorie]);

  /** Remet le formulaire Ajouter/Modifier à zéro. */
  const resetForm = () => {
    setEditingId(null);
    setForm({ code: "", libelle: "", ordre: 0 });
    setError("");
  };

  /** Actualiser remet la page dans un état propre puis relit Supabase sans recharger le navigateur. */
  const handleRefresh = async () => {
    resetForm(); setMessage(""); setRefreshing(true); await loadItems(); setRefreshing(false);
  };

  /** Change de catégorie et synchronise la query string utilisée par la Sidebar. */
  const changeCategory = (code: string) => setSearchParams({ categorie: code });

  /** Charge une valeur existante dans le formulaire de modification. */
  const startEdit = (item: RefValue) => {
    setEditingId(item.id);
    setForm({ code: item.code, libelle: item.libelle, ordre: Number(item.ordre ?? 0) });
    setError(""); setMessage("");
  };

  /** Ajoute ou modifie une valeur dans la table unique `referentiel_valeurs`. */
  const saveItem = async () => {
    const libelle = form.libelle.trim();
    if (!libelle) { setError("Le libellé est obligatoire."); return; }
    const payload = { categorie, code: form.code.trim() || makeCode(libelle), libelle, ordre: Number(form.ordre) || 0, actif: true };
    setSaving(true); setError(""); setMessage("");
    try {
      if (editingId) await api.patch(`/v2/referentiels/${editingId}/`, payload);
      else await api.post("/v2/referentiels/", payload);
      setMessage(editingId ? "Valeur modifiée." : "Valeur ajoutée.");
      resetForm(); await loadItems();
    } catch (err) { console.error(err); setError(apiErrorMessage(err, "Impossible d'enregistrer cette valeur.")); }
    finally { setSaving(false); }
  };

  /** Supprime réellement une valeur après confirmation. */
  const deleteItem = async (item: RefValue) => {
    if (!window.confirm(`Supprimer « ${item.libelle} » ?`)) return;
    try {
      setError(""); setMessage("");
      await api.delete(`/v2/referentiels/${item.id}/`);
      if (editingId === item.id) resetForm();
      setMessage("Valeur supprimée."); await loadItems();
    } catch (err) { console.error(err); setError(apiErrorMessage(err, "Suppression impossible.")); }
  };

  return (
    <div style={{ width: "100%", color: "#172B2A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div><p style={{ margin: 0, color: "#007F5F", fontWeight: 800, fontSize: 12 }}>RÉFÉRENTIELS</p><h1 style={{ margin: "6px 0", color: "#063D32" }}>Listes déroulantes</h1><p style={{ margin: 0, color: "#64748B" }}>Une seule base pour toutes les petites listes utilisées dans le Wizard.</p></div>
        <button type="button" onClick={() => void handleRefresh()} disabled={refreshing || saving} style={secondaryButton}><RefreshCw size={16} className={refreshing ? "spin" : undefined} /> Actualiser</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: 18 }}>
        <aside style={{ padding: 10, border: "1px solid #DDE7E3", borderRadius: 14, background: "#FFF" }}>
          {CATEGORIES.map((item) => <button key={item.code} type="button" onClick={() => changeCategory(item.code)} style={{ width: "100%", border: 0, borderRadius: 9, padding: "11px 12px", marginBottom: 5, background: categorie === item.code ? "#DDF7EE" : "transparent", color: categorie === item.code ? "#007F5F" : "#405A55", fontWeight: categorie === item.code ? 800 : 650, textAlign: "left", cursor: "pointer" }}>{item.label}</button>)}
        </aside>

        <main>
          <section style={{ padding: 20, border: "1px solid #DDE7E3", borderRadius: 14, background: "#FFF", marginBottom: 18 }}>
            <h2 style={{ margin: "0 0 16px", color: "#063D32" }}>{editingId ? "Modifier" : "Ajouter"} — {currentCategory.label}</h2>
            {error && <div style={errorBox}>{error}</div>}
            {message && <div style={successBox}>{message}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 100px", gap: 12 }}>
              <label style={labelStyle}><span>Code</span><input value={form.code} onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))} placeholder="Auto si vide" style={inputStyle} /></label>
              <label style={labelStyle}><span>Libellé *</span><input value={form.libelle} onChange={(e) => setForm((c) => ({ ...c, libelle: e.target.value }))} style={inputStyle} /></label>
              <label style={labelStyle}><span>Ordre</span><input type="number" value={form.ordre} onChange={(e) => setForm((c) => ({ ...c, ordre: Number(e.target.value) || 0 }))} style={inputStyle} /></label>
            </div>
            <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
              <button type="button" onClick={() => void saveItem()} disabled={saving} style={primaryButton}>{saving ? <LoaderCircle size={16} className="spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}{editingId ? "Enregistrer" : "Ajouter"}</button>
              {editingId && <button type="button" onClick={resetForm} style={secondaryButton}><X size={16} /> Annuler</button>}
            </div>
          </section>

          <section style={{ overflow: "hidden", border: "1px solid #DDE7E3", borderRadius: 14, background: "#FFF" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #DDE7E3" }}><h2 style={{ margin: 0, color: "#063D32", fontSize: 18 }}>{currentCategory.label}</h2></div>
            {loading ? <div style={{ padding: 30 }}>Chargement...</div> : items.length === 0 ? <div style={{ padding: 30, color: "#64748B" }}>Aucune valeur enregistrée.</div> : (
              <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ background: "#F1FBF7" }}><th style={th}>Code</th><th style={th}>Libellé</th><th style={th}>Ordre</th><th style={th}>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} style={{ borderTop: "1px solid #EDF2F0" }}><td style={td}>{item.code}</td><td style={td}><strong>{item.libelle}</strong></td><td style={td}>{Number(item.ordre ?? 0)}</td><td style={td}><div style={{ display: "flex", gap: 7 }}><button type="button" onClick={() => startEdit(item)} style={iconButton}><Pencil size={15} /></button><button type="button" onClick={() => void deleteItem(item)} style={{ ...iconButton, color: "#DC3545" }}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, fontWeight: 650 };
const inputStyle: React.CSSProperties = { minHeight: 42, padding: "9px 11px", border: "1px solid #DDE7E3", borderRadius: 9 };
const primaryButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", border: 0, borderRadius: 8, background: "#00966D", color: "#FFF", fontWeight: 700, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", border: "1px solid #DDE7E3", borderRadius: 8, background: "#FFF", color: "#405A55", fontWeight: 700, cursor: "pointer" };
const iconButton: React.CSSProperties = { width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #DDE7E3", borderRadius: 8, background: "#FFF", cursor: "pointer" };
const th: React.CSSProperties = { padding: "12px 14px", textAlign: "left", color: "#405A55", fontSize: 12, fontWeight: 800 };
const td: React.CSSProperties = { padding: "13px 14px", color: "#344A46", fontSize: 14 };
const errorBox: React.CSSProperties = { marginBottom: 14, padding: 11, border: "1px solid #FECDD3", borderRadius: 9, background: "#FFF1F2", color: "#B4232F" };
const successBox: React.CSSProperties = { marginBottom: 14, padding: 11, border: "1px solid #B8E8D6", borderRadius: 9, background: "#F1FBF7", color: "#007F5F" };
