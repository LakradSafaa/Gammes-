import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ImagePlus, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import api from "../../api/axios";

type DisplayMode = "list" | "cards" | "table";
type FieldConfig = { name: string; label: string; type?: "text" | "number" | "textarea" | "url" | "image"; required?: boolean; placeholder?: string };
type ReferentielItem = { id: string; [key: string]: unknown };
type Props = { title: string; subtitle?: string; endpoint: string; primaryField: string; secondaryFields?: string[]; imageField?: string; displayMode?: DisplayMode; fields: FieldConfig[] };

/** Normalise les réponses API paginées ou non. */
function extractItems(data: any): ReferentielItem[] {
  if (!data) return [];
  return Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
}

/** Transforme une erreur Axios/DRF en message lisible. */
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

/** Composant CRUD générique des référentiels spécialisés avec prise en charge des images. */
export default function ReferentielPage({ title, subtitle, endpoint, primaryField, secondaryFields = [], imageField, displayMode = "list", fields }: Props) {
  const [items, setItems] = useState<ReferentielItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /** Construit un objet formulaire vide à partir des champs configurés par la page spécialisée. */
  const initialForm = useMemo(() => {
    const data: Record<string, string> = {};
    fields.forEach((field) => { data[field.name] = ""; });
    return data;
  }, [fields]);

  const [form, setForm] = useState<Record<string, string>>(initialForm);

  /** Resynchronise le formulaire si la configuration des champs change. */
  useEffect(() => { setForm(initialForm); }, [initialForm]);

  /** Charge les lignes du référentiel depuis l'API. */
  const loadItems = async () => {
    setError("");
    try { const response = await api.get(endpoint); setItems(extractItems(response.data)); }
    catch (err) { console.error(err); setError(apiErrorMessage(err, `Impossible de charger ${title}.`)); }
  };

  /** Charge les données au premier affichage ou lors d'un changement d'endpoint. */
  useEffect(() => {
    const boot = async () => { setLoading(true); await loadItems(); setLoading(false); };
    void boot();
  }, [endpoint]);

  /** Remet le formulaire à zéro sans recharger toute l'application. */
  const resetForm = () => { setEditingId(null); setForm({ ...initialForm }); setError(""); };

  /** Actualise uniquement le référentiel courant et ferme l'édition en cours. */
  const handleRefresh = async () => { resetForm(); setMessage(""); setRefreshing(true); await loadItems(); setRefreshing(false); };

  /** Met à jour un champ texte, nombre ou textarea. */
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  /**
   * Charge une image locale, vérifie son type/taille puis la transforme en Data URL.
   * Le schéma actuel stocke image_url dans un champ texte, donc l'image peut être sauvegardée directement.
   */
  const handleImageFile = (fieldName: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Le fichier sélectionné n'est pas une image."); return; }
    if (file.size > 3 * 1024 * 1024) { setError("L'image ne doit pas dépasser 3 Mo."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { setForm((previous) => ({ ...previous, [fieldName]: reader.result as string })); setError(""); } };
    reader.onerror = () => setError("Impossible de lire cette image.");
    reader.readAsDataURL(file);
  };

  /** Prépare une ligne existante pour modification. */
  const handleEdit = (item: ReferentielItem) => {
    const nextForm: Record<string, string> = {};
    fields.forEach((field) => { const value = item[field.name]; nextForm[field.name] = value == null ? "" : String(value); });
    setEditingId(item.id); setForm(nextForm); setError(""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Construit le payload puis crée ou modifie l'élément via l'API. */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const value = form[field.name];
      payload[field.name] = field.type === "number" ? (value === "" ? null : Number(value)) : (value || null);
    });
    setSaving(true); setError(""); setMessage("");
    try {
      if (editingId) await api.patch(`${endpoint}${editingId}/`, payload);
      else await api.post(endpoint, payload);
      setMessage(editingId ? "Élément modifié avec succès." : "Élément ajouté avec succès.");
      resetForm(); await loadItems();
    } catch (err) { console.error(err); setError(apiErrorMessage(err, "Impossible d'enregistrer cet élément.")); }
    finally { setSaving(false); }
  };

  /** Supprime un élément après confirmation. */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    try { setError(""); setMessage(""); await api.delete(`${endpoint}${id}/`); if (editingId === id) resetForm(); setMessage("Élément supprimé."); await loadItems(); }
    catch (err) { console.error(err); setError(apiErrorMessage(err, "Suppression impossible. Cet élément est peut-être déjà utilisé.")); }
  };

  /** Retourne une propriété d'une ligne sous forme de chaîne pour l'affichage générique. */
  const getValue = (item: ReferentielItem, fieldName: string): string => {
    const value = item[fieldName]; return value == null ? "" : String(value);
  };

  return (
    <div style={{ width: "100%", padding: 24, boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div><p style={{ margin: 0, color: "#007F5F", fontWeight: 800, fontSize: 12 }}>RÉFÉRENTIELS</p><h1 style={{ margin: "6px 0 0", color: "#172B2A", fontSize: 28 }}>{title}</h1>{subtitle && <p style={{ marginTop: 8, color: "#64748B" }}>{subtitle}</p>}</div>
        <button type="button" onClick={() => void handleRefresh()} disabled={refreshing || saving} style={secondaryButton}><RefreshCw size={16} className={refreshing ? "spin" : undefined} /> Actualiser</button>
      </div>

      {error && <div style={errorBox}>{error}</div>}
      {message && <div style={successBox}>{message}</div>}

      <div style={{ background: "#FFF", border: "1px solid #DDE7E3", borderRadius: 14, padding: 22, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, color: "#172B2A", fontSize: 18 }}>{editingId ? "Modifier" : "Ajouter"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            {fields.map((field) => <div key={field.name}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 650 }}>{field.label}{field.required ? " *" : ""}</label>
              {field.type === "textarea" ? (
                <textarea name={field.name} required={field.required} value={form[field.name] ?? ""} onChange={handleChange} rows={4} style={control} />
              ) : field.type === "image" ? (
                <div>
                  <label style={imagePicker}><ImagePlus size={18} /> Choisir une image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }} onChange={(e) => handleImageFile(field.name, e.target.files?.[0])} /></label>
                  {form[field.name] && <div style={{ marginTop: 10, position: "relative", width: 160 }}><img src={form[field.name]} alt="Aperçu" style={{ width: 160, height: 110, objectFit: "contain", border: "1px solid #DDE7E3", borderRadius: 8 }} /><button type="button" onClick={() => setForm((p) => ({ ...p, [field.name]: "" }))} style={removeImage}><X size={15} /></button></div>}
                </div>
              ) : (
                <input name={field.name} type={field.type ?? "text"} required={field.required} placeholder={field.placeholder} value={form[field.name] ?? ""} onChange={handleChange} style={control} />
              )}
            </div>)}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" disabled={saving} style={primaryButton}>{saving ? <LoaderCircle className="spin" size={16} /> : editingId ? <Pencil size={16} /> : <Plus size={16} />}{saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Ajouter"}</button>
            {editingId && <button type="button" disabled={saving} onClick={resetForm} style={secondaryButton}><X size={16} /> Annuler</button>}
          </div>
        </form>
      </div>

      <div style={{ background: "#FFF", border: "1px solid #DDE7E3", borderRadius: 14, padding: 22 }}>
        {loading ? <p>Chargement...</p> : items.length === 0 ? <p style={{ color: "#64748B" }}>Aucun élément enregistré.</p> : (
          <div style={displayMode === "cards" ? { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 } : { display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid #DDE7E3", borderRadius: 10, padding: 14 }}>
              {imageField && getValue(item, imageField) && <img src={getValue(item, imageField)} alt={getValue(item, primaryField)} style={{ width: 64, height: 64, objectFit: "contain", border: "1px solid #DDE7E3", borderRadius: 8 }} />}
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 750 }}>{getValue(item, primaryField)}</div>{secondaryFields.map((fieldName) => { const value = getValue(item, fieldName); return value ? <div key={fieldName} style={{ color: "#64748B", fontSize: 14, marginTop: 3 }}>{value}</div> : null; })}</div>
              <button type="button" onClick={() => handleEdit(item)} style={smallButton}><Pencil size={15} /> Modifier</button>
              <button type="button" onClick={() => void handleDelete(item.id)} style={{ ...smallButton, color: "#DC3545", borderColor: "#F4B5BB" }}><Trash2 size={15} /> Supprimer</button>
            </div>)}
          </div>
        )}
      </div>
    </div>
  );
}

