import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import api from "../../api/axios";
import "./EquipementsPage.css";

type Equipement = {
  id: string;
  code: string;
  nom: string;
  constructeur?: string | null;
  type?: string | null;
  reference?: string | null;
  description?: string | null;
  actif: boolean;
};

type ApiResponse<T> =
  | T[]
  | {
      results: T[];
    };

function extractResults<T>(
  data: ApiResponse<T>,
): T[] {
  return Array.isArray(data)
    ? data
    : data.results ?? [];
}

export default function EquipementsPage() {
  const [items, setItems] =
    useState<Equipement[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response =
          await api.get<
            ApiResponse<Equipement>
          >("/equipements/");

        setItems(
          extractResults(response.data),
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return items;
    }

    return items.filter((item) =>
      [
        item.code,
        item.nom,
        item.constructeur,
        item.type,
        item.reference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [items, search]);

  return (
    <div className="equipment-page">
      <div className="equipment-heading">
        <div>
          <h1>Équipements</h1>
          <p>
            Liste des équipements de votre parc
          </p>
        </div>

        <button
          className="equipment-add"
          type="button"
        >
          <Plus size={18} />
          Nouvel équipement
        </button>
      </div>

      <div className="equipment-toolbar">
        <Search size={17} />

        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Rechercher un équipement..."
        />
      </div>

      <div className="equipment-table-card">
        {loading ? (
          <div className="equipment-empty">
            Chargement...
          </div>
        ) : (
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Constructeur</th>
                <th>Type</th>
                <th>Référence</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="equipment-name">
                    {item.nom}
                  </td>
                  <td>{item.code}</td>
                  <td>
                    {item.constructeur || "—"}
                  </td>
                  <td>{item.type || "—"}</td>
                  <td>
                    {item.reference || "—"}
                  </td>
                  <td>
                    <span
                      className={
                        item.actif
                          ? "equipment-status active"
                          : "equipment-status inactive"
                      }
                    >
                      {item.actif
                        ? "Actif"
                        : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <div className="equipment-actions">
                      <button type="button">
                        <Eye size={15} />
                      </button>
                      <button type="button">
                        <Pencil size={15} />
                      </button>
                      <button
                        className="danger"
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="equipment-empty"
                  >
                    Aucun équipement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
