import type { ReactNode } from "react";

import {
  Bell,
  Search,
  UserRound,
} from "lucide-react";

import Sidebar from "./Sidebar";

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
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher..."
            />
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={20} />

              <span className="notification-badge">
                3
              </span>
            </button>

            <div className="user-info">
              <div className="user-avatar">
                <UserRound size={20} />
              </div>

              <div>
                <strong>admin</strong>
                <span>Administrateur</span>
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