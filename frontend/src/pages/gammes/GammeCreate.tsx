import { useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";
import "./GammeCreate.css";

type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

type Equipement = {
  id: string;
  code?: string | null;
  nom: string;
  constructeur?: string | null;
  type?: string | null;
  reference?: string | null;
  actif?: boolean;
};

type SimpleRef = {
  id: string;
  nom: string;
  description?: string | null;
  image_url?: string | null;
};

type Piece = {
  id: string;
  code?: string | null;
  nom: string;
  reference?: string | null;
};

type RefValue = {
  id?: string;
  code: string;
  libelle: string;
  ordre?: number;
  actif?: boolean;
};

type GammeVersion = {
  id: string;
  numero_version?: number;
  code_version?: string;
};

type FormState = {
  code: string;
  designation: string;
  abreviation: string;
  equipement: string;
  corps_metier: string;
  type_redaction: string;
  image_url: string;
  type_maintenance: string;
  periodicite: string;
  main_oeuvre: number;
  type_arret: string;
  modifications: string;
};

const initialForm: FormState = {
  code: "",
  designation: "",
  abreviation: "",
  equipement: "",
  corps_metier: "",
  type_redaction: "redaction_complete",
  image_url: "",
  type_maintenance: "preventif",
  periodicite: "Mensuelle",
  main_oeuvre: 1,
  type_arret: "aucun",
  modifications: "Création initiale de la gamme",
};

const fallbackMaintenance: RefValue[] = [
  { code: "preventif", libelle: "Préventive" },
  { code: "correctif", libelle: "Corrective" },
  { code: "amelioratif", libelle: "Améliorative" },
  { code: "conditionnel", libelle: "Conditionnelle" },
  { code: "predictif", libelle: "Prédictive" },
];

const fallbackPeriodicites: RefValue[] = [
  { code: "À chaque intervention", libelle: "À chaque intervention" },
  { code: "Journalière", libelle: "Journalière" },
  { code: "Hebdomadaire", libelle: "Hebdomadaire" },
  { code: "Mensuelle", libelle: "Mensuelle" },
  { code: "Trimestrielle", libelle: "Trimestrielle" },
  { code: "Semestrielle", libelle: "Semestrielle" },
  { code: "Annuelle", libelle: "Annuelle" },
  { code: "2 ans", libelle: "2 ans" },
  { code: "3 ans", libelle: "3 ans" },
  { code: "Selon compteur", libelle: "Selon compteur" },
  { code: "Conditionnelle", libelle: "Conditionnelle" },
];

const fallbackArrets: RefValue[] = [
  { code: "aucun", libelle: "Aucun arrêt" },
  { code: "equipement", libelle: "Arrêt équipement" },
  { code: "partiel", libelle: "Arrêt partiel" },
  { code: "ligne", libelle: "Arrêt ligne" },
  { code: "total", libelle: "Arrêt total" },
];

const wizardSteps = [
  "Informations",
  "Maintenance",
  "Sécurité",
  "Moyens",
  "Vérification",
];

function extractResults<T>(data: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

function normalizeReferenceValues(
  values: RefValue[],
  fallback: RefValue[],
): RefValue[] {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }

  return values
    .filter((item) => item.actif !== false)
    .slice()
    .sort(
      (a, b) =>
        Number(a.ordre ?? 0) - Number(b.ordre ?? 0),
    );
}

export default function GammeCreate() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);

  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [epis, setEpis] = useState<SimpleRef[]>([]);
  const [epcs, setEpcs] = useState<SimpleRef[]>([]);
  const [risques, setRisques] = useState<SimpleRef[]>([]);
  const [outillages, setOutillages] = useState<SimpleRef[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);

  const [maintenanceTypes, setMaintenanceTypes] =
    useState<RefValue[]>(fallbackMaintenance);

  const [periodicites, setPeriodicites] =
    useState<RefValue[]>(fallbackPeriodicites);

  const [typesArret, setTypesArret] =
    useState<RefValue[]>(fallbackArrets);

  const [corpsMetiers, setCorpsMetiers] =
    useState<RefValue[]>([]);

  const [typesRedaction, setTypesRedaction] =
    useState<RefValue[]>([]);

  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [selectedEpcs, setSelectedEpcs] = useState<string[]>([]);
  const [selectedRisques, setSelectedRisques] = useState<string[]>([]);
  const [selectedOutillages, setSelectedOutillages] =
    useState<Record<string, number>>({});
  const [selectedPieces, setSelectedPieces] =
    useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReferences = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          equipementsResponse,
          episResponse,
          risquesResponse,
          outillagesResponse,
          piecesResponse,
        ] = await Promise.all([
          api.get<Equipement[] | PaginatedResponse<Equipement>>(
            "/equipements/",
          ),
          api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>(
            "/epis/",
          ),
          api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>(
            "/risques/",
          ),
          api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>(
            "/outillages/",
          ),
          api.get<Piece[] | PaginatedResponse<Piece>>(
            "/pieces/",
          ),
        ]);

        setEquipements(
          extractResults<Equipement>(equipementsResponse.data).filter(
            (item) => item.actif !== false,
          ),
        );

        setEpis(extractResults<SimpleRef>(episResponse.data));
        setRisques(extractResults<SimpleRef>(risquesResponse.data));
        setOutillages(extractResults<SimpleRef>(outillagesResponse.data));
        setPieces(extractResults<Piece>(piecesResponse.data));

        const optionalResponses = await Promise.allSettled([
          api.get<SimpleRef[]>("/v2/epcs/"),
          api.get<RefValue[]>(
            "/v2/referentiels/?categorie=type_maintenance",
          ),
          api.get<RefValue[]>(
            "/v2/referentiels/?categorie=periodicite",
          ),
          api.get<RefValue[]>(
            "/v2/referentiels/?categorie=type_arret",
          ),
          api.get<RefValue[]>(
            "/v2/referentiels/?categorie=corps_metier",
          ),
          api.get<RefValue[]>(
            "/v2/referentiels/?categorie=type_redaction",
          ),
        ]);

        if (optionalResponses[0].status === "fulfilled") {
          setEpcs(optionalResponses[0].value.data);
        }

        if (optionalResponses[1].status === "fulfilled") {
          setMaintenanceTypes(
            normalizeReferenceValues(
              optionalResponses[1].value.data,
              fallbackMaintenance,
            ),
          );
        }

        if (optionalResponses[2].status === "fulfilled") {
          const values = normalizeReferenceValues(
            optionalResponses[2].value.data,
            fallbackPeriodicites,
          );

          setPeriodicites(
            values.map((item) => ({
              ...item,
              code: item.libelle,
            })),
          );
        }

        if (optionalResponses[3].status === "fulfilled") {
          setTypesArret(
            normalizeReferenceValues(
              optionalResponses[3].value.data,
              fallbackArrets,
            ),
          );
        }

        if (optionalResponses[4].status === "fulfilled") {
          setCorpsMetiers(
            normalizeReferenceValues(
              optionalResponses[4].value.data,
              [],
            ),
          );
        }

        if (optionalResponses[5].status === "fulfilled") {
          setTypesRedaction(
            normalizeReferenceValues(
              optionalResponses[5].value.data,
              [],
            ),
          );
        }
      } catch (err) {
        console.error(err);
        setError(
          "Impossible de charger les référentiels nécessaires.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadReferences();
  }, []);

  const selectedEquipment = useMemo(
    () =>
      equipements.find(
        (item) => item.id === form.equipement,
      ) ?? null,
    [equipements, form.equipement],
  );

  const updateForm = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleId = (
    id: string,
    setter: Dispatch<
      SetStateAction<string[]>
    >,
  ) => {
    setter((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleQuantity = (
    id: string,
    setter: Dispatch<
      SetStateAction<Record<string, number>>
    >,
  ) => {
    setter((current) => {
      if (current[id]) {
        const next = { ...current };
        delete next[id];
        return next;
      }

      return {
        ...current,
        [id]: 1,
      };
    });
  };

  const updateQuantity = (
    id: string,
    quantity: number,
    setter: Dispatch<
      SetStateAction<Record<string, number>>
    >,
  ) => {
    setter((current) => ({
      ...current,
      [id]: Math.max(1, Number(quantity) || 1),
    }));
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Le fichier sélectionné doit être une image.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 3 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateForm("image_url", String(reader.result ?? ""));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const validateCurrentStep = () => {
    setError("");

    if (
      currentStep === 0 &&
      (
        !form.code.trim() ||
        !form.designation.trim() ||
        !form.equipement ||
        !form.corps_metier ||
        !form.type_redaction
      )
    ) {
      setError(
        "Le code, l'intitulé, le corps de métier, le type de rédaction et l'équipement sont obligatoires.",
      );
      return false;
    }

    if (
      currentStep === 1 &&
      (
        !form.type_maintenance ||
        !form.periodicite ||
        form.main_oeuvre < 1 ||
        !form.type_arret
      )
    ) {
      setError(
        "Renseignez le type de maintenance, la périodicité, la main-d'œuvre et le type d'arrêt.",
      );
      return false;
    }

    return true;
  };

  const next = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setCurrentStep((step) =>
      Math.min(step + 1, wizardSteps.length - 1),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const previous = () => {
    setError("");

    setCurrentStep((step) =>
      Math.max(step - 1, 0),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const save = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      currentStep !== wizardSteps.length - 1
    ) {
      next();
      return;
    }

    if (
      !form.code.trim() ||
      !form.designation.trim() ||
      !form.equipement ||
      !form.corps_metier ||
      !form.type_redaction
    ) {
      setError(
        "Le code, l'intitulé, le corps de métier, le type de rédaction et l'équipement sont obligatoires.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const gammeResponse = await api.post(
        "/gammes/",
        {
          code: form.code.trim(),
          designation: form.designation.trim(),
          abreviation:
            form.abreviation.trim() || null,
          equipement: form.equipement,
          description: null,
          actif: true,
        },
      );

      const gammeId = String(
        gammeResponse.data.id,
      );

      await api.patch(
        `/v2/gammes/${gammeId}/metadata/`,
        {
          corps_metier: form.corps_metier,
          type_redaction: form.type_redaction,
          image_url: form.image_url || null,
        },
      );

      const versionsResponse = await api.get<
        GammeVersion[] |
        PaginatedResponse<GammeVersion>
      >(
        `/gammes/${gammeId}/versions/`,
      );

      const version = extractResults<GammeVersion>(
        versionsResponse.data,
      )
        .slice()
        .sort(
          (a, b) =>
            Number(b.numero_version ?? 0) -
            Number(a.numero_version ?? 0),
        )[0];

      if (!version) {
        throw new Error(
          "La version V0 n'a pas été créée.",
        );
      }

      await api.patch(
        `/versions/${version.id}/`,
        {
          type_maintenance:
            form.type_maintenance,
          periodicite:
            form.periodicite,
          main_oeuvre:
            form.main_oeuvre,
          modifications:
            form.modifications.trim(),
          arret:
            form.type_arret !== "aucun",
        },
      );

      try {
        await api.patch(
          `/v2/versions/${version.id}/metadata/`,
          {
            type_arret:
              form.type_arret,
          },
        );
      } catch (metadataError) {
        console.warn(
          "Métadonnées V2 non disponibles.",
          metadataError,
        );
      }

      await Promise.all(
        selectedEpis.map((epi) =>
          api.post(
            "/version-epis/",
            {
              version: version.id,
              epi,
            },
          ),
        ),
      );

      await Promise.all(
        selectedRisques.map((risque) =>
          api.post(
            "/version-risques/",
            {
              version: version.id,
              risque,
            },
          ),
        ),
      );

      await Promise.all(
        Object.entries(
          selectedOutillages,
        ).map(
          ([outillage, quantite]) =>
            api.post(
              "/version-outillages/",
              {
                version: version.id,
                outillage,
                quantite,
              },
            ),
        ),
      );

      await Promise.all(
        Object.entries(
          selectedPieces,
        ).map(
          ([piece, quantite]) =>
            api.post(
              "/version-pieces/",
              {
                version: version.id,
                piece,
                quantite,
              },
            ),
        ),
      );

      if (selectedEpcs.length > 0) {
        try {
          await Promise.all(
            selectedEpcs.map((epc) =>
              api.post(
                "/v2/version-epcs/",
                {
                  version: version.id,
                  epc,
                },
              ),
            ),
          );
        } catch (epcError) {
          console.warn(
            "Association EPC non disponible.",
            epcError,
          );
        }
      }

      navigate(
        `/gammes/${gammeId}`,
      );
    } catch (err: any) {
      console.error(err);

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.code?.[0] ||
        err?.message;

      setError(
        typeof detail === "string"
          ? detail
          : "Impossible de créer la gamme.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <LoaderCircle
          className="spin"
          size={28}
        />
        <span>
          Chargement des référentiels...
        </span>
      </div>
    );
  }

  return (
    <form
      className="gamme-create-page"
      onSubmit={save}
    >
      <div className="page-header">
        <div>
          <p className="page-kicker">
            Gammes opératoires
          </p>

          <h1>
            Créer une gamme
          </h1>

          <p>
            Création d'une nouvelle gamme
            avec référentiels Supabase.
          </p>
        </div>
      </div>

      <div className="wizard-progress">
        {wizardSteps.map(
          (label, index) => (
            <button
              key={label}
              type="button"
              className={
                index === currentStep
                  ? "wizard-step active"
                  : index < currentStep
                    ? "wizard-step done"
                    : "wizard-step"
              }
              onClick={() => {
                if (
                  index <= currentStep
                ) {
                  setCurrentStep(index);
                  setError("");
                }
              }}
            >
              <span>
                {index < currentStep ? (
                  <Check size={15} />
                ) : (
                  index + 1
                )}
              </span>

              {label}
            </button>
          ),
        )}
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <section className="wizard-card">
        {currentStep === 0 && (
          <>
            <div className="section-heading">
              <h2>
                Informations générales
              </h2>

              <p>
                Identifiez la gamme et
                l'équipement concerné.
              </p>
            </div>

            <div className="form-grid">
              <label>
                <span>
                  Code gamme *
                </span>

                <input
                  value={form.code}
                  onChange={(event) =>
                    updateForm(
                      "code",
                      event.target.value
                        .toUpperCase(),
                    )
                  }
                  placeholder="Ex. GAM-001"
                />
              </label>

              <label>
                <span>
                  Abréviation
                </span>

                <input
                  value={
                    form.abreviation
                  }
                  onChange={(event) =>
                    updateForm(
                      "abreviation",
                      event.target.value
                        .toUpperCase(),
                    )
                  }
                  placeholder="Ex. MP-CONV"
                />
              </label>

              <label className="form-span-2">
                <span>
                  Intitulé de l'opération *
                </span>

                <input
                  value={
                    form.designation
                  }
                  onChange={(event) =>
                    updateForm(
                      "designation",
                      event.target.value,
                    )
                  }
                  placeholder="Ex. Contrôle mensuel du convoyeur"
                />
              </label>

              <label className="form-span-2">
                <span>
                  Équipement *
                </span>

                <select
                  value={
                    form.equipement
                  }
                  onChange={(event) =>
                    updateForm(
                      "equipement",
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
                        key={
                          equipement.id
                        }
                        value={
                          equipement.id
                        }
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

              {selectedEquipment && (
                <div className="equipment-summary form-span-2">
                  <div>
                    <span>
                      Constructeur
                    </span>
                    <strong>
                      {selectedEquipment.constructeur ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Référence machine
                    </span>
                    <strong>
                      {selectedEquipment.reference ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Type machine
                    </span>
                    <strong>
                      {selectedEquipment.type ||
                        "—"}
                    </strong>
                  </div>
                </div>
              )}

              <label>
                <span>
                  Corps de métier *
                </span>

                <select
                  value={form.corps_metier}
                  onChange={(event) =>
                    updateForm(
                      "corps_metier",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner un corps de métier
                  </option>
                  {corpsMetiers.map((item) => (
                    <option key={item.code} value={item.code}>
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
                  value={form.type_redaction}
                  onChange={(event) =>
                    updateForm(
                      "type_redaction",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sélectionner un type de rédaction
                  </option>
                  {typesRedaction.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-span-2 gamme-image-field">
                <span className="field-label">Image de la gamme</span>

                {form.image_url ? (
                  <div className="gamme-image-preview">
                    <img src={form.image_url} alt="Aperçu de la gamme" />
                    <div className="gamme-image-buttons">
                      <label className="image-button">
                        Remplacer
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleImageChange(event.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="image-button danger"
                        onClick={() => updateForm("image_url", "")}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="gamme-image-dropzone">
                    <strong>Ajouter une image</strong>
                    <span>PNG, JPG ou WEBP — maximum 3 Mo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleImageChange(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="section-heading">
              <h2>
                Paramètres de maintenance
              </h2>

              <p>
                Les valeurs des listes
                proviennent des référentiels.
              </p>
            </div>

            <div className="form-grid">
              <label>
                <span>
                  Type de maintenance *
                </span>

                <select
                  value={
                    form.type_maintenance
                  }
                  onChange={(event) =>
                    updateForm(
                      "type_maintenance",
                      event.target.value,
                    )
                  }
                >
                  {maintenanceTypes.map(
                    (item) => (
                      <option
                        key={
                          item.code
                        }
                        value={
                          item.code
                        }
                      >
                        {item.libelle}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Périodicité *
                </span>

                <select
                  value={
                    form.periodicite
                  }
                  onChange={(event) =>
                    updateForm(
                      "periodicite",
                      event.target.value,
                    )
                  }
                >
                  {periodicites.map(
                    (item) => (
                      <option
                        key={
                          item.code
                        }
                        value={
                          item.code
                        }
                      >
                        {item.libelle}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Main-d'œuvre *
                </span>

                <input
                  type="number"
                  min={1}
                  value={
                    form.main_oeuvre
                  }
                  onChange={(event) =>
                    updateForm(
                      "main_oeuvre",
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
                  value={
                    form.type_arret
                  }
                  onChange={(event) =>
                    updateForm(
                      "type_arret",
                      event.target.value,
                    )
                  }
                >
                  {typesArret.map(
                    (item) => (
                      <option
                        key={
                          item.code
                        }
                        value={
                          item.code
                        }
                      >
                        {item.libelle}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="form-span-2">
                <span>
                  Modifications
                </span>

                <textarea
                  value={
                    form.modifications
                  }
                  onChange={(event) =>
                    updateForm(
                      "modifications",
                      event.target.value,
                    )
                  }
                  rows={3}
                />
              </label>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="section-heading">
              <h2>
                Sécurité
              </h2>

              <p>
                Sélectionnez les EPI, EPC
                et risques applicables.
              </p>
            </div>

            <div className="selection-columns">
              <div className="selection-panel">
                <h3>
                  EPI
                </h3>

                {epis.length === 0 ? (
                  <p className="empty-selection">
                    Aucun EPI disponible.
                  </p>
                ) : (
                  epis.map((item) => (
                    <label
                      key={item.id}
                      className="selection-row"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedEpis.includes(
                            item.id,
                          )
                        }
                        onChange={() =>
                          toggleId(
                            item.id,
                            setSelectedEpis,
                          )
                        }
                      />

                      <span>
                        {item.nom}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <div className="selection-panel">
                <h3>
                  EPC
                </h3>

                {epcs.length === 0 ? (
                  <p className="empty-selection">
                    Aucun EPC disponible.
                  </p>
                ) : (
                  epcs.map((item) => (
                    <label
                      key={item.id}
                      className="selection-row"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedEpcs.includes(
                            item.id,
                          )
                        }
                        onChange={() =>
                          toggleId(
                            item.id,
                            setSelectedEpcs,
                          )
                        }
                      />

                      <span>
                        {item.nom}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <div className="selection-panel">
                <h3>
                  Risques
                </h3>

                {risques.length === 0 ? (
                  <p className="empty-selection">
                    Aucun risque disponible.
                  </p>
                ) : (
                  risques.map((item) => (
                    <label
                      key={item.id}
                      className="selection-row"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedRisques.includes(
                            item.id,
                          )
                        }
                        onChange={() =>
                          toggleId(
                            item.id,
                            setSelectedRisques,
                          )
                        }
                      />

                      <span>
                        {item.nom}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div className="section-heading">
              <h2>
                Moyens
              </h2>

              <p>
                Sélectionnez les outillages
                et pièces nécessaires.
              </p>
            </div>

            <div className="selection-columns">
              <div className="selection-panel">
                <h3>
                  Outillages
                </h3>

                {outillages.length === 0 ? (
                  <p className="empty-selection">
                    Aucun outillage disponible.
                  </p>
                ) : (
                  outillages.map((item) => {
                    const selected =
                      selectedOutillages[
                        item.id
                      ];

                    return (
                      <div
                        key={item.id}
                        className="quantity-row"
                      >
                        <label className="selection-row">
                          <input
                            type="checkbox"
                            checked={
                              Boolean(
                                selected,
                              )
                            }
                            onChange={() =>
                              toggleQuantity(
                                item.id,
                                setSelectedOutillages,
                              )
                            }
                          />

                          <span>
                            {item.nom}
                          </span>
                        </label>

                        {selected && (
                          <input
                            className="quantity-input"
                            type="number"
                            min={1}
                            value={
                              selected
                            }
                            onChange={(event) =>
                              updateQuantity(
                                item.id,
                                Number(
                                  event.target.value,
                                ),
                                setSelectedOutillages,
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="selection-panel">
                <h3>
                  Pièces de rechange
                </h3>

                {pieces.length === 0 ? (
                  <p className="empty-selection">
                    Aucune pièce disponible.
                  </p>
                ) : (
                  pieces.map((item) => {
                    const selected =
                      selectedPieces[
                        item.id
                      ];

                    return (
                      <div
                        key={item.id}
                        className="quantity-row"
                      >
                        <label className="selection-row">
                          <input
                            type="checkbox"
                            checked={
                              Boolean(
                                selected,
                              )
                            }
                            onChange={() =>
                              toggleQuantity(
                                item.id,
                                setSelectedPieces,
                              )
                            }
                          />

                          <span>
                            {item.code
                              ? `${item.code} — `
                              : ""}
                            {item.nom}
                            {item.reference
                              ? ` (${item.reference})`
                              : ""}
                          </span>
                        </label>

                        {selected && (
                          <input
                            className="quantity-input"
                            type="number"
                            min={1}
                            value={
                              selected
                            }
                            onChange={(event) =>
                              updateQuantity(
                                item.id,
                                Number(
                                  event.target.value,
                                ),
                                setSelectedPieces,
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div className="section-heading">
              <h2>
                Vérification
              </h2>

              <p>
                Contrôlez les informations
                avant la création de la gamme.
              </p>
            </div>

            <div className="review-grid">
              <div>
                <span>
                  Code
                </span>
                <strong>
                  {form.code || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Intitulé
                </span>
                <strong>
                  {form.designation || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Équipement
                </span>
                <strong>
                  {selectedEquipment?.nom ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Type maintenance
                </span>
                <strong>
                  {maintenanceTypes.find(
                    (item) =>
                      item.code ===
                      form.type_maintenance,
                  )?.libelle || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Périodicité
                </span>
                <strong>
                  {form.periodicite ||
                    "—"}
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
                      form.type_arret,
                  )?.libelle || "—"}
                </strong>
              </div>

              <div>
                <span>
                  EPI
                </span>
                <strong>
                  {selectedEpis.length}
                </strong>
              </div>

              <div>
                <span>
                  EPC
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
                  {
                    Object.keys(
                      selectedOutillages,
                    ).length
                  }
                </strong>
              </div>

              <div>
                <span>
                  Pièces
                </span>
                <strong>
                  {
                    Object.keys(
                      selectedPieces,
                    ).length
                  }
                </strong>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="wizard-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={
            currentStep === 0 ||
            saving
          }
          onClick={previous}
        >
          <ArrowLeft size={17} />
          Précédent
        </button>

        {currentStep <
        wizardSteps.length - 1 ? (
          <button
            type="button"
            className="primary-button"
            disabled={saving}
            onClick={next}
          >
            Suivant
            <ArrowRight size={17} />
          </button>
        ) : (
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle
                className="spin"
                size={17}
              />
            ) : (
              <Save size={17} />
            )}

            Créer la gamme
          </button>
        )}
      </div>
    </form>
  );
}
