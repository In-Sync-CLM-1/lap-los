import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Upload, 
  FileImage, 
  MapPin, 
  Check, 
  X, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
  requiresGeoTag?: boolean;
}

interface UploadedDocument {
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface DocumentUploadProps {
  leadId: string;
  applicationId?: string;
  documentTypes: DocumentType[];
  uploadedDocuments: UploadedDocument[];
  onUploadComplete: (document: UploadedDocument) => void;
}

export function DocumentUpload({ 
  leadId, 
  applicationId,
  documentTypes, 
  uploadedDocuments,
  onUploadComplete 
}: DocumentUploadProps) {
  const { user } = useAuth();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  
  const getGeoLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };
  
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    docType: DocumentType
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > docType.maxSizeMB) {
      toast.error(`File size exceeds ${docType.maxSizeMB}MB limit`);
      return;
    }
    
    setUploadingDoc(docType.id);
    setUploadProgress(10);
    
    try {
      // Get geolocation if required
      let location: { lat: number; lng: number; address?: string } | null = null;
      if (docType.requiresGeoTag) {
        try {
          const coords = await getGeoLocation();
          location = {
            lat: coords.lat,
            lng: coords.lng,
            address: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, // Mock address
          };
          setGeoLocation(location);
        } catch (geoError) {
          toast.warning('Could not get location. Upload will continue without geo-tag.');
        }
      }
      
      setUploadProgress(30);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${leadId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      setUploadProgress(70);
      
      // Save document record
      const { error: dbError } = await supabase.from('documents').insert({
        lead_id: leadId,
        application_id: applicationId,
        document_type: docType.id,
        document_name: docType.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        capture_latitude: location?.lat,
        capture_longitude: location?.lng,
        capture_address: location?.address,
        captured_at: new Date().toISOString(),
      });
      
      if (dbError) throw dbError;
      
      setUploadProgress(100);
      
      const uploadedDoc: UploadedDocument = {
        documentType: docType.id,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        latitude: location?.lat,
        longitude: location?.lng,
        address: location?.address,
      };
      
      onUploadComplete(uploadedDoc);
      toast.success(`${docType.name} uploaded successfully`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(null);
      setUploadProgress(0);
      setSelectedDocType(null);
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };
  
  const isDocUploaded = (docTypeId: string) => {
    return uploadedDocuments.some(doc => doc.documentType === docTypeId);
  };
  
  const getUploadedDoc = (docTypeId: string) => {
    return uploadedDocuments.find(doc => doc.documentType === docTypeId);
  };
  
  const completedCount = documentTypes.filter(dt => isDocUploaded(dt.id)).length;
  const requiredCount = documentTypes.filter(dt => dt.required).length;
  const requiredCompleted = documentTypes.filter(dt => dt.required && isDocUploaded(dt.id)).length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              Document Collection
            </CardTitle>
            <CardDescription>
              Upload required documents with geo-tagging
            </CardDescription>
          </div>
          <Badge variant={requiredCompleted === requiredCount ? 'default' : 'secondary'}>
            {completedCount}/{documentTypes.length} Uploaded
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Required: {requiredCompleted}/{requiredCount}</span>
            <span>{Math.round((requiredCompleted / requiredCount) * 100)}%</span>
          </div>
          <Progress value={(requiredCompleted / requiredCount) * 100} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {documentTypes.map((docType) => {
            const isUploaded = isDocUploaded(docType.id);
            const uploadedDoc = getUploadedDoc(docType.id);
            const isCurrentlyUploading = uploadingDoc === docType.id;
            
            return (
              <div 
                key={docType.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  isUploaded ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" :
                  docType.required ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" :
                  "bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{docType.name}</h4>
                      {docType.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      {docType.requiresGeoTag && (
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {docType.description}
                    </p>
                    
                    {isUploaded && uploadedDoc && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Uploaded: {uploadedDoc.fileName}
                        {uploadedDoc.latitude && (
                          <span className="ml-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Geo-tagged
                          </span>
                        )}
                      </div>
                    )}
                    
                    {isCurrentlyUploading && (
                      <div className="mt-2 space-y-1">
                        <Progress value={uploadProgress} className="h-1" />
                        <p className="text-xs text-muted-foreground">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!isUploaded && !isCurrentlyUploading && (
                      <>
                        {/* Camera Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDocType(docType.id);
                            cameraInputRef.current?.click();
                          }}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                        
                        {/* File Upload Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDocType(docType.id);
                            fileInputRef.current?.click();
                          }}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {isCurrentlyUploading && (
                      <Button size="sm" variant="ghost" disabled>
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </Button>
                    )}
                    
                    {isUploaded && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const docType = documentTypes.find(dt => dt.id === selectedDocType);
            if (docType) handleFileSelect(e, docType);
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const docType = documentTypes.find(dt => dt.id === selectedDocType);
            if (docType) handleFileSelect(e, docType);
          }}
        />
        
        {/* Warning if required docs missing */}
        {requiredCompleted < requiredCount && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {requiredCount - requiredCompleted} required document(s) pending
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Default document types for loan applications
export const DEFAULT_DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'customer_photo',
    name: 'Customer Photo',
    description: 'Recent passport-size photograph',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeMB: 5,
    requiresGeoTag: true,
  },
  {
    id: 'pan_card',
    name: 'PAN Card',
    description: 'Clear copy of PAN card',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeMB: 5,
  },
  {
    id: 'aadhaar_front',
    name: 'Aadhaar Card (Front)',
    description: 'Front side of Aadhaar card',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeMB: 5,
  },
  {
    id: 'aadhaar_back',
    name: 'Aadhaar Card (Back)',
    description: 'Back side of Aadhaar card',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeMB: 5,
  },
  {
    id: 'shop_exterior',
    name: 'Shop Exterior Photo',
    description: 'Outside view of business premises with signboard',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
    requiresGeoTag: true,
  },
  {
    id: 'shop_interior',
    name: 'Shop Interior Photo',
    description: 'Inside view showing stock/inventory',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
    requiresGeoTag: true,
  },
  {
    id: 'gst_certificate',
    name: 'GST Certificate',
    description: 'GST registration certificate (if applicable)',
    required: false,
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeMB: 5,
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    description: 'Last 6 months bank statement',
    required: true,
    acceptedFormats: ['pdf'],
    maxSizeMB: 20,
  },
  {
    id: 'property_document',
    name: 'Property Document',
    description: 'Property ownership proof (if applicable)',
    required: false,
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeMB: 10,
  },
  {
    id: 'residence_proof',
    name: 'Residence Proof',
    description: 'Utility bill or rent agreement',
    required: false,
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeMB: 5,
  },
];
