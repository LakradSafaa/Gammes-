import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Edit3, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";

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
};

export default function ReferentielPage({
  title,
  subtitle,
  endpoint,
  fields,
  primaryField,
  secondaryFields = [],
}: Props) {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const normalizedEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;

  const emptyForm = () => Object.fromEntries(fields.map((field) => [field.name, ""]));

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<RecordItem[] | PaginatedResponse<RecordItem>>(
        `${normalizedEndpoint}/`,
      );
      setItems(extractResults(response.data));
    } catch (err) {
      console.error(err);
      setError(`Impossible de charger ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [normalizedEndpoint]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((item) =>
      Object.values(item).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [items, query]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setMessage("");
    setOpen(true);
  };

  const startEdit = (item: RecordItem) => {
    setEditing(item);
    setForm(
      Object.fromEntries(
        fields.map((field) => [field.name, String(item[field.name] ?? "")]),
      ),
    );
    setError("");
    setMessage("");
    setOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    for (const field of fields) {
      if (field.required && !String(form[field.name] ?? "").trim()) {
        setError(`${field.label} est obligatoire.`);
        return;
      }
    }

    const payload = Object.fromEntries(
      fields.map((field) => {
        const value = String(form[field.name] ?? "").trim();
        return [field.name, value || null];
      }),
    );

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editing) {
        await api.patch(`${normalizedEndpoint}/${editing.id}/`, payload);
        setMessage("Élément modifié avec succès.");
      } else {
        await api.post(`${normalizedEndpoint}/`, payload);
        setMessage("Élément ajouté avec succès.");
      }

      setOpen(false);
      await load();
    } catch (err: any) {
      console.error(err);
      const response = err?.response?.data;
      const firstFieldError =
        response && typeof response === "object"
          ? Object.values(response).find((value) => Array.isArray(value))
          : null;

      setError(
        response?.detail ||
          (Array.isArray(firstFieldError) ? String(firstFieldError[0]) : "") ||
          "Enregistrement impossible. Vérifiez vos droits et les données saisies.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: RecordItem) => {
    const name = String(item[primaryField] ?? "cet élément");
    if (!window.confirm(`Supprimer « ${name} » ?`)) return;

    try {
      setError("");
      setMessage("");
      await api.delete(`${normalizedEndpoint}/${item.id}/`);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setMessage("Élément supprimé.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Suppression impossible. Cet élément peut déjà être utilisé par une gamme.",
      );
    }
  };

  return (
    <div className="ref-page">
      <header className="ref-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="ref-primary" type="button" onClick={startCreate}>
          <Plus size={18} /> Ajouter
        </button>
      </header>

      {error && <div className="module-error">{error}</div>}
      {message && <div className="module-success">{message}</div>}

      <section className="ref-card">
        <div className="ref-toolbar">
          <div className="ref-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher..."
            />
          </div>
          <span>{filtered.length} élément(s)</span>
        </div>

        {loading ? (
          <div className="module-loading">
            <LoaderCircle className="spin" size={22} />
            <strong>Chargement...</strong>
          </div>
        ) : (
          <div className="ref-list">
            {filtered.length === 0 ? (
              <div className="ref-empty">Aucun élément.</div>
            ) : (
              filtered.map((item) => (
                <article key={item.id} className="ref-row">
                  <div className="ref-main">
                    <strong>{String(item[primaryField] ?? "—")}</strong>
                    <div>
                      {secondaryFields.map((field) =>
                        item[field] ? <span key={field}>{String(item[field])}</span> : null,
                      )}
                    </div>
                  </div>
                  <div className="ref-actions">
                    <button type="button" title="Modifier" onClick={() => startEdit(item)}>
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
                </article>
              ))
            )}
          </div>
        )}
      </section>

      {open && (
        <div className="ref-modal-backdrop" onMouseDown={() => !saving && setOpen(false)}>
          <form
            className="ref-modal"
            onSubmit={submit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ref-modal-head">
              <div>
                <h2>{editing ? "Modifier" : "Ajouter"} — {title}</h2>
                <p>Complétez les informations puis enregistrez.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="ref-form">
              {fields.map((field) => (
                <label key={field.name}>
                  <span>
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="ref-modal-actions">
              <button type="button" className="ref-secondary" onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="ref-primary" disabled={saving}>
                {saving ? <LoaderCircle className="spin" size={17} /> : null}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
