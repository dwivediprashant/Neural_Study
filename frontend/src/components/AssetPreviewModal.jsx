import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./AssetPreviewModal.module.css";

const inferAssetType = (assetUrl = "") => {
  const lower = assetUrl.toLowerCase();
  if (lower.endsWith(".mp4")) return "video";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".json")) return "json";
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  )
    return "image";
  return "unknown";
};

const JsonPreview = ({ assetUrl }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    fetch(assetUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(t("assetPreview.json.error"));
        const text = await response.text();
        if (mounted) {
          setContent(text);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError(err?.message || t("assetPreview.json.error"));
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [assetUrl, t]);

  if (error) {
    return <p className={styles.fallbackMessage}>{error}</p>;
  }

  if (!content) {
    return <p className={styles.fallbackMessage}>{t("assetPreview.json.loading")}</p>;
  }

  return (
    <pre className={styles.jsonPreview}>
      <code>{content}</code>
    </pre>
  );
};

const AssetPreviewModal = ({ open, assetUrl, title, lessonType, onClose }) => {
  const assetType = useMemo(() => inferAssetType(assetUrl), [assetUrl]);
  const { t } = useTranslation();
  const assetTypeLabel = useMemo(
    () =>
      t(`assetPreview.assetTypes.${assetType}`, {
        defaultValue: t("assetPreview.assetTypes.unknown"),
      }),
    [assetType, t]
  );
  const assetMetaText = assetType === "unknown"
    ? t("assetPreview.assetMeta.download")
    : t("assetPreview.assetMeta.showing", { type: assetTypeLabel });

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t("assetPreview.ariaLabel", { title })}
    >
      <div className={styles.modalCard}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{lessonType || t("assetPreview.lessonFallback")}</p>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.assetMeta}>{assetMetaText}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t("assetPreview.actions.close")}
          >
            ×
          </button>
        </header>

        <div className={styles.previewBody}>
          {assetType === "video" && (
            <video
              className={styles.videoPlayer}
              controls
              preload="metadata"
              src={assetUrl}
            >
              {t("assetPreview.video.noSupport")}
            </video>
          )}

          {assetType === "pdf" && (
            <iframe
              title={t("assetPreview.pdf.title", { title })}
              src={assetUrl}
              className={styles.documentFrame}
            />
          )}

          {assetType === "image" && (
            <img
              src={assetUrl}
              alt={title}
              className={styles.imagePreview}
              loading="lazy"
            />
          )}

          {assetType === "json" && <JsonPreview assetUrl={assetUrl} />}

          {assetType === "unknown" && (
            <div className={styles.fallbackBlock}>
              <p className={styles.fallbackMessage}>{t("assetPreview.unknown.message")}</p>
              <a href={assetUrl} download className={styles.downloadLink}>
                {t("assetPreview.actions.download")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AssetPreviewModal.defaultProps = {
  open: false,
  assetUrl: "",
  title: "",
  lessonType: "",
  onClose: () => {},
};

export default AssetPreviewModal;
