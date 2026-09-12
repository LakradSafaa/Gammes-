import {
  BarChart3,
  Boxes,
  FileText,
  HardHat,
  LogOut,
  PackageOpen,
  Settings,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { logout } from "../api/auth";

function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Wrench size={22} />
          </div>

          <div>
            <strong>Gammes</strong>
            <span>Maintenance</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <BarChart3 size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/equipements"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <Boxes size={19} />
            <span>Équipements</span>
          </NavLink>

          <NavLink
            to="/gammes"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <FileText size={19} />
            <span>Gammes opératoires</span>
          </NavLink>

          <div className="sidebar-section">
            Bibliothèques
          </div>

          <NavLink
            to="/epis"
            className="sidebar-link"
          >
            <HardHat size={18} />
            <span>EPI</span>
          </NavLink>

          <NavLink
            to="/risques"
            className="sidebar-link"
          >
            <ShieldAlert size={18} />
            <span>Risques</span>
          </NavLink>

          <NavLink
            to="/outillages"
            className="sidebar-link"
          >
            <Wrench size={18} />
            <span>Outillages</span>
          </NavLink>

          <NavLink
            to="/pieces"
            className="sidebar-link"
          >
            <PackageOpen size={18} />
            <span>Pièces de rechange</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button className="sidebar-link">
          <Settings size={18} />
          <span>Paramètres</span>
        </button>

        <button
          className="sidebar-link logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;