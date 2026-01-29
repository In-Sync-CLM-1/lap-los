import { LucideIcon, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { exportToCSV, exportToExcel, type ExportData } from '@/lib/export-utils';

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  recordCount: number;
  additionalInfo?: string;
  isLoading?: boolean;
  onGenerateReport: () => Promise<ExportData | null>;
  filename: string;
}

export function ReportCard({
  title,
  description,
  icon: Icon,
  recordCount,
  additionalInfo,
  isLoading = false,
  onGenerateReport,
  filename,
}: ReportCardProps) {
  const handleExportCSV = async () => {
    const data = await onGenerateReport();
    if (data) {
      exportToCSV(data, filename);
    }
  };

  const handleExportExcel = async () => {
    const data = await onGenerateReport();
    if (data) {
      exportToExcel(data, filename);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                <span className="font-medium text-foreground">{recordCount.toLocaleString()}</span> records
                {additionalInfo && (
                  <span className="ml-3 text-muted-foreground">| {additionalInfo}</span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isLoading || recordCount === 0}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isLoading || recordCount === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
