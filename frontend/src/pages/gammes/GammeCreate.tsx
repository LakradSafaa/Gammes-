import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  LoaderCircle,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { extractResults } from "./types";
import type { Equipement, GammeVersion, PaginatedResponse } from "./types";
import "./GammeCreate.css";

type EPI = { id: string; nom: string; description?: string | null };
type Risque = { id: string; nom: string; description?: string | null };
type Outillage = { id: string; nom: string; description?: string | null };
type Piece = { id: string; code?: string | null; nom: string; reference?: string | null };

type StepDraft = {
  key: string;
  titre: string;
  description: string;
  duree_minutes: number;
  actions: string[];
};

type DocumentDraft = { key: string; titre: string; reference: string; description: string; fichier_url: string };
type RecommendationDraft = { key: string; titre: string; contenu: string };

type FormState = {
  code: string;
  designation: string;
  abreviation: string;
  equipement: string;
  description: string;
  type_maintenance: string;
  periodicite: string;
  main_oeuvre: number;
  modifications: string;
  referentiel: boolean;
  rapport: boolean;
  production: boolean;
  arret: boolean;
  degrade: boolean;
};

const initialForm: FormState = {
  code: "",
  designation: "",
  abreviation: "",
  equipement: "",
  description: "",
  type_maintenance: "preventif",
  periodicite: "",
  main_oeuvre: 1,
  modifications: "Création initiale de la gamme",
  referentiel: false,
  rapport: false,
  production: false,
  arret: false,
  degrade: false,
};

const wizardSteps = [
  "Informations",
  "Maintenance",
  "Sécurité",
  "Moyens",
  "Étapes",
  "Documents",
  "Vérification",
];

