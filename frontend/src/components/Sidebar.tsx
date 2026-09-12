import {
  BarChart3,
  BookOpenText,
  Boxes,
  ChevronDown,
  ClipboardList,
  FileArchive,
  FileText,
  Gauge,
  HardHat,
  History,
  LogOut,
  PackageSearch,
  QrCode,
  Settings,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useMemo,
  useState,
} from "react";

import {
  logout,
} from "../api/auth";

import "./Sidebar.css";

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const pilotageItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <Gauge size={17} /> },
  { label: "Indicateurs / KPI", path: "/kpi", icon: <BarChart3 size={17} /> },
];

const maintenanceItems: NavItem[] = [
  { label: "Équipements", path: "/equipements", icon: <HardHat size={17} /> },
  { label: "Gammes opératoires", path: "/gammes", icon: <FileText size={17} /> },
  { label: "Versions", path: "/versions", icon: <History size={17} /> },
  { label: "Plans maintenance", path: "/plans-maintenance", icon: <ClipboardList size={17} /> },
];

const referentielItems: NavItem[] = [
  { label: "EPI", path: "/epis", icon: <HardHat size={17} /> },
  { label: "Risques", path: "/risques", icon: <ShieldAlert size={17} /> },
  { label: "Outillages", path: "/outillages", icon: <Wrench size={17} /> },
  { label: "Pièces de rechange", path: "/pieces", icon: <Boxes size={17} /> },
  { label: "Documents", path: "/documents", icon: <BookOpenText size={17} /> },
];

const systemItems: NavItem[] = [
  { label: "QR Codes", path: "/qr-codes", icon: <QrCode size={17} /> },
  { label: "Exports", path: "/exports", icon: <FileArchive size={17} /> },
];

function NavigationItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        isActive ? "sidebar-link active" : "sidebar-link"
      }
    >
      <span className="sidebar-link-icon">{item.icon}</span>
      <span className="sidebar-link-label">{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [librariesOpen, setLibrariesOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  const libraryActive = useMemo(
    () =>
      referentielItems.some((item) =>
        location.pathname.startsWith(item.path),
      ),
    [location.pathname],
  );

  const systemActive = useMemo(
    () =>
      systemItems.some((item) =>
        location.pathname.startsWith(item.path),
      ),
    [location.pathname],
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Wrench size={22} />
        </div>

        <div>
          <strong>Gammes</strong>
          <span>Maintenance</span>
        </div>
      </div>

      <div className="sidebar-scroll">
        <section className="sidebar-section">
          <p className="sidebar-section-title">PILOTAGE</p>

          {pilotageItems.map((item) => (
            <NavigationItem key={item.path} item={item} />
          ))}
        </section>

        <section className="sidebar-section">
          <p className="sidebar-section-title">MAINTENANCE</p>

          {maintenanceItems.map((item) => (
            <NavigationItem key={item.path} item={item} />
          ))}
        </section>

        <section className="sidebar-section">
          <button
            type="button"
            className={
              libraryActive
                ? "sidebar-group-button active"
                : "sidebar-group-button"
            }
            onClick={() =>
              setLibrariesOpen((value) => !value)
            }
          >
            <span className="sidebar-group-left">
              <PackageSearch size={17} />
              <span>Référentiels</span>
            </span>

            <ChevronDown
              size={15}
              className={librariesOpen ? "chevron open" : "chevron"}
            />
          </button>

          {librariesOpen && (
            <div className="sidebar-submenu">
              {referentielItems.map((item) => (
                <NavigationItem key={item.path} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="sidebar-section">
          <button
            type="button"
            className={
              systemActive
                ? "sidebar-group-button active"
                : "sidebar-group-button"
            }
            onClick={() =>
              setSystemOpen((value) => !value)
            }
          >
            <span className="sidebar-group-left">
              <FileArchive size={17} />
              <span>Système</span>
            </span>

            <ChevronDown
              size={15}
              className={systemOpen ? "chevron open" : "chevron"}
            />
          </button>

          {systemOpen && (
            <div className="sidebar-submenu">
              {systemItems.map((item) => (
                <NavigationItem key={item.path} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="sidebar-footer">
        <NavLink to="/parametres" className="sidebar-link">
          <Settings size={17} />
          <span>Paramètres</span>
        </NavLink>

        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
