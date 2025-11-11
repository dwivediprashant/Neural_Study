import { useTranslation } from "react-i18next";

import styles from "./FeatureHighlights.module.css";

const FEATURE_CONFIG = [
  {
    id: "free",
    img: "/9816db69-099c-4020-935c-b98cc3ab4464.webp",
  },
  {
    id: "ai",
    img: "../../c.webp",
  },
  {
    id: "support",
    img: "/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp",
  },
  {
    id: "offline",
    img: "/65d1e4cb-abf8-4bda-9f2c-49f37a714b7a.webp",
  },
];

const FeatureHighlights = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.wrapper} aria-label={t("features.ariaLabel")}>
      <div className={styles.grid}>
        {FEATURE_CONFIG.map((feature, index) => (
          <article
            key={feature.id}
            className={styles.item}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className={styles.imageFrame}>
              <img
                className={styles.image}
                src={feature.img}
                alt={t(`features.items.${feature.id}.alt`)}
                loading="lazy"
              />
            </div>
            <h3 className={styles.title}>{t(`features.items.${feature.id}.title`)}</h3>
            <p className={styles.description}>{t(`features.items.${feature.id}.description`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeatureHighlights;
