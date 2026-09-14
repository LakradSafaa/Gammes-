import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import api from "../../api/axios";
import "./GammeCreate.css";


/* ============================================================
   TYPES
   ============================================================ */

type ApiList<T> =
  | T[]
  | {
      results?: T[];
    };


type Equipement = {
  id: string;
  code?: string;
  nom: string;
  constructeur?: string | null;
  type?: string | null;
  reference?: string | null;
};


type SimpleItem = {
  id: string;
  nom: string;
  description?: string | null;
  image_url?: string | null;
};


type Piece = {
  id: string;
  code?: string | null;
  nom: string;
  constructeur?: string | null;
  reference?: string | null;
  description?: string | null;
  image_url?: string | null;
};


type Referentiel = {
  id: string;
  categorie?: string;
  code: string;
  libelle: string;
  ordre?: number;
  actif?: boolean;
};


type Gamme = {
  id: string;
  code: string;
  designation: string;
  abreviation?: string | null;
  equipement?: string | null;
};


type GammeVersion = {
  id: string;
  numero_version?: number;
  code_version?: string;
  statut?: string;
};


type QuantityMap = Record<string, number>;


type WizardStep = {
  id: number;
  label: string;
};


/* ============================================================
   CONSTANTES
   ============================================================ */

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    label: "Informations",
  },
  {
    id: 2,
    label: "Maintenance",
  },
  {
    id: 3,
    label: "Sécurité",
  },
  {
    id: 4,
    label: "Moyens",
  },
  {
    id: 5,
    label: "Vérification",
  },
];


const FALLBACK_TYPE_MAINTENANCE: Referentiel[] = [
  {
    id: "preventif",
    code: "preventif",
    libelle: "Préventive",
  },
  {
    id: "correctif",
    code: "correctif",
    libelle: "Corrective",
  },
  {
    id: "amelioratif",
    code: "amelioratif",
    libelle: "Améliorative",
  },
  {
    id: "conditionnel",
    code: "conditionnel",
    libelle: "Conditionnelle",
  },
  {
    id: "predictif",
    code: "predictif",
    libelle: "Prédictive",
  },
];


const FALLBACK_PERIODICITE: Referentiel[] = [
  {
    id: "chaque_intervention",
    code: "chaque_intervention",
    libelle: "À chaque intervention",
  },
  {
    id: "journaliere",
    code: "journaliere",
    libelle: "Journalière",
  },
  {
    id: "hebdomadaire",
    code: "hebdomadaire",
    libelle: "Hebdomadaire",
  },
  {
    id: "mensuelle",
    code: "mensuelle",
    libelle: "Mensuelle",
  },
  {
    id: "trimestrielle",
    code: "trimestrielle",
    libelle: "Trimestrielle",
  },
  {
    id: "semestrielle",
    code: "semestrielle",
    libelle: "Semestrielle",
  },
  {
    id: "annuelle",
    code: "annuelle",
    libelle: "Annuelle",
  },
  {
    id: "2_ans",
    code: "2_ans",
    libelle: "2 ans",
  },
  {
    id: "3_ans",
    code: "3_ans",
    libelle: "3 ans",
  },
  {
    id: "selon_compteur",
    code: "selon_compteur",
    libelle: "Selon compteur",
  },
  {
    id: "conditionnelle",
    code: "conditionnelle",
    libelle: "Conditionnelle",
  },
];


const FALLBACK_TYPE_ARRET: Referentiel[] = [
  {
    id: "aucun",
    code: "aucun",
    libelle: "Aucun arrêt",
  },
  {
    id: "equipement",
    code: "equipement",
    libelle: "Arrêt équipement",
  },
  {
    id: "partiel",
    code: "partiel",
    libelle: "Arrêt partiel",
  },
  {
    id: "ligne",
    code: "ligne",
    libelle: "Arrêt ligne",
  },
  {
    id: "total",
    code: "total",
    libelle: "Arrêt total",
  },
];


const FALLBACK_CORPS_METIER: Referentiel[] = [
  {
    id: "electrique",
    code: "electrique",
    libelle: "Electrique",
  },
  {
    id: "mecanique",
    code: "mecanique",
    libelle: "Mecanique",
  },
  {
    id: "plombier",
    code: "plombier",
    libelle: "Plombier",
  },
  {
    id: "hvac",
    code: "hvac",
    libelle: "HVAC",
  },
];


