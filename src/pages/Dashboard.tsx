
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Clock, Database, AlertCircle, CheckCircle, XCircle, Search, Filter, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import CronjobTable from '@/components/CronjobTable';
import StatCard from '@/components/StatCard';
import TransactionDetails from '@/components/TransactionDetails';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data generator untuk simulasi
  const generateMockData = () => {
    const features = ['Production Sync', 'Inventory Update', 'Quality Check', 'Material Transfer', 'Batch Processing'];
    const endpoints = ['/api/production/sync', '/api/inventory/update', '/api/quality/check', '/api/material/transfer', '/api/batch/process'];
    const methods = ['POST', 'GET', 'PUT', 'DELETE'];
    const statuses = ['Success', 'Failed', 'Processing', 'Warning'];
    const ips = ['192.168.1.10', '192.168.1.11', '192.168.1.12', '10.0.0.5', '10.0.0.6'];
    
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
      desc_transaction: JSON.stringify(mockTransactionData),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      ip: ips[Math.floor(Math.random() * ips.length)],
      user_agent: 'Mozilla/5.0 (compatible; CronjobBot/1.0)',
      duration_time: parseFloat((Math.random() * 5 + 0.1).toFixed(2)),
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  useEffect(() => {
    const mockData = generateMockData();
    setData(mockData);
    setFilteredData(mockData);
  }, []);

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

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newData = generateMockData();
      setData(newData);
      setIsLoading(false);
    }, 1000);
  };

  // Statistics calculations
  const totalJobs = data.length;
  const successJobs = data.filter(item => item.status === 'Success').length;
  const failedJobs = data.filter(item => item.status === 'Failed').length;
  const avgDuration = data.length > 0 ? (data.reduce((sum, item) => sum + item.duration_time, 0) / data.length).toFixed(2) : 0;

  // Chart data
  const statusChartData = [
    { name: 'Success', value: successJobs, color: '#10B981' },
    { name: 'Failed', value: failedJobs, color: '#EF4444' },
    { name: 'Processing', value: data.filter(item => item.status === 'Processing').length, color: '#F59E0B' },
    { name: 'Warning', value: data.filter(item => item.status === 'Warning').length, color: '#F97316' }
  ];

  const timeSeriesData = data
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
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
          <Button onClick={refreshData} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
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
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
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

        {/* Main Content Tabs */}
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
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
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
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Data Table</TabsTrigger>
                <TabsTrigger value="details">Transaction Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-6">
                <CronjobTable 
                  data={filteredData} 
                  onRowClick={setSelectedTransaction}
                />
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <TransactionDetails transaction={selectedTransaction} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
