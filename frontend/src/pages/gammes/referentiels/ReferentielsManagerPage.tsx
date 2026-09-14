import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
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


type ReferentielCategory = {
  id: string;
  code: string;
  libelle: string;
  type_source: "generic" | "table" | string;
  table_source?: string | null;
  ordre?: number;
  actif?: boolean;
};


type ReferentielValue = {
  id: string;
  categorie: string;
  code: string;
  libelle: string;
  ordre?: number;
  actif?: boolean;
};


type FormState = {
  code: string;
  libelle: string;
  ordre: number;
};


const EMPTY_FORM: FormState = {
  code: "",
  libelle: "",
  ordre: 0,
};


const SPECIAL_ROUTES: Record<
  string,
  string
> = {
  epi: "/epis",
  epc: "/referentiels/epc",
  risques: "/risques",
  outils: "/outillages",
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


export default function ReferentielsManagerPage() {
  const navigate = useNavigate();

  const [categories, setCategories] =
    useState<ReferentielCategory[]>([]);

  const [values, setValues] =
    useState<ReferentielValue[]>([]);

  const [selectedCategoryCode, setSelectedCategoryCode] =
    useState<string>("");

  const [loadingCategories, setLoadingCategories] =
    useState<boolean>(true);

  const [loadingValues, setLoadingValues] =
    useState<boolean>(false);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);


  const selectedCategory = useMemo<
    ReferentielCategory | undefined
  >(() => {
    return categories.find(
      (item: ReferentielCategory) =>
        item.code === selectedCategoryCode,
    );
  }, [categories, selectedCategoryCode]);


  const isSpecialTable =
    selectedCategory?.type_source === "table";


  useEffect(() => {
    void loadCategories();
  }, []);


  useEffect(() => {
    if (!selectedCategoryCode) {
      setValues([]);
      return;
    }

    const category = categories.find(
      (item: ReferentielCategory) =>
        item.code === selectedCategoryCode,
    );

    if (!category) {
      return;
    }

    if (category.type_source === "table") {
      setValues([]);
      return;
    }

    void loadValues(selectedCategoryCode);
  }, [selectedCategoryCode, categories]);


  async function loadCategories() {
    setLoadingCategories(true);
    setError("");

    try {
      const response =
        await api.get<
          ApiList<ReferentielCategory>
        >(
          "/v2/referentiel-categories/",
        );

      const result =
        extractResults<ReferentielCategory>(
          response.data,
        )
          .filter(
            (item: ReferentielCategory) =>
              item.actif !== false,
          )
          .sort(
            (
              a: ReferentielCategory,
              b: ReferentielCategory,
            ) =>
              (a.ordre ?? 0) -
              (b.ordre ?? 0),
          );

      setCategories(result);

      if (
        result.length > 0 &&
        !selectedCategoryCode
      ) {
        setSelectedCategoryCode(
          result[0].code,
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        `Impossible de charger les catégories : ${getErrorMessage(
          err,
        )}`,
      );
    } finally {
      setLoadingCategories(false);
    }
  }


  async function loadValues(
    categorie: string,
  ) {
    setLoadingValues(true);
    setError("");

    try {
      const response =
        await api.get<
          ApiList<ReferentielValue>
        >(
          `/v2/referentiels/?categorie=${encodeURIComponent(
            categorie,
          )}&include_inactive=true`,
        );

      const result =
        extractResults<ReferentielValue>(
          response.data,
        ).sort(
          (
            a: ReferentielValue,
            b: ReferentielValue,
          ) =>
            (a.ordre ?? 0) -
            (b.ordre ?? 0),
        );

      setValues(result);
    } catch (err) {
      console.error(err);

      setError(
        `Impossible de charger les valeurs : ${getErrorMessage(
          err,
        )}`,
      );
    } finally {
      setLoadingValues(false);
    }
  }


  function selectCategory(
    code: string,
  ) {
    setSelectedCategoryCode(code);
    resetForm();
    setError("");
  }


  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }


  function startEdit(
    item: ReferentielValue,
  ) {
    setEditingId(item.id);

    setForm({
      code: item.code,
      libelle: item.libelle,
      ordre: item.ordre ?? 0,
    });
  }


  async function handleSave() {
    if (!selectedCategoryCode) {
      setError(
        "Sélectionnez une catégorie.",
      );
      return;
    }

    if (!form.code.trim()) {
      setError(
        "Le code est obligatoire.",
      );
      return;
    }

    if (!form.libelle.trim()) {
      setError(
        "Le libellé est obligatoire.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await api.patch(
          `/v2/referentiels/${editingId}/`,
          {
            code: form.code.trim(),
            libelle:
              form.libelle.trim(),
            ordre: form.ordre,
          },
        );
      } else {
        await api.post(
          "/v2/referentiels/",
          {
            categorie:
              selectedCategoryCode,
            code: form.code.trim(),
            libelle:
              form.libelle.trim(),
            ordre: form.ordre,
            actif: true,
          },
        );
      }

      resetForm();

      await loadValues(
        selectedCategoryCode,
      );
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


  async function toggleActive(
    item: ReferentielValue,
  ) {
    setError("");

    try {
      await api.patch(
        `/v2/referentiels/${item.id}/`,
        {
          actif: item.actif === false,
        },
      );

      await loadValues(
        selectedCategoryCode,
      );
    } catch (err) {
      console.error(err);

      setError(
        `Modification impossible : ${getErrorMessage(
          err,
        )}`,
      );
    }
  }


  async function deleteValue(
    item: ReferentielValue,
  ) {
    const confirmed = window.confirm(
      `Supprimer définitivement "${item.libelle}" ?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.delete(
        `/v2/referentiels/${item.id}/`,
      );

      if (editingId === item.id) {
        resetForm();
      }

      await loadValues(
        selectedCategoryCode,
      );
    } catch (err) {
      console.error(err);

      setError(
        `Suppression impossible : ${getErrorMessage(
          err,
        )}`,
      );
    }
  }


  function openSpecialTable() {
    if (!selectedCategory) {
      return;
    }

    const route =
      SPECIAL_ROUTES[
        selectedCategory.code
      ];

    if (!route) {
      return;
    }

    navigate(route);
  }


  return (
    <div className="referentiels-page">

      <header className="referentiels-header">
        <div>
          <span className="referentiels-kicker">
            Paramètres
          </span>

          <h1>
            Référentiels
          </h1>

          <p>
            Gérez les listes déroulantes utilisées
            dans les gammes opératoires.
          </p>
        </div>
      </header>


      {error && (
        <div className="referentiel-error">
          {error}
        </div>
      )}


      <div className="referentiels-layout">

        {/* ====================================================
            CATEGORIES
            ==================================================== */}

        <aside className="referentiels-sidebar">

          <div className="referentiels-sidebar-title">
            Listes disponibles
          </div>


          {loadingCategories ? (
            <div className="referentiel-loading">
              <Loader2
                size={18}
                className="spin"
              />

              Chargement...
            </div>
          ) : categories.length === 0 ? (
            <div className="referentiel-empty">
              Aucune catégorie.
            </div>
          ) : (
            <div className="referentiels-category-list">
              {categories.map(
                (
                  category: ReferentielCategory,
                ) => (
                  <button
                    key={category.id}
                    type="button"
                    className={[
                      "referentiel-category-button",
                      selectedCategoryCode ===
                      category.code
                        ? "active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      selectCategory(
                        category.code,
                      )
                    }
                  >
                    <span>
                      {category.libelle}
                    </span>

                    {category.type_source ===
                      "table" && (
                      <small>
                        Table
                      </small>
                    )}
                  </button>
                ),
              )}
            </div>
          )}

        </aside>


        {/* ====================================================
            CONTENT
            ==================================================== */}

        <main className="referentiels-content">

          {!selectedCategory ? (
            <section className="referentiel-card">
              <div className="referentiel-empty">
                Sélectionnez une catégorie.
              </div>
            </section>
          ) : isSpecialTable ? (
            <section className="referentiel-card">

              <div className="referentiel-section-title">
                <div>
                  <h2>
                    {selectedCategory.libelle}
                  </h2>

                  <p>
                    Cette liste utilise une table
                    spécialisée :
                    {" "}
                    <strong>
                      {selectedCategory.table_source ||
                        "—"}
                    </strong>
                  </p>
                </div>
              </div>


              <div className="special-table-box">

                <div>
                  <strong>
                    Référentiel spécialisé
                  </strong>

                  <p>
                    Les valeurs de cette liste possèdent
                    leur propre table et doivent être
                    gérées depuis leur module dédié.
                  </p>
                </div>


                {SPECIAL_ROUTES[
                  selectedCategory.code
                ] ? (
                  <button
                    type="button"
                    className="referentiel-primary-button"
                    onClick={
                      openSpecialTable
                    }
                  >
                    Ouvrir la gestion

                    <ExternalLink
                      size={16}
                    />
                  </button>
                ) : (
                  <span className="referentiel-muted">
                    Aucun écran dédié configuré.
                  </span>
                )}

              </div>

            </section>
          ) : (
            <>

              {/* ==============================================
                  FORMULAIRE
                  ============================================== */}

              <section className="referentiel-card">

                <div className="referentiel-section-title">
                  <div>
                    <h2>
                      {selectedCategory.libelle}
                    </h2>

                    <p>
                      {editingId
                        ? "Modifier la valeur sélectionnée."
                        : "Ajouter une nouvelle valeur à cette liste."}
                    </p>
                  </div>
                </div>


                <div className="referentiel-form-grid">

                  <label>
                    <span>
                      Code *
                    </span>

                    <input
                      type="text"
                      value={form.code}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            code:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Ex. automatisme"
                    />
                  </label>


                  <label>
                    <span>
                      Libellé *
                    </span>

                    <input
                      type="text"
                      value={form.libelle}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            libelle:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Ex. Automatisme"
                    />
                  </label>


                  <label>
                    <span>
                      Ordre
                    </span>

                    <input
                      type="number"
                      min={0}
                      value={form.ordre}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            ordre:
                              Number(
                                event.target
                                  .value,
                              ) || 0,
                          }),
                        )
                      }
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


              {/* ==============================================
                  TABLEAU
                  ============================================== */}

              <section className="referentiel-card">

                <div className="referentiel-section-title">
                  <div>
                    <h2>
                      Valeurs
                    </h2>

                    <p>
                      {values.length} valeur
                      {values.length > 1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>


                {loadingValues ? (
                  <div className="referentiel-loading">
                    <Loader2
                      size={18}
                      className="spin"
                    />

                    Chargement...
                  </div>
                ) : values.length === 0 ? (
                  <div className="referentiel-empty">
                    Aucune valeur disponible.
                  </div>
                ) : (
                  <div className="referentiel-table-wrapper">

                    <table className="referentiel-table">

                      <thead>
                        <tr>
                          <th>
                            Ordre
                          </th>

                          <th>
                            Code
                          </th>

                          <th>
                            Libellé
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
                        {values.map(
                          (
                            item: ReferentielValue,
                          ) => (
                            <tr key={item.id}>

                              <td>
                                {item.ordre ?? 0}
                              </td>


                              <td>
                                <code>
                                  {item.code}
                                </code>
                              </td>


                              <td>
                                <strong>
                                  {item.libelle}
                                </strong>
                              </td>


                              <td>
                                <button
                                  type="button"
                                  className={
                                    item.actif ===
                                    false
                                      ? "status-badge inactive"
                                      : "status-badge active"
                                  }
                                  onClick={() => {
                                    void toggleActive(
                                      item,
                                    );
                                  }}
                                >
                                  {item.actif ===
                                  false ? (
                                    <>
                                      <XCircle
                                        size={14}
                                      />

                                      Inactif
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2
                                        size={14}
                                      />

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
                                      startEdit(
                                        item,
                                      )
                                    }
                                  >
                                    <Pencil
                                      size={16}
                                    />
                                  </button>


                                  <button
                                    type="button"
                                    className="referentiel-icon-button danger"
                                    title="Supprimer"
                                    onClick={() => {
                                      void deleteValue(
                                        item,
                                      );
                                    }}
                                  >
                                    <Trash2
                                      size={16}
                                    />
                                  </button>

                                </div>
                              </td>

                            </tr>
                          ),
                        )}
                      </tbody>

                    </table>

                  </div>
                )}

              </section>

            </>
          )}

        </main>

      </div>
    </div>
  );
}
