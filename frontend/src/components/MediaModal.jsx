import { createPortal } from 'react-dom';

import styles from './MediaModal.module.css';

const modalRoot = typeof document !== 'undefined' ? document.body : null;

const MediaModal = ({ open, title, media, onClose }) => {
  if (!open || !modalRoot) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className={styles.body}>
          {media ? (
            <div className={styles.playerWrap}>
              {media.type === 'video' ? (
                <video className={styles.player} src={media.src} controls autoPlay poster={media.poster || undefined}>
                  Your browser does not support embedded video playback.
                </video>
              ) : media.type === 'embed' ? (
                <iframe
                  className={styles.player}
                  src={media.src}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <p className={styles.fallback}>No preview available for this lecture.</p>
              )}
            </div>
          ) : (
            <p className={styles.fallback}>No preview available for this lecture.</p>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default MediaModal;
