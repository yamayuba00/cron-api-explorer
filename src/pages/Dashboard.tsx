import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Activity, Clock, Database, AlertCircle, CheckCircle, XCircle, Search, Filter, RefreshCw, TrendingUp, BarChart3, PieChart, Settings, Play, Pause, Zap, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import CronjobTable from '@/components/CronjobTable';
import StatCard from '@/components/StatCard';
import TransactionDetails from '@/components/TransactionDetails';
import { apiClient, CronjobData } from '@/utils/apiClient';
import { useToast } from '@/hooks/use-toast';

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
  const [methodFilter, setMethodFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTransaction, setSelectedTransaction] = useState<CronjobData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [isRealTime, setIsRealTime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [useApiData, setUseApiData] = useState(false);
  const { toast } = useToast();

  // Enhanced mock data generator dengan data yang sesuai contoh
  const generateMockData = (): CronjobData[] => {
    const features = ['GIGR', 'Production Sync', 'Inventory Update', 'Quality Check', 'Material Transfer', 'Order Processing', 'Batch Monitor'];
    const endpoints = [
      'api/grpmobile/gigr/insert-gr-fg',
      '/api/production/sync', 
      '/api/inventory/update', 
      '/api/quality/check', 
      '/api/material/transfer',
      '/api/order/process',
      '/api/batch/monitor'
    ];
    const methods = ['POST', 'GET', 'PUT', 'DELETE', 'CRON'];
    const statuses = ['200', '201', '500', '404', '400', '502', '503'];
    const ips = ['10.1.6.203', '192.168.1.11', '192.168.1.12', '10.0.0.5', '10.0.0.6', '172.16.0.10'];
    
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

    return Array.from({ length: 100 }, (_, i) => ({
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
    if (!useApiData || !apiUrl) {
      return generateMockData();
    }
    
    try {
      apiClient.setBaseUrl(apiUrl);
      const timeRangeHours = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168,
        '30d': 720
      }[timeRange] || 24;
      
      const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
      
      return await apiClient.fetchTransactionHistory({
        limit: 1000,
        startDate,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        feature: featureFilter !== 'all' ? featureFilter : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
      });
    } catch (error) {
      console.error('API fetch failed, using mock data:', error);
      toast({
        title: "API Error",
        description: "Failed to fetch from API, using mock data",
        variant: "destructive",
      });
      return generateMockData();
    }
  };

  // React Query dengan dynamic refresh interval
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['cronjobData', apiUrl, useApiData, timeRange, statusFilter, featureFilter, methodFilter],
    queryFn: fetchCronjobData,
    refetchInterval: isRealTime ? refreshInterval * 1000 : false,
  });

  // Connect to API function
  const handleConnectApi = () => {
    if (!apiUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API URL",
        variant: "destructive",
      });
      return;
    }
    
    setUseApiData(true);
    toast({
      title: "Connecting to API",
      description: `Connecting to: ${apiUrl}`,
    });
    refetch();
  };

  const handleDisconnectApi = () => {
    setUseApiData(false);
    toast({
      title: "Disconnected",
      description: "Switched back to mock data",
    });
    refetch();
  };

  // Advanced filtering logic
  useEffect(() => {
    let filtered = data;
    
    // Time range filter
    const now = new Date();
    const timeRangeHours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }[timeRange] || 24;
    
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.created_at);
      return (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60) <= timeRangeHours;
    });
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ip.includes(searchTerm) ||
        item.desc_transaction.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (featureFilter !== 'all') {
      filtered = filtered.filter(item => item.feature === featureFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(item => item.method === methodFilter);
    }
    
    setFilteredData(filtered);
  }, [data, searchTerm, statusFilter, featureFilter, methodFilter, timeRange]);

  const handleRowClick = (transaction: CronjobData) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  // Enhanced statistics calculations
  const totalJobs = data.length;
  const successJobs = data.filter(item => ['200', '201'].includes(item.status)).length;
  const failedJobs = data.filter(item => ['500', '404', '400', '502', '503'].includes(item.status)).length;
  const avgDuration = data.length > 0 ? parseFloat((data.reduce((sum, item) => sum + item.duration_time, 0) / data.length).toFixed(2)) : 0;
  const errorRate = totalJobs > 0 ? ((failedJobs / totalJobs) * 100).toFixed(1) : '0';
  const throughput = data.filter(item => {
    const itemDate = new Date(item.created_at);
    return (new Date().getTime() - itemDate.getTime()) / (1000 * 60) <= 60; // Last hour
  }).length;

  // Enhanced chart data
  const statusChartData = [
    { name: 'Success (2xx)', value: successJobs, color: '#10B981' },
    { name: 'Client Error (4xx)', value: data.filter(item => ['400', '404'].includes(item.status)).length, color: '#F59E0B' },
    { name: 'Server Error (5xx)', value: data.filter(item => ['500', '502', '503'].includes(item.status)).length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const timeSeriesData = data
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-50)
    .map((item, index) => ({
      time: new Date(item.created_at).toLocaleTimeString(),
      duration: item.duration_time,
      success: ['200', '201'].includes(item.status) ? 1 : 0,
      errors: ['500', '404', '400', '502', '503'].includes(item.status) ? 1 : 0,
      requests: 1
    }));

  // Feature performance data
  const featurePerformanceData = [...new Set(data.map(item => item.feature))].map(feature => {
    const featureData = data.filter(item => item.feature === feature);
    const avgDur = featureData.reduce((sum, item) => sum + item.duration_time, 0) / featureData.length;
    const errorCount = featureData.filter(item => ['500', '404', '400'].includes(item.status)).length;
    
    return {
      feature,
      avgDuration: parseFloat(avgDur.toFixed(2)),
      requests: featureData.length,
      errors: errorCount,
      errorRate: ((errorCount / featureData.length) * 100).toFixed(1)
    };
  });

  const uniqueFeatures = [...new Set(data.map(item => item.feature))];
  const uniqueMethods = [...new Set(data.map(item => item.method))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header dengan API Connection */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              API & Cronjob Monitoring
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time monitoring dan analisis performance
              {isRealTime && (
                <Badge className="bg-green-100 text-green-800 animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Live
                </Badge>
              )}
              {useApiData && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Globe className="w-3 h-3 mr-1" />
                  API Connected
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="realtime"
                checked={isRealTime}
                onCheckedChange={setIsRealTime}
              />
              <Label htmlFor="realtime" className="text-sm">Real-time</Label>
            </div>
            <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5s</SelectItem>
                <SelectItem value="10">10s</SelectItem>
                <SelectItem value="30">30s</SelectItem>
                <SelectItem value="60">1m</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="API Endpoint URL (e.g., https://api.example.com)"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-80"
            />
            {!useApiData ? (
              <Button onClick={handleConnectApi} className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Connect API
              </Button>
            ) : (
              <Button onClick={handleDisconnectApi} variant="outline" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Disconnect
              </Button>
            )}
            <Button onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <StatCard
            title="Total Requests"
            value={totalJobs.toLocaleString()}
            icon={Database}
            trend="+12%"
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value={`${((successJobs/totalJobs)*100).toFixed(1)}%`}
            icon={CheckCircle}
            trend="+8%"
            color="green"
          />
          <StatCard
            title="Error Rate"
            value={`${errorRate}%`}
            icon={XCircle}
            trend="-2%"
            color="red"
          />
          <StatCard
            title="Avg Response"
            value={`${avgDuration}s`}
            icon={Clock}
            trend="-5%"
            color="orange"
          />
          <StatCard
            title="Throughput/h"
            value={throughput.toString()}
            icon={TrendingUp}
            trend="+15%"
            color="blue"
          />
          <StatCard
            title="Uptime"
            value="99.9%"
            icon={Activity}
            trend="+0.1%"
            color="green"
          />
        </div>

        {/* Advanced Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1h</SelectItem>
                  <SelectItem value="6h">Last 6h</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7d</SelectItem>
                  <SelectItem value="30d">Last 30d</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="502">502</SelectItem>
                  <SelectItem value="503">503</SelectItem>
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
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {uniqueMethods.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Charts Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Request Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="requests" 
                        stackId="1"
                        stroke="#3B82F6" 
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
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
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Response Time Trends
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
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Feature Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={featurePerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feature" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgDuration" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Error Rate Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="success" 
                      stackId="1"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="errors" 
                      stackId="1"
                      stroke="#EF4444" 
                      fill="#EF4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Request Logs</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="h-4 w-4" />
                    {filteredData.length} records found
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
          </TabsContent>
        </Tabs>

        {/* Transaction Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
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
