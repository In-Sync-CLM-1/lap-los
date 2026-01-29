import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, Scan } from 'lucide-react';
import { performOCR, formatAadhaar, type OCRResult } from '@/lib/ocr-mock';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OCRDocumentCaptureProps {
  documentType: 'aadhaar' | 'pan';
  onDataExtracted: (data: {
    name?: string;
    number: string;
    dateOfBirth?: string;
    address?: string;
    gender?: string;
  }) => void;
  leadId?: string;
  disabled?: boolean;
}

export function OCRDocumentCapture({
  documentType,
  onDataExtracted,
  leadId,
  disabled = false,
}: OCRDocumentCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleProcessOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const ocrResult = await performOCR(documentType, selectedFile, leadId);
      setResult(ocrResult);

      if (ocrResult.success) {
        toast({
          title: 'Document processed',
          description: `Extracted data with ${Math.round(ocrResult.confidence * 100)}% confidence`,
        });
      } else {
        toast({
          title: 'OCR failed',
          description: ocrResult.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error processing document',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyData = () => {
    if (result?.success && result.extractedData) {
      onDataExtracted(result.extractedData);
      setIsOpen(false);
      resetState();
      toast({
        title: 'Data applied',
        description: 'Form fields have been populated with extracted data',
      });
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <Scan className="w-4 h-4" />
        Scan {documentType === 'aadhaar' ? 'Aadhaar' : 'PAN'}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Scan {documentType === 'aadhaar' ? 'Aadhaar Card' : 'PAN Card'}
            </DialogTitle>
            <DialogDescription>
              Upload or capture a photo of the document to auto-fill form fields
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload Area */}
            {!previewUrl ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="flex justify-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute('capture');
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute('capture', 'environment');
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Take a clear photo or upload an image of your {documentType === 'aadhaar' ? 'Aadhaar card' : 'PAN card'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Process Button */}
                {!result && (
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={handleProcessOCR}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        Extract Data
                      </>
                    )}
                  </Button>
                )}

                {/* OCR Results */}
                {result && (
                  <div className={cn(
                    'rounded-lg p-4 space-y-3',
                    result.success ? 'bg-success/10' : 'bg-destructive/10'
                  )}>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          <span className="font-medium text-success">
                            Data Extracted ({Math.round(result.confidence * 100)}% confidence)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-destructive" />
                          <span className="font-medium text-destructive">{result.error}</span>
                        </>
                      )}
                    </div>

                    {result.success && result.extractedData && (
                      <div className="space-y-2 text-sm">
                        {result.extractedData.name && (
                          <div>
                            <Label className="text-muted-foreground">Name</Label>
                            <p className="font-medium">{result.extractedData.name}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-muted-foreground">
                            {documentType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Number'}
                          </Label>
                          <p className="font-medium font-mono">
                            {documentType === 'aadhaar' 
                              ? formatAadhaar(result.extractedData.number)
                              : result.extractedData.number}
                          </p>
                        </div>
                        {result.extractedData.dateOfBirth && (
                          <div>
                            <Label className="text-muted-foreground">Date of Birth</Label>
                            <p className="font-medium">{result.extractedData.dateOfBirth}</p>
                          </div>
                        )}
                        {result.extractedData.address && (
                          <div>
                            <Label className="text-muted-foreground">Address</Label>
                            <p className="font-medium">{result.extractedData.address}</p>
                          </div>
                        )}
                        {result.extractedData.gender && (
                          <div>
                            <Label className="text-muted-foreground">Gender</Label>
                            <p className="font-medium">{result.extractedData.gender}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Change Image */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={resetState}
                >
                  Choose Different Image
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {result?.success && (
              <Button type="button" onClick={handleApplyData}>
                Apply Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
