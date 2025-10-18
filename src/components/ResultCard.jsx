import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export const ResultCard = ({ result }) => {
  const { toast } = useToast();

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const downloadCertificate = () => {
    const certificate = {
      certificateId: result.certificateId,
      timestamp: result.timestamp,
      contentHash: result.contentHash,
      blockchainTxHash: result.blockchainTxHash,
      authenticity: result.isAuthentic ? "Authentic" : "Potentially Modified",
      confidence: `${result.confidence.toFixed(1)}%`,
    };

    const blob = new Blob([JSON.stringify(certificate, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${result.certificateId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Certificate Downloaded",
      description: "Authentication certificate saved to your device.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-xl border-2 shadow-lg border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {result.isAuthentic ? (
                <CheckCircle
                  className="text-green-500 flex-shrink-0"
                  size={36}
                />
              ) : (
                <AlertTriangle
                  className="text-yellow-500 flex-shrink-0"
                  size={36}
                />
              )}
              <div>
                <CardTitle
                  className={`text-2xl ${
                    result.isAuthentic
                      ? "text-green-600 dark:text-green-500"
                      : "text-yellow-600 dark:text-yellow-500"
                  }`}
                >
                  {result.isAuthentic
                    ? "Content Verified"
                    : "Potential Issues Detected"}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Confidence: {result.confidence.toFixed(1)}%
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={result.isAuthentic ? "default" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {result.isAuthentic ? "Authentic" : "Flagged"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Authenticity Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Content Hash
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted/50 rounded-md text-sm font-mono break-all">
                    {result.contentHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(result.contentHash, "Content hash")
                    }
                    className="flex-shrink-0 h-10 w-10 p-0 hover:scale-110 transition-fast"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Blockchain Transaction
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted/50 rounded-md text-sm font-mono break-all">
                    {result.blockchainTxHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        result.blockchainTxHash,
                        "Transaction hash"
                      )
                    }
                    className="flex-shrink-0 h-10 w-10 p-0 hover:scale-110 transition-fast"
                  >
                    <Copy size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://etherscan.io/tx/${result.blockchainTxHash}`,
                        "_blank"
                      )
                    }
                    className="flex-shrink-0 h-10 w-10 p-0 hover:scale-110 transition-fast"
                  >
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Certificate ID
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted/50 rounded-md text-sm font-mono break-all">
                    {result.certificateId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(result.certificateId, "Certificate ID")
                    }
                    className="flex-shrink-0 h-10 w-10 p-0 hover:scale-110 transition-fast"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Timestamp
                </label>
                <div className="p-3 bg-muted/50 rounded-md text-sm font-medium">
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button
              onClick={downloadCertificate}
              className="flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-fast"
            >
              <Download size={18} />
              Download Certificate
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-fast"
            >
              <ExternalLink size={18} />
              View on Blockchain
            </Button>
          </div>

          {/* Additional Info */}
          {!result.isAuthentic && (
            <div className="p-5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3 text-base">
                Detection Notes
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                Our AI system has detected patterns suggesting this content may
                have been generated or significantly modified by artificial
                intelligence. This does not necessarily mean the content is
                inauthentic, but warrants further review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
