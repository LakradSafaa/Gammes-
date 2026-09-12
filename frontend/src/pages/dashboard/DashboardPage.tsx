import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  FileText,
  Layers3,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import api from "../../api/axios";

import "./DashboardPage.css";


type DistributionItem = {
  total: number;

  statut?: string | null;

  type_maintenance?:
    | string
    | null;

  constructeur?:
    | string
    | null;
};


type DashboardData = {
  gammes_total: number;

  equipements_total: number;

  versions_total: number;

  par_statut:
    DistributionItem[];

  par_type_maintenance:
    DistributionItem[];

  par_constructeur:
    DistributionItem[];
};


const EMPTY_DASHBOARD:
  DashboardData = {
  gammes_total: 0,

  equipements_total: 0,

  versions_total: 0,

  par_statut: [],

  par_type_maintenance: [],

  par_constructeur: [],
};


/* ============================================================
   LIBELLÉS
   ============================================================ */

function labelStatus(
  value?: string | null,
) {
  switch (value) {
    case "brouillon":
      return "Brouillon";

    case "en_validation":
      return "En validation";

    case "validee":
      return "Validée";

    case "archivee":
      return "Archivée";

    default:
      return (
        value ||
        "Non renseigné"
      );
  }
}


function labelMaintenance(
  value?: string | null,
) {
  switch (value) {
    case "preventif":
      return "Préventive";

    case "correctif":
      return "Corrective";

    case "amelioratif":
      return "Améliorative";

    case "conditionnel":
      return "Conditionnelle";

    case "predictif":
      return "Prédictive";

    default:
      return (
        value ||
        "Non renseigné"
      );
  }
}


/* ============================================================
   EXTRAIRE UN COUNT D'UNE API PAGINÉE OU D'UN TABLEAU
   ============================================================ */

function extractCount(
  data: unknown,
): number {
  if (
    data &&
    typeof data === "object" &&
    "count" in data
  ) {
    const count =
      (
        data as {
          count?: unknown;
        }
      ).count;

    if (
      typeof count ===
      "number"
    ) {
      return count;
    }
  }


  if (
    Array.isArray(data)
  ) {
    return data.length;
  }


  if (
    data &&
    typeof data === "object" &&
    "results" in data
  ) {
    const results =
      (
        data as {
          results?: unknown;
        }
      ).results;

    if (
      Array.isArray(results)
    ) {
      return results.length;
    }
  }


  return 0;
}


/* ============================================================
   DASHBOARD
   ============================================================ */

