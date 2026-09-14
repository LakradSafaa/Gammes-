import type { ReactNode } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import DashboardPage from "./pages/dashboard/DashboardPage";

import EquipementsPage from "./pages/equipements/Equipements";

import GammeCreate from "./pages/gammes/GammeCreate";

import EPIPage from "./pages/referentiels/EPIPage";
import RisquesPage from "./pages/referentiels/RisquesPage";
import OutillagesPage from "./pages/referentiels/OutillagesPage";
import PiecesPage from "./pages/referentiels/PiecesPage";

import VersionsPage from "./pages/modules/VersionsPage";
import PlansMaintenancePage from "./pages/modules/PlansMaintenancePage";
import DocumentsPage from "./pages/modules/DocumentsPage";
import QRCodesPage from "./pages/modules/QRCodesPage";
import ExportsPage from "./pages/modules/ExportsPage";
import SimpleModulePage from "./pages/modules/SimpleModulePage";

import "./styles/GreenWhiteTheme.css";


function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/kpi"
          element={
            <ProtectedLayout>
              <SimpleModulePage
                title="Indicateurs / KPI"
                subtitle="MTBF, MTTR, disponibilité et performance maintenance"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/equipements"
          element={
            <ProtectedLayout>
              <EquipementsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/gammes"
          element={
            <ProtectedLayout>
              <SimpleModulePage
                title="Gammes opératoires"
                subtitle="Gestion des gammes de maintenance"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/gammes/nouvelle"
          element={
            <ProtectedLayout>
              <GammeCreate />
            </ProtectedLayout>
          }
        />

        <Route
          path="/gammes/new"
          element={
            <Navigate
              to="/gammes/nouvelle"
              replace
            />
          }
        />

        <Route
          path="/versions"
          element={
            <ProtectedLayout>
              <VersionsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/plans-maintenance"
          element={
            <ProtectedLayout>
              <PlansMaintenancePage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/epis"
          element={
            <ProtectedLayout>
              <EPIPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/referentiels/epis"
          element={
            <ProtectedLayout>
              <EPIPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/risques"
          element={
            <ProtectedLayout>
              <RisquesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/referentiels/risques"
          element={
            <ProtectedLayout>
              <RisquesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/outillages"
          element={
            <ProtectedLayout>
              <OutillagesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/referentiels/outillages"
          element={
            <ProtectedLayout>
              <OutillagesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/pieces"
          element={
            <ProtectedLayout>
              <PiecesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedLayout>
              <DocumentsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/qr-codes"
          element={
            <ProtectedLayout>
              <QRCodesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/exports"
          element={
            <ProtectedLayout>
              <ExportsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/parametres"
          element={
            <ProtectedLayout>
              <SimpleModulePage
                title="Paramètres"
                subtitle="Configuration générale de l'application"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
