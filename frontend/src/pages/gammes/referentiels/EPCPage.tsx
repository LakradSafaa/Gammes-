import { useEffect, useState } from "react";
import { Edit3, LoaderCircle, Plus, Power, Trash2, X } from "lucide-react";

import api from "../../api/axios";
import "./ReferentielsManagerPage.css";

type EPC = {
  id: string;
  nom: string;
  description?: string | null;
  image_url?: string | null;
  actif: boolean;
};

export default function EPCPage() {
  const [items, setItems] = useState<EPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EPC | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const response = await api.get<EPC[]>("/v2/epcs/?include_inactive=true");
    setItems(response.data);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        await load();
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les EPC.");
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, []);

  const openCreate = () => {
    setEditing({ id: "", nom: "", description: "", image_url: null, actif: true });
    setNom("");
    setDescription("");
  };

  const openEdit = (item: EPC) => {
    setEditing(item);
    setNom(item.nom);
    setDescription(item.description ?? "");
  };

  const save = async () => {
    if (!nom.trim()) {
      setError("Le nom de l'EPC est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      if (editing?.id) {
        await api.patch(`/v2/epcs/${editing.id}/`, {
          nom: nom.trim(),
          description: description.trim() || null,
        });
      } else {
        await api.post("/v2/epcs/", {
          nom: nom.trim(),
          description: description.trim() || null,
        });
      }
      setEditing(null);
      await load();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Impossible d'enregistrer l'EPC.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: EPC) => {
    await api.patch(`/v2/epcs/${item.id}/`, { actif: !item.actif });
    await load();
  };

  const remove = async (item: EPC) => {
    if (!window.confirm(`Supprimer définitivement « ${item.nom} » ?`)) return;
    try {
      await api.delete(`/v2/epcs/${item.id}/`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Suppression impossible. Désactivez l'EPC s'il est déjà utilisé.");
    }
  };

  if (loading) {
    return <div className="refs-loading"><LoaderCircle className="spin" size={28} /> Chargement des EPC...</div>;
  }

  return (
    <div className="refs-page">
      <header className="refs-header">
        <div>
          <p className="refs-kicker">Référentiels</p>
          <h1>EPC</h1>
          <p>Équipements de protection collective disponibles pour les gammes.</p>
        </div>
        <button type="button" className="refs-primary-button" onClick={openCreate}>
          <Plus size={17} /> Ajouter
        </button>
      </header>

      {error && <div className="refs-alert error">{error}</div>}

      {editing && (
        <section className="refs-card refs-editor">
          <div className="refs-editor-header">
            <h3>{editing.id ? "Modifier l'EPC" : "Ajouter un EPC"}</h3>
            <button type="button" className="refs-icon-button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="refs-form-grid">
            <label>
              <span>Nom *</span>
              <input value={nom} onChange={(e) => setNom(e.target.value)} />
            </label>
            <label>
              <span>Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
          </div>
          <div className="refs-editor-actions">
            <button type="button" className="refs-secondary-button" onClick={() => setEditing(null)}>Annuler</button>
            <button type="button" className="refs-primary-button" disabled={saving} onClick={() => void save()}>
              {saving ? <LoaderCircle className="spin" size={17} /> : null} Enregistrer
            </button>
          </div>
        </section>
      )}

      <section className="refs-card refs-table-card">
        <div className="refs-table-wrap">
          <table>
            <thead><tr><th>Nom</th><th>Description</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.nom}</td>
                  <td>{item.description || "—"}</td>
                  <td><span className={item.actif ? "refs-status active" : "refs-status inactive"}>{item.actif ? "Actif" : "Inactif"}</span></td>
                  <td>
                    <div className="refs-actions">
                      <button type="button" title="Modifier" onClick={() => openEdit(item)}><Edit3 size={16} /></button>
                      <button type="button" title={item.actif ? "Désactiver" : "Activer"} onClick={() => void toggle(item)}><Power size={16} /></button>
                      <button type="button" className="danger" title="Supprimer" onClick={() => void remove(item)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
