import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Download, 
  Building2, 
  User, 
  FileText,
  Calculator,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;
type Application = Tables<'applications'>;

interface CAMSheetProps {
  lead: Lead;
  application: Application;
}

export function CAMSheet({ lead, application }: CAMSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CAM Sheet - ${application.application_number}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.5;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 { font-size: 18px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 11px; }
            .section { margin-bottom: 20px; }
            .section-title { 
              font-weight: bold; 
              font-size: 13px;
              background: #f5f5f5;
              padding: 8px;
              margin-bottom: 10px;
              border-left: 3px solid #333;
            }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
            .field { margin-bottom: 6px; }
            .field-label { color: #666; font-size: 10px; }
            .field-value { font-weight: 500; }
            .badge { 
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            }
            .badge-success { background: #d4edda; color: #155724; }
            .badge-warning { background: #fff3cd; color: #856404; }
            .badge-danger { background: #f8d7da; color: #721c24; }
            .signature-section { 
              display: grid; 
              grid-template-columns: 1fr 1fr 1fr; 
              gap: 30px;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .signature-box { text-align: center; }
            .signature-line { 
              border-top: 1px solid #333; 
              margin-top: 40px;
              padding-top: 5px;
              font-size: 11px;
            }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };
  
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getDecisionBadge = () => {
    switch (application.bre_decision) {
      case 'stp_approved':
        return <span className="badge badge-success">STP APPROVED</span>;
      case 'non_stp':
        return <span className="badge badge-warning">NON-STP</span>;
      case 'rejected':
        return <span className="badge badge-danger">REJECTED</span>;
      case 'deviation':
        return <span className="badge badge-warning">DEVIATION</span>;
      default:
        return <span className="badge">PENDING</span>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Credit Appraisal Memo (CAM)
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Printable Content */}
        <div ref={printRef} className="text-sm">
          {/* Header */}
          <div className="header text-center mb-6 pb-4 border-b-2 border-foreground">
            <h1 className="text-lg font-bold mb-1">LOAN-SYNC PRIVATE LIMITED</h1>
            <p className="text-muted-foreground text-xs">Credit Appraisal Memorandum</p>
            <p className="text-xs mt-2">Application No: <strong>{application.application_number}</strong></p>
            <p className="text-xs">Date: {format(new Date(), 'dd MMM yyyy')}</p>
          </div>
          
          {/* Customer Section */}
          <div className="section mb-6">
            <div className="section-title bg-muted p-2 mb-3 border-l-4 border-primary font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              CUSTOMER INFORMATION
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Customer Name</div>
                <div className="field-value font-medium">{lead.customer_name}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Phone</div>
                <div className="field-value font-medium">{lead.customer_phone}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">PAN</div>
                <div className="field-value font-medium">{lead.customer_pan || '—'}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Gender / DOB</div>
                <div className="field-value font-medium">{lead.gender || '—'} / {lead.date_of_birth || '—'}</div>
              </div>
            </div>
          </div>
          
          {/* Business Section */}
          <div className="section mb-6">
            <div className="section-title bg-muted p-2 mb-3 border-l-4 border-primary font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              BUSINESS DETAILS
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Business Name</div>
                <div className="field-value font-medium">{lead.business_name || '—'}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Business Type</div>
                <div className="field-value font-medium">{lead.business_type || '—'}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Vintage</div>
                <div className="field-value font-medium">{lead.business_vintage_years ? `${lead.business_vintage_years} years` : '—'}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">GST Number</div>
                <div className="field-value font-medium">{lead.gst_number || '—'}</div>
              </div>
              <div className="field col-span-2">
                <div className="field-label text-xs text-muted-foreground">Address</div>
                <div className="field-value font-medium">{lead.business_address || '—'}</div>
              </div>
            </div>
          </div>
          
          {/* Loan Details */}
          <div className="section mb-6">
            <div className="section-title bg-muted p-2 mb-3 border-l-4 border-primary font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              LOAN DETAILS & ASSESSMENT
            </div>
            
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted text-left">Parameter</th>
                  <th className="border p-2 bg-muted text-left">Requested</th>
                  <th className="border p-2 bg-muted text-left">Approved</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">Product Type</td>
                  <td className="border p-2" colSpan={2}>{lead.product_type.replace('_', ' ').toUpperCase()}</td>
                </tr>
                <tr>
                  <td className="border p-2">Loan Amount</td>
                  <td className="border p-2">{formatCurrency(lead.requested_amount)}</td>
                  <td className="border p-2 font-semibold">{formatCurrency(application.final_amount)}</td>
                </tr>
                <tr>
                  <td className="border p-2">Tenure</td>
                  <td className="border p-2">{lead.requested_tenure_months || 36} months</td>
                  <td className="border p-2 font-semibold">{application.final_tenure_months || '—'} months</td>
                </tr>
                <tr>
                  <td className="border p-2">Interest Rate</td>
                  <td className="border p-2">—</td>
                  <td className="border p-2 font-semibold">{application.final_interest_rate ? `${application.final_interest_rate}%` : '—'}</td>
                </tr>
                <tr>
                  <td className="border p-2">EMI</td>
                  <td className="border p-2">—</td>
                  <td className="border p-2 font-semibold">{formatCurrency(application.final_emi)}</td>
                </tr>
              </tbody>
            </table>
            
            {/* FOIR Details */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Monthly Turnover</div>
                <div className="field-value font-medium">{formatCurrency(Number(application.monthly_turnover))}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Existing Obligations</div>
                <div className="field-value font-medium">{formatCurrency(Number(application.existing_obligations))}</div>
              </div>
              <div className="field">
                <div className="field-label text-xs text-muted-foreground">Calculated FOIR</div>
                <div className="field-value font-medium">{application.calculated_foir ? `${Number(application.calculated_foir).toFixed(1)}%` : '—'}</div>
              </div>
            </div>
          </div>
          
          {/* BRE Decision */}
          <div className="section mb-6">
            <div className="section-title bg-muted p-2 mb-3 border-l-4 border-primary font-semibold flex items-center gap-2">
              {application.bre_decision === 'stp_approved' ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
              BRE DECISION
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Decision: </span>
                {getDecisionBadge()}
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Score: </span>
                <strong>{application.bre_score || '—'}</strong>
              </div>
            </div>
            {application.bre_reasons && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                <strong>Reasons:</strong>
                <ul className="list-disc list-inside mt-1">
                  {(application.bre_reasons as string[]).map((reason: string, i: number) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Recommendation */}
          <div className="section mb-6">
            <div className="section-title bg-muted p-2 mb-3 border-l-4 border-primary font-semibold">
              UNDERWRITER RECOMMENDATION
            </div>
            <div className="p-3 bg-muted/30 rounded min-h-[60px]">
              {application.cam_recommendation || application.cam_notes || 'No recommendation provided'}
            </div>
          </div>
          
          {/* Signature Section */}
          <div className="signature-section grid grid-cols-3 gap-8 mt-10 pt-6 border-t">
            <div className="signature-box text-center">
              <div className="signature-line border-t border-foreground mt-12 pt-2 text-xs">
                Credit Officer
              </div>
            </div>
            <div className="signature-box text-center">
              <div className="signature-line border-t border-foreground mt-12 pt-2 text-xs">
                Sales Manager
              </div>
            </div>
            <div className="signature-box text-center">
              <div className="signature-line border-t border-foreground mt-12 pt-2 text-xs">
                Approving Authority
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
