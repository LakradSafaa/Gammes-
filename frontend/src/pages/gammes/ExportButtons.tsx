import { useState } from "react";

import {
  FileDown,
  FileText,
  LoaderCircle,
} from "lucide-react";

import api from "../../api/axios";


interface ExportButtonsProps {
  versionId: string;
  compact?: boolean;
}


async function extractBackendError(
  error: any,
  fallbackMessage: string,
): Promise<string> {
  const responseData =
    error?.response?.data;

  /*
   * Avec responseType: "blob",
   * même une erreur JSON peut arriver
   * sous forme de Blob.
   */
  if (
    responseData instanceof Blob
  ) {
    try {
      const text =
        await responseData.text();

      const parsed =
        JSON.parse(text);

      if (
        parsed?.detail
      ) {
        return String(
          parsed.detail,
        );
      }
    } catch {
      return fallbackMessage;
    }
  }

  if (
    responseData?.detail
  ) {
    return String(
      responseData.detail,
    );
  }

  if (
    error?.message
  ) {
    return String(
      error.message,
    );
  }

  return fallbackMessage;
}


export default function ExportButtons({
  versionId,
  compact = false,
}: ExportButtonsProps) {
  const [
    loading,
    setLoading,
  ] = useState<
    "pdf" |
    "word" |
    null
  >(null);

  const [
    error,
    setError,
  ] = useState("");


  const exportDocument =
    async (
      format:
        | "pdf"
        | "word",
    ) => {
      try {
        setLoading(
          format,
        );

        setError("");

        /*
         * IMPORTANT :
         * responseType doit être blob,
         * car le backend retourne
         * directement le fichier.
         */
        const response =
          await api.post(
            `/versions/${versionId}/export_${format}/`,
            {},
            {
              responseType:
                "blob",
            },
          );


        /*
         * On ne lit volontairement PAS
         * response.headers["content-type"].
         *
         * Axios peut typer ce header comme :
         *
         * string |
         * number |
         * true |
         * AxiosHeaders |
         * string[]
         *
         * alors que Blob attend uniquement
         * une chaîne pour son type MIME.
         *
         * On définit donc directement
         * le MIME selon le format.
         */
        const mimeType =
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";


        const extension =
          format === "pdf"
            ? "pdf"
            : "docx";


        const filename =
          `gamme_${versionId}.${extension}`;


        /*
         * response.data est déjà un Blob
         * avec Axios lorsque
         * responseType = "blob".
         *
         * On crée néanmoins un Blob
         * avec notre MIME contrôlé.
         */
        const blob =
          new Blob(
            [
              response.data,
            ],
            {
              type:
                mimeType,
            },
          );


        /*
         * Création d'une URL temporaire
         * dans le navigateur.
         */
        const objectUrl =
          window.URL
            .createObjectURL(
              blob,
            );


        /*
         * Création temporaire
         * d'un lien <a>
         * pour déclencher
         * le téléchargement.
         */
        const link =
          document
            .createElement(
              "a",
            );


        link.href =
          objectUrl;

        link.download =
          filename;

        link.style.display =
          "none";


        document.body
          .appendChild(
            link,
          );


        link.click();


        /*
         * Nettoyage.
         */
        link.remove();


        window.setTimeout(
          () => {
            window.URL
              .revokeObjectURL(
                objectUrl,
              );
          },
          1500,
        );
      } catch (
        err: any
      ) {
        console.error(
          `Erreur export ${format}:`,
          err,
        );


        const message =
          await extractBackendError(
            err,
            format === "pdf"
              ? "Erreur lors de la génération du PDF."
              : "Erreur lors de la génération du document Word.",
          );


        setError(
          message,
        );
      } finally {
        setLoading(
          null,
        );
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
        type="button"
        className="module-button module-button-pdf"
        disabled={
          loading !== null
        }
        onClick={() =>
          void exportDocument(
            "pdf",
          )
        }
      >
        {
          loading ===
          "pdf"
            ? (
              <LoaderCircle
                size={18}
                className="spin"
              />
            )
            : (
              <FileDown
                size={18}
              />
            )
        }

        {
          !compact &&
          (
            <span>
              PDF
            </span>
          )
        }
      </button>


      <button
        type="button"
        className="module-button module-button-word"
        disabled={
          loading !== null
        }
        onClick={() =>
          void exportDocument(
            "word",
          )
        }
      >
        {
          loading ===
          "word"
            ? (
              <LoaderCircle
                size={18}
                className="spin"
              />
            )
            : (
              <FileText
                size={18}
              />
            )
        }

        {
          !compact &&
          (
            <span>
              Word
            </span>
          )
        }
      </button>


      {
        error && (
          <span
            className="export-error"
          >
            {error}
          </span>
        )
      }
    </div>
  );
}
