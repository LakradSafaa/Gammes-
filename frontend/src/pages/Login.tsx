import {
  Boxes,
  FileText,
  LockKeyhole,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";

import {
  type FormEvent,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { login } from "../api/auth";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(username, password);

      navigate("/");
    } catch {
      setError(
        "Nom d'utilisateur ou mot de passe incorrect.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-decoration login-decoration-one" />
        <div className="login-decoration login-decoration-two" />

        <div className="login-brand">
          <div className="login-brand-icon">
            <Wrench size={34} />
          </div>

          <h1>
            Gammes
            <br />
            Maintenance
          </h1>

          <p>
            Vos procédures de maintenance
            digitalisées et accessibles
          </p>
        </div>

        <div className="login-features">
          <div>
            <span>
              <Boxes size={19} />
            </span>
            Équipements
          </div>

          <div>
            <span>
              <FileText size={19} />
            </span>
            Gammes opératoires
          </div>

          <div>
            <span>
              <ShieldCheck size={19} />
            </span>
            Sécurité et conformité
          </div>
        </div>

        <blockquote>
          « Une maintenance plus sûre,
          plus simple, plus efficace. »
        </blockquote>
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Connexion</h2>

            <p>
              Accédez à votre espace de travail
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">
                Utilisateur
              </label>

              <div className="input-wrapper">
                <User size={18} />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value,
                    )
                  }
                  placeholder="Nom d'utilisateur"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Mot de passe
              </label>

              <div className="input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Mot de passe"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Connexion..."
                : "Se connecter"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;