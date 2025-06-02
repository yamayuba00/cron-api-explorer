
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Activity, Clock, Database, AlertCircle, CheckCircle, XCircle, Search, Filter, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import CronjobTable from '@/components/CronjobTable';
import StatCard from '@/components/StatCard';
import TransactionDetails from '@/components/TransactionDetails';

interface CronjobData {
  Id: number;
  feature: string;
  endpoint: string;
  method: string;
  desc_transaction: string;
  status: string;
  ip: string;
  user_agent: string;
  duration_time: number;
  created_at: string;
}

const Dashboard = () => {
  const [filteredData, setFilteredData] = useState<CronjobData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<CronjobData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  // Mock data generator untuk simulasi saat API tidak tersedia
  const generateMockData = (): CronjobData[] => {
    const features = ['GIGR', 'Production Sync', 'Inventory Update', 'Quality Check', 'Material Transfer'];
    const endpoints = [
      'api/grpmobile/gigr/insert-gr-fg',
      '/api/production/sync', 
      '/api/inventory/update', 
      '/api/quality/check', 
      '/api/material/transfer'
    ];
    const methods = ['POST', 'GET', 'PUT', 'DELETE', 'CRON'];
    const statuses = ['200', '500', '404', '201', '400'];
    const ips = ['10.1.6.203', '192.168.1.11', '192.168.1.12', '10.0.0.5', '10.0.0.6'];
    
    const mockTransactionData = [
      {
        "parent_id": "PrimeBP146120467716",
        "business_unit": "BP",
        "product_type": "WF-BEAM",
        "production_order": "1100000954",
        "batch_id": "11B2505DE",
        "material_number": null,
        "material_description": "SNI BjP 41 / JIS G3101 SS400 588x300x12x20x12000",
        "heat_no": "11B2505",
        "qty": 1,
        "sloc": "BPF0",
        "gr_status": "Prime",
        "from_sorting": null,
        "type": "Production",
        "ul": "6",
        "created_by": "2",
        "last_scanned": "2025-06-02 13:47:09",
        "rsi_flag": "0",
        "repair_children": []
      }
    ];

    return Array.from({ length: 50 }, (_, i) => ({
      Id: i + 1,
      feature: features[Math.floor(Math.random() * features.length)],
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      desc_transaction: i % 10 === 0 ? 'Berhasil membuat' : JSON.stringify(mockTransactionData),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      ip: ips[Math.floor(Math.random() * ips.length)],
      user_agent: 'Dart/3.7 (dart:io)',
      duration_time: parseFloat((Math.random() * 15 + 0.1).toFixed(2)),
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  // API fetch function
  const fetchCronjobData = async (): Promise<CronjobData[]> => {
    if (!apiUrl) {
      return generateMockData();
    }
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return await response.json();
    } catch (error) {
      console.log('API fetch failed, using mock data:', error);
      return generateMockData();
    }
  };

  // React Query for data fetching
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['cronjobData', apiUrl],
    queryFn: fetchCronjobData,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ip.includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (featureFilter !== 'all') {
      filtered = filtered.filter(item => item.feature === featureFilter);
    }
    
    setFilteredData(filtered);
  }, [data, searchTerm, statusFilter, featureFilter]);

  const handleRowClick = (transaction: CronjobData) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  // Statistics calculations
  const totalJobs = data.length;
  const successJobs = data.filter(item => ['200', '201'].includes(item.status)).length;
  const failedJobs = data.filter(item => ['500', '404', '400'].includes(item.status)).length;
  const avgDuration = data.length > 0 ? parseFloat((data.reduce((sum, item) => sum + item.duration_time, 0) / data.length).toFixed(2)) : 0;

  // Chart data
  const statusChartData = [
    { name: 'Success (2xx)', value: successJobs, color: '#10B981' },
    { name: 'Failed (4xx/5xx)', value: failedJobs, color: '#EF4444' },
    { name: 'Others', value: totalJobs - successJobs - failedJobs, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  const timeSeriesData = data
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20)
    .map(item => ({
      time: new Date(item.created_at).toLocaleTimeString(),
      duration: item.duration_time,
      status: item.status
    }));

  const uniqueFeatures = [...new Set(data.map(item => item.feature))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cronjob Monitoring Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time monitoring dan analisis history data API & cronjob</p>
          </div>
          <div className="flex items-center gap-4">
            <Input
              placeholder="API Endpoint URL"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Jobs"
            value={totalJobs}
            icon={Database}
            trend="+12%"
            color="blue"
          />
          <StatCard
            title="Successful"
            value={successJobs}
            icon={CheckCircle}
            trend="+8%"
            color="green"
          />
          <StatCard
            title="Failed"
            value={failedJobs}
            icon={XCircle}
            trend="-2%"
            color="red"
          />
          <StatCard
            title="Avg Duration"
            value={`${avgDuration}s`}
            icon={Clock}
            trend="-5%"
            color="orange"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Duration Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cronjob History Data</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by feature, endpoint, or IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="201">201</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="404">404</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={featureFilter} onValueChange={setFeatureFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Feature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Features</SelectItem>
                    {uniqueFeatures.map(feature => (
                      <SelectItem key={feature} value={feature}>{feature}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CronjobTable 
              data={filteredData} 
              onRowClick={handleRowClick}
            />
          </CardContent>
        </Card>

        {/* Transaction Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            <TransactionDetails transaction={selectedTransaction} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
