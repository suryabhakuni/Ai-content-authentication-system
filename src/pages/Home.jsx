import { HeroSection } from '@/components/HeroSection';
import { UploadForm } from '@/components/UploadForm';

const Home = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <UploadForm />
    </div>
  );
};

export default Home;