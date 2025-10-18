import { UploadForm } from '@/components/UploadForm';

const Upload = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Content Authentication</h1>
          <p className="text-xl text-muted-foreground">
            Upload your content for AI-powered authenticity verification
          </p>
        </div>
        <UploadForm />
      </div>
    </div>
  );
};

export default Upload;