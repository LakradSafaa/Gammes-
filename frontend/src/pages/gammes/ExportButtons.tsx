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

function filenameFromDisposition(
  disposition: string | undefined,
  fallback: string,
) {
  if (!disposition) {
    return fallback;
  }

  const utf8Match = disposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (utf8Match?.[1]) {
    return decodeURIComponent(
      utf8Match[1].replace(/["']/g, ""),
    );
  }

  const simpleMatch = disposition.match(
    /filename="?([^";]+)"?/i,
  );

  return simpleMatch?.[1] || fallback;
}

async function extractBackendError(
  error: any,
  fallback: string,
) {
  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text);
      return parsed?.detail || fallback;
    } catch {
      return fallback;
    }
  }

  return (
    responseData?.detail ||
    error?.message ||
    fallback
  );
}

export default function ExportButtons({
  versionId,
  compact = false,
}: Props) {
  const [
    loading,
    setLoading,
  ] = useState<"pdf" | "word" | null>(null);

  const [
    error,
    setError,
  ] = useState("");

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

      const fallback =
        type === "pdf"
          ? `gamme_${versionId}.pdf`
          : `gamme_${versionId}.docx`;

      const filename = filenameFromDisposition(
        response.headers["content-disposition"],
        fallback,
      );

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers["content-type"] ||
            (type === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        },
      );

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(
        () => URL.revokeObjectURL(objectUrl),
        1500,
      );
    } catch (err: any) {
      console.error(err);

      const message = await extractBackendError(
        err,
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
