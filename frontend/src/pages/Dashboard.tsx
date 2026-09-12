import { useEffect, useState } from "react";
import api from "../api/axios";

interface DashboardData {
  gammes_total: number;
  equipements_total: number;
  versions_total: number;

  par_statut: Array<{
    statut: string;
    total: number;
  }>;

  par_type_maintenance: Array<{
    type_maintenance: string;
    total: number;
  }>;

  par_constructeur: Array<{
    constructeur: string | null;
    total: number;
  }>;
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/dashboard/");
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger le tableau de bord.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatLabel = (value: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      en_validation: "En validation",
      validee: "Validée",
      archivee: "Archivée",
      preventif: "Préventive",
      correctif: "Corrective",
      amelioratif: "Améliorative",
    };

    return labels[value] ?? value;
  };

  if (loading) {
    return (
      <div className="placeholder-card">
        <h2>Chargement...</h2>
        <p>Récupération des données depuis Django.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="placeholder-card">
        <h2>Erreur</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Tableau de bord</h1>
          <p>
            Vue générale de l'activité de maintenance et des gammes
            opératoires.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div>
            <span>Équipements</span>
            <strong>{data.equipements_total}</strong>
          </div>
        </div>

        <div className="stat-card stat-red">
          <div>
            <span>Gammes opératoires</span>
            <strong>{data.gammes_total}</strong>
          </div>
        </div>

        <div className="stat-card stat-salmon">
          <div>
            <span>Versions</span>
            <strong>{data.versions_total}</strong>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div>
            <span>EPI</span>
            <strong>7</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Statut des versions</h2>
              <p>Répartition des versions enregistrées</p>
            </div>
          </div>

          <div className="dashboard-list">
            {data.par_statut.map((item) => (
              <div
                className="dashboard-list-item"
                key={item.statut}
              >
                <span>{formatLabel(item.statut)}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Types de maintenance</h2>
              <p>Répartition des gammes par type</p>
            </div>
          </div>

          <div className="dashboard-list">
            {data.par_type_maintenance.map((item) => (
              <div
                className="dashboard-list-item"
                key={item.type_maintenance}
              >
                <span>{formatLabel(item.type_maintenance)}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Constructeurs</h2>
              <p>Équipements par constructeur</p>
            </div>
          </div>

          <div className="dashboard-list">
            {data.par_constructeur.map((item, index) => (
              <div
                className="dashboard-list-item"
                key={`${item.constructeur}-${index}`}
              >
                <span>{item.constructeur || "Non renseigné"}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Dashboard;