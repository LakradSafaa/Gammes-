import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../../api/axios";
import "./ReferentielsManagerPage.css";


type ApiList<T> =
  | T[]
  | {
      results?: T[];
    };


type Epc = {
  id: string;
  nom: string;
  description?: string | null;
  image_url?: string | null;
  actif?: boolean;
};


type FormState = {
  nom: string;
  description: string;
};


const EMPTY_FORM: FormState = {
  nom: "",
  description: "",
};


function extractResults<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.results ?? [];
}


function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: {
        data?: unknown;
      };
    };

    const data = axiosError.response?.data;

    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data === "object") {
      try {
        return JSON.stringify(data);
      } catch {
        return "Une erreur est survenue.";
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}


export default function EPCPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Epc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState<string | null>(null);


  useEffect(() => {
    void loadItems();
  }, []);


  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const response =
        await api.get<ApiList<Epc>>("/v2/epcs/");

      setItems(
        extractResults<Epc>(response.data),
      );
    } catch (err) {
      console.error(err);

      setError(
        `Impossible de charger les EPC : ${getErrorMessage(
          err,
        )}`,
      );
    } finally {
      setLoading(false);
    }
  }


  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  }


  function startEdit(item: Epc) {
    setEditingId(item.id);

    setForm({
      nom: item.nom,
      description: item.description ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  async function handleSave() {
    if (!form.nom.trim()) {
      setError("Le nom de l'EPC est obligatoire.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await api.patch(
          `/v2/epcs/${editingId}/`,
          {
            nom: form.nom.trim(),
            description:
              form.description.trim() || null,
          },
        );
      } else {
        await api.post(
          "/v2/epcs/",
          {
            nom: form.nom.trim(),
            description:
              form.description.trim() || null,
            actif: true,
          },
        );
      }

      resetForm();

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        `Enregistrement impossible : ${getErrorMessage(
          err,
        )}`,
      );
    } finally {
      setSaving(false);
    }
  }


  async function toggleActive(item: Epc) {
    setError("");

    try {
      await api.patch(
        `/v2/epcs/${item.id}/`,
        {
          actif: item.actif === false,
        },
      );

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        `Modification impossible : ${getErrorMessage(
          err,
        )}`,
      );
    }
  }


  async function deleteItem(item: Epc) {
    const confirmed = window.confirm(
      `Supprimer définitivement l'EPC "${item.nom}" ?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.delete(
        `/v2/epcs/${item.id}/`,
      );

      if (editingId === item.id) {
        resetForm();
      }

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        `Suppression impossible : ${getErrorMessage(
          err,
        )}`,
      );
    }
  }


  return (
    <div className="referentiels-page">

      <header className="referentiels-header">
        <div>
          <span className="referentiels-kicker">
            Référentiels
          </span>

          <h1>
            EPC
          </h1>

          <p>
            Gérez les équipements de protection
            collective proposés dans les gammes.
          </p>
        </div>

        <button
          type="button"
          className="referentiel-secondary-button"
          onClick={() =>
            navigate("/referentiels")
          }
        >
          <ArrowLeft size={17} />

          Retour aux référentiels
        </button>
      </header>


      {error && (
        <div className="referentiel-error">
          {error}
        </div>
      )}


      <section className="referentiel-card">
        <div className="referentiel-section-title">
          <div>
            <h2>
              {editingId
                ? "Modifier l'EPC"
                : "Ajouter un EPC"}
            </h2>

            <p>
              Nom et description de la protection
              collective.
            </p>
          </div>
        </div>


        <div className="referentiel-form-grid">
          <label>
            <span>
              Nom *
            </span>

            <input
              type="text"
              value={form.nom}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nom: event.target.value,
                }))
              }
              placeholder="Ex. Balisage de zone"
            />
          </label>


          <label className="referentiel-form-span-2">
            <span>
              Description
            </span>

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description:
                    event.target.value,
                }))
              }
              placeholder="Description de l'EPC..."
            />
          </label>
        </div>


        <div className="referentiel-form-actions">

          {editingId && (
            <button
              type="button"
              className="referentiel-secondary-button"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={16} />

              Annuler
            </button>
          )}


          <button
            type="button"
            className="referentiel-primary-button"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2
                  size={16}
                  className="spin"
                />

                Enregistrement...
              </>
            ) : editingId ? (
              <>
                <Save size={16} />

                Enregistrer
              </>
            ) : (
              <>
                <Plus size={16} />

                Ajouter
              </>
            )}
          </button>

        </div>
      </section>


      <section className="referentiel-card">
        <div className="referentiel-section-title">
          <div>
            <h2>
              Liste des EPC
            </h2>

            <p>
              {items.length} élément
              {items.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>


        {loading ? (
          <div className="referentiel-loading">
            <Loader2
              size={20}
              className="spin"
            />

            Chargement...
          </div>
        ) : items.length === 0 ? (
          <div className="referentiel-empty">
            Aucun EPC enregistré.
          </div>
        ) : (
          <div className="referentiel-table-wrapper">
            <table className="referentiel-table">
              <thead>
                <tr>
                  <th>
                    Nom
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Statut
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.nom}
                      </strong>
                    </td>

                    <td>
                      {item.description || "—"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className={
                          item.actif === false
                            ? "status-badge inactive"
                            : "status-badge active"
                        }
                        onClick={() => {
                          void toggleActive(item);
                        }}
                      >
                        {item.actif === false ? (
                          <>
                            <XCircle size={14} />

                            Inactif
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />

                            Actif
                          </>
                        )}
                      </button>
                    </td>

                    <td>
                      <div className="referentiel-row-actions">

                        <button
                          type="button"
                          className="referentiel-icon-button"
                          title="Modifier"
                          onClick={() =>
                            startEdit(item)
                          }
                        >
                          <Pencil size={16} />
                        </button>


                        <button
                          type="button"
                          className="referentiel-icon-button danger"
                          title="Supprimer"
                          onClick={() => {
                            void deleteItem(
                              item,
                            );
                          }}
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
