import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";
import {
  extractResults,
} from "./types";
import type {
  Equipement,
  GammeVersion,
  PaginatedResponse,
} from "./types";

import "./GammeCreate.css";

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
};

type Profile = {
  id: string;
  nom: string;
  prenom?: string | null;
  poste?: string | null;
  metier?: string | null;
  domaine?: string | null;
};

type ImageDraft = {
  key: string;
  name: string;
  dataUrl: string;
  description: string;
};

type StepDraft = {
  key: string;
  titre: string;
  description: string;
  duree_minutes: number;
  actions: string[];
  images: ImageDraft[];
};

type DocumentDraft = {
  key: string;
  titre: string;
  reference: string;
  description: string;
  fichier_url: string;
};

type RecommendationDraft = {
  key: string;
  titre: string;
  contenu: string;
};

type FormState = {
  code: string;
  intitule: string;
  abreviation: string;
  equipement: string;
  description: string;
  type_maintenance: string;
  periodicite: string;
  main_oeuvre: number;
  type_arret: string;
  modifications: string;
  redacteur_profile: string;
  valideur_profile: string;
};

const makeKey = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const fallbackMaintenance: RefValue[] = [
  { code: "preventif", libelle: "Préventive" },
  { code: "correctif", libelle: "Corrective" },
  { code: "amelioratif", libelle: "Améliorative" },
  { code: "conditionnel", libelle: "Conditionnelle" },
  { code: "predictif", libelle: "Prédictive" },
];

