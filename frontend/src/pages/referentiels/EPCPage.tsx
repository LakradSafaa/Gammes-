import { useEffect, useState } from "react";
import { Edit3, LoaderCircle, Plus, Trash2, X } from "lucide-react";

import api from "../../api/axios";
import "./ReferentielsManagerPage.css";

type EPC = {
  id: string;
  nom: string;
  description?: string | null;
  image_url?: string | null;
  actif?: boolean;
};

export default function EPCPage() {
  const [items, setItems] = useState<EPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EPC | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await api.get<EPC[]>("/v2/epcs/");
    setItems(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        setError("");
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
    setEditing({ id: "", nom: "", description: "" });
    setNom("");
    setDescription("");
    setError("");
    setMessage("");
  };

  const openEdit = (item: EPC) => {
    setEditing(item);
    setNom(item.nom);
    setDescription(item.description ?? "");
    setError("");
    setMessage("");
  };

  const save = async () => {
    if (!nom.trim()) {
      setError("Le nom de l'EPC est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editing?.id) {
        await api.patch(`/v2/epcs/${editing.id}/`, {
          nom: nom.trim(),
          description: description.trim() || null,
        });
        setMessage("EPC modifié avec succès.");
      } else {
        await api.post("/v2/epcs/", {
          nom: nom.trim(),
          description: description.trim() || null,
        });
        setMessage("EPC ajouté avec succès.");
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

  const remove = async (item: EPC) => {
    if (!window.confirm(`Supprimer « ${item.nom} » ?`)) return;

    try {
      setError("");
      setMessage("");
      await api.delete(`/v2/epcs/${item.id}/`);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setMessage("EPC supprimé.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Suppression impossible. Cet EPC peut déjà être utilisé par une gamme.",
      );
    }
  };

  if (loading) {
    return (
      <div className="refs-loading">
        <LoaderCircle className="spin" size={28} /> Chargement des EPC...
      </div>
    );
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
      {message && <div className="refs-alert success">{message}</div>}

      {editing && (
        <section className="refs-card refs-editor">
          <div className="refs-editor-header">
            <h3>{editing.id ? "Modifier l'EPC" : "Ajouter un EPC"}</h3>
            <button type="button" className="refs-icon-button" onClick={() => setEditing(null)}>
              <X size={18} />
            </button>
          </div>
          <div className="refs-form-grid">
            <label>
              <span>Nom *</span>
              <input value={nom} onChange={(event) => setNom(event.target.value)} />
            </label>
            <label>
              <span>Description</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>
          <div className="refs-editor-actions">
            <button
              type="button"
              className="refs-secondary-button"
              onClick={() => setEditing(null)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="refs-primary-button"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? <LoaderCircle className="spin" size={17} /> : null}
              Enregistrer
            </button>
          </div>
        </section>
      )}

      <section className="refs-card refs-table-card">
        <div className="refs-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3}>Aucun EPC.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nom}</td>
                    <td>{item.description || "—"}</td>
                    <td>
                      <div className="refs-actions">
                        <button type="button" title="Modifier" onClick={() => openEdit(item)}>
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          title="Supprimer"
                          onClick={() => void remove(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
