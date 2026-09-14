import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
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

type PieceLibre = {
  localId: string;
  nom: string;
  reference: string;
  quantite: number;
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

function extractResults<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

function normalizeReferenceValues(values: unknown, fallback: RefValue[]): RefValue[] {
  if (!Array.isArray(values) || values.length === 0) return fallback;

  return (values as RefValue[])
    .filter((item) => item && item.actif !== false)
    .slice()
    .sort((a, b) => Number(a.ordre ?? 0) - Number(b.ordre ?? 0));
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

  const [maintenanceTypes, setMaintenanceTypes] = useState<RefValue[]>(fallbackMaintenance);
  const [periodicites, setPeriodicites] = useState<RefValue[]>(fallbackPeriodicites);
  const [typesArret, setTypesArret] = useState<RefValue[]>(fallbackArrets);
  const [corpsMetiers, setCorpsMetiers] = useState<RefValue[]>([]);
  const [typesRedaction, setTypesRedaction] = useState<RefValue[]>([]);

  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [selectedEpcs, setSelectedEpcs] = useState<string[]>([]);
  const [selectedRisques, setSelectedRisques] = useState<string[]>([]);
  const [selectedOutillages, setSelectedOutillages] = useState<Record<string, number>>({});

  const [piecesLibres, setPiecesLibres] = useState<PieceLibre[]>([]);
  const [pieceDraft, setPieceDraft] = useState({ nom: "", reference: "", quantite: 1 });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReferences = async () => {
      setLoading(true);
      setError("");

      try {
        const [equipementsResponse, episResponse, risquesResponse, outillagesResponse] =
          await Promise.all([
            api.get<Equipement[] | PaginatedResponse<Equipement>>("/equipements/"),
            api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/epis/"),
            api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/risques/"),
            api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/outillages/"),
          ]);

        setEquipements(
          extractResults<Equipement>(equipementsResponse.data).filter(
            (item) => item && item.actif !== false,
          ),
        );
        setEpis(extractResults<SimpleRef>(episResponse.data).filter(Boolean));
        setRisques(extractResults<SimpleRef>(risquesResponse.data).filter(Boolean));
        setOutillages(extractResults<SimpleRef>(outillagesResponse.data).filter(Boolean));

        const optionalResponses = await Promise.allSettled([
          api.get<SimpleRef[]>("/v2/epcs/"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=type_maintenance"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=periodicite"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=type_arret"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=corps_metier"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=type_redaction"),
        ]);

        if (optionalResponses[0].status === "fulfilled") {
          setEpcs(Array.isArray(optionalResponses[0].value.data) ? optionalResponses[0].value.data : []);
        }
        if (optionalResponses[1].status === "fulfilled") {
          setMaintenanceTypes(
            normalizeReferenceValues(optionalResponses[1].value.data, fallbackMaintenance),
          );
        }
        if (optionalResponses[2].status === "fulfilled") {
          const values = normalizeReferenceValues(
            optionalResponses[2].value.data,
            fallbackPeriodicites,
          );
          setPeriodicites(values.map((item) => ({ ...item, code: item.libelle })));
        }
        if (optionalResponses[3].status === "fulfilled") {
          setTypesArret(normalizeReferenceValues(optionalResponses[3].value.data, fallbackArrets));
        }
        if (optionalResponses[4].status === "fulfilled") {
          setCorpsMetiers(normalizeReferenceValues(optionalResponses[4].value.data, []));
        }
        if (optionalResponses[5].status === "fulfilled") {
          setTypesRedaction(normalizeReferenceValues(optionalResponses[5].value.data, []));
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les référentiels nécessaires.");
      } finally {
        setLoading(false);
      }
    };

    void loadReferences();
  }, []);

  const selectedEquipment = useMemo(
    () => equipements.find((item) => item.id === form.equipement) ?? null,
    [equipements, form.equipement],
  );

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleId = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleQuantity = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  ) => {
    setter((current) => {
      if (current[id]) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: 1 };
    });
  };

  const updateQuantity = (
    id: string,
    quantity: number,
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  ) => {
    setter((current) => ({ ...current, [id]: Math.max(1, Number(quantity) || 1) }));
  };

  const addPieceLibre = () => {
    const nom = pieceDraft.nom.trim();
    if (!nom) {
      setError("Le nom de la pièce de rechange est obligatoire.");
      return;
    }

    setPiecesLibres((current) => [
      ...current,
      {
        localId: createLocalId(),
        nom,
        reference: pieceDraft.reference.trim(),
        quantite: Math.max(1, Number(pieceDraft.quantite) || 1),
      },
    ]);
    setPieceDraft({ nom: "", reference: "", quantite: 1 });
    setError("");
  };

  const removePieceLibre = (localId: string) => {
    setPiecesLibres((current) => current.filter((item) => item.localId !== localId));
  };

  const validateCurrentStep = () => {
    setError("");

    if (currentStep === 0 && (!form.code.trim() || !form.designation.trim() || !form.equipement)) {
      setError("Le code, l'intitulé et l'équipement sont obligatoires.");
      return false;
    }

    if (
      currentStep === 1 &&
      (!form.type_maintenance || !form.periodicite || form.main_oeuvre < 1 || !form.type_arret)
    ) {
      setError(
        "Renseignez le type de maintenance, la périodicité, la main-d'œuvre et le type d'arrêt.",
      );
      return false;
    }

    return true;
  };

  const next = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previous = () => {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep !== wizardSteps.length - 1) {
      next();
      return;
    }

    if (!form.code.trim() || !form.designation.trim() || !form.equipement) {
      setError("Le code, l'intitulé et l'équipement sont obligatoires.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const gammeResponse = await api.post("/gammes/", {
        code: form.code.trim(),
        designation: form.designation.trim(),
        abreviation: form.abreviation.trim() || null,
        equipement: form.equipement,
        description: null,
        actif: true,
      });

      const gammeId = String(gammeResponse.data.id);

      try {
        await api.patch(`/v2/gammes/${gammeId}/metadata/`, {
          corps_metier: form.corps_metier || null,
          type_redaction: form.type_redaction || null,
          image_url: form.image_url || null,
        });
      } catch (metadataError) {
        console.warn("Métadonnées gamme V2 non disponibles.", metadataError);
      }

      const versionsResponse = await api.get<GammeVersion[] | PaginatedResponse<GammeVersion>>(
        `/gammes/${gammeId}/versions/`,
      );

      const version = extractResults(versionsResponse.data)
        .slice()
        .sort((a, b) => Number(b.numero_version ?? 0) - Number(a.numero_version ?? 0))[0];

      if (!version) throw new Error("La version V0 n'a pas été créée.");

      await api.patch(`/versions/${version.id}/`, {
        type_maintenance: form.type_maintenance,
        periodicite: form.periodicite,
        main_oeuvre: form.main_oeuvre,
        modifications: form.modifications.trim(),
        arret: form.type_arret !== "aucun",
      });

      try {
        await api.patch(`/v2/versions/${version.id}/metadata/`, { type_arret: form.type_arret });
      } catch (metadataError) {
        console.warn("Métadonnées version V2 non disponibles.", metadataError);
      }

      await Promise.all(
        selectedEpis.map((epi) => api.post("/version-epis/", { version: version.id, epi })),
      );

      await Promise.all(
        selectedRisques.map((risque) =>
          api.post("/version-risques/", { version: version.id, risque }),
        ),
      );

      await Promise.all(
        Object.entries(selectedOutillages).map(([outillage, quantite]) =>
          api.post("/version-outillages/", { version: version.id, outillage, quantite }),
        ),
      );

      for (const piece of piecesLibres) {
        const createdPiece = await api.post("/pieces/", {
          code: null,
          nom: piece.nom,
          reference: piece.reference || null,
          constructeur: null,
          description: null,
          image_url: null,
        });

        await api.post("/version-pieces/", {
          version: version.id,
          piece: createdPiece.data.id,
          quantite: piece.quantite,
        });
      }

      if (selectedEpcs.length > 0) {
        try {
          await Promise.all(
            selectedEpcs.map((epc) =>
              api.post("/v2/version-epcs/", { version: version.id, epc }),
            ),
          );
        } catch (epcError) {
          console.warn("Association EPC non disponible.", epcError);
        }
      }

      navigate(`/gammes/${gammeId}`);
    } catch (err: any) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.code?.[0] ||
        err?.response?.data?.nom?.[0] ||
        err?.message;
      setError(typeof detail === "string" ? detail : "Impossible de créer la gamme.");
    } finally {
      setSaving(false);
    }
  };

  const handleImage = (file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 3 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateForm("image_url", reader.result);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <LoaderCircle className="spin" size={28} />
        <span>Chargement des référentiels...</span>
      </div>
    );
  }

  return (
    <form className="gamme-create-page" onSubmit={save}>
      <div className="page-header">
        <div>
          <p className="page-kicker">Gammes opératoires</p>
          <h1>Créer une gamme</h1>
          <p>Création guidée d'une nouvelle gamme de maintenance.</p>
        </div>
      </div>

      <div className="wizard-progress">
        {wizardSteps.map((label, index) => (
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
              if (index <= currentStep) {
                setCurrentStep(index);
                setError("");
              }
            }}
          >
            <span>{index < currentStep ? <Check size={15} /> : index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      <section className="wizard-card">
        {currentStep === 0 && (
          <>
            <div className="section-heading">
              <h2>Informations générales</h2>
              <p>Identifiez la gamme et l'équipement concerné.</p>
            </div>

            <div className="form-grid">
              <label>
                <span>Code gamme *</span>
                <input
                  value={form.code}
                  onChange={(event) => updateForm("code", event.target.value.toUpperCase())}
                  placeholder="Ex. GAM-001"
                />
              </label>

              <label>
                <span>Abréviation</span>
                <input
                  value={form.abreviation}
                  onChange={(event) =>
                    updateForm("abreviation", event.target.value.toUpperCase())
                  }
                  placeholder="Ex. MP-CONV"
                />
              </label>

              <label className="form-span-2">
                <span>Intitulé de l'opération *</span>
                <input
                  value={form.designation}
                  onChange={(event) => updateForm("designation", event.target.value)}
                  placeholder="Ex. Contrôle mensuel du convoyeur"
                />
              </label>

              <label>
                <span>Corps de métier</span>
                <select
                  value={form.corps_metier}
                  onChange={(event) => updateForm("corps_metier", event.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {corpsMetiers.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Type de rédaction</span>
                <select
                  value={form.type_redaction}
                  onChange={(event) => updateForm("type_redaction", event.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {typesRedaction.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-span-2">
                <span>Équipement *</span>
                <select
                  value={form.equipement}
                  onChange={(event) => updateForm("equipement", event.target.value)}
                >
                  <option value="">Sélectionner un équipement</option>
                  {equipements.map((equipement) => (
                    <option key={equipement.id} value={equipement.id}>
                      {equipement.code ? `${equipement.code} — ` : ""}
                      {equipement.nom}
                    </option>
                  ))}
                </select>
              </label>

              {selectedEquipment && (
                <div className="equipment-summary form-span-2">
                  <div>
                    <span>Constructeur</span>
                    <strong>{selectedEquipment.constructeur || "—"}</strong>
                  </div>
                  <div>
                    <span>Référence machine</span>
                    <strong>{selectedEquipment.reference || "—"}</strong>
                  </div>
                  <div>
                    <span>Type machine</span>
                    <strong>{selectedEquipment.type || "—"}</strong>
                  </div>
                </div>
              )}

              <label className="form-span-2">
                <span>Image de la gamme</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleImage(event.target.files?.[0])}
                />
              </label>

              {form.image_url && (
                <div className="image-preview form-span-2">
                  <img src={form.image_url} alt="Aperçu de la gamme" />
                  <button type="button" onClick={() => updateForm("image_url", "")}>
                    <Trash2 size={16} /> Supprimer l'image
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="section-heading">
              <h2>Paramètres de maintenance</h2>
              <p>Renseignez les paramètres principaux de l'intervention.</p>
            </div>

            <div className="form-grid">
              <label>
                <span>Type de maintenance *</span>
                <select
                  value={form.type_maintenance}
                  onChange={(event) => updateForm("type_maintenance", event.target.value)}
                >
                  {maintenanceTypes.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Périodicité *</span>
                <select
                  value={form.periodicite}
                  onChange={(event) => updateForm("periodicite", event.target.value)}
                >
                  {periodicites.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Main-d'œuvre *</span>
                <input
                  type="number"
                  min={1}
                  value={form.main_oeuvre}
                  onChange={(event) =>
                    updateForm("main_oeuvre", Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </label>

              <label>
                <span>Type d'arrêt *</span>
                <select
                  value={form.type_arret}
                  onChange={(event) => updateForm("type_arret", event.target.value)}
                >
                  {typesArret.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-span-2">
                <span>Modifications</span>
                <textarea
                  value={form.modifications}
                  onChange={(event) => updateForm("modifications", event.target.value)}
                  rows={3}
                />
              </label>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="section-heading">
              <h2>Sécurité</h2>
              <p>Sélectionnez les EPI, EPC et risques applicables.</p>
            </div>

            <div className="selection-columns">
              <SelectionPanel
                title="EPI"
                items={epis}
                selectedIds={selectedEpis}
                onToggle={(id) => toggleId(id, setSelectedEpis)}
              />
              <SelectionPanel
                title="EPC"
                items={epcs}
                selectedIds={selectedEpcs}
                onToggle={(id) => toggleId(id, setSelectedEpcs)}
              />
              <SelectionPanel
                title="Risques"
                items={risques}
                selectedIds={selectedRisques}
                onToggle={(id) => toggleId(id, setSelectedRisques)}
              />
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div className="section-heading">
              <h2>Moyens</h2>
              <p>Sélectionnez les outillages et saisissez directement les pièces de rechange.</p>
            </div>

            <div className="selection-columns means-columns">
              <div className="selection-panel">
                <h3>Outillages</h3>
                {outillages.length === 0 ? (
                  <p className="empty-selection">Aucun outillage disponible.</p>
                ) : (
                  outillages.map((item) => {
                    const selected = selectedOutillages[item.id];
                    return (
                      <div key={item.id} className="quantity-row">
                        <label className="selection-row">
                          <input
                            type="checkbox"
                            checked={Boolean(selected)}
                            onChange={() => toggleQuantity(item.id, setSelectedOutillages)}
                          />
                          <span>{item.nom}</span>
                        </label>
                        {selected ? (
                          <input
                            className="quantity-input"
                            type="number"
                            min={1}
                            value={selected}
                            onChange={(event) =>
                              updateQuantity(
                                item.id,
                                Number(event.target.value),
                                setSelectedOutillages,
                              )
                            }
                          />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="selection-panel piece-panel">
                <h3>Pièces de rechange</h3>
                <p className="panel-help">Champ libre : aucune liste déroulante.</p>

                <div className="piece-entry-grid">
                  <label>
                    <span>Nom de la pièce *</span>
                    <input
                      value={pieceDraft.nom}
                      onChange={(event) =>
                        setPieceDraft((current) => ({ ...current, nom: event.target.value }))
                      }
                      placeholder="Ex. Courroie moteur"
                    />
                  </label>
                  <label>
                    <span>Référence</span>
                    <input
                      value={pieceDraft.reference}
                      onChange={(event) =>
                        setPieceDraft((current) => ({
                          ...current,
                          reference: event.target.value,
                        }))
                      }
                      placeholder="Ex. REF-12345"
                    />
                  </label>
                  <label>
                    <span>Quantité</span>
                    <input
                      type="number"
                      min={1}
                      value={pieceDraft.quantite}
                      onChange={(event) =>
                        setPieceDraft((current) => ({
                          ...current,
                          quantite: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                    />
                  </label>
                  <button type="button" className="add-piece-button" onClick={addPieceLibre}>
                    <Plus size={17} /> Ajouter la pièce
                  </button>
                </div>

                <div className="piece-list">
                  {piecesLibres.length === 0 ? (
                    <p className="empty-selection">Aucune pièce ajoutée.</p>
                  ) : (
                    piecesLibres.map((piece) => (
                      <div className="piece-row" key={piece.localId}>
                        <div>
                          <strong>{piece.nom}</strong>
                          <span>
                            {piece.reference || "Sans référence"} · Qté {piece.quantite}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="danger-icon-button"
                          onClick={() => removePieceLibre(piece.localId)}
                          title="Supprimer la pièce"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div className="section-heading">
              <h2>Vérification</h2>
              <p>Contrôlez les informations avant la création de la gamme.</p>
            </div>

            <div className="review-grid">
              <ReviewItem label="Code" value={form.code || "—"} />
              <ReviewItem label="Intitulé" value={form.designation || "—"} />
              <ReviewItem label="Équipement" value={selectedEquipment?.nom || "—"} />
              <ReviewItem
                label="Type maintenance"
                value={
                  maintenanceTypes.find((item) => item.code === form.type_maintenance)?.libelle ||
                  form.type_maintenance ||
                  "—"
                }
              />
              <ReviewItem label="Périodicité" value={form.periodicite || "—"} />
              <ReviewItem
                label="Type d'arrêt"
                value={
                  typesArret.find((item) => item.code === form.type_arret)?.libelle ||
                  form.type_arret ||
                  "—"
                }
              />
              <ReviewItem label="EPI" value={String(selectedEpis.length)} />
              <ReviewItem label="EPC" value={String(selectedEpcs.length)} />
              <ReviewItem label="Risques" value={String(selectedRisques.length)} />
              <ReviewItem
                label="Outillages"
                value={String(Object.keys(selectedOutillages ?? {}).length)}
              />
              <ReviewItem label="Pièces de rechange" value={String(piecesLibres.length)} />
            </div>
          </>
        )}
      </section>

      <div className="wizard-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={currentStep === 0 || saving}
          onClick={previous}
        >
          <ArrowLeft size={17} /> Précédent
        </button>

        {currentStep < wizardSteps.length - 1 ? (
          <button type="button" className="primary-button" disabled={saving} onClick={next}>
            Suivant <ArrowRight size={17} />
          </button>
        ) : (
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Créer la gamme
          </button>
        )}
      </div>
    </form>
  );
}

function SelectionPanel({
  title,
  items,
  selectedIds,
  onToggle,
}: {
  title: string;
  items: SimpleRef[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  return (
    <div className="selection-panel">
      <h3>{title}</h3>
      {safeItems.length === 0 ? (
        <p className="empty-selection">Aucun élément disponible.</p>
      ) : (
        safeItems.map((item) => (
          <label key={item.id} className="selection-row">
            <input
              type="checkbox"
              checked={safeSelectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            <span>{item.nom || "Sans nom"}</span>
          </label>
        ))
      )}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
