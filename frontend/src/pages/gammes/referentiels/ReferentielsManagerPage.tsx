import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import api from "../../api/axios";
import "./ReferentielsManagerPage.css";

type Category = {
  id: string;
  code: string;
  libelle: string;
  type_source: "generic" | "table";
  table_source?: string | null;
  ordre: number;
  actif: boolean;
};

type RefValue = {
  id: string;
  categorie: string;
  code: string;
  libelle: string;
  ordre: number;
  actif: boolean;
};

type EditorState = {
  id?: string;
  code: string;
  libelle: string;
  ordre: number;
  actif: boolean;
};

const emptyEditor: EditorState = {
  code: "",
  libelle: "",
  ordre: 0,
  actif: true,
};

const specializedRoutes: Record<string, string> = {
  epi: "/epis",
  epc: "/referentiels/epc",
  outils: "/outillages",
  risques: "/risques",
};

export default function ReferentielsManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState<RefValue[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentCategory = useMemo(
    () => categories.find((item) => item.code === selectedCategory) ?? null,
    [categories, selectedCategory],
  );

  const loadCategories = async () => {
    const response = await api.get<Category[]>("/v2/referentiel-categories/");
    setCategories(response.data);

    const requested = searchParams.get("categorie");
    const fallback = response.data.find((item) => item.type_source === "generic")?.code ?? "";
    const nextCategory =
      requested && response.data.some((item) => item.code === requested)
        ? requested
        : fallback;

    setSelectedCategory(nextCategory);
  };

  const loadValues = async (categorie: string) => {
    if (!categorie) {
      setValues([]);
      return;
    }

    const category = categories.find((item) => item.code === categorie);
    if (category?.type_source === "table") {
      setValues([]);
      return;
    }

    const response = await api.get<RefValue[]>(
      `/v2/referentiels/?categorie=${encodeURIComponent(categorie)}&include_inactive=true`,
    );
    setValues(response.data);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        setError("");
        await loadCategories();
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les catégories de référentiels.");
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, []);

  useEffect(() => {
    if (!selectedCategory || categories.length === 0) {
      return;
    }

    setSearchParams({ categorie: selectedCategory }, { replace: true });
    setEditor(emptyEditor);
    setEditing(false);
    setMessage("");
    setError("");

    void loadValues(selectedCategory).catch((err) => {
      console.error(err);
      setError("Impossible de charger les valeurs du référentiel.");
    });
  }, [selectedCategory, categories]);

  const openCreate = () => {
    const nextOrder = values.length === 0 ? 1 : Math.max(...values.map((item) => item.ordre)) + 1;
    setEditor({ ...emptyEditor, ordre: nextOrder });
    setEditing(true);
    setError("");
    setMessage("");
  };

  const openEdit = (item: RefValue) => {
    setEditor({
      id: item.id,
      code: item.code,
      libelle: item.libelle,
      ordre: item.ordre,
      actif: item.actif,
    });
    setEditing(true);
    setError("");
    setMessage("");
  };

  const saveValue = async () => {
    if (!selectedCategory || !editor.code.trim() || !editor.libelle.trim()) {
      setError("Le code et le libellé sont obligatoires.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editor.id) {
        await api.patch(`/v2/referentiels/${editor.id}/`, {
          code: editor.code,
          libelle: editor.libelle,
          ordre: editor.ordre,
          actif: editor.actif,
        });
        setMessage("Valeur modifiée avec succès.");
      } else {
        await api.post("/v2/referentiels/", {
          categorie: selectedCategory,
          code: editor.code,
          libelle: editor.libelle,
          ordre: editor.ordre,
          actif: editor.actif,
        });
        setMessage("Valeur ajoutée avec succès.");
      }

      setEditing(false);
      setEditor(emptyEditor);
      await loadValues(selectedCategory);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Impossible d'enregistrer la valeur. Vérifiez qu'elle n'existe pas déjà.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: RefValue) => {
    try {
      setError("");
      await api.patch(`/v2/referentiels/${item.id}/`, { actif: !item.actif });
      await loadValues(selectedCategory);
    } catch (err) {
      console.error(err);
      setError("Impossible de modifier le statut de cette valeur.");
    }
  };

  const deleteValue = async (item: RefValue) => {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${item.libelle} » ?\n\nPour une valeur déjà utilisée dans des gammes, préférez la désactivation.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await api.delete(`/v2/referentiels/${item.id}/`);
      await loadValues(selectedCategory);
      setMessage("Valeur supprimée.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Suppression impossible. Désactivez la valeur si elle est déjà utilisée.",
      );
    }
  };

  if (loading) {
    return (
      <div className="refs-loading">
        <LoaderCircle className="spin" size={28} />
        <span>Chargement des référentiels...</span>
      </div>
    );
  }

  return (
    <div className="refs-page">
      <header className="refs-header">
        <div>
          <p className="refs-kicker">Administration</p>
          <h1>Référentiels</h1>
          <p>Ajoutez, modifiez, activez, désactivez ou supprimez les valeurs utilisées dans les listes déroulantes.</p>
        </div>

        <button
          type="button"
          className="refs-secondary-button"
          onClick={() => void loadValues(selectedCategory)}
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </header>

      <div className="refs-layout">
        <aside className="refs-categories">
          <h2>Listes</h2>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={selectedCategory === category.code ? "refs-category active" : "refs-category"}
              onClick={() => setSelectedCategory(category.code)}
            >
              <span>{category.libelle}</span>
              <small>{category.type_source === "table" ? "Table dédiée" : "Liste simple"}</small>
            </button>
          ))}
        </aside>

        <main className="refs-content">
          {currentCategory?.type_source === "table" ? (
            <section className="refs-card">
              <h2>{currentCategory.libelle}</h2>
              <p>
                Ce référentiel utilise la table spécialisée <strong>{currentCategory.table_source}</strong>. Il conserve sa propre page de gestion afin de garder ses champs spécifiques comme l'image ou la description.
              </p>
              <a className="refs-primary-link" href={specializedRoutes[currentCategory.code] ?? "/"}>
                Ouvrir la page {currentCategory.libelle}
              </a>
            </section>
          ) : (
            <>
              <section className="refs-card refs-toolbar-card">
                <div>
                  <h2>{currentCategory?.libelle ?? "Référentiel"}</h2>
                  <p>{values.length} valeur(s) enregistrée(s)</p>
                </div>

                <button type="button" className="refs-primary-button" onClick={openCreate}>
                  <Plus size={17} />
                  Ajouter
                </button>
              </section>

              {error && <div className="refs-alert error">{error}</div>}
              {message && <div className="refs-alert success">{message}</div>}

              {editing && (
                <section className="refs-card refs-editor">
                  <div className="refs-editor-header">
                    <h3>{editor.id ? "Modifier la valeur" : "Ajouter une valeur"}</h3>
                    <button type="button" className="refs-icon-button" onClick={() => setEditing(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="refs-form-grid">
                    <label>
                      <span>Code *</span>
                      <input
                        value={editor.code}
                        onChange={(event) =>
                          setEditor((current) => ({ ...current, code: event.target.value }))
                        }
                        placeholder="Ex. mensuelle"
                      />
                    </label>

                    <label>
                      <span>Libellé *</span>
                      <input
                        value={editor.libelle}
                        onChange={(event) =>
                          setEditor((current) => ({ ...current, libelle: event.target.value }))
                        }
                        placeholder="Ex. Mensuelle"
                      />
                    </label>

                    <label>
                      <span>Ordre</span>
                      <input
                        type="number"
                        min={0}
                        value={editor.ordre}
                        onChange={(event) =>
                          setEditor((current) => ({
                            ...current,
                            ordre: Number(event.target.value) || 0,
                          }))
                        }
                      />
                    </label>

                    <label className="refs-checkbox-label">
                      <input
                        type="checkbox"
                        checked={editor.actif}
                        onChange={(event) =>
                          setEditor((current) => ({ ...current, actif: event.target.checked }))
                        }
                      />
                      <span>Valeur active</span>
                    </label>
                  </div>

                  <div className="refs-editor-actions">
                    <button type="button" className="refs-secondary-button" onClick={() => setEditing(false)}>
                      Annuler
                    </button>
                    <button type="button" className="refs-primary-button" disabled={saving} onClick={() => void saveValue()}>
                      {saving ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}
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
                        <th>Ordre</th>
                        <th>Code</th>
                        <th>Libellé</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="refs-empty">Aucune valeur dans ce référentiel.</td>
                        </tr>
                      ) : (
                        values.map((item) => (
                          <tr key={item.id}>
                            <td>{item.ordre}</td>
                            <td><code>{item.code}</code></td>
                            <td>{item.libelle}</td>
                            <td>
                              <span className={item.actif ? "refs-status active" : "refs-status inactive"}>
                                {item.actif ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            <td>
                              <div className="refs-actions">
                                <button type="button" title="Modifier" onClick={() => openEdit(item)}>
                                  <Edit3 size={16} />
                                </button>
                                <button type="button" title={item.actif ? "Désactiver" : "Activer"} onClick={() => void toggleActive(item)}>
                                  <Power size={16} />
                                </button>
                                <button type="button" className="danger" title="Supprimer" onClick={() => void deleteValue(item)}>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
