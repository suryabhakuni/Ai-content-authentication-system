import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { ResultCard } from "./ResultCard";

export const UploadForm = () => {
  const [textContent, setTextContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some text to authenticate.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call - replace with actual backend endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult = {
        isAuthentic: Math.random() > 0.3, // 70% chance of being authentic
        confidence: Math.random() * 100,
        contentHash: "0x" + Math.random().toString(16).substring(2, 18),
        blockchainTxHash: "0x" + Math.random().toString(16).substring(2, 18),
        timestamp: new Date().toISOString(),
        certificateId: Math.random().toString(36).substring(7),
      };

      setResult(mockResult);
      toast({
        title: "Analysis Complete",
        description: `Content authentication ${
          mockResult.isAuthentic ? "successful" : "flagged potential issues"
        }.`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to authenticate content. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleImageSubmit = async () => {
    if (!imageFile) {
      toast({
        title: "No File Selected",
        description: "Please select an image to authenticate.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call - replace with actual backend endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult = {
        isAuthentic: Math.random() > 0.4, // 60% chance of being authentic
        confidence: Math.random() * 100,
        contentHash: "0x" + Math.random().toString(16).substring(2, 18),
        blockchainTxHash: "0x" + Math.random().toString(16).substring(2, 18),
        timestamp: new Date().toISOString(),
        certificateId: Math.random().toString(36).substring(7),
      };

      setResult(mockResult);
      toast({
        title: "Analysis Complete",
        description: `Image authentication ${
          mockResult.isAuthentic ? "successful" : "flagged potential issues"
        }.`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to authenticate image. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <section id="upload-section" className="section-spacing px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Authenticate Your Content
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload text or images for AI-powered authenticity verification
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Text Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="card-modern h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <FileText className="text-primary" size={28} />
                  Text Authentication
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Paste or type content to verify its authenticity using AI
                  detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Textarea
                  placeholder="Enter your content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[240px] resize-none rounded-lg border-2 focus:border-primary transition-fast text-base"
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={loading || !textContent.trim()}
                  className="w-full py-6 text-base font-medium hover:scale-[1.02] active:scale-[0.98] transition-fast"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2" size={18} />
                      Authenticate Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Image Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="card-modern h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <ImageIcon className="text-primary" size={28} />
                  Image Authentication
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Upload images to detect AI-generated or manipulated content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary hover:bg-muted/30 transition-fast cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <ImageIcon
                      className="mx-auto mb-4 text-muted-foreground"
                      size={56}
                    />
                    <p className="text-base text-foreground font-medium mb-2">
                      {imageFile ? imageFile.name : "Click to upload an image"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG, WEBP up to 10MB
                    </p>
                  </label>
                </div>
                <Button
                  onClick={handleImageSubmit}
                  disabled={loading || !imageFile}
                  className="w-full py-6 text-base font-medium hover:scale-[1.02] active:scale-[0.98] transition-fast"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2" size={18} />
                      Authenticate Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ResultCard result={result} />
          </motion.div>
        )}
      </div>
    </section>
  );
};
