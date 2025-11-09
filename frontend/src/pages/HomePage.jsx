import FeatureHighlights from '../components/FeatureHighlights.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import ExamCategories from '../components/ExamCategories.jsx';

const HomePage = () => {
  return (
    <>
      <HeroCarousel />
      <FeatureHighlights />
      <ExamCategories />
    </>
  );
};

export default HomePage;
