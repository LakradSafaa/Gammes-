import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  BarChart3, ChevronDown, ClipboardList, FileArchive, FileText, Gauge, HardHat,
  History, ListChecks, LogOut, PackageSearch, QrCode, Settings, ShieldAlert,
  Tags, UserRoundCog, Wrench,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import "./Sidebar.css";

type NavItem = { label: string; path: string; icon: ReactNode };

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

/** Toutes les petites listes déroulantes de `referentiel_valeurs`, visibles séparément à gauche. */
const dropdownReferenceItems: NavItem[] = [
  { label: "Corps de métier", path: "/referentiels?categorie=corps_metier", icon: <Tags size={17} /> },
  { label: "Type maintenance", path: "/referentiels?categorie=type_maintenance", icon: <ListChecks size={17} /> },
  { label: "Périodicité", path: "/referentiels?categorie=periodicite", icon: <ListChecks size={17} /> },
  { label: "Type d'arrêt", path: "/referentiels?categorie=type_arret", icon: <ListChecks size={17} /> },
  { label: "Profil", path: "/referentiels?categorie=profil", icon: <UserRoundCog size={17} /> },
  { label: "Statut de la gamme", path: "/referentiels?categorie=statut_gamme", icon: <ListChecks size={17} /> },
  { label: "Type de rédaction", path: "/referentiels?categorie=type_redaction", icon: <ListChecks size={17} /> },
];

/** Référentiels spécialisés qui possèdent description et image. */
const specializedReferenceItems: NavItem[] = [
  { label: "EPI", path: "/referentiels/epis", icon: <HardHat size={17} /> },
  { label: "EPC", path: "/referentiels/epc", icon: <ShieldAlert size={17} /> },
  { label: "Risques", path: "/referentiels/risques", icon: <ShieldAlert size={17} /> },
  { label: "Outillages", path: "/referentiels/outillages", icon: <Wrench size={17} /> },
];

const systemItems: NavItem[] = [
  { label: "QR Codes", path: "/qr-codes", icon: <QrCode size={17} /> },
  { label: "Exports", path: "/exports", icon: <FileArchive size={17} /> },
];

/** Construit l'URL exacte incluant la query string afin de distinguer les catégories. */
function getCurrentUrl(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

/** Affiche un lien de navigation et calcule correctement son état actif. */
function NavigationItem({ item }: { item: NavItem }) {
  const location = useLocation();
  const currentUrl = getCurrentUrl(location.pathname, location.search);
  const hasQuery = item.path.includes("?");

  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      className={({ isActive }) =>
        (hasQuery ? currentUrl === item.path : isActive) ? "sidebar-link active" : "sidebar-link"
      }
    >
      <span className="sidebar-link-icon">{item.icon}</span>
      <span className="sidebar-link-label">{item.label}</span>
    </NavLink>
  );
}

/** Sidebar principale : pilotage, maintenance, tous les référentiels et système. */
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [librariesOpen, setLibrariesOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  /** Signale si une page de référentiel est actuellement ouverte. */
  const libraryActive = useMemo(
    () => location.pathname.startsWith("/referentiels"),
    [location.pathname],
  );

  /** Signale si un module Système est actuellement ouvert. */
  const systemActive = useMemo(
    () => systemItems.some((item) => location.pathname.startsWith(item.path)),
    [location.pathname],
  );

  /** Déconnecte proprement puis retourne vers la page de connexion. */
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><Wrench size={22} /></div>
        <div><strong>Gammes</strong><span>Maintenance</span></div>
      </div>

      <div className="sidebar-scroll">
        <section className="sidebar-section">
          <p className="sidebar-section-title">PILOTAGE</p>
          {pilotageItems.map((item) => <NavigationItem key={item.path} item={item} />)}
        </section>

        <section className="sidebar-section">
          <p className="sidebar-section-title">MAINTENANCE</p>
          {maintenanceItems.map((item) => <NavigationItem key={item.path} item={item} />)}
        </section>

        <section className="sidebar-section">
          <button
            type="button"
            className={libraryActive ? "sidebar-group-button active" : "sidebar-group-button"}
            onClick={() => setLibrariesOpen((value) => !value)}
          >
            <span className="sidebar-group-left"><PackageSearch size={17} /><span>Référentiels</span></span>
            <ChevronDown size={15} className={librariesOpen ? "chevron open" : "chevron"} />
          </button>

          {librariesOpen && (
            <div className="sidebar-submenu">
              {dropdownReferenceItems.map((item) => <NavigationItem key={item.path} item={item} />)}
              {specializedReferenceItems.map((item) => <NavigationItem key={item.path} item={item} />)}
            </div>
          )}
        </section>

        <section className="sidebar-section">
          <button
            type="button"
            className={systemActive ? "sidebar-group-button active" : "sidebar-group-button"}
            onClick={() => setSystemOpen((value) => !value)}
          >
            <span className="sidebar-group-left"><FileArchive size={17} /><span>Système</span></span>
            <ChevronDown size={15} className={systemOpen ? "chevron open" : "chevron"} />
          </button>
          {systemOpen && <div className="sidebar-submenu">{systemItems.map((item) => <NavigationItem key={item.path} item={item} />)}</div>}
        </section>
      </div>

      <div className="sidebar-footer">
        <NavLink to="/parametres" className="sidebar-link"><Settings size={17} /><span>Paramètres</span></NavLink>
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout}><LogOut size={17} /><span>Déconnexion</span></button>
      </div>
    </aside>
  );
}