const fallbackPeriodicity: RefValue[] = [
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

const fallbackStops: RefValue[] = [
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
  "Étapes",
  "Documents",
  "Profils",
  "Vérification",
];

const initialForm: FormState = {
  code: "",
  intitule: "",
  abreviation: "",
  equipement: "",
  description: "",
  type_maintenance: "preventif",
  periodicite: "Mensuelle",
  main_oeuvre: 1,
  type_arret: "aucun",
  modifications: "Création initiale de la gamme",
  redacteur_profile: "",
  valideur_profile: "",
};

function profileLabel(profile?: Profile | null) {
  if (!profile) return "";
  const name = [profile.prenom, profile.nom].filter(Boolean).join(" ");
  return profile.poste ? `${name} — ${profile.poste}` : name;
}

async function readImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n'est pas une image.");
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Chaque image doit faire moins de 3 Mo.");
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire l'image."));
    reader.readAsDataURL(file);
  });
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<RefValue[]>(fallbackMaintenance);
  const [periodicities, setPeriodicities] = useState<RefValue[]>(fallbackPeriodicity);
  const [stopTypes, setStopTypes] = useState<RefValue[]>(fallbackStops);
  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [selectedEpcs, setSelectedEpcs] = useState<string[]>([]);
  const [selectedRisques, setSelectedRisques] = useState<string[]>([]);
  const [selectedOutillages, setSelectedOutillages] = useState<Record<string, number>>({});
  const [selectedPieces, setSelectedPieces] = useState<Record<string, number>>({});
  const [steps, setSteps] = useState<StepDraft[]>([
    {
      key: makeKey(),
      titre: "",
      description: "",
      duree_minutes: 0,
      actions: [""],
      images: [],
    },
  ]);
  const [documents, setDocuments] = useState<DocumentDraft[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [eq, ep, ri, ou, pi] = await Promise.all([
          api.get<Equipement[] | PaginatedResponse<Equipement>>("/equipements/"),
          api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/epis/"),
          api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/risques/"),
          api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/outillages/"),
          api.get<Piece[] | PaginatedResponse<Piece>>("/pieces/"),
        ]);
        setEquipements(extractResults(eq.data).filter((item) => item.actif !== false));
        setEpis(extractResults(ep.data));
        setRisques(extractResults(ri.data));
        setOutillages(extractResults(ou.data));
        setPieces(extractResults(pi.data));

        const optional = await Promise.allSettled([
          api.get<SimpleRef[]>("/v2/epcs/"),
          api.get<Profile[]>("/v2/profils-maintenance/"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=type_maintenance"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=periodicite"),
          api.get<RefValue[]>("/v2/referentiels/?categorie=type_arret"),
        ]);
        if (optional[0].status === "fulfilled") setEpcs(optional[0].value.data);
        if (optional[1].status === "fulfilled") setProfiles(optional[1].value.data);
        if (optional[2].status === "fulfilled" && optional[2].value.data.length) setMaintenanceTypes(optional[2].value.data);
        if (optional[3].status === "fulfilled" && optional[3].value.data.length) {
          setPeriodicities(optional[3].value.data.map((x) => ({ ...x, code: x.libelle })));
        }
        if (optional[4].status === "fulfilled" && optional[4].value.data.length) setStopTypes(optional[4].value.data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les référentiels nécessaires.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const selectedEquipment = useMemo(
    () => equipements.find((item) => item.id === form.equipement) ?? null,
    [equipements, form.equipement],
  );

  const totalDuration = useMemo(
    () => steps.reduce((sum, item) => sum + Number(item.duree_minutes || 0), 0),
    [steps],
  );

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleId = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const toggleQuantity = (id: string, setter: React.Dispatch<React.SetStateAction<Record<string, number>>>) => {
    setter((current) => {
      if (current[id]) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: 1 };
    });
  };

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setSteps((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const updateAction = (stepIndex: number, actionIndex: number, value: string) => {
    setSteps((current) => current.map((step, i) => i !== stepIndex ? step : {
      ...step,
      actions: step.actions.map((action, j) => j === actionIndex ? value : action),
    }));
  };

  const addImages = async (stepIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    try {
      const files = Array.from(event.target.files || []);
      const drafts = await Promise.all(files.map(async (file) => ({
        key: makeKey(),
        name: file.name,
        dataUrl: await readImage(file),
        description: file.name,
      })));
      setSteps((current) => current.map((step, i) => i === stepIndex ? {
        ...step,
        images: [...step.images, ...drafts],
      } : step));
      event.target.value = "";
    } catch (err: any) {
      setError(err?.message || "Impossible d'ajouter l'image.");
    }
  };

  const validateCurrentStep = () => {
    if (currentStep === 0 && (!form.code.trim() || !form.intitule.trim() || !form.equipement)) {
      setError("Le code, l'intitulé et l'équipement sont obligatoires.");
      return false;
    }
    if (currentStep === 1 && (!form.type_maintenance || !form.periodicite || form.main_oeuvre < 1)) {
      setError("Renseignez le type de maintenance, la périodicité et la main-d'œuvre.");
      return false;
    }
    if (currentStep === 2 && (selectedEpis.length === 0 || selectedRisques.length === 0)) {
      setError("Sélectionnez au moins un EPI et un risque.");
      return false;
    }
    if (currentStep === 4) {
      const valid = steps.filter((step) => step.titre.trim());
      if (!valid.length) {
        setError("Ajoutez au moins une étape.");
        return false;
      }
      if (valid.some((step) => !step.actions.some((action) => action.trim()))) {
        setError("Chaque étape doit contenir au moins une action.");
        return false;
      }
    }
    setError("");
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
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    try {
      setSaving(true);
      setError("");

      const gammeResponse = await api.post("/gammes/", {
        code: form.code.trim(),
        designation: form.intitule.trim(),
        abreviation: form.abreviation.trim() || null,
        equipement: form.equipement,
        description: form.description.trim() || null,
        actif: true,
      });

      const gammeId = String(gammeResponse.data.id);
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
        modifications: form.modifications,
        arret: form.type_arret !== "aucun",
      });

      const redacteur = profileLabel(profiles.find((x) => x.id === form.redacteur_profile));
      const valideur = profileLabel(profiles.find((x) => x.id === form.valideur_profile));
      try {
        await api.patch(`/v2/versions/${version.id}/metadata/`, {
          type_arret: form.type_arret,
          redacteur: redacteur || undefined,
          valideur: valideur || undefined,
        });
      } catch (metadataError) {
        console.warn("Métadonnées V2 non disponibles", metadataError);
      }

      await Promise.all(selectedEpis.map((epi) => api.post("/version-epis/", { version: version.id, epi })));
      await Promise.all(selectedRisques.map((risque) => api.post("/version-risques/", { version: version.id, risque })));
      await Promise.all(Object.entries(selectedOutillages).map(([outillage, quantite]) => api.post("/version-outillages/", { version: version.id, outillage, quantite })));
      await Promise.all(Object.entries(selectedPieces).map(([piece, quantite]) => api.post("/version-pieces/", { version: version.id, piece, quantite })));
      await Promise.all(selectedEpcs.map((epc) => api.post("/v2/version-epcs/", { version: version.id, epc })));

      const validSteps = steps.filter((step) => step.titre.trim());
      for (let i = 0; i < validSteps.length; i += 1) {
        const step = validSteps[i];
        const response = await api.post("/etapes/", {
          version: version.id,
          numero: i + 1,
          ordre: i + 1,
          titre: step.titre.trim(),
          description: step.description.trim() || null,
          duree_minutes: Number(step.duree_minutes || 0),
        });
        const stepId = String(response.data.id);
        const actions = step.actions.filter((action) => action.trim());
        for (let j = 0; j < actions.length; j += 1) {
          await api.post("/actions/", { etape: stepId, ordre: j + 1, contenu: actions[j].trim() });
        }
        for (let j = 0; j < step.images.length; j += 1) {
          await api.post("/images-etapes/", {
            etape: stepId,
            ordre: j + 1,
            image_url: step.images[j].dataUrl,
            description: step.images[j].description || step.images[j].name,
          });
        }
      }

      for (const doc of documents.filter((item) => item.titre.trim())) {
        await api.post("/documents/", {
          version: version.id,
          titre: doc.titre.trim(),
          reference: doc.reference.trim() || null,
          description: doc.description.trim() || null,
          fichier_url: doc.fichier_url.trim() || null,
        });
      }
      for (const rec of recommendations.filter((item) => item.contenu.trim())) {
        await api.post("/recommandations/", {
          version: version.id,
          titre: rec.titre.trim() || "Recommandation",
          contenu: rec.contenu.trim(),
        });
      }

      await api.post(`/versions/${version.id}/recalculate/`, {});
      navigate(`/gammes/${gammeId}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || err?.message || "La création de la gamme a échoué.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="module-loading"><div className="module-spinner"/><strong>Chargement du wizard...</strong></div>;
  }

  const renderChoices = (
    items: SimpleRef[],
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    fallback: string,
  ) => (
    <div className="choice-list">
      {items.map((item) => (
        <label key={item.id} className={`choice-card ${selected.includes(item.id) ? "selected" : ""}`}>
          <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleId(item.id, setter)}/>
          <div><strong>{item.nom}</strong><span>{item.description || fallback}</span></div>
        </label>
      ))}
    </div>
  );

  return (
    <form className="create-page" onSubmit={save}>
      <header className="create-header">
        <div>
          <button type="button" className="back-link" onClick={() => navigate("/gammes")}><ArrowLeft size={18}/> Retour aux gammes</button>
          <span className="create-kicker">Assistant de création V2</span>
          <h1>Nouvelle gamme opératoire</h1>
          <p>Création guidée, référentiels, sécurité, étapes, actions, photos et version V0.</p>
        </div>
        <div className="create-summary-chip"><ClipboardList size={20}/><div><span>Étape</span><strong>{currentStep + 1}/{wizardSteps.length}</strong></div></div>
      </header>

      <div className="wizard-track">
        {wizardSteps.map((label, index) => (
          <button type="button" key={label} className={`wizard-node ${index === currentStep ? "active" : ""} ${index < currentStep ? "done" : ""}`} onClick={() => index < currentStep && setCurrentStep(index)}>
            <span>{index < currentStep ? <Check size={16}/> : index + 1}</span><small>{label}</small>
          </button>
        ))}
      </div>

      {error && <div className="module-error">{error}</div>}

      <section className="wizard-card">
        {currentStep === 0 && (
          <div className="wizard-section">
            <div className="section-heading"><h2>Informations générales</h2><p>Identification de la gamme et machine concernée.</p></div>
            <div className="wizard-grid">
              <label><span>Code gamme *</span><input value={form.code} onChange={(e) => updateForm("code", e.target.value.toUpperCase())} placeholder="Ex. HP_TRI_FIV_001"/></label>
              <label><span>Abréviation</span><input value={form.abreviation} onChange={(e) => updateForm("abreviation", e.target.value.toUpperCase())}/></label>
              <label className="wide"><span>Intitulé de l'opération *</span><input value={form.intitule} onChange={(e) => updateForm("intitule", e.target.value)} placeholder="Ex. Vérification préventive du convoyeur"/></label>
              <label className="wide"><span>Équipement *</span><select value={form.equipement} onChange={(e) => updateForm("equipement", e.target.value)}><option value="">Sélectionner...</option>{equipements.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.nom}</option>)}</select></label>
              {selectedEquipment && <div className="equipment-meta-grid">
                <div className="equipment-meta-card"><span>Constructeur</span><strong>{selectedEquipment.constructeur || "Non renseigné"}</strong></div>
                <div className="equipment-meta-card"><span>Référence machine</span><strong>{selectedEquipment.reference || "Non renseignée"}</strong></div>
                <div className="equipment-meta-card"><span>Type machine</span><strong>{selectedEquipment.type || "Non renseigné"}</strong></div>
              </div>}
              <label className="wide"><span>Description / objectif</span><textarea rows={5} value={form.description} onChange={(e) => updateForm("description", e.target.value)}/></label>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="wizard-section">
            <div className="section-heading"><h2>Paramètres de maintenance</h2><p>Les champs non utiles Référentiel, Rapport, Production et Mode dégradé ont été retirés de l'interface.</p></div>
            <div className="wizard-grid">
              <label><span>Type de maintenance *</span><select value={form.type_maintenance} onChange={(e) => updateForm("type_maintenance", e.target.value)}>{maintenanceTypes.map((item) => <option key={item.code} value={item.code}>{item.libelle}</option>)}</select></label>
              <label><span>Périodicité *</span><select value={form.periodicite} onChange={(e) => updateForm("periodicite", e.target.value)}>{periodicities.map((item) => <option key={item.code} value={item.code}>{item.libelle}</option>)}</select></label>
              <label><span>Main-d'œuvre *</span><input type="number" min="1" value={form.main_oeuvre} onChange={(e) => updateForm("main_oeuvre", Number(e.target.value))}/></label>
              <label><span>Type d'arrêt *</span><select value={form.type_arret} onChange={(e) => updateForm("type_arret", e.target.value)}>{stopTypes.map((item) => <option key={item.code} value={item.code}>{item.libelle}</option>)}</select></label>
              <label className="wide"><span>Objet / modification</span><select value={form.modifications} onChange={(e) => updateForm("modifications", e.target.value)}><option>Création initiale de la gamme</option><option>Mise à jour du mode opératoire</option><option>Modification sécurité</option><option>Modification équipement</option><option>Optimisation maintenance</option></select></label>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="wizard-section">
            <div className="two-columns">
              <div><div className="section-heading"><h2><ShieldCheck size={20}/> EPI *</h2><p>Protection individuelle.</p></div>{renderChoices(epis, selectedEpis, setSelectedEpis, "Équipement de protection individuelle")}</div>
              <div><div className="section-heading"><h2>Risques *</h2><p>Risques associés à l'intervention.</p></div>{renderChoices(risques, selectedRisques, setSelectedRisques, "Risque maintenance")}</div>
            </div>
            <div className="section-heading"><h2>EPC</h2><p>Équipements de protection collective.</p></div>
            {epcs.length ? renderChoices(epcs, selectedEpcs, setSelectedEpcs, "Équipement de protection collective") : <div className="v2-note">Aucun EPC disponible. Exécutez le script SQL V2 dans Supabase pour activer ce référentiel.</div>}
          </div>
        )}

        {currentStep === 3 && (
          <div className="wizard-section two-columns">
            <div><div className="section-heading"><h2><Wrench size={20}/> Outillages</h2></div><div className="choice-list">{outillages.map((item) => { const selected = Boolean(selectedOutillages[item.id]); return <div key={item.id} className={`choice-card quantity ${selected ? "selected" : ""}`}><label><input type="checkbox" checked={selected} onChange={() => toggleQuantity(item.id, setSelectedOutillages)}/><div><strong>{item.nom}</strong><span>{item.description || "Outillage"}</span></div></label>{selected && <input className="qty" type="number" min="1" value={selectedOutillages[item.id]} onChange={(e) => setSelectedOutillages((cur) => ({ ...cur, [item.id]: Number(e.target.value) }))}/>}</div>})}</div></div>
            <div><div className="section-heading"><h2>Pièces de rechange</h2><p>Nom, référence et quantité.</p></div><div className="choice-list">{pieces.map((item) => { const selected = Boolean(selectedPieces[item.id]); return <div key={item.id} className={`choice-card quantity ${selected ? "selected" : ""}`}><label><input type="checkbox" checked={selected} onChange={() => toggleQuantity(item.id, setSelectedPieces)}/><div><strong>{item.nom}</strong><span>{item.reference || item.code || "Pièce de rechange"}</span></div></label>{selected && <input className="qty" type="number" min="1" value={selectedPieces[item.id]} onChange={(e) => setSelectedPieces((cur) => ({ ...cur, [item.id]: Number(e.target.value) }))}/>}</div>})}</div></div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="wizard-section">
            <div className="section-heading row"><div><h2>Étapes, actions, temps et photos *</h2><p>Durée totale calculée : <strong>{totalDuration} min</strong>.</p></div><button type="button" className="secondary-button" onClick={() => setSteps((cur) => [...cur, { key: makeKey(), titre: "", description: "", duree_minutes: 0, actions: [""], images: [] }])}><Plus size={17}/> Ajouter une étape</button></div>
            <div className="step-editor-list">{steps.map((step, index) => <article className="step-editor" key={step.key}>
              <div className="step-editor-head"><span className="step-index">{index + 1}</span><strong>Étape {index + 1}</strong>{steps.length > 1 && <button type="button" className="danger-icon" onClick={() => setSteps((cur) => cur.filter((_, i) => i !== index))}><Trash2 size={17}/></button>}</div>
              <div className="wizard-grid"><label><span>Titre *</span><input value={step.titre} onChange={(e) => updateStep(index, { titre: e.target.value })}/></label><label><span>Durée (minutes)</span><input type="number" min="0" value={step.duree_minutes} onChange={(e) => updateStep(index, { duree_minutes: Number(e.target.value) })}/></label><label className="wide"><span>Description</span><textarea rows={3} value={step.description} onChange={(e) => updateStep(index, { description: e.target.value })}/></label></div>
              <div className="actions-editor"><div className="actions-title"><strong>Actions obligatoires</strong><button type="button" onClick={() => updateStep(index, { actions: [...step.actions, ""] })}><Plus size={15}/> Action</button></div>{step.actions.map((action, actionIndex) => <div className="action-line" key={`${step.key}-${actionIndex}`}><span>{actionIndex + 1}</span><input value={action} onChange={(e) => updateAction(index, actionIndex, e.target.value)} placeholder="Décrire l'action..."/>{step.actions.length > 1 && <button type="button" onClick={() => updateStep(index, { actions: step.actions.filter((_, i) => i !== actionIndex) })}><Trash2 size={15}/></button>}</div>)}</div>
              <div className="image-editor"><div className="image-editor-head"><strong>Photos de l'étape</strong><label className="image-upload-label"><ImagePlus size={16}/> Upload image<input type="file" accept="image/*" multiple onChange={(event) => void addImages(index, event)}/></label></div>{step.images.length > 0 && <div className="image-preview-grid">{step.images.map((image) => <div className="image-preview-card" key={image.key}><button type="button" onClick={() => updateStep(index, { images: step.images.filter((x) => x.key !== image.key) })}><Trash2 size={14}/></button><img src={image.dataUrl} alt={image.description || image.name}/><input value={image.description} onChange={(e) => updateStep(index, { images: step.images.map((x) => x.key === image.key ? { ...x, description: e.target.value } : x) })}/></div>)}</div>}</div>
            </article>)}</div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="wizard-section two-columns">
            <div><div className="section-heading row"><div><h2>Documents liés</h2></div><button type="button" className="secondary-button" onClick={() => setDocuments((cur) => [...cur, { key: makeKey(), titre: "", reference: "", description: "", fichier_url: "" }])}><Plus size={16}/> Ajouter</button></div>{documents.length === 0 && <div className="empty-box">Aucun document.</div>}{documents.map((doc, index) => <div className="mini-editor" key={doc.key}><button type="button" className="danger-icon" onClick={() => setDocuments((cur) => cur.filter((_, i) => i !== index))}><Trash2 size={16}/></button><input placeholder="Titre" value={doc.titre} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, titre: e.target.value } : d))}/><input placeholder="Référence" value={doc.reference} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, reference: e.target.value } : d))}/><input placeholder="URL / chemin du fichier" value={doc.fichier_url} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, fichier_url: e.target.value } : d))}/><textarea rows={2} placeholder="Description" value={doc.description} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, description: e.target.value } : d))}/></div>)}</div>
            <div><div className="section-heading row"><div><h2>Recommandations</h2></div><button type="button" className="secondary-button" onClick={() => setRecommendations((cur) => [...cur, { key: makeKey(), titre: "", contenu: "" }])}><Plus size={16}/> Ajouter</button></div>{recommendations.length === 0 && <div className="empty-box">Aucune recommandation.</div>}{recommendations.map((rec, index) => <div className="mini-editor" key={rec.key}><button type="button" className="danger-icon" onClick={() => setRecommendations((cur) => cur.filter((_, i) => i !== index))}><Trash2 size={16}/></button><input placeholder="Titre" value={rec.titre} onChange={(e) => setRecommendations((cur) => cur.map((r, i) => i === index ? { ...r, titre: e.target.value } : r))}/><textarea rows={5} placeholder="Recommandation" value={rec.contenu} onChange={(e) => setRecommendations((cur) => cur.map((r, i) => i === index ? { ...r, contenu: e.target.value } : r))}/></div>)}</div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="wizard-section">
            <div className="section-heading"><h2>Profils</h2><p>Rédacteur et valideur issus de la liste des profils maintenance.</p></div>
            <div className="wizard-grid"><label><span>Rédacteur</span><select value={form.redacteur_profile} onChange={(e) => updateForm("redacteur_profile", e.target.value)}><option value="">Utilisateur connecté</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profileLabel(profile)}</option>)}</select></label><label><span>Valideur prévu</span><select value={form.valideur_profile} onChange={(e) => updateForm("valideur_profile", e.target.value)}><option value="">À définir lors de la validation</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profileLabel(profile)}</option>)}</select></label></div>
            {!profiles.length && <div className="v2-note">Aucun profil maintenance n'est encore renseigné. Le wizard conservera l'utilisateur connecté comme rédacteur.</div>}
          </div>
        )}

        {currentStep === 7 && (
          <div className="wizard-section">
            <div className="section-heading"><h2>Vérification avant création</h2><p>La gamme sera créée en V0 / brouillon.</p></div>
            <div className="review-grid">
              <div className="review-card"><span>Code</span><strong>{form.code || "—"}</strong></div>
              <div className="review-card"><span>Intitulé</span><strong>{form.intitule || "—"}</strong></div>
              <div className="review-card"><span>Équipement</span><strong>{selectedEquipment ? `${selectedEquipment.code} — ${selectedEquipment.nom}` : "—"}</strong></div>
              <div className="review-card"><span>Machine</span><strong>{selectedEquipment?.constructeur || "—"} · {selectedEquipment?.reference || "—"}</strong></div>
              <div className="review-card"><span>Maintenance</span><strong>{form.type_maintenance} · {form.periodicite}</strong></div>
              <div className="review-card"><span>Arrêt</span><strong>{stopTypes.find((x) => x.code === form.type_arret)?.libelle || form.type_arret}</strong></div>
              <div className="review-card"><span>Sécurité</span><strong>{selectedEpis.length} EPI · {selectedEpcs.length} EPC · {selectedRisques.length} risques</strong></div>
              <div className="review-card"><span>Procédure</span><strong>{steps.filter((x) => x.titre.trim()).length} étapes · {totalDuration} min · {steps.reduce((s,x) => s+x.images.length,0)} photos</strong></div>
            </div>
            <div className="final-note"><ShieldCheck size={22}/><div><strong>Versioning protégé</strong><p>Après validation, la V0 ne sera plus modifiable directement. Toute évolution passera par clonage en V1, V2, etc.</p></div></div>
          </div>
        )}
      </section>

      <div className="wizard-actions">
        <button type="button" className="secondary-button" onClick={previous} disabled={currentStep === 0 || saving}><ArrowLeft size={17}/> Précédent</button>
        {currentStep < wizardSteps.length - 1 ? <button type="button" className="primary-button" onClick={next}>Suivant <ArrowRight size={17}/></button> : <button type="submit" className="primary-button green" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18}/> : <Save size={18}/>} Créer la gamme V0</button>}
      </div>
    </form>
  );
}