const FALLBACK_TYPE_REDACTION: Referentiel[] = [
  {
    id: "redaction_complete",
    code: "redaction_complete",
    libelle: "Rédaction Complète",
  },
  {
    id: "revision",
    code: "revision",
    libelle: "Révision",
  },
];


/* ============================================================
   FONCTIONS UTILITAIRES
   ============================================================ */

function extractResults<T>(data: ApiList<T> | undefined | null): T[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}


function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: {
        data?: unknown;
      };
    };

    const data = axiosError.response?.data;

    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data === "object") {
      try {
        return JSON.stringify(data);
      } catch {
        return "Une erreur est survenue.";
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}


/* ============================================================
   COMPOSANT
   ============================================================ */

export default function GammeCreate() {
  const navigate = useNavigate();

  /* ----------------------------------------------------------
     WIZARD
     ---------------------------------------------------------- */

  const [currentStep, setCurrentStep] = useState<number>(1);


  /* ----------------------------------------------------------
     CHARGEMENT
     ---------------------------------------------------------- */

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");


  /* ----------------------------------------------------------
     DONNÉES PRINCIPALES
     ---------------------------------------------------------- */

  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [epis, setEpis] = useState<SimpleItem[]>([]);
  const [epcs, setEpcs] = useState<SimpleItem[]>([]);
  const [risques, setRisques] = useState<SimpleItem[]>([]);
  const [outillages, setOutillages] = useState<SimpleItem[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);


  /* ----------------------------------------------------------
     RÉFÉRENTIELS
     ---------------------------------------------------------- */

  const [typesMaintenance, setTypesMaintenance] =
    useState<Referentiel[]>(FALLBACK_TYPE_MAINTENANCE);

  const [periodicites, setPeriodicites] =
    useState<Referentiel[]>(FALLBACK_PERIODICITE);

  const [typesArret, setTypesArret] =
    useState<Referentiel[]>(FALLBACK_TYPE_ARRET);

  const [corpsMetiers, setCorpsMetiers] =
    useState<Referentiel[]>(FALLBACK_CORPS_METIER);

  const [typesRedaction, setTypesRedaction] =
    useState<Referentiel[]>(FALLBACK_TYPE_REDACTION);


  /* ----------------------------------------------------------
     INFORMATIONS GÉNÉRALES
     ---------------------------------------------------------- */

  const [code, setCode] = useState<string>("");
  const [abreviation, setAbreviation] = useState<string>("");
  const [designation, setDesignation] = useState<string>("");

  const [corpsMetier, setCorpsMetier] = useState<string>("");
  const [typeRedaction, setTypeRedaction] = useState<string>("");

  const [equipementId, setEquipementId] = useState<string>("");

  const [imageUrl, setImageUrl] = useState<string>("");


  /* ----------------------------------------------------------
     MAINTENANCE
     ---------------------------------------------------------- */

  const [typeMaintenance, setTypeMaintenance] = useState<string>("");
  const [periodicite, setPeriodicite] = useState<string>("");
  const [mainOeuvre, setMainOeuvre] = useState<number>(1);
  const [typeArret, setTypeArret] = useState<string>("aucun");


  /* ----------------------------------------------------------
     SÉCURITÉ
     ---------------------------------------------------------- */

  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [selectedEpcs, setSelectedEpcs] = useState<string[]>([]);
  const [selectedRisques, setSelectedRisques] = useState<string[]>([]);


  /* ----------------------------------------------------------
     MOYENS
     ---------------------------------------------------------- */

  const [selectedOutillages, setSelectedOutillages] =
    useState<string[]>([]);

  const [selectedPieces, setSelectedPieces] =
    useState<string[]>([]);

  const [outillageQuantities, setOutillageQuantities] =
    useState<QuantityMap>({});

  const [pieceQuantities, setPieceQuantities] =
    useState<QuantityMap>({});


  /* ============================================================
     ÉQUIPEMENT SÉLECTIONNÉ
     ============================================================ */

  const selectedEquipement = useMemo(() => {
    return (
      equipements.find(
        (equipement) => equipement.id === equipementId,
      ) ?? null
    );
  }, [equipements, equipementId]);


  /* ============================================================
     CHARGEMENT DES DONNÉES
     ============================================================ */

  useEffect(() => {
    void loadData();
  }, []);


  async function loadReferentiel(
    categorie: string,
    fallback: Referentiel[],
  ): Promise<Referentiel[]> {
    try {
      const response = await api.get<ApiList<Referentiel>>(
        `/v2/referentiels/?categorie=${categorie}`,
      );

      const values = extractResults(response.data).filter(
        (item) => item.actif !== false,
      );

      if (values.length === 0) {
        return fallback;
      }

      return values.sort(
        (a, b) => (a.ordre ?? 0) - (b.ordre ?? 0),
      );
    } catch {
      return fallback;
    }
  }


  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        equipementResponse,
        epiResponse,
        risqueResponse,
        outillageResponse,
        pieceResponse,
      ] = await Promise.all([
        api.get<ApiList<Equipement>>("/equipements/"),
        api.get<ApiList<SimpleItem>>("/epis/"),
        api.get<ApiList<SimpleItem>>("/risques/"),
        api.get<ApiList<SimpleItem>>("/outillages/"),
        api.get<ApiList<Piece>>("/pieces/"),
      ]);

      setEquipements(extractResults(equipementResponse.data));
      setEpis(extractResults(epiResponse.data));
      setRisques(extractResults(risqueResponse.data));
      setOutillages(extractResults(outillageResponse.data));
      setPieces(extractResults(pieceResponse.data));


      try {
        const epcResponse =
          await api.get<ApiList<SimpleItem>>("/v2/epcs/");

        setEpcs(extractResults(epcResponse.data));
      } catch {
        setEpcs([]);
      }


      const [
        maintenanceValues,
        periodiciteValues,
        arretValues,
        metierValues,
        redactionValues,
      ] = await Promise.all([
        loadReferentiel(
          "type_maintenance",
          FALLBACK_TYPE_MAINTENANCE,
        ),

        loadReferentiel(
          "periodicite",
          FALLBACK_PERIODICITE,
        ),

        loadReferentiel(
          "type_arret",
          FALLBACK_TYPE_ARRET,
        ),

        loadReferentiel(
          "corps_metier",
          FALLBACK_CORPS_METIER,
        ),

        loadReferentiel(
          "type_redaction",
          FALLBACK_TYPE_REDACTION,
        ),
      ]);

      setTypesMaintenance(maintenanceValues);
      setPeriodicites(periodiciteValues);
      setTypesArret(arretValues);
      setCorpsMetiers(metierValues);
      setTypesRedaction(redactionValues);
    } catch (err) {
      console.error(err);

      setError(
        "Impossible de charger les données nécessaires à la création de la gamme.",
      );
    } finally {
      setLoading(false);
    }
  }


  /* ============================================================
     IMAGE
     ============================================================ */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Le fichier sélectionné doit être une image.");
      return;
    }

    const maxSize = 3 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "L'image est trop volumineuse. Taille maximale autorisée : 3 Mo.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
        setError("");
      }
    };

    reader.onerror = () => {
      setError("Impossible de lire l'image sélectionnée.");
    };

    reader.readAsDataURL(file);
  }


  function removeImage() {
    setImageUrl("");
  }


  /* ============================================================
     SÉLECTIONS
     ============================================================ */

  function toggleSelection(
    id: string,
    values: string[],
    setter: (values: string[]) => void,
  ) {
    if (values.includes(id)) {
      setter(values.filter((value) => value !== id));
      return;
    }

    setter([...values, id]);
  }


  function toggleOutillage(id: string) {
    if (selectedOutillages.includes(id)) {
      setSelectedOutillages(
        selectedOutillages.filter((value) => value !== id),
      );

      setOutillageQuantities((current) => {
        const copy = { ...current };
        delete copy[id];
        return copy;
      });

      return;
    }

    setSelectedOutillages([...selectedOutillages, id]);

    setOutillageQuantities((current) => ({
      ...current,
      [id]: 1,
    }));
  }


  function togglePiece(id: string) {
    if (selectedPieces.includes(id)) {
      setSelectedPieces(
        selectedPieces.filter((value) => value !== id),
      );

      setPieceQuantities((current) => {
        const copy = { ...current };
        delete copy[id];
        return copy;
      });

      return;
    }

    setSelectedPieces([...selectedPieces, id]);

    setPieceQuantities((current) => ({
      ...current,
      [id]: 1,
    }));
  }


  /* ============================================================
     VALIDATION DES ÉTAPES
     ============================================================ */

  function validateStep(step: number): boolean {
    setError("");

    if (step === 1) {
      if (!code.trim()) {
        setError("Le code gamme est obligatoire.");
        return false;
      }

      if (!designation.trim()) {
        setError("L'intitulé de l'opération est obligatoire.");
        return false;
      }

      if (!corpsMetier) {
        setError("Sélectionnez un corps de métier.");
        return false;
      }

      if (!typeRedaction) {
        setError("Sélectionnez un type de rédaction.");
        return false;
      }

      if (!equipementId) {
        setError("Sélectionnez un équipement.");
        return false;
      }
    }


    if (step === 2) {
      if (!typeMaintenance) {
        setError("Sélectionnez un type de maintenance.");
        return false;
      }

      if (!periodicite) {
        setError("Sélectionnez une périodicité.");
        return false;
      }

      if (!typeArret) {
        setError("Sélectionnez un type d'arrêt.");
        return false;
      }

      if (!mainOeuvre || mainOeuvre < 1) {
        setError(
          "La main-d'œuvre doit être supérieure ou égale à 1.",
        );
        return false;
      }
    }

    return true;
  }


  function nextStep() {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep((current) => current + 1);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }


  function previousStep() {
    setError("");

    if (currentStep > 1) {
      setCurrentStep((current) => current - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }


  function goToCompletedStep(step: number) {
    if (step < currentStep) {
      setCurrentStep(step);
      setError("");
    }
  }


  /* ============================================================
     CRÉATION
     ============================================================ */

  async function handleCreate() {
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      /* --------------------------------------------------------
         1. CRÉATION DE LA GAMME
         -------------------------------------------------------- */

      const gammeResponse = await api.post<Gamme>(
        "/gammes/",
        {
          code: code.trim(),
          designation: designation.trim(),
          abreviation: abreviation.trim(),
          equipement: equipementId,
          description: "",
          actif: true,
        },
      );

      const gamme = gammeResponse.data;


      /* --------------------------------------------------------
         2. MÉTADONNÉES V2 DE LA GAMME
         -------------------------------------------------------- */

      await api.patch(
        `/v2/gammes/${gamme.id}/metadata/`,
        {
          corps_metier: corpsMetier,
          type_redaction: typeRedaction,
          image_url: imageUrl || null,
        },
      );


      /* --------------------------------------------------------
         3. RÉCUPÉRATION DE V0
         -------------------------------------------------------- */

      const versionsResponse =
        await api.get<ApiList<GammeVersion>>(
          `/gammes/${gamme.id}/versions/`,
        );

      const versions = extractResults(versionsResponse.data);

      if (versions.length === 0) {
        throw new Error(
          "La gamme a été créée mais aucune version V0 n'a été trouvée.",
        );
      }

      const version =
        versions.find(
          (item) =>
            item.numero_version === 0 ||
            item.code_version === "V0",
        ) ?? versions[0];


      /* --------------------------------------------------------
         4. INFORMATIONS DE MAINTENANCE
         -------------------------------------------------------- */

      await api.patch(
        `/versions/${version.id}/`,
        {
          type_maintenance: typeMaintenance,
          periodicite,
          main_oeuvre: mainOeuvre,
        },
      );


      await api.patch(
        `/v2/versions/${version.id}/metadata/`,
        {
          type_arret: typeArret,
        },
      );


      /* --------------------------------------------------------
         5. EPI
         -------------------------------------------------------- */

      await Promise.all(
        selectedEpis.map((epiId) =>
          api.post("/version-epis/", {
            version: version.id,
            epi: epiId,
          }),
        ),
      );


      /* --------------------------------------------------------
         6. EPC
         -------------------------------------------------------- */

      await Promise.all(
        selectedEpcs.map((epcId) =>
          api.post("/v2/version-epcs/", {
            version_id: version.id,
            epc_id: epcId,
          }),
        ),
      );


      /* --------------------------------------------------------
         7. RISQUES
         -------------------------------------------------------- */

      await Promise.all(
        selectedRisques.map((risqueId) =>
          api.post("/version-risques/", {
            version: version.id,
            risque: risqueId,
          }),
        ),
      );


      /* --------------------------------------------------------
         8. OUTILLAGES
         -------------------------------------------------------- */

      await Promise.all(
        selectedOutillages.map((outillageId) =>
          api.post("/version-outillages/", {
            version: version.id,
            outillage: outillageId,
            quantite:
              outillageQuantities[outillageId] ?? 1,
          }),
        ),
      );


      /* --------------------------------------------------------
         9. PIÈCES
         -------------------------------------------------------- */

      await Promise.all(
        selectedPieces.map((pieceId) =>
          api.post("/version-pieces/", {
            version: version.id,
            piece: pieceId,
            quantite:
              pieceQuantities[pieceId] ?? 1,
          }),
        ),
      );


      /* --------------------------------------------------------
         10. RECALCUL DURÉE
         -------------------------------------------------------- */

      try {
        await api.post(
          `/versions/${version.id}/recalculate/`,
        );
      } catch {
        // La gamme est quand même créée.
      }


      /* --------------------------------------------------------
         11. REDIRECTION
         -------------------------------------------------------- */

      navigate(`/gammes/${gamme.id}`);
    } catch (err) {
      console.error(err);

      setError(
        `Création impossible : ${getErrorMessage(err)}`,
      );
    } finally {
      setSaving(false);
    }
  }


  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="gamme-create-page">
        <div className="page-loading">
          <Loader2
            size={22}
            className="spin"
          />

          <span>
            Chargement du formulaire...
          </span>
        </div>
      </div>
    );
  }


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="gamme-create-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="page-header">
        <div>
          <span className="page-kicker">
            Gammes opératoires
          </span>

          <h1>
            Nouvelle gamme
          </h1>

          <p>
            Créez une gamme opératoire de maintenance
            à partir du Wizard.
          </p>
        </div>
      </header>


      {/* ======================================================
          WIZARD PROGRESS
          ====================================================== */}

      <nav
        className="wizard-progress"
        aria-label="Progression de création"
      >
        {WIZARD_STEPS.map((wizardStep) => {
          const isActive =
            currentStep === wizardStep.id;

          const isDone =
            currentStep > wizardStep.id;

          return (
            <button
              key={wizardStep.id}
              type="button"
              className={[
                "wizard-step",
                isActive ? "active" : "",
                isDone ? "done" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                goToCompletedStep(wizardStep.id)
              }
              disabled={
                !isDone && !isActive
              }
            >
              <span className="wizard-step-number">
                {isDone ? (
                  <Check size={15} />
                ) : (
                  wizardStep.id
                )}
              </span>

              <span className="wizard-step-content">
                <strong>
                  {wizardStep.label}
                </strong>

                <small>
                  Étape {wizardStep.id}
                </small>
              </span>
            </button>
          );
        })}
      </nav>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}


      {/* ======================================================
          CARD
          ====================================================== */}

      <main className="wizard-card">

        {/* ====================================================
            ÉTAPE 1
            ==================================================== */}

        {currentStep === 1 && (
          <>
            <div className="section-heading">
              <h2>
                Informations générales
              </h2>

              <p>
                Identifiez la gamme, le corps de métier et
                l'équipement concerné.
              </p>
            </div>


            <div className="form-grid">

              <label>
                <span>
                  Code gamme *
                </span>

                <input
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  placeholder="Ex. HP_TRI_FIV_001"
                />
              </label>


              <label>
                <span>
                  Abréviation
                </span>

                <input
                  type="text"
                  value={abreviation}
                  onChange={(event) =>
                    setAbreviation(
                      event.target.value,
                    )
                  }
                  placeholder="Ex. CONTROLE CONV"
                />
              </label>


              <label className="form-span-2">
                <span>
                  Intitulé de l'opération *
                </span>

                <input
                  type="text"
                  value={designation}
                  onChange={(event) =>
                    setDesignation(
                      event.target.value,
                    )
                  }
                  placeholder="Ex. Contrôle préventif du convoyeur principal"
                />
              </label>


              <label>
                <span>
                  Corps de métier *
                </span>

                <select
                  value={corpsMetier}
                  onChange={(event) =>
                    setCorpsMetier(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {corpsMetiers.map((item) => (
                    <option
                      key={item.id}
                      value={item.code}
                    >
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>


              <label>
                <span>
                  Type de rédaction *
                </span>

                <select
                  value={typeRedaction}
                  onChange={(event) =>
                    setTypeRedaction(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {typesRedaction.map((item) => (
                    <option
                      key={item.id}
                      value={item.code}
                    >
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>


              <label className="form-span-2">
                <span>
                  Équipement *
                </span>

                <select
                  value={equipementId}
                  onChange={(event) =>
                    setEquipementId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner un équipement
                  </option>

                  {equipements.map(
                    (equipement) => (
                      <option
                        key={equipement.id}
                        value={equipement.id}
                      >
                        {equipement.code
                          ? `${equipement.code} — `
                          : ""}
                        {equipement.nom}
                      </option>
                    ),
                  )}
                </select>
              </label>


              {selectedEquipement && (
                <div className="equipment-summary form-span-2">
                  <div>
                    <span>
                      Constructeur
                    </span>

                    <strong>
                      {selectedEquipement.constructeur ||
                        "Non renseigné"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Référence
                    </span>

                    <strong>
                      {selectedEquipement.reference ||
                        "Non renseignée"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Type machine
                    </span>

                    <strong>
                      {selectedEquipement.type ||
                        "Non renseigné"}
                    </strong>
                  </div>
                </div>
              )}


              {/* IMAGE À LA PLACE DE DESCRIPTION */}

              <div className="gamme-image-field form-span-2">

                <div className="field-label">
                  Image de la gamme
                </div>


                {!imageUrl ? (
                  <label className="gamme-image-dropzone">
                    <ImagePlus size={36} />

                    <strong>
                      Ajouter une image
                    </strong>

                    <span>
                      Cliquez pour sélectionner une photo
                      de l'équipement ou de l'opération.
                      PNG, JPG ou WEBP — maximum 3 Mo.
                    </span>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={
                        handleImageChange
                      }
                    />
                  </label>
                ) : (
                  <div className="gamme-image-preview">

                    <img
                      src={imageUrl}
                      alt="Aperçu de la gamme"
                    />


                    <div className="gamme-image-buttons">

                      <label className="image-button">
                        <Upload size={16} />

                        Remplacer

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={
                            handleImageChange
                          }
                        />
                      </label>


                      <button
                        type="button"
                        className="image-button danger"
                        onClick={removeImage}
                      >
                        <Trash2 size={16} />

                        Supprimer
                      </button>

                    </div>
                  </div>
                )}
              </div>

            </div>
          </>
        )}


        {/* ====================================================
            ÉTAPE 2
            ==================================================== */}

        {currentStep === 2 && (
          <>
            <div className="section-heading">
              <h2>
                Paramètres de maintenance
              </h2>

              <p>
                Définissez la maintenance, la périodicité
                et les contraintes d'arrêt.
              </p>
            </div>


            <div className="form-grid">

              <label>
                <span>
                  Type de maintenance *
                </span>

                <select
                  value={typeMaintenance}
                  onChange={(event) =>
                    setTypeMaintenance(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {typesMaintenance.map((item) => (
                    <option
                      key={item.id}
                      value={item.code}
                    >
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>


              <label>
                <span>
                  Périodicité *
                </span>

                <select
                  value={periodicite}
                  onChange={(event) =>
                    setPeriodicite(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {periodicites.map((item) => (
                    <option
                      key={item.id}
                      value={item.code}
                    >
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>


              <label>
                <span>
                  Main-d'œuvre *
                </span>

                <input
                  type="number"
                  min={1}
                  value={mainOeuvre}
                  onChange={(event) =>
                    setMainOeuvre(
                      Math.max(
                        1,
                        Number(
                          event.target.value,
                        ) || 1,
                      ),
                    )
                  }
                />
              </label>


              <label>
                <span>
                  Type d'arrêt *
                </span>

                <select
                  value={typeArret}
                  onChange={(event) =>
                    setTypeArret(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {typesArret.map((item) => (
                    <option
                      key={item.id}
                      value={item.code}
                    >
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

            </div>
          </>
        )}


        {/* ====================================================
            ÉTAPE 3
            ==================================================== */}

        {currentStep === 3 && (
          <>
            <div className="section-heading">
              <h2>
                Sécurité
              </h2>

              <p>
                Sélectionnez les EPI, les EPC et les
                risques liés à l'intervention.
              </p>
            </div>


            <div className="selection-columns">

              {/* EPI */}

              <section className="selection-panel">
                <h3>
                  EPI
                </h3>

                {epis.length === 0 ? (
                  <p className="empty-selection">
                    Aucun EPI disponible.
                  </p>
                ) : (
                  epis.map((epi) => (
                    <label
                      className="selection-row"
                      key={epi.id}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEpis.includes(
                          epi.id,
                        )}
                        onChange={() =>
                          toggleSelection(
                            epi.id,
                            selectedEpis,
                            setSelectedEpis,
                          )
                        }
                      />

                      <span>
                        {epi.nom}
                      </span>
                    </label>
                  ))
                )}
              </section>


              {/* EPC */}

              <section className="selection-panel">
                <h3>
                  EPC
                </h3>

                {epcs.length === 0 ? (
                  <p className="empty-selection">
                    Aucun EPC disponible.
                  </p>
                ) : (
                  epcs.map((epc) => (
                    <label
                      className="selection-row"
                      key={epc.id}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEpcs.includes(
                          epc.id,
                        )}
                        onChange={() =>
                          toggleSelection(
                            epc.id,
                            selectedEpcs,
                            setSelectedEpcs,
                          )
                        }
                      />

                      <span>
                        {epc.nom}
                      </span>
                    </label>
                  ))
                )}
              </section>


              {/* RISQUES */}

              <section className="selection-panel">
                <h3>
                  Risques
                </h3>

                {risques.length === 0 ? (
                  <p className="empty-selection">
                    Aucun risque disponible.
                  </p>
                ) : (
                  risques.map((risque) => (
                    <label
                      className="selection-row"
                      key={risque.id}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRisques.includes(
                          risque.id,
                        )}
                        onChange={() =>
                          toggleSelection(
                            risque.id,
                            selectedRisques,
                            setSelectedRisques,
                          )
                        }
                      />

                      <span>
                        {risque.nom}
                      </span>
                    </label>
                  ))
                )}
              </section>

            </div>
          </>
        )}


        {/* ====================================================
            ÉTAPE 4
            ==================================================== */}

        {currentStep === 4 && (
          <>
            <div className="section-heading">
              <h2>
                Moyens nécessaires
              </h2>

              <p>
                Sélectionnez les outillages et les pièces
                nécessaires à l'intervention.
              </p>
            </div>


            <div className="selection-columns means-columns">

              {/* OUTILLAGES */}

              <section className="selection-panel">
                <h3>
                  Outillages
                </h3>

                {outillages.length === 0 ? (
                  <p className="empty-selection">
                    Aucun outillage disponible.
                  </p>
                ) : (
                  outillages.map((outillage) => {
                    const selected =
                      selectedOutillages.includes(
                        outillage.id,
                      );

                    return (
                      <div
                        className="quantity-row"
                        key={outillage.id}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleOutillage(
                              outillage.id,
                            )
                          }
                        />

                        <span>
                          {outillage.nom}
                        </span>

                        <input
                          className="quantity-input"
                          type="number"
                          min={1}
                          disabled={!selected}
                          value={
                            outillageQuantities[
                              outillage.id
                            ] ?? 1
                          }
                          onChange={(event) =>
                            setOutillageQuantities(
                              (current) => ({
                                ...current,
                                [outillage.id]:
                                  Math.max(
                                    1,
                                    Number(
                                      event.target
                                        .value,
                                    ) || 1,
                                  ),
                              }),
                            )
                          }
                        />
                      </div>
                    );
                  })
                )}
              </section>


              {/* PIÈCES */}

              <section className="selection-panel">
                <h3>
                  Pièces de rechange
                </h3>

                {pieces.length === 0 ? (
                  <p className="empty-selection">
                    Aucune pièce disponible.
                  </p>
                ) : (
                  pieces.map((piece) => {
                    const selected =
                      selectedPieces.includes(
                        piece.id,
                      );

                    return (
                      <div
                        className="quantity-row"
                        key={piece.id}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            togglePiece(
                              piece.id,
                            )
                          }
                        />

                        <span>
                          {piece.nom}
                          {piece.reference
                            ? ` — ${piece.reference}`
                            : ""}
                        </span>

                        <input
                          className="quantity-input"
                          type="number"
                          min={1}
                          disabled={!selected}
                          value={
                            pieceQuantities[
                              piece.id
                            ] ?? 1
                          }
                          onChange={(event) =>
                            setPieceQuantities(
                              (current) => ({
                                ...current,
                                [piece.id]:
                                  Math.max(
                                    1,
                                    Number(
                                      event.target
                                        .value,
                                    ) || 1,
                                  ),
                              }),
                            )
                          }
                        />
                      </div>
                    );
                  })
                )}
              </section>

            </div>
          </>
        )}


        {/* ====================================================
            ÉTAPE 5
            ==================================================== */}

        {currentStep === 5 && (
          <>
            <div className="section-heading">
              <h2>
                Vérification
              </h2>

              <p>
                Vérifiez les informations avant de créer
                la gamme V0.
              </p>
            </div>


            <div className="review-grid">

              <div>
                <span>
                  Code gamme
                </span>

                <strong>
                  {code || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Abréviation
                </span>

                <strong>
                  {abreviation || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Intitulé
                </span>

                <strong>
                  {designation || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Corps de métier
                </span>

                <strong>
                  {corpsMetiers.find(
                    (item) =>
                      item.code === corpsMetier,
                  )?.libelle || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Type de rédaction
                </span>

                <strong>
                  {typesRedaction.find(
                    (item) =>
                      item.code ===
                      typeRedaction,
                  )?.libelle || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Équipement
                </span>

                <strong>
                  {selectedEquipement?.nom ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Type maintenance
                </span>

                <strong>
                  {typesMaintenance.find(
                    (item) =>
                      item.code ===
                      typeMaintenance,
                  )?.libelle || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Périodicité
                </span>

                <strong>
                  {periodicites.find(
                    (item) =>
                      item.code ===
                      periodicite,
                  )?.libelle || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Type d'arrêt
                </span>

                <strong>
                  {typesArret.find(
                    (item) =>
                      item.code ===
                      typeArret,
                  )?.libelle || "—"}
                </strong>
              </div>


              <div>
                <span>
                  Main-d'œuvre
                </span>

                <strong>
                  {mainOeuvre}
                </strong>
              </div>


              <div>
                <span>
                  EPI sélectionnés
                </span>

                <strong>
                  {selectedEpis.length}
                </strong>
              </div>


              <div>
                <span>
                  EPC sélectionnés
                </span>

                <strong>
                  {selectedEpcs.length}
                </strong>
              </div>


              <div>
                <span>
                  Risques
                </span>

                <strong>
                  {selectedRisques.length}
                </strong>
              </div>


              <div>
                <span>
                  Outillages
                </span>

                <strong>
                  {selectedOutillages.length}
                </strong>
              </div>


              <div>
                <span>
                  Pièces
                </span>

                <strong>
                  {selectedPieces.length}
                </strong>
              </div>


              <div>
                <span>
                  Image
                </span>

                <strong>
                  {imageUrl
                    ? "Image ajoutée"
                    : "Aucune image"}
                </strong>
              </div>

            </div>


            {imageUrl && (
              <div className="review-image">
                <span>
                  Aperçu de l'image
                </span>

                <img
                  src={imageUrl}
                  alt="Aperçu final"
                />
              </div>
            )}


            <div className="creation-ready">
              <CheckCircle2 size={22} />

              <div>
                <strong>
                  Prêt pour la création
                </strong>

                <span>
                  La gamme sera créée avec une
                  première version V0.
                </span>
              </div>
            </div>
          </>
        )}


        {/* ====================================================
            ACTIONS
            ==================================================== */}

        <div className="wizard-actions">

          <button
            type="button"
            className="secondary-button"
            disabled={
              currentStep === 1 || saving
            }
            onClick={previousStep}
          >
            <ArrowLeft size={17} />

            Précédent
          </button>


          {currentStep <
          WIZARD_STEPS.length ? (
            <button
              type="button"
              className="primary-button"
              onClick={nextStep}
            >
              Suivant

              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                void handleCreate();
              }}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />

                  Création...
                </>
              ) : (
                <>
                  <Save size={17} />

                  Créer la gamme
                </>
              )}
            </button>
          )}

        </div>

      </main>
    </div>
  );
}
