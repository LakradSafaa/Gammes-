import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

interface PlaceholderProps {
  title: string;
  description: string;
}

function Placeholder({
  title,
  description,
}: PlaceholderProps) {
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="placeholder-card">
        <h2>{title}</h2>

        <p>
          Ce module sera connecté à l'API
          Django lors de la prochaine étape.
        </p>
      </div>
    </>
  );
}

function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}

function App() {
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
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/equipements"
          element={
            <ProtectedLayout>
              <Placeholder
                title="Équipements"
                description="Gestion du parc d'équipements"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/gammes"
          element={
            <ProtectedLayout>
              <Placeholder
                title="Gammes opératoires"
                description="Gestion des procédures de maintenance"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/epis"
          element={
            <ProtectedLayout>
              <Placeholder
                title="EPI"
                description="Équipements de protection individuelle"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/risques"
          element={
            <ProtectedLayout>
              <Placeholder
                title="Risques"
                description="Bibliothèque des risques"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/outillages"
          element={
            <ProtectedLayout>
              <Placeholder
                title="Outillages"
                description="Bibliothèque des outillages"
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/pieces"
          element={
            <ProtectedLayout>
              <Placeholder
                title="Pièces de rechange"
                description="Gestion des pièces de rechange"
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

export default App;