export default function DashboardPage() {
  const [
    data,
    setData,
  ] =
    useState<DashboardData>(
      EMPTY_DASHBOARD,
    );


  const [
    episTotal,
    setEpisTotal,
  ] =
    useState(0);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  /* =========================================================
     CHARGER LE DASHBOARD
     ========================================================= */

  const loadDashboard =
    async (
      manual = false,
    ) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }


        setError("");


        /* ----------------------------------------------------
           1. DASHBOARD PRINCIPAL
           ---------------------------------------------------- */

        try {
          const response =
            await api.get<
              DashboardData
            >(
              "/dashboard/",
            );


          const responseData =
            response.data;


          setData({
            gammes_total:
              Number(
                responseData
                  ?.gammes_total ??
                  0,
              ),

            equipements_total:
              Number(
                responseData
                  ?.equipements_total ??
                  0,
              ),

            versions_total:
              Number(
                responseData
                  ?.versions_total ??
                  0,
              ),

            par_statut:
              Array.isArray(
                responseData
                  ?.par_statut,
              )
                ? responseData
                    .par_statut
                : [],

            par_type_maintenance:
              Array.isArray(
                responseData
                  ?.par_type_maintenance,
              )
                ? responseData
                    .par_type_maintenance
                : [],

            par_constructeur:
              Array.isArray(
                responseData
                  ?.par_constructeur,
              )
                ? responseData
                    .par_constructeur
                : [],
          });
        } catch (
          dashboardError:
            any
        ) {
          console.error(
            "Erreur /dashboard/ :",
            dashboardError,
          );


          console.error(
            "Status :",
            dashboardError
              ?.response
              ?.status,
          );


          console.error(
            "Réponse backend :",
            dashboardError
              ?.response
              ?.data,
          );


          throw dashboardError;
        }


        /* ----------------------------------------------------
           2. EPI
           Une erreur EPI ne bloque PLUS le Dashboard.
           ---------------------------------------------------- */

        try {
          const epiResponse =
            await api.get(
              "/epis/",
            );


          setEpisTotal(
            extractCount(
              epiResponse.data,
            ),
          );
        } catch (
          epiError
        ) {
          console.warn(
            "Impossible de récupérer le nombre d'EPI.",
            epiError,
          );


          setEpisTotal(0);
        }

      } catch (
        err: any
      ) {
        console.error(
          "Erreur chargement Dashboard :",
          err,
        );


        const status =
          err?.response
            ?.status;


        const backendMessage =
          err?.response
            ?.data?.detail;


        if (
          status === 401
        ) {
          setError(
            "Session expirée. Reconnectez-vous.",
          );
        } else if (
          status === 403
        ) {
          setError(
            "Vous n'avez pas l'autorisation d'accéder au tableau de bord.",
          );
        } else if (
          status === 500
        ) {
          setError(
            "Erreur interne du backend sur /api/dashboard/. Vérifiez le terminal Django.",
          );
        } else if (
          backendMessage
        ) {
          setError(
            String(
              backendMessage,
            ),
          );
        } else {
          setError(
            "Impossible de charger le tableau de bord.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };


  /* =========================================================
     INITIALISATION
     ========================================================= */

  useEffect(() => {
    void loadDashboard();
  }, []);


  /* =========================================================
     TOTAL DES STATUTS
     ========================================================= */

  const totalStatuses =
    useMemo(
      () =>
        data.par_statut.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            Number(
              item.total ||
                0,
            ),

          0,
        ),

      [
        data.par_statut,
      ],
    );


  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="dash-loading">

        <RefreshCw
          size={23}
          className="spin"
        />

        Chargement du
        tableau de bord...

      </div>
    );
  }


  /* =========================================================
     INTERFACE
     ========================================================= */

  return (
    <div className="dash-page">

      {/* ====================================================
          TITRE
          ==================================================== */}

      <header className="dash-title-row">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Vue générale de
            l&apos;activité
            maintenance
          </p>

        </div>


        <button
          type="button"
          className="dashboard-refresh"
          disabled={refreshing}
          onClick={() =>
            void loadDashboard(
              true,
            )
          }
        >

          <RefreshCw
            size={16}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          Actualiser

        </button>

      </header>


      {/* ====================================================
          ERREUR
          ==================================================== */}

      {error && (
        <div className="dash-error">

          <strong>
            Erreur :
          </strong>

          {" "}

          {error}

        </div>
      )}


      {/* ====================================================
          KPI
          ==================================================== */}

      <section className="dash-kpi-grid">

        {/* ÉQUIPEMENTS */}

        <article className="dash-kpi-card">

          <div className="dash-kpi-icon">

            <PackageCheck
              size={25}
            />

          </div>


          <div className="dash-kpi-content">

            <strong>
              {
                data
                  .equipements_total
              }
            </strong>

            <span>
              Équipements
            </span>

            <small>
              Parc industriel
            </small>

          </div>

        </article>


        {/* GAMMES */}

        <article className="dash-kpi-card">

          <div className="dash-kpi-icon">

            <FileText
              size={25}
            />

          </div>


          <div className="dash-kpi-content">

            <strong>
              {
                data
                  .gammes_total
              }
            </strong>

            <span>
              Gammes opératoires
            </span>

            <small>
              Documentation
              maintenance
            </small>

          </div>

        </article>


        {/* VERSIONS */}

        <article className="dash-kpi-card">

          <div className="dash-kpi-icon">

            <Layers3
              size={25}
            />

          </div>


          <div className="dash-kpi-content">

            <strong>
              {
                data
                  .versions_total
              }
            </strong>

            <span>
              Versions
            </span>

            <small>
              Historique
              documentaire
            </small>

          </div>

        </article>


        {/* EPI */}

        <article className="dash-kpi-card">

          <div className="dash-kpi-icon">

            <ShieldCheck
              size={25}
            />

          </div>


          <div className="dash-kpi-content">

            <strong>
              {episTotal}
            </strong>

            <span>
              EPI
            </span>

            <small>
              Référentiel
              sécurité
            </small>

          </div>

        </article>

      </section>


      {/* ====================================================
          ANALYSES
          ==================================================== */}

      <section className="dash-analytics-grid">

        {/* STATUTS */}

        <article className="dash-panel">

          <div className="dash-panel-title">

            <h2>
              Versions par
              statut
            </h2>

            <CheckCircle2
              size={18}
            />

          </div>


          <div className="dash-donut-wrap">

            <div className="dash-donut">

              <div>

                <strong>
                  {
                    totalStatuses
                  }
                </strong>

                <span>
                  total
                </span>

              </div>

            </div>


            <div className="dash-legend">

              {
                data
                  .par_statut
                  .length ===
                0 ? (
                  <div className="empty-state">
                    Aucune donnée
                  </div>
                ) : (
                  data
                    .par_statut
                    .map(
                      (
                        item,
                      ) => (
                        <div
                          className="dash-legend-row"
                          key={
                            item.statut ||
                            "statut"
                          }
                        >

                          <span className="dash-dot" />

                          <span>
                            {
                              labelStatus(
                                item.statut,
                              )
                            }
                          </span>

                          <strong>
                            {
                              item.total
                            }
                          </strong>

                        </div>
                      ),
                    )
                )
              }

            </div>

          </div>

        </article>


        {/* TYPES DE MAINTENANCE */}

        <article className="dash-panel">

          <div className="dash-panel-title">

            <h2>
              Type de maintenance
            </h2>

            <Wrench
              size={18}
            />

          </div>


          <div className="dash-bars">

            {
              data
                .par_type_maintenance
                .length ===
              0 ? (
                <div className="empty-state">
                  Aucune donnée
                </div>
              ) : (
                data
                  .par_type_maintenance
                  .map(
                    (
                      item,
                    ) => {
                      const max =
                        Math.max(
                          ...data
                            .par_type_maintenance
                            .map(
                              (
                                x,
                              ) =>
                                Number(
                                  x.total ||
                                    0,
                                ),
                            ),

                          1,
                        );


                      const height =
                        Math.max(
                          18,

                          (
                            Number(
                              item.total ||
                                0,
                            ) /
                            max
                          ) *
                            130,
                        );


                      return (
                        <div
                          className="dash-bar-item"
                          key={
                            item
                              .type_maintenance ||
                            "maintenance"
                          }
                        >

                          <strong>
                            {
                              item.total
                            }
                          </strong>


                          <div
                            className="dash-bar"
                            style={{
                              height:
                                `${height}px`,
                            }}
                          />


                          <span>
                            {
                              labelMaintenance(
                                item
                                  .type_maintenance,
                              )
                            }
                          </span>

                        </div>
                      );
                    },
                  )
              )
            }

          </div>

        </article>


        {/* CONSTRUCTEURS */}

        <article className="dash-panel">

          <div className="dash-panel-title">

            <h2>
              Équipements par
              constructeur
            </h2>

          </div>


          <div className="dash-bars">

            {
              data
                .par_constructeur
                .length ===
              0 ? (
                <div className="empty-state">
                  Aucune donnée
                </div>
              ) : (
                data
                  .par_constructeur
                  .slice(
                    0,
                    5,
                  )
                  .map(
                    (
                      item,
                    ) => {
                      const max =
                        Math.max(
                          ...data
                            .par_constructeur
                            .map(
                              (
                                x,
                              ) =>
                                Number(
                                  x.total ||
                                    0,
                                ),
                            ),

                          1,
                        );


                      const height =
                        Math.max(
                          18,

                          (
                            Number(
                              item.total ||
                                0,
                            ) /
                            max
                          ) *
                            130,
                        );


                      return (
                        <div
                          className="dash-bar-item"
                          key={
                            item
                              .constructeur ||
                            "constructeur"
                          }
                        >

                          <strong>
                            {
                              item.total
                            }
                          </strong>


                          <div
                            className="dash-bar"
                            style={{
                              height:
                                `${height}px`,
                            }}
                          />


                          <span>
                            {
                              item
                                .constructeur ||
                              "Non renseigné"
                            }
                          </span>

                        </div>
                      );
                    },
                  )
              )
            }

          </div>

        </article>

      </section>

    </div>
  );
}