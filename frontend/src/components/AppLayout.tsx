import type {
  ReactNode,
} from "react";

import {
  Bell,
  Search,
  UserRound,
} from "lucide-react";

import Sidebar from "./Sidebar";

import "./AppLayout.css";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="application">
      <Sidebar />

      <div className="application-content">
        <header className="topbar">
          <div className="topbar-search-wrap">
            <div className="search-box">
              <Search size={18} />

              <input
                type="text"
                placeholder="Rechercher un équipement, une gamme..."
                aria-label="Recherche"
              />
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={19} />

              <span className="notification-badge">
                3
              </span>
            </button>

            <div className="topbar-divider" />

            <div className="user-info">
              <div className="user-avatar">
                <UserRound size={20} />
              </div>

              <div className="user-copy">
                <strong>
                  admin
                </strong>

                <span>
                  Administrateur
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
