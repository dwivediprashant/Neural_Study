import styles from "./FeatureHighlights.module.css";

const FEATURES = [
  {
    id: "free",
    img: "/9816db69-099c-4020-935c-b98cc3ab4464.webp",
    alt: "Free access",
    title: "Free access",
    desc: "High quality courses",
  },
  {
    id: "ai",
    img: "../../c.webp",
    alt: "AI powered guidance",
    title: "AI powered",
    desc: "Tests, sample papers & notes",
  },
  {
    id: "support",
    img: "/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp",
    alt: "Structured support",
    title: "Structured notes, quizzes, tests",
    desc: "Offline available",
  },
  {
    id: "offline",
    img: "/65d1e4cb-abf8-4bda-9f2c-49f37a714b7a.webp",
    alt: "Gamified experience",
    title: "Gamified UI + Badges + Achievements",
    desc: "Interactive & engaging experience",
  },
];

const FeatureHighlights = () => {
  return (
    <section className={styles.wrapper} aria-label="Key features">
      <div className={styles.grid}>
        {FEATURES.map((feature, index) => (
          <article
            key={feature.id}
            className={styles.item}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className={styles.imageFrame}>
              <img
                className={styles.image}
                src={feature.img}
                alt={feature.alt}
                loading="lazy"
              />
            </div>
            <h3 className={styles.title}>{feature.title}</h3>
            <p className={styles.description}>{feature.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeatureHighlights;
