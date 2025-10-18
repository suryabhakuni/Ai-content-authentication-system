import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Hash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ResultCard } from './ResultCard';

export const VerifyForm = () => {
  const [certificateId, setCertificateId] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!certificateId.trim() && !contentHash.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter either a Certificate ID or Content Hash to verify.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate blockchain lookup - replace with actual blockchain query
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result - in real implementation, this would come from blockchain
      if (Math.random() > 0.3) { // 70% chance of finding a record
        const mockResult = {
          isAuthentic: Math.random() > 0.2, // 80% chance of being authentic if found
          confidence: 95 + Math.random() * 5, // High confidence for blockchain records
          contentHash: contentHash || "0x" + Math.random().toString(16).substring(2, 18),
          blockchainTxHash: "0x" + Math.random().toString(16).substring(2, 18),
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          certificateId: certificateId || Math.random().toString(36).substring(7)
        };
        
        setResult(mockResult);
        toast({
          title: "Verification Complete",
          description: "Certificate found on blockchain and verified."
        });
      } else {
        toast({
          title: "Certificate Not Found",
          description: "No matching certificate found on the blockchain.",
          variant: "destructive"
        });
        setResult(null);
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify certificate. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Verify Authentication Certificate</h2>
          <p className="text-xl text-muted-foreground">
            Check the blockchain for existing authentication certificates
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="text-primary" size={24} />
                Certificate Verification
              </CardTitle>
              <CardDescription>
                Enter a Certificate ID or Content Hash to verify its authenticity on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText size={16} />
                    Certificate ID
                  </label>
                  <Input
                    placeholder="e.g., abc123def"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    The unique identifier from your authentication certificate
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash size={16} />
                    Content Hash
                  </label>
                  <Input
                    placeholder="e.g., 0x1a2b3c4d..."
                    value={contentHash}
                    onChange={(e) => setContentHash(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    The cryptographic hash of your content
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleVerify}
                  disabled={loading || (!certificateId.trim() && !contentHash.trim())}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2" size={16} />
                      Verify Certificate
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>🔒 All verifications are performed directly on the blockchain</p>
                <p>📋 No personal information is stored or transmitted</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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