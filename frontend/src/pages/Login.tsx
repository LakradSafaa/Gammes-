import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  FileText,
  HardHat,
  LockKeyhole,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  isAuthenticated,
  login,
} from "../api/auth";

import "./Login.css";


export default function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    remember,
    setRemember,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     SI DÉJÀ CONNECTÉ
     ========================================================= */

  useEffect(() => {
    if (
      isAuthenticated()
    ) {
      navigate(
        "/",
        {
          replace: true,
        },
      );

      return;
    }


    const savedUsername =
      localStorage.getItem(
        "remembered_username",
      );


    if (savedUsername) {
      setUsername(
        savedUsername,
      );
    }
  }, [navigate]);


  /* =========================================================
     CONNEXION
     ========================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();


      if (
        !username.trim() ||
        !password.trim()
      ) {
        setError(
          "Veuillez saisir votre identifiant et votre mot de passe.",
        );

        return;
      }


      try {
        setLoading(true);
        setError("");


        await login(
          username.trim(),
          password,
        );


        /* -------------------------------------------
           MÉMORISER UNIQUEMENT LE NOM UTILISATEUR
           ------------------------------------------- */

        if (remember) {
          localStorage.setItem(
            "remembered_username",
            username.trim(),
          );
        } else {
          localStorage.removeItem(
            "remembered_username",
          );
        }


        /* -------------------------------------------
           VÉRIFICATION DU TOKEN
           ------------------------------------------- */

        const accessToken =
          localStorage.getItem(
            "access_token",
          );


        if (!accessToken) {
          throw new Error(
            "Token JWT non enregistré.",
          );
        }


        /* -------------------------------------------
           REDIRECTION
           ------------------------------------------- */

        const state =
          location.state as {
            from?: string;
          } | null;


        navigate(
          state?.from || "/",
          {
            replace: true,
          },
        );
      } catch (err) {
        console.error(
          "Erreur connexion :",
          err,
        );


        setError(
          "Connexion impossible. Vérifiez l'identifiant, le mot de passe et que le backend Django est démarré.",
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <main className="login-page">

      {/* ====================================================
          PARTIE GAUCHE
          ==================================================== */}

      <section className="login-brand-panel">

        <div
          className="
            login-decoration
            login-decoration-one
          "
        />

        <div
          className="
            login-decoration
            login-decoration-two
          "
        />


        <div className="login-brand-content">

          <div className="login-logo">

            <div className="login-logo-icon">
              <Wrench size={27} />
            </div>

            <div>
              <strong>
                Gammes
              </strong>

              <span>
                Maintenance
              </span>
            </div>

          </div>


          <div className="login-presentation">

            <span className="login-overline">
              MAINTENANCE
              INDUSTRIELLE
            </span>


            <h1>
              Gammes
              <br />
              Maintenance
            </h1>


            <p>
              Vos procédures de
              maintenance digitalisées,
              centralisées et accessibles
              en toute sécurité.
            </p>

          </div>


          <div className="login-features">

            <div className="login-feature">

              <div className="login-feature-icon">
                <HardHat
                  size={20}
                />
              </div>

              <div>
                <strong>
                  Équipements
                </strong>

                <span>
                  Gestion centralisée
                  du parc
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="login-feature-icon">
                <FileText
                  size={20}
                />
              </div>

              <div>
                <strong>
                  Gammes opératoires
                </strong>

                <span>
                  Procédures et
                  versioning
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="login-feature-icon">
                <ShieldCheck
                  size={20}
                />
              </div>

              <div>
                <strong>
                  Sécurité &
                  conformité
                </strong>

                <span>
                  EPI, risques et
                  traçabilité
                </span>
              </div>

            </div>

          </div>


          <blockquote className="login-quote">
            « Une maintenance plus
            sûre, plus simple et plus
            efficace. »
          </blockquote>

        </div>

      </section>


      {/* ====================================================
          PARTIE CONNEXION
          ==================================================== */}

      <section className="login-form-panel">

        <div className="login-form-decoration" />


        <div className="login-card">

          <header className="login-card-header">

            <div className="login-card-icon">
              <LockKeyhole
                size={22}
              />
            </div>


            <div>
              <h2>
                Connexion
              </h2>

              <p>
                Accédez à votre
                espace de travail
              </p>
            </div>

          </header>


          <form
            className="login-form"
            onSubmit={
              handleSubmit
            }
          >

            {/* UTILISATEUR */}

            <label className="login-field">

              <span className="login-field-label">
                Utilisateur
              </span>


              <div className="login-input-wrapper">

                <User
                  size={18}
                  className="login-input-icon"
                />


                <input
                  type="text"
                  value={username}
                  autoComplete="username"
                  placeholder="Votre identifiant"
                  disabled={loading}
                  onChange={(event) =>
                    setUsername(
                      event.target
                        .value,
                    )
                  }
                />

              </div>

            </label>


            {/* MOT DE PASSE */}

            <label className="login-field">

              <span className="login-field-label">
                Mot de passe
              </span>


              <div className="login-input-wrapper">

                <LockKeyhole
                  size={18}
                  className="login-input-icon"
                />


                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  disabled={loading}
                  onChange={(event) =>
                    setPassword(
                      event.target
                        .value,
                    )
                  }
                />


                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value,
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}
                </button>

              </div>

            </label>


            {/* ERREUR */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* SE SOUVENIR */}

            <div className="login-options">

              <label className="login-remember">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(
                      event.target
                        .checked,
                    )
                  }
                />

                <span>
                  Se souvenir de moi
                </span>

              </label>

            </div>


            {/* BOUTON */}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading
                ? "Connexion..."
                : "Se connecter"}

              {!loading && (
                <span>
                  →
                </span>
              )}

            </button>

          </form>


          <footer className="login-card-footer">

            <ShieldCheck
              size={15}
            />

            <span>
              Connexion sécurisée
              par JWT
            </span>

          </footer>

        </div>

      </section>

    </main>
  );
}