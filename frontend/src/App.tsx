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


/* ============================================================
   ÉQUIPEMENTS
============================================================ */

import EquipementsPage from "./pages/equipements/Equipements";


/* ============================================================
   GAMMES
============================================================ */

import GammesList from "./pages/gammes/GammesList";
import GammeCreate from "./pages/gammes/GammeCreate";
import GammeDetail from "./pages/gammes/GammeDetail";
import GammeEdit from "./pages/gammes/GammeEdit";
import QrPublic from "./pages/gammes/QrPublic";


/* ============================================================
   RÉFÉRENTIELS
============================================================ */

import EPIPage from "./pages/referentiels/EPIPage";
import RisquesPage from "./pages/referentiels/RisquesPage";
import OutillagesPage from "./pages/referentiels/OutillagesPage";
import PiecesPage from "./pages/referentiels/PiecesPage";


/* ============================================================
   MODULES
============================================================ */

import VersionsPage from "./pages/modules/VersionsPage";
import PlansMaintenancePage from "./pages/modules/PlansMaintenancePage";
import DocumentsPage from "./pages/modules/DocumentsPage";
import QRCodesPage from "./pages/modules/QRCodesPage";
import ExportsPage from "./pages/modules/ExportsPage";
import SimpleModulePage from "./pages/modules/SimpleModulePage";


/* ============================================================
   STYLE
============================================================ */

import "./styles/GreenWhiteTheme.css";


/* ============================================================
   LAYOUT PROTÉGÉ
============================================================ */

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


/* ============================================================
   APPLICATION
============================================================ */

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            AUTHENTIFICATION
        ===================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =====================================================
            QR PUBLIC
        ===================================================== */}

        <Route
          path="/qr/:code"
          element={<QrPublic />}
        />


        {/* =====================================================
            TABLEAU DE BORD
        ===================================================== */}

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            KPI
        ===================================================== */}

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


        {/* =====================================================
            ÉQUIPEMENTS
        ===================================================== */}

        <Route
          path="/equipements"
          element={
            <ProtectedLayout>
              <EquipementsPage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            LISTE DES GAMMES
        ===================================================== */}

        <Route
          path="/gammes"
          element={
            <ProtectedLayout>
              <GammesList />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            WIZARD NOUVELLE GAMME
        ===================================================== */}

        <Route
          path="/gammes/nouvelle"
          element={
            <ProtectedLayout>
              <GammeCreate />
            </ProtectedLayout>
          }
        />


        {/* Compatibilité ancienne route */}

        <Route
          path="/gammes/new"
          element={
            <Navigate
              to="/gammes/nouvelle"
              replace
            />
          }
        />


        {/* =====================================================
            DÉTAIL D'UNE GAMME
        ===================================================== */}

        <Route
          path="/gammes/:id"
          element={
            <ProtectedLayout>
              <GammeDetail />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            MODIFICATION D'UNE GAMME
        ===================================================== */}

        <Route
          path="/gammes/:id/modifier"
          element={
            <ProtectedLayout>
              <GammeEdit />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            VERSIONS
        ===================================================== */}

        <Route
          path="/versions"
          element={
            <ProtectedLayout>
              <VersionsPage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            PLANS DE MAINTENANCE
        ===================================================== */}

        <Route
          path="/plans-maintenance"
          element={
            <ProtectedLayout>
              <PlansMaintenancePage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            EPI
        ===================================================== */}

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


        {/* =====================================================
            RISQUES
        ===================================================== */}

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


        {/* =====================================================
            OUTILLAGES
        ===================================================== */}

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


        {/* =====================================================
            PIÈCES DE RECHANGE
        ===================================================== */}

        <Route
          path="/pieces"
          element={
            <ProtectedLayout>
              <PiecesPage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            DOCUMENTS
        ===================================================== */}

        <Route
          path="/documents"
          element={
            <ProtectedLayout>
              <DocumentsPage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            QR CODES
        ===================================================== */}

        <Route
          path="/qr-codes"
          element={
            <ProtectedLayout>
              <QRCodesPage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            EXPORTS
        ===================================================== */}

        <Route
          path="/exports"
          element={
            <ProtectedLayout>
              <ExportsPage />
            </ProtectedLayout>
          }
        />


        {/* =====================================================
            PARAMÈTRES
        ===================================================== */}

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


        {/* =====================================================
            ROUTE INCONNUE
        ===================================================== */}

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
