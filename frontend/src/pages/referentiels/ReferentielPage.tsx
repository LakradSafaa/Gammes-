import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

type DisplayMode = "list" | "cards" | "table";

type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "url";
  required?: boolean;
  placeholder?: string;
};

type ReferentielItem = {
  id: string;
  [key: string]: unknown;
};

type Props = {
  title: string;
  subtitle?: string;

  endpoint: string;

  primaryField: string;

  secondaryFields?: string[];

  imageField?: string;

  displayMode?: DisplayMode;

  fields: FieldConfig[];
};

export default function ReferentielPage({
  title,
  subtitle,
  endpoint,
  primaryField,
  secondaryFields = [],
  imageField,
  displayMode = "list",
  fields,
}: Props) {
  const [items, setItems] = useState<ReferentielItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = useMemo(() => {
    const data: Record<string, string> = {};

    fields.forEach((field) => {
      data[field.name] = "";
    });

    return data;
  }, [fields]);

  const [form, setForm] = useState<Record<string, string>>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const loadItems = async () => {
    try {
      setLoading(true);

      const response = await api.get(endpoint);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      setItems(data);
    } catch (error) {
      console.error(`Erreur chargement ${title}`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [endpoint]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = (item: ReferentielItem) => {
    const nextForm: Record<string, string> = {};

    fields.forEach((field) => {
      const value = item[field.name];

      nextForm[field.name] =
        value === undefined || value === null ? "" : String(value);
    });

    setEditingId(item.id);
    setForm(nextForm);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload: Record<string, unknown> = {};

      fields.forEach((field) => {
        const value = form[field.name];

        if (field.type === "number") {
          payload[field.name] =
            value === "" || value === undefined ? null : Number(value);
        } else {
          payload[field.name] = value;
        }
      });

      if (editingId) {
        await api.patch(`${endpoint}${editingId}/`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      resetForm();
      await loadItems();
    } catch (error) {
      console.error(`Erreur enregistrement ${title}`, error);
      alert("Impossible d'enregistrer cette valeur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cet élément ?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`${endpoint}${id}/`);

      if (editingId === id) {
        resetForm();
      }

      await loadItems();
    } catch (error) {
      console.error(`Erreur suppression ${title}`, error);

      alert(
        "Suppression impossible. Cet élément est peut-être déjà utilisé dans une gamme."
      );
    }
  };

  const getValue = (item: ReferentielItem, fieldName: string) => {
    const value = item[fieldName];

    if (value === undefined || value === null) {
      return "";
    }

    return String(value);
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#172B2A",
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              marginTop: "8px",
              color: "#64748B",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #DDE7E3",
          borderRadius: "14px",
          padding: "22px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "18px",
            color: "#172B2A",
            fontSize: "18px",
          }}
        >
          {editingId ? "Modifier" : "Ajouter"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: 600,
                    color: "#172B2A",
                  }}
                >
                  {field.label}
                  {field.required ? " *" : ""}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={form[field.name] ?? ""}
                    onChange={handleChange}
                    rows={4}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #DDE7E3",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type ?? "text"}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={form[field.name] ?? ""}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #DDE7E3",
                      borderRadius: "8px",
                      padding: "10px 12px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                border: 0,
                borderRadius: "8px",
                padding: "10px 18px",
                background: "#00966D",
                color: "#FFFFFF",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {saving
                ? "Enregistrement..."
                : editingId
                ? "Enregistrer"
                : "+ Ajouter"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  border: "1px solid #DDE7E3",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  background: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #DDE7E3",
          borderRadius: "14px",
          padding: "22px",
        }}
      >
        {loading ? (
          <p>Chargement...</p>
        ) : items.length === 0 ? (
          <p
            style={{
              color: "#64748B",
            }}
          >
            Aucun élément enregistré.
          </p>
        ) : (
          <div
            style={
              displayMode === "cards"
                ? {
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "16px",
                  }
                : {
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }
            }
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  border: "1px solid #DDE7E3",
                  borderRadius: "10px",
                  padding: "14px",
                  background: "#FFFFFF",
                }}
              >
                {imageField && getValue(item, imageField) && (
                  <img
                    src={getValue(item, imageField)}
                    alt={getValue(item, primaryField)}
                    style={{
                      width: "56px",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #DDE7E3",
                    }}
                  />
                )}

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#172B2A",
                    }}
                  >
                    {getValue(item, primaryField)}
                  </div>

                  {secondaryFields.map((fieldName) => {
                    const value = getValue(item, fieldName);

                    if (!value) {
                      return null;
                    }

                    return (
                      <div
                        key={fieldName}
                        style={{
                          color: "#64748B",
                          fontSize: "14px",
                          marginTop: "3px",
                        }}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  style={{
                    border: "1px solid #00966D",
                    borderRadius: "7px",
                    padding: "7px 12px",
                    background: "#FFFFFF",
                    color: "#007F5F",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Modifier
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  style={{
                    border: "1px solid #DC3545",
                    borderRadius: "7px",
                    padding: "7px 12px",
                    background: "#FFFFFF",
                    color: "#DC3545",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