const makeKey = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function GammeCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [epis, setEpis] = useState<EPI[]>([]);
  const [risques, setRisques] = useState<Risque[]>([]);
  const [outillages, setOutillages] = useState<Outillage[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [selectedRisques, setSelectedRisques] = useState<string[]>([]);
  const [selectedOutillages, setSelectedOutillages] = useState<Record<string, number>>({});
  const [selectedPieces, setSelectedPieces] = useState<Record<string, number>>({});
  const [steps, setSteps] = useState<StepDraft[]>([
    { key: makeKey(), titre: "", description: "", duree_minutes: 0, actions: [""] },
  ]);
  const [documents, setDocuments] = useState<DocumentDraft[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReferences = async () => {
      try {
        setLoading(true);
        const [eq, ep, ri, ou, pi] = await Promise.all([
          api.get<Equipement[] | PaginatedResponse<Equipement>>("/equipements/"),
          api.get<EPI[] | PaginatedResponse<EPI>>("/epis/"),
          api.get<Risque[] | PaginatedResponse<Risque>>("/risques/"),
          api.get<Outillage[] | PaginatedResponse<Outillage>>("/outillages/"),
          api.get<Piece[] | PaginatedResponse<Piece>>("/pieces/"),
        ]);
        setEquipements(extractResults(eq.data).filter((item) => item.actif !== false));
        setEpis(extractResults(ep.data));
        setRisques(extractResults(ri.data));
        setOutillages(extractResults(ou.data));
        setPieces(extractResults(pi.data));
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les référentiels nécessaires au wizard.");
      } finally {
        setLoading(false);
      }
    };
    loadReferences();
  }, []);

  const totalDuration = useMemo(
    () => steps.reduce((sum, item) => sum + Number(item.duree_minutes || 0), 0),
    [steps],
  );

  const selectedEquipment = useMemo(
    () => equipements.find((item) => item.id === form.equipement) ?? null,
    [equipements, form.equipement],
  );

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleId = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
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

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setSteps((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateAction = (stepIndex: number, actionIndex: number, value: string) => {
    setSteps((current) =>
      current.map((step, i) => {
        if (i !== stepIndex) return step;
        return {
          ...step,
          actions: step.actions.map((action, j) => (j === actionIndex ? value : action)),
        };
      }),
    );
  };

  const validateCurrentStep = () => {
    if (currentStep === 0 && (!form.code.trim() || !form.designation.trim() || !form.equipement)) {
      setError("Le code, la désignation et l’équipement sont obligatoires.");
      return false;
    }
    if (currentStep === 1 && (!form.type_maintenance || !form.periodicite.trim() || form.main_oeuvre < 1)) {
      setError("Renseignez le type de maintenance, la périodicité et la main d’œuvre.");
      return false;
    }
    if (currentStep === 2 && (selectedEpis.length === 0 || selectedRisques.length === 0)) {
      setError("Sélectionnez au moins un EPI et un risque.");
      return false;
    }
    if (currentStep === 4) {
      const validSteps = steps.filter((item) => item.titre.trim());
      if (validSteps.length === 0) {
        setError("Ajoutez au moins une étape avec un titre.");
        return false;
      }
      if (validSteps.some((item) => item.actions.filter((action) => action.trim()).length === 0)) {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    try {
      setSaving(true);
      setError("");

      const gammeResponse = await api.post("/gammes/", {
        code: form.code.trim(),
        designation: form.designation.trim(),
        abreviation: form.abreviation.trim() || null,
        equipement: form.equipement,
        description: form.description.trim() || null,
        actif: true,
      });

      const gammeId = gammeResponse.data.id as string;
      const versionsResponse = await api.get<GammeVersion[] | PaginatedResponse<GammeVersion>>(
        `/gammes/${gammeId}/versions/`,
      );
      const createdVersions = extractResults(versionsResponse.data);
      const version = createdVersions
        .slice()
        .sort((a, b) => Number(b.numero_version ?? 0) - Number(a.numero_version ?? 0))[0];

      if (!version) throw new Error("La version V0 n’a pas été créée par le backend.");

      await api.patch(`/versions/${version.id}/`, {
        type_maintenance: form.type_maintenance,
        periodicite: form.periodicite.trim(),
        main_oeuvre: form.main_oeuvre,
        modifications: form.modifications.trim(),
        referentiel: form.referentiel,
        rapport: form.rapport,
        production: form.production,
        arret: form.arret,
        degrade: form.degrade,
      });

      for (const epi of selectedEpis) {
        await api.post("/version-epis/", { version: version.id, epi });
      }
      for (const risque of selectedRisques) {
        await api.post("/version-risques/", { version: version.id, risque });
      }
      for (const [outillage, quantite] of Object.entries(selectedOutillages)) {
        await api.post("/version-outillages/", { version: version.id, outillage, quantite });
      }
      for (const [piece, quantite] of Object.entries(selectedPieces)) {
        await api.post("/version-pieces/", { version: version.id, piece, quantite });
      }

      const validSteps = steps.filter((item) => item.titre.trim());
      for (let i = 0; i < validSteps.length; i += 1) {
        const step = validSteps[i];
        const stepResponse = await api.post("/etapes/", {
          version: version.id,
          numero: i + 1,
          ordre: i + 1,
          titre: step.titre.trim(),
          description: step.description.trim() || null,
          duree_minutes: Number(step.duree_minutes || 0),
        });
        const stepId = stepResponse.data.id as string;
        const actions = step.actions.filter((action) => action.trim());
        for (let j = 0; j < actions.length; j += 1) {
          await api.post("/actions/", {
            etape: stepId,
            ordre: j + 1,
            contenu: actions[j].trim(),
          });
        }
      }

      for (const document of documents.filter((item) => item.titre.trim())) {
        await api.post("/documents/", {
          version: version.id,
          titre: document.titre.trim(),
          reference: document.reference.trim() || null,
          description: document.description.trim() || null,
          fichier_url: document.fichier_url.trim() || null,
        });
      }

      for (const recommendation of recommendations.filter((item) => item.contenu.trim())) {
        await api.post("/recommandations/", {
          version: version.id,
          titre: recommendation.titre.trim() || "Recommandation",
          contenu: recommendation.contenu.trim(),
        });
      }

      await api.post(`/versions/${version.id}/recalculate/`, {});
      navigate(`/gammes/${gammeId}`);
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      setError(detail || "La création de la gamme a échoué. Vérifiez les données puis réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="module-loading"><div className="module-spinner"/><strong>Chargement du wizard...</strong></div>;
  }

  return (
    <form className="create-page" onSubmit={save}>
      <header className="create-header">
        <div>
          <button type="button" className="back-link" onClick={() => navigate("/gammes")}>
            <ArrowLeft size={18}/> Retour aux gammes
          </button>
          <span className="create-kicker">Assistant de création</span>
          <h1>Nouvelle gamme opératoire</h1>
          <p>Créez une gamme complète et sa première version V0 en suivant les étapes.</p>
        </div>
        <div className="create-summary-chip">
          <ClipboardList size={20}/>
          <div><span>Étape</span><strong>{currentStep + 1}/{wizardSteps.length}</strong></div>
        </div>
      </header>

      <div className="wizard-track">
        {wizardSteps.map((label, index) => (
          <button
            type="button"
            key={label}
            className={`wizard-node ${index === currentStep ? "active" : ""} ${index < currentStep ? "done" : ""}`}
            onClick={() => index < currentStep && setCurrentStep(index)}
          >
            <span>{index < currentStep ? <Check size={16}/> : index + 1}</span>
            <small>{label}</small>
          </button>
        ))}
      </div>

      {error && <div className="module-error">{error}</div>}

      <section className="wizard-card">
        {currentStep === 0 && (
          <div className="wizard-section">
            <div className="section-heading"><h2>Informations générales</h2><p>Identification et équipement concerné.</p></div>
            <div className="wizard-grid">
              <label><span>Code gamme *</span><input value={form.code} onChange={(e) => updateForm("code", e.target.value.toUpperCase())} placeholder="Ex. GAM-002"/></label>
              <label><span>Abréviation</span><input value={form.abreviation} onChange={(e) => updateForm("abreviation", e.target.value.toUpperCase())} placeholder="Ex. MP-CONV-002"/></label>
              <label className="wide"><span>Désignation *</span><input value={form.designation} onChange={(e) => updateForm("designation", e.target.value)} placeholder="Maintenance préventive..."/></label>
              <label className="wide"><span>Équipement *</span><select value={form.equipement} onChange={(e) => updateForm("equipement", e.target.value)}><option value="">Sélectionner...</option>{equipements.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.nom}</option>)}</select></label>
              <label className="wide"><span>Description</span><textarea rows={5} value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Objectif et périmètre de la gamme..."/></label>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="wizard-section">
            <div className="section-heading"><h2>Paramètres de maintenance</h2><p>Définissez le type d’intervention et les conditions d’exécution.</p></div>
            <div className="wizard-grid">
              <label><span>Type de maintenance *</span><select value={form.type_maintenance} onChange={(e) => updateForm("type_maintenance", e.target.value)}><option value="preventif">Préventive</option><option value="correctif">Corrective</option><option value="amelioratif">Améliorative</option></select></label>
              <label><span>Périodicité *</span><input value={form.periodicite} onChange={(e) => updateForm("periodicite", e.target.value)} placeholder="Ex. Mensuelle"/></label>
              <label><span>Main d’œuvre *</span><input type="number" min="1" value={form.main_oeuvre} onChange={(e) => updateForm("main_oeuvre", Number(e.target.value))}/></label>
              <label><span>Modifications / objet</span><input value={form.modifications} onChange={(e) => updateForm("modifications", e.target.value)}/></label>
            </div>
            <div className="condition-grid">
              {([
                ["referentiel", "Référentiel"], ["rapport", "Rapport"], ["production", "Production"], ["arret", "Arrêt"], ["degrade", "Mode dégradé"],
              ] as Array<[keyof FormState, string]>).map(([key, label]) => (
                <label className="condition-card" key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={(e) => updateForm(key, e.target.checked as never)}/><span>{label}</span></label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="wizard-section two-columns">
            <div><div className="section-heading"><h2><ShieldCheck size={20}/> EPI *</h2><p>Au moins un EPI est obligatoire.</p></div><div className="choice-list">{epis.map((item) => <label key={item.id} className={`choice-card ${selectedEpis.includes(item.id) ? "selected" : ""}`}><input type="checkbox" checked={selectedEpis.includes(item.id)} onChange={() => toggleId(item.id, setSelectedEpis)}/><div><strong>{item.nom}</strong><span>{item.description || "Équipement de protection individuelle"}</span></div></label>)}</div></div>
            <div><div className="section-heading"><h2>Risques *</h2><p>Au moins un risque est obligatoire.</p></div><div className="choice-list">{risques.map((item) => <label key={item.id} className={`choice-card ${selectedRisques.includes(item.id) ? "selected" : ""}`}><input type="checkbox" checked={selectedRisques.includes(item.id)} onChange={() => toggleId(item.id, setSelectedRisques)}/><div><strong>{item.nom}</strong><span>{item.description || "Risque de maintenance"}</span></div></label>)}</div></div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="wizard-section two-columns">
            <div><div className="section-heading"><h2><Wrench size={20}/> Outillages</h2><p>Sélectionnez le matériel nécessaire.</p></div><div className="choice-list">{outillages.map((item) => { const selected = Boolean(selectedOutillages[item.id]); return <div key={item.id} className={`choice-card quantity ${selected ? "selected" : ""}`}><label><input type="checkbox" checked={selected} onChange={() => toggleQuantity(item.id, setSelectedOutillages)}/><div><strong>{item.nom}</strong><span>{item.description || "Outillage"}</span></div></label>{selected && <input className="qty" type="number" min="1" value={selectedOutillages[item.id]} onChange={(e) => setSelectedOutillages((cur) => ({ ...cur, [item.id]: Number(e.target.value) }))}/>}</div>})}</div></div>
            <div><div className="section-heading"><h2>Pièces de rechange</h2><p>Ajoutez les pièces prévues pour l’intervention.</p></div><div className="choice-list">{pieces.map((item) => { const selected = Boolean(selectedPieces[item.id]); return <div key={item.id} className={`choice-card quantity ${selected ? "selected" : ""}`}><label><input type="checkbox" checked={selected} onChange={() => toggleQuantity(item.id, setSelectedPieces)}/><div><strong>{item.code ? `${item.code} — ` : ""}{item.nom}</strong><span>{item.reference || "Pièce de rechange"}</span></div></label>{selected && <input className="qty" type="number" min="1" value={selectedPieces[item.id]} onChange={(e) => setSelectedPieces((cur) => ({ ...cur, [item.id]: Number(e.target.value) }))}/>}</div>})}</div></div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="wizard-section">
            <div className="section-heading row"><div><h2>Étapes et actions *</h2><p>Construisez la procédure opérationnelle. Durée totale : <strong>{totalDuration} min</strong>.</p></div><button type="button" className="secondary-button" onClick={() => setSteps((cur) => [...cur, { key: makeKey(), titre: "", description: "", duree_minutes: 0, actions: [""] }])}><Plus size={17}/> Ajouter une étape</button></div>
            <div className="step-editor-list">{steps.map((step, index) => <article className="step-editor" key={step.key}><div className="step-editor-head"><span className="step-index">{index + 1}</span><strong>Étape {index + 1}</strong>{steps.length > 1 && <button type="button" className="danger-icon" onClick={() => setSteps((cur) => cur.filter((_, i) => i !== index))}><Trash2 size={17}/></button>}</div><div className="wizard-grid"><label><span>Titre *</span><input value={step.titre} onChange={(e) => updateStep(index, { titre: e.target.value })}/></label><label><span>Durée (minutes)</span><input type="number" min="0" value={step.duree_minutes} onChange={(e) => updateStep(index, { duree_minutes: Number(e.target.value) })}/></label><label className="wide"><span>Description</span><textarea rows={3} value={step.description} onChange={(e) => updateStep(index, { description: e.target.value })}/></label></div><div className="actions-editor"><div className="actions-title"><strong>Actions</strong><button type="button" onClick={() => updateStep(index, { actions: [...step.actions, ""] })}><Plus size={15}/> Action</button></div>{step.actions.map((action, actionIndex) => <div className="action-line" key={`${step.key}-${actionIndex}`}><span>{actionIndex + 1}</span><input value={action} onChange={(e) => updateAction(index, actionIndex, e.target.value)} placeholder="Décrire l’action à réaliser..."/>{step.actions.length > 1 && <button type="button" onClick={() => updateStep(index, { actions: step.actions.filter((_, i) => i !== actionIndex) })}><Trash2 size={15}/></button>}</div>)}</div></article>)}</div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="wizard-section two-columns">
            <div><div className="section-heading row"><div><h2>Documents liés</h2><p>Références, modes opératoires et liens.</p></div><button type="button" className="secondary-button" onClick={() => setDocuments((cur) => [...cur, { key: makeKey(), titre: "", reference: "", description: "", fichier_url: "" }])}><Plus size={16}/> Ajouter</button></div>{documents.length === 0 && <div className="empty-box">Aucun document ajouté.</div>}{documents.map((doc, index) => <div className="mini-editor" key={doc.key}><button type="button" className="danger-icon" onClick={() => setDocuments((cur) => cur.filter((_, i) => i !== index))}><Trash2 size={16}/></button><input placeholder="Titre" value={doc.titre} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, titre: e.target.value } : d))}/><input placeholder="Référence" value={doc.reference} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, reference: e.target.value } : d))}/><input placeholder="URL du fichier (facultatif)" value={doc.fichier_url} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, fichier_url: e.target.value } : d))}/><textarea rows={2} placeholder="Description" value={doc.description} onChange={(e) => setDocuments((cur) => cur.map((d, i) => i === index ? { ...d, description: e.target.value } : d))}/></div>)}</div>
            <div><div className="section-heading row"><div><h2>Recommandations</h2><p>Consignes complémentaires pour le technicien.</p></div><button type="button" className="secondary-button" onClick={() => setRecommendations((cur) => [...cur, { key: makeKey(), titre: "", contenu: "" }])}><Plus size={16}/> Ajouter</button></div>{recommendations.length === 0 && <div className="empty-box">Aucune recommandation ajoutée.</div>}{recommendations.map((rec, index) => <div className="mini-editor" key={rec.key}><button type="button" className="danger-icon" onClick={() => setRecommendations((cur) => cur.filter((_, i) => i !== index))}><Trash2 size={16}/></button><input placeholder="Titre" value={rec.titre} onChange={(e) => setRecommendations((cur) => cur.map((r, i) => i === index ? { ...r, titre: e.target.value } : r))}/><textarea rows={5} placeholder="Recommandation" value={rec.contenu} onChange={(e) => setRecommendations((cur) => cur.map((r, i) => i === index ? { ...r, contenu: e.target.value } : r))}/></div>)}</div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="wizard-section">
            <div className="section-heading"><h2>Vérification avant création</h2><p>La gamme sera créée en V0 avec le statut brouillon.</p></div>
            <div className="review-grid">
              <div className="review-card"><span>Code</span><strong>{form.code || "—"}</strong></div>
              <div className="review-card"><span>Désignation</span><strong>{form.designation || "—"}</strong></div>
              <div className="review-card"><span>Équipement</span><strong>{selectedEquipment ? `${selectedEquipment.code} — ${selectedEquipment.nom}` : "—"}</strong></div>
              <div className="review-card"><span>Maintenance</span><strong>{form.type_maintenance} · {form.periodicite || "—"}</strong></div>
              <div className="review-card"><span>Sécurité</span><strong>{selectedEpis.length} EPI · {selectedRisques.length} risques</strong></div>
              <div className="review-card"><span>Moyens</span><strong>{Object.keys(selectedOutillages).length} outillages · {Object.keys(selectedPieces).length} pièces</strong></div>
              <div className="review-card"><span>Procédure</span><strong>{steps.filter((item) => item.titre.trim()).length} étapes · {totalDuration} min</strong></div>
              <div className="review-card"><span>Documents</span><strong>{documents.filter((item) => item.titre.trim()).length} documents · {recommendations.filter((item) => item.contenu.trim()).length} recommandations</strong></div>
            </div>
            <div className="final-note"><ShieldCheck size={22}/><div><strong>Après création</strong><p>Vous pourrez ouvrir la fiche, compléter le brouillon puis l’envoyer en validation. Une version validée deviendra non modifiable.</p></div></div>
          </div>
        )}
      </section>

      <div className="wizard-actions">
        <button type="button" className="secondary-button" onClick={previous} disabled={currentStep === 0 || saving}><ArrowLeft size={17}/> Précédent</button>
        {currentStep < wizardSteps.length - 1 ? (
          <button type="button" className="primary-button" onClick={next}>Suivant <ArrowRight size={17}/></button>
        ) : (
          <button type="submit" className="primary-button green" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18}/> : <Save size={18}/>} Créer la gamme V0</button>
        )}
      </div>
    </form>
  );
}
