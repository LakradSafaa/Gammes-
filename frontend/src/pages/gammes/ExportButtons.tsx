import { useState } from "react";
import {
  FileDown,
  FileText,
  LoaderCircle,
} from "lucide-react";

import api from "../../api/axios";

interface Props {
  versionId: string;
  compact?: boolean;
}

async function extractBackendError(
  error: any,
  fallbackMessage: string,
): Promise<string> {
  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text);

      if (parsed?.detail) {
        return String(parsed.detail);
      }
    } catch {
      return fallbackMessage;
    }
  }

  if (responseData?.detail) {
    return String(responseData.detail);
  }

  if (error?.message) {
    return String(error.message);
  }

  return fallbackMessage;
}

export default function ExportButtons({
  versionId,
  compact = false,
}: Props) {
  const [loading, setLoading] = useState<
    "pdf" | "word" | null
  >(null);

  const [error, setError] = useState("");

  const run = async (
    type: "pdf" | "word",
  ) => {
    try {
      setLoading(type);
      setError("");

      const response = await api.post(
        `/versions/${versionId}/export_${type}/`,
        {},
        {
          responseType: "blob",
        },
      );

      const mimeType: string =
        type === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const extension =
        type === "pdf"
          ? "pdf"
          : "docx";

      const filename =
        `gamme_${versionId}.${extension}`;

      const blob = new Blob(
        [response.data],
        {
          type: mimeType,
        },
      );

      const objectUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(
          objectUrl,
        );
      }, 1500);
    } catch (e: any) {
      console.error(
        `Erreur export ${type}:`,
        e,
      );

      const message =
        await extractBackendError(
          e,
          type === "pdf"
            ? "Erreur lors de la génération du PDF."
            : "Erreur lors de la génération du document Word.",
        );

      setError(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className={
        compact
          ? "export-buttons export-buttons-compact"
          : "export-buttons"
      }
    >
      <button
        className="module-button module-button-pdf"
        type="button"
        disabled={loading !== null}
        onClick={() => void run("pdf")}
      >
        {loading === "pdf" ? (
          <LoaderCircle
            className="spin"
            size={18}
          />
        ) : (
          <FileDown size={18} />
        )}

        {!compact && "PDF"}
      </button>

      <button
        className="module-button module-button-word"
        type="button"
        disabled={loading !== null}
        onClick={() => void run("word")}
      >
        {loading === "word" ? (
          <LoaderCircle
            className="spin"
            size={18}
          />
        ) : (
          <FileText size={18} />
        )}

        {!compact && "Word"}
      </button>

      {error && (
        <span className="export-error">
          {error}
        </span>
      )}
    </div>
  );
}