const control: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #DDE7E3", borderRadius: 8, padding: "10px 12px", fontFamily: "inherit" };
const imagePicker: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 42, border: "1px dashed #9CCDBD", borderRadius: 8, background: "#F1FBF7", color: "#007F5F", fontWeight: 700, cursor: "pointer" };
const removeImage: React.CSSProperties = { position: "absolute", top: 5, right: 5, width: 30, height: 30, border: "1px solid #F4B5BB", borderRadius: 8, background: "#FFF", color: "#DC3545", cursor: "pointer" };
const primaryButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, border: 0, borderRadius: 8, padding: "10px 18px", background: "#00966D", color: "#FFF", cursor: "pointer", fontWeight: 700 };
const secondaryButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #DDE7E3", borderRadius: 8, padding: "10px 16px", background: "#FFF", color: "#405A55", cursor: "pointer", fontWeight: 650 };
const smallButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #9CCDBD", borderRadius: 7, padding: "7px 10px", background: "#FFF", color: "#007F5F", cursor: "pointer", fontWeight: 650 };
const errorBox: React.CSSProperties = { marginBottom: 14, padding: 11, border: "1px solid #FECDD3", borderRadius: 9, background: "#FFF1F2", color: "#B4232F" };
const successBox: React.CSSProperties = { marginBottom: 14, padding: 11, border: "1px solid #B8E8D6", borderRadius: 9, background: "#F1FBF7", color: "#007F5F" };
