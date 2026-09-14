import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";
import "./Equipements.css";


/* ============================================================
   TYPES
============================================================ */

type Equipement = {
  id: string;
  code: string;
  nom: string;
  constructeur?: string | null;
  type?: string | null;
  reference?: string | null;
  description?: string | null;
  actif?: boolean;
};


type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};


type EquipmentForm = {
  code: string;
  nom: string;
  constructeur: string;
  type: string;
  reference: string;
  description: string;
};


/* ============================================================
   UTILITAIRE API
============================================================ */

function extractResults<T>(
  data: T[] | PaginatedResponse<T>
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    Array.isArray(data.results)
  ) {
    return data.results;
  }

  return [];
}


/* ============================================================
   FORMULAIRE VIDE
============================================================ */

const emptyForm: EquipmentForm = {
  code: "",
  nom: "",
  constructeur: "",
  type: "",
  reference: "",
  description: "",
};


/* ============================================================
   PAGE ÉQUIPEMENTS
============================================================ */

export default function Equipements() {
  const [items, setItems] = useState<Equipement[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [open, setOpen] = useState(false);

  const [editing, setEditing] =
    useState<Equipement | null>(null);

  const [form, setForm] =
    useState<EquipmentForm>(emptyForm);


  /* ============================================================
     CHARGEMENT
  ============================================================ */

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<
        Equipement[] | PaginatedResponse<Equipement>
      >("/equipements/");

      setItems(extractResults(response.data));
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les équipements.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void load();
  }, []);


  /* ============================================================
     RECHERCHE
  ============================================================ */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) =>
      [
        item.code,
        item.nom,
        item.constructeur ?? "",
        item.type ?? "",
        item.reference ?? "",
      ]
        .map((value) =>
          String(value ?? "").toLowerCase()
        )
        .some((value) =>
          value.includes(query)
        )
    );
  }, [items, search]);


  /* ============================================================
     AJOUTER
  ============================================================ */

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setOpen(true);
  };


  /* ============================================================
     MODIFIER
  ============================================================ */

  const startEdit = (item: Equipement) => {
    setEditing(item);

    setForm({
      code: item.code ?? "",
      nom: item.nom ?? "",
      constructeur: item.constructeur ?? "",
      type: item.type ?? "",
      reference: item.reference ?? "",
      description: item.description ?? "",
    });

    setError("");
    setMessage("");
    setOpen(true);
  };


  /* ============================================================
     ENREGISTRER
  ============================================================ */

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.code.trim() || !form.nom.trim()) {
      setError(
        "Le code et le nom de l'équipement sont obligatoires."
      );
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      nom: form.nom.trim(),

      constructeur:
        form.constructeur.trim() || null,

      type:
        form.type.trim() || null,

      reference:
        form.reference.trim() || null,

      description:
        form.description.trim() || null,

      actif: true,
    };

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editing) {
        await api.patch(
          `/equipements/${editing.id}/`,
          payload
        );

        setMessage("Équipement modifié avec succès.");
      } else {
        await api.post(
          "/equipements/",
          payload
        );

        setMessage("Équipement ajouté avec succès.");
      }

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);

      await load();
    } catch (err: unknown) {
      console.error(err);

      let messageErreur =
        "Enregistrement impossible.";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const axiosError = err as {
          response?: {
            data?: {
              detail?: string;
              code?: string[];
              nom?: string[];
            };
          };
        };

        const response =
          axiosError.response?.data;

        messageErreur =
          response?.detail ||
          response?.code?.[0] ||
          response?.nom?.[0] ||
          messageErreur;
      }

      setError(messageErreur);
    } finally {
      setSaving(false);
    }
  };


  /* ============================================================
     SUPPRIMER
  ============================================================ */

  const remove = async (item: Equipement) => {
    const name = item.code
      ? `${item.code} — ${item.nom}`
      : item.nom;

    const confirmation = window.confirm(
      `Supprimer l'équipement « ${name} » ?`
    );

    if (!confirmation) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(
        `/equipements/${item.id}/`
      );

      setItems((current) =>
        current.filter(
          (row) => row.id !== item.id
        )
      );

      setMessage("Équipement supprimé.");
    } catch (err: unknown) {
      console.error(err);

      let messageErreur =
        "Suppression impossible. L'équipement peut déjà être utilisé par une gamme.";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const axiosError = err as {
          response?: {
            data?: {
              detail?: string;
            };
          };
        };

        messageErreur =
          axiosError.response?.data?.detail ||
          messageErreur;
      }

      setError(messageErreur);
    }
  };


  /* ============================================================
     CHARGEMENT
  ============================================================ */

  if (loading) {
    return (
      <div className="equipment-loading">
        <LoaderCircle
          className="spin"
          size={22}
        />

        Chargement des équipements...
      </div>
    );
  }


  /* ============================================================
     AFFICHAGE
  ============================================================ */

  return (
    <div className="equipment-page">

      <header className="equipment-header">
        <div>
          <h1>Équipements</h1>

          <p>
            Ajoutez, modifiez ou supprimez les équipements
            utilisés dans le Wizard.
          </p>
        </div>

        <button
          type="button"
          className="equipment-create"
          onClick={startCreate}
        >
          <Plus size={18} />
          Nouvel équipement
        </button>
      </header>


      {error && (
        <div className="equipment-alert error">
          {error}
        </div>
      )}


      {message && (
        <div className="equipment-alert success">
          {message}
        </div>
      )}


      <section className="equipment-card">

        <div className="equipment-toolbar">

          <label className="equipment-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un équipement..."
            />
          </label>

          <span>
            {filtered.length} équipement(s)
          </span>

        </div>


        <div className="equipment-table-wrap">

          <table className="equipment-table">

            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Constructeur</th>
                <th>Type</th>
                <th>Référence</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="equipment-empty"
                  >
                    Aucun équipement.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>

                    <td>
                      <strong>
                        {item.code || "—"}
                      </strong>
                    </td>

                    <td>{item.nom}</td>

                    <td>
                      {item.constructeur || "—"}
                    </td>

                    <td>
                      {item.type || "—"}
                    </td>

                    <td>
                      {item.reference || "—"}
                    </td>

                    <td>
                      <div className="eq-actions">

                        <button
                          type="button"
                          title="Modifier"
                          onClick={() =>
                            startEdit(item)
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="danger"
                          title="Supprimer"
                          onClick={() =>
                            void remove(item)
                          }
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


      {open && (
        <div
          className="equipment-modal-backdrop"
          onMouseDown={() => {
            if (!saving) {
              setOpen(false);
            }
          }}
        >

          <form
            className="equipment-modal"
            onSubmit={submit}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="equipment-modal-head">

              <div>
                <h2>
                  {editing
                    ? "Modifier l'équipement"
                    : "Ajouter un équipement"}
                </h2>

                <p>
                  Ces informations seront disponibles
                  dans la création d'une gamme.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="equipment-form-grid">

              <label>
                <span>Code *</span>

                <input
                  required
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                />
              </label>


              <label>
                <span>Nom *</span>

                <input
                  required
                  value={form.nom}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nom: event.target.value,
                    }))
                  }
                />
              </label>


              <label>
                <span>Constructeur</span>

                <input
                  value={form.constructeur}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      constructeur: event.target.value,
                    }))
                  }
                />
              </label>


              <label>
                <span>Type machine</span>

                <input
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                />
              </label>


              <label className="equipment-span-2">
                <span>Référence machine</span>

                <input
                  value={form.reference}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                />
              </label>


              <label className="equipment-span-2">
                <span>Description</span>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

            </div>


            <div className="equipment-modal-actions">

              <button
                type="button"
                className="equipment-cancel"
                disabled={saving}
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                  setForm(emptyForm);
                }}
              >
                Annuler
              </button>


              <button
                type="submit"
                className="equipment-create"
                disabled={saving}
              >
                {saving && (
                  <LoaderCircle
                    className="spin"
                    size={17}
                  />
                )}

                Enregistrer
              </button>

            </div>

          </form>

        </div>
      )}

    </div>
  );
}
