import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./HeroCarousel.module.css";

const AUTOPLAY_INTERVAL = 4500;

const SLIDE_CONFIG = [
  {
    id: "community",
    bgClass: "slideCommunity",
    translationKey: "community",
  },
  {
    id: "concept-mastery",
    bgClass: "slideConcept",
    translationKey: "concept",
  },
  {
    id: "adaptive-learning",
    bgClass: "slideAdaptive",
    translationKey: "adaptive",
  },
];

const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { t } = useTranslation();

  const slides = useMemo(
    () =>
      SLIDE_CONFIG.map((config) => {
        const baseKey = `hero.slides.${config.translationKey}`;
        return {
          ...config,
          title: t(`${baseKey}.title`),
          description: t(`${baseKey}.description`),
        };
      }),
    [t]
  );

  const totalSlides = slides.length;

  const goTo = useCallback(
    (index) => {
      setActiveIndex((prev) => {
        if (index === prev) return prev;
        return (index + totalSlides) % totalSlides;
      });
    },
    [totalSlides]
  );

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      goNext();
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [goNext, isPaused, totalSlides]);

  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);

  return (
    <section
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('hero.carouselLabel')}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocusCapture={handlePause}
      onBlurCapture={handleResume}
    >
      <div
        className={styles.viewport}
        aria-live="polite"
        style={{ "--active-index": String(activeIndex) }}
      >
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <article
              key={slide.id}
              className={`${styles.slide} ${styles[slide.bgClass]} ${
                isActive ? styles.slideActive : ""
              }`}
              aria-hidden={isActive ? "false" : "true"}
            >
              <div className={styles.overlay} />
              <div className={styles.content}>
                <h3 className={styles.slideTitle}>{slide.title}</h3>
                <p className={styles.slideText}>{slide.description}</p>
              </div>
            </article>
          );
        })}
      </div>
      <div className={styles.sideControls}>
        <button
          type="button"
          className={`${styles.sideButton} ${styles.sideButtonPrev}`}
          onClick={goPrev}
          aria-label={t('hero.prev')}
        >
          ‹
        </button>
        <button
          type="button"
          className={`${styles.sideButton} ${styles.sideButtonNext}`}
          onClick={goNext}
          aria-label={t('hero.next')}
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default HeroCarousel;
