import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  Edit3,
  ImageOff,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";
import { extractResults } from "../gammes/types";
import type { PaginatedResponse } from "../gammes/types";

import "./ReferentielPage.css";


type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
};


type RecordItem = {
  id: string;
  [key: string]: unknown;
};


type Props = {
  title: string;
  subtitle: string;
  endpoint: string;
  fields: FieldConfig[];
  primaryField: string;
  secondaryFields?: string[];
  imageField?: string;
  displayMode?: "list" | "cards";
};


function backendOrigin() {
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api";

  return apiUrl.replace(/\/api\/?$/, "");
}


function resolveImageUrl(
  value: unknown,
) {
  if (!value) {
    return "";
  }

  const raw =
    String(value).trim();

  if (!raw) {
    return "";
  }

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  if (raw.startsWith("/media/")) {
    return `${backendOrigin()}${raw}`;
  }

  return (
    `${backendOrigin()}/media/` +
    raw.replace(/^\/+/, "")
  );
}


export default function ReferentielPage({
  title,
  subtitle,
  endpoint,
  fields,
  primaryField,
  secondaryFields = [],
  imageField = "image_url",
  displayMode = "list",
}: Props) {
  const [items, setItems] =
    useState<RecordItem[]>([]);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<RecordItem | null>(
      null,
    );

  const [form, setForm] =
    useState<Record<
      string,
      string
    >>({});


  const emptyForm = () =>
    Object.fromEntries(
      fields.map(
        (field) => [
          field.name,
          "",
        ],
      ),
    );


  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<
          | RecordItem[]
          | PaginatedResponse<RecordItem>
        >(
          `${endpoint}/`,
        );

      setItems(
        extractResults(
          response.data,
        ),
      );
    } catch (err) {
      console.error(err);

      setError(
        `Impossible de charger ${title.toLowerCase()}.`,
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void load();
  }, [endpoint]);


  const filtered =
    useMemo(() => {
      const needle =
        query
          .trim()
          .toLowerCase();

      if (!needle) {
        return items;
      }

      return items.filter(
        (item) =>
          Object.values(item).some(
            (value) =>
              String(
                value ?? "",
              )
                .toLowerCase()
                .includes(
                  needle,
                ),
          ),
      );
    }, [items, query]);


  const startCreate = () => {
    setEditing(null);
    setForm(
      emptyForm(),
    );
    setOpen(true);
  };


  const startEdit = (
    item: RecordItem,
  ) => {
    setEditing(item);

    setForm(
      Object.fromEntries(
        fields.map(
          (field) => [
            field.name,
            String(
              item[
                field.name
              ] ?? "",
            ),
          ],
        ),
      ),
    );

    setOpen(true);
  };


  const submit = async (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload =
        Object.fromEntries(
          fields.map(
            (field) => [
              field.name,
              form[
                field.name
              ]?.trim() ||
                null,
            ],
          ),
        );


      if (editing) {
        await api.patch(
          `${endpoint}/${editing.id}/`,
          payload,
        );
      } else {
        await api.post(
          `${endpoint}/`,
          payload,
        );
      }

      setOpen(false);

      await load();
    } catch (
      err: any
    ) {
      console.error(err);

      setError(
        err?.response?.data
          ?.detail ||
          "Enregistrement impossible.",
      );
    } finally {
      setSaving(false);
    }
  };


  const remove = async (
    item: RecordItem,
  ) => {
    const name =
      String(
        item[
          primaryField
        ] ??
          "cet élément",
      );

    if (
      !window.confirm(
        `Supprimer « ${name} » ?`,
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `${endpoint}/${item.id}/`,
      );

      setItems(
        (current) =>
          current.filter(
            (row) =>
              row.id !==
              item.id,
          ),
      );
    } catch (
      err: any
    ) {
      console.error(err);

      setError(
        err?.response?.data
          ?.detail ||
          "Suppression impossible.",
      );
    }
  };


  const renderActions = (
    item: RecordItem,
  ) => (
    <div className="ref-actions">
      <button
        type="button"
        title="Modifier"
        onClick={() =>
          startEdit(item)
        }
      >
        <Edit3 size={16} />
      </button>

      <button
        type="button"
        title="Supprimer"
        className="danger"
        onClick={() =>
          void remove(item)
        }
      >
        <Trash2
          size={16}
        />
      </button>
    </div>
  );


  return (
    <div className="ref-page">

      <header className="ref-header">

        <div>
          <h1>
            {title}
          </h1>

          <p>
            {subtitle}
          </p>
        </div>

        <button
          className="ref-primary"
          type="button"
          onClick={
            startCreate
          }
        >
          <Plus size={18} />

          Ajouter
        </button>

      </header>


      {error && (
        <div className="module-error">
          {error}
        </div>
      )}


      <section className="ref-card">

        <div className="ref-toolbar">

          <div className="ref-search">
            <Search size={17} />

            <input
              value={query}
              onChange={(
                event,
              ) =>
                setQuery(
                  event.target
                    .value,
                )
              }
              placeholder="Rechercher..."
            />
          </div>

          <span className="ref-count">
            {filtered.length}
            {" "}
            élément(s)
          </span>

        </div>


        {loading ? (
          <div className="module-loading">
            <div className="module-spinner" />

            <strong>
              Chargement...
            </strong>
          </div>
        ) : displayMode ===
          "cards" ? (
          <div className="ref-grid">
            {filtered.map(
              (item) => {
                const imageUrl =
                  resolveImageUrl(
                    item[
                      imageField
                    ],
                  );

                return (
                  <article
                    key={item.id}
                    className="ref-grid-card"
                  >
                    <div className="ref-image-box">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={String(
                            item[
                              primaryField
                            ] ?? "",
                          )}
                        />
                      ) : (
                        <div className="ref-image-empty">
                          <ImageOff
                            size={28}
                          />
                        </div>
                      )}
                    </div>

                    <div className="ref-grid-body">
                      <strong>
                        {String(
                          item[
                            primaryField
                          ] ?? "—",
                        )}
                      </strong>

                      <div className="ref-secondary-text">
                        {secondaryFields.map(
                          (field) =>
                            item[
                              field
                            ] ? (
                              <span
                                key={
                                  field
                                }
                              >
                                {String(
                                  item[
                                    field
                                  ],
                                )}
                              </span>
                            ) : null,
                        )}
                      </div>
                    </div>

                    {renderActions(
                      item,
                    )}
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div className="ref-list">
            {filtered.map(
              (item) => (
                <article
                  key={item.id}
                  className="ref-row"
                >
                  <div className="ref-main">
                    <strong>
                      {String(
                        item[
                          primaryField
                        ] ?? "—",
                      )}
                    </strong>

                    <div>
                      {secondaryFields.map(
                        (field) =>
                          item[
                            field
                          ] ? (
                            <span
                              key={
                                field
                              }
                            >
                              {String(
                                item[
                                  field
                                ],
                              )}
                            </span>
                          ) : null,
                      )}
                    </div>
                  </div>

                  {renderActions(
                    item,
                  )}
                </article>
              ),
            )}
          </div>
        )}

      </section>


      {open && (
        <div
          className="ref-modal-backdrop"
          onMouseDown={() =>
            !saving &&
            setOpen(false)
          }
        >
          <form
            className="ref-modal"
            onSubmit={submit}
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >

            <div className="ref-modal-head">

              <div>
                <h2>
                  {editing
                    ? "Modifier"
                    : "Ajouter"}
                  {" — "}
                  {title}
                </h2>

                <p>
                  Complétez les
                  informations puis
                  enregistrez.
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


            <div className="ref-form">
              {fields.map(
                (field) => (
                  <label
                    key={
                      field.name
                    }
                  >
                    <span>
                      {field.label}

                      {field.required
                        ? " *"
                        : ""}
                    </span>

                    {field.type ===
                    "textarea" ? (
                      <textarea
                        rows={4}
                        required={
                          field.required
                        }
                        value={
                          form[
                            field.name
                          ] ?? ""
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,

                              [field.name]:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder={
                          field.placeholder
                        }
                      />
                    ) : (
                      <input
                        required={
                          field.required
                        }
                        value={
                          form[
                            field.name
                          ] ?? ""
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,

                              [field.name]:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder={
                          field.placeholder
                        }
                      />
                    )}
                  </label>
                ),
              )}
            </div>


            <div className="ref-modal-actions">

              <button
                type="button"
                className="ref-secondary"
                onClick={() =>
                  setOpen(false)
                }
              >
                Annuler
              </button>

              <button
                type="submit"
                className="ref-primary"
                disabled={
                  saving
                }
              >
                {saving ? (
                  <LoaderCircle
                    className="spin"
                    size={17}
                  />
                ) : null}

                Enregistrer
              </button>

            </div>

          </form>
        </div>
      )}

    </div>
  );
}
