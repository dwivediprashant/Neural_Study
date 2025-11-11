import styles from './CenteredLoader.module.css';

const CenteredLoader = ({ logoSrc = '/logo.svg', alt = 'Loading Neural Study' }) => (
  <div className={styles.backdrop} role="status" aria-live="polite">
    <div className={styles.loader}>
      <span className={styles.spinner} aria-hidden="true" />
      <img src={logoSrc} alt={alt} className={styles.logo} />
    </div>
  </div>
);

export default CenteredLoader;
