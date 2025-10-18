import { VerifyForm } from '@/components/VerifyForm';

const Verify = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Verify Certificate</h1>
          <p className="text-xl text-muted-foreground">
            Check the blockchain for existing authentication certificates
          </p>
        </div>
        <VerifyForm />
      </div>
    </div>
  );
};

export default Verify;