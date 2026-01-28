import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data
const funnelData = [
  { stage: 'Leads', count: 156, conversion: 100 },
  { stage: 'Submitted', count: 124, conversion: 79 },
  { stage: 'BRE Passed', count: 98, conversion: 63 },
  { stage: 'Underwriting', count: 85, conversion: 54 },
  { stage: 'Approved', count: 72, conversion: 46 },
  { stage: 'Disbursed', count: 68, conversion: 44 },
];

const trendData = [
  { month: 'Aug', leads: 120, approved: 52, disbursed: 48 },
  { month: 'Sep', leads: 135, approved: 61, disbursed: 55 },
  { month: 'Oct', leads: 148, approved: 68, disbursed: 62 },
  { month: 'Nov', leads: 142, approved: 65, disbursed: 60 },
  { month: 'Dec', leads: 158, approved: 74, disbursed: 68 },
  { month: 'Jan', leads: 156, approved: 72, disbursed: 68 },
];

const productMix = [
  { name: 'Business Loan', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'Personal Loan', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'STPL', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'PO Finance', value: 10, color: 'hsl(var(--chart-4))' },
];

const rejectionReasons = [
  { reason: 'Low Bureau Score', count: 15, percentage: 35 },
  { reason: 'Insufficient Income', count: 12, percentage: 28 },
  { reason: 'Document Issues', count: 8, percentage: 19 },
  { reason: 'High FOIR', count: 5, percentage: 12 },
  { reason: 'Other', count: 3, percentage: 7 },
];

const topPerformers = [
  { name: 'Amit Singh', leads: 28, conversion: 75, amount: 45 },
  { name: 'Priya Sharma', leads: 24, conversion: 71, amount: 38 },
  { name: 'Rahul Verma', leads: 22, conversion: 68, amount: 35 },
  { name: 'Sneha Gupta', leads: 20, conversion: 65, amount: 32 },
  { name: 'Vikram Joshi', leads: 18, conversion: 61, amount: 28 },
];

export function Analytics() {
  const { isManager } = useAuth();
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & MIS</h1>
          <p className="text-muted-foreground">Business intelligence and reporting</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              12% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disbursed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              8% vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg TAT</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 days</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              0.3 days faster
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2.8Cr</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              15% vs last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
            <CardDescription>Conversion at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stage.stage}</span>
                    <span className="font-medium">{stage.count} ({stage.conversion}%)</span>
                  </div>
                  <Progress 
                    value={stage.conversion} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Leads, approvals & disbursals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="disbursed" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1" />
                <span>Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3" />
                <span>Disbursed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Mix */}
        <Card>
          <CardHeader>
            <CardTitle>Product Mix</CardTitle>
            <CardDescription>Distribution by product type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {productMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {productMix.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rejection Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Rejection Reasons</CardTitle>
            <CardDescription>Top reasons for rejection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rejectionReasons.map((item) => (
                <div key={item.reason}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.reason}</span>
                    <span className="font-medium">{item.count} ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top ROs</CardTitle>
            <CardDescription>Best performing relationship officers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((person, index) => (
                <div key={person.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.leads} leads • {person.conversion}% conv.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{person.amount}L</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
