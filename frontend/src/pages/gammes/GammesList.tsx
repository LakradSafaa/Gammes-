import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";

import api from "../../api/axios";


type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};


type Gamme = {
  id: string;
  code: string;
  designation: string;
  abreviation?: string | null;
  actif?: boolean;
  equipement?: string | null;
};


function extractResults<T>(
  data: T[] | PaginatedResponse<T> | null | undefined
): T[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}


export default function GammesList() {
  const navigate = useNavigate();

  const [gammes, setGammes] = useState<Gamme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadGammes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<
        Gamme[] | PaginatedResponse<Gamme>
      >("/gammes/");

      const data = extractResults<Gamme>(response.data);

      setGammes(data);
    } catch (err) {
      console.error(err);

      setError(
        "Impossible de charger les gammes opératoires."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void loadGammes();
  }, []);


  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#00966D",
              fontWeight: 700,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Maintenance industrielle
          </p>

          <h1
            style={{
              margin: "7px 0 4px",
              color: "#172B2A",
              fontSize: "32px",
            }}
          >
            Gammes opératoires
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6B7D79",
            }}
          >
            Gestion des gammes de maintenance
          </p>
        </div>


        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => void loadGammes()}
            disabled={loading}
            style={{
              minHeight: "44px",
              border: "1px solid #DDE7E3",
              borderRadius: "10px",
              padding: "0 16px",
              background: "#FFFFFF",
              color: "#172B2A",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <RefreshCw size={17} />

            Actualiser
          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/gammes/nouvelle")
            }
            style={{
              minHeight: "44px",
              border: "none",
              borderRadius: "10px",
              padding: "0 18px",
              background: "#00966D",
              color: "#FFFFFF",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} />

            Nouvelle gamme
          </button>
        </div>
      </div>


      {/* ERREUR */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#FFF2F2",
            border: "1px solid #F3C5C5",
            color: "#B42318",
          }}
        >
          {error}
        </div>
      )}


      {/* CONTENU */}

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #DDE7E3",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow:
            "0 8px 30px rgba(23, 43, 42, 0.05)",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#6B7D79",
            }}
          >
            Chargement des gammes...
          </div>
        ) : gammes.length === 0 ? (
          <div
            style={{
              padding: "60px 30px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                color: "#172B2A",
              }}
            >
              Aucune gamme disponible
            </h3>

            <p
              style={{
                margin: "0 0 22px",
                color: "#6B7D79",
              }}
            >
              Commencez par créer une nouvelle
              gamme opératoire.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/gammes/nouvelle")
              }
              style={{
                minHeight: "44px",
                border: "none",
                borderRadius: "10px",
                padding: "0 18px",
                background: "#00966D",
                color: "#FFFFFF",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Créer une gamme
            </button>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "760px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F1FBF7",
                  }}
                >
                  <th style={headerCellStyle}>
                    Code
                  </th>

                  <th style={headerCellStyle}>
                    Intitulé de l'opération
                  </th>

                  <th style={headerCellStyle}>
                    Abréviation
                  </th>

                  <th style={headerCellStyle}>
                    Statut
                  </th>
                </tr>
              </thead>

              <tbody>
                {gammes.map((gamme) => (
                  <tr
                    key={gamme.id}
                    style={{
                      borderTop:
                        "1px solid #EEF3F1",
                    }}
                  >
                    <td style={bodyCellStyle}>
                      <strong
                        style={{
                          color: "#063D32",
                        }}
                      >
                        {gamme.code || "—"}
                      </strong>
                    </td>

                    <td style={bodyCellStyle}>
                      {gamme.designation || "—"}
                    </td>

                    <td style={bodyCellStyle}>
                      {gamme.abreviation || "—"}
                    </td>

                    <td style={bodyCellStyle}>
                      <span
                        style={{
                          display:
                            "inline-flex",
                          padding:
                            "5px 10px",
                          borderRadius:
                            "999px",
                          background:
                            gamme.actif === false
                              ? "#F4F4F4"
                              : "#DDF7EE",
                          color:
                            gamme.actif === false
                              ? "#667085"
                              : "#007F5F",
                          fontSize:
                            "12px",
                          fontWeight: 700,
                        }}
                      >
                        {gamme.actif === false
                          ? "Inactive"
                          : "Disponible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


const headerCellStyle: React.CSSProperties = {
  padding: "15px 18px",
  textAlign: "left",
  color: "#405A55",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};


const bodyCellStyle: React.CSSProperties = {
  padding: "17px 18px",
  color: "#344A46",
  fontSize: "14px",
};
