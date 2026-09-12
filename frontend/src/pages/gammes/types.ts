export interface Equipement {
  id: string;
  code: string;
  nom: string;
  constructeur?: string | null;
  type?: string | null;
  reference?: string | null;
  description?: string | null;
  actif?: boolean;
}

export interface Gamme {
  id: string;
  equipement?: string | null;
  equipement_detail?: Equipement | null;
  code: string;
  designation: string;
  abreviation?: string | null;
  description?: string | null;
  actif?: boolean;
}

export interface ActionEtape {
  id: string;
  ordre?: number | null;
  contenu?: string | null;
}

export interface Etape {
  id: string;
  numero?: number | null;
  ordre?: number | null;
  titre?: string | null;
  description?: string | null;
  duree_minutes?: number | null;
  actions?: ActionEtape[];
}

export interface GammeVersion {
  id: string;
  gamme: string;
  numero_version?: number | null;
  code_version?: string | null;
  date_version?: string | null;
  redacteur?: string | null;
  valideur?: string | null;
  modifications?: string | null;
  statut?: string | null;
  type_maintenance?: string | null;
  periodicite?: string | null;
  main_oeuvre?: number | null;
  duree_minutes?: number | null;
  referentiel?: boolean;
  rapport?: boolean;
  production?: boolean;
  arret?: boolean;
  degrade?: boolean;
  etapes?: Etape[];
  version_epis?: Array<{ pk?: string; epi_detail?: { id: string; nom: string } }>;
  epis?: Array<{ pk?: string; epi_detail?: { id: string; nom: string } }>;
  version_risques?: Array<{ pk?: string; risque_detail?: { id: string; nom: string } }>;
  risques?: Array<{ pk?: string; risque_detail?: { id: string; nom: string } }>;
  version_outillages?: Array<{ pk?: string; quantite?: number; outillage_detail?: { id: string; nom: string } }>;
  outillages?: Array<{ pk?: string; quantite?: number; outillage_detail?: { id: string; nom: string } }>;
  version_pieces_rechange?: Array<{ pk?: string; quantite?: number; piece_detail?: { id: string; code?: string | null; nom: string } }>;
  pieces_rechange?: Array<{ pk?: string; quantite?: number; piece_detail?: { id: string; code?: string | null; nom: string } }>;
  documents?: Array<{ id: string; titre?: string | null; reference?: string | null }>;
  recommandations?: Array<{ id: string; titre?: string | null; contenu?: string | null }>;
}

export interface FichierGenere {
  id: string;
  type_fichier?: string | null;
  fichier_url?: string | null;
  nom_fichier?: string | null;
}

export interface QrResolveResponse {
  gamme: string;
  code: string;
  version_id: string;
  version: string;
  designation: string;
}

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export function extractResults<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

export function formatStatus(value?: string | null): string {
  const labels: Record<string, string> = {
    brouillon: "Brouillon",
    en_validation: "En validation",
    validee: "Validée",
    archivee: "Archivée",
  };
  return labels[value ?? ""] ?? value ?? "-";
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function backendFileUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  const origin = new URL(apiUrl).origin;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}
