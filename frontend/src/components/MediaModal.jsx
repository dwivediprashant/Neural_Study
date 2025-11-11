import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import styles from './MediaModal.module.css';

const modalRoot = typeof document !== 'undefined' ? document.body : null;

const MediaModal = ({ open, title, media, onClose }) => {
  const { t } = useTranslation();
  if (!open || !modalRoot) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('mediaModal.ariaLabel', { title })}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('mediaModal.actions.close')}
          >
            ×
          </button>
        </header>
        <div className={styles.body}>
          {media ? (
            <div className={styles.playerWrap}>
              {media.type === 'video' ? (
                <video className={styles.player} src={media.src} controls autoPlay poster={media.poster || undefined}>
                  {t('mediaModal.video.noSupport')}
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
                <p className={styles.fallback}>{t('mediaModal.fallback')}</p>
              )}
            </div>
          ) : (
            <p className={styles.fallback}>{t('mediaModal.fallback')}</p>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default MediaModal;
