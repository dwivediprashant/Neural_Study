import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    fetch(assetUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load JSON asset");
        const text = await response.text();
        if (mounted) {
          setContent(text);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError(err?.message || "Unable to load JSON asset");
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [assetUrl]);

  if (error) {
    return <p className={styles.fallbackMessage}>{error}</p>;
  }

  if (!content) {
    return <p className={styles.fallbackMessage}>Loading preview…</p>;
  }

  return (
    <pre className={styles.jsonPreview}>
      <code>{content}</code>
    </pre>
  );
};

const AssetPreviewModal = ({ open, assetUrl, title, lessonType, onClose }) => {
  const assetType = useMemo(() => inferAssetType(assetUrl), [assetUrl]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview for ${title}`}
    >
      <div className={styles.modalCard}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{lessonType || "Lesson asset"}</p>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.assetMeta}>
              {assetType === "unknown"
                ? "Download to view"
                : `Showing ${assetType} preview`}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close asset preview"
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
              Your browser does not support embedded video playback.
            </video>
          )}

          {assetType === "pdf" && (
            <iframe
              title={`${title} PDF preview`}
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
              <p className={styles.fallbackMessage}>
                Preview unavailable for this asset type.
              </p>
              <a href={assetUrl} download className={styles.downloadLink}>
                Download asset
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
