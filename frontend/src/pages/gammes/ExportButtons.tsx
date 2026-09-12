import { useState } from "react";
import { FileDown, FileText, LoaderCircle } from "lucide-react";
import api from "../../api/axios";
import { backendFileUrl, type FichierGenere } from "./types";

interface Props { versionId: string; compact?: boolean; }

export default function ExportButtons({ versionId, compact = false }: Props) {
  const [loading, setLoading] = useState<"pdf" | "word" | null>(null);
  const [error, setError] = useState("");

  const run = async (type: "pdf" | "word") => {
    try {
      setLoading(type);
      setError("");
      const response = await api.post<FichierGenere>(`/versions/${versionId}/export_${type}/`, {});
      const url = backendFileUrl(response.data.fichier_url);
      if (!url) throw new Error("URL fichier absente");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      setError(type === "pdf" ? "Erreur PDF" : "Erreur Word");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={compact ? "export-buttons export-buttons-compact" : "export-buttons"}>
      <button className="module-button module-button-pdf" type="button" disabled={loading !== null} onClick={() => run("pdf")}>
        {loading === "pdf" ? <LoaderCircle className="spin" size={18} /> : <FileDown size={18} />}
        {!compact && "PDF"}
      </button>
      <button className="module-button module-button-word" type="button" disabled={loading !== null} onClick={() => run("word")}>
        {loading === "word" ? <LoaderCircle className="spin" size={18} /> : <FileText size={18} />}
        {!compact && "Word"}
      </button>
      {error && <span className="export-error">{error}</span>}
    </div>
  );
}
