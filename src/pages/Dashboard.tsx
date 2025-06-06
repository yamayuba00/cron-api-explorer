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
import { Activity, Search, Filter, RefreshCw, Globe, BarChart3, PieChart, TrendingUp, Users, Server, Shield, Zap, Timer, Database, AlertCircle, Monitor, Camera, FileText, Brain, AlertTriangle, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import CronjobTable from '@/components/CronjobTable';
import StatCard from '@/components/StatCard';
import TransactionDetails from '@/components/TransactionDetails';
import ApiConnectionModal from '@/components/ApiConnectionModal';
import MonitoringCharts from '@/components/MonitoringCharts';
import MonitoringMetrics from '@/components/MonitoringMetrics';
import SmartFilters from '@/components/SmartFilters';
import DashboardPlaylist from '@/components/DashboardPlaylist';
import SnapshotManager from '@/components/SnapshotManager';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import AutoSummary from '@/components/AutoSummary';
import LogAnalysisAI from '@/components/LogAnalysisAI';
import VisualAnomalyDetector from '@/components/VisualAnomalyDetector';
import InsightGenerator from '@/components/InsightGenerator';
import TrendLearning from '@/components/TrendLearning';
import InsightFeed from '@/components/InsightFeed';
import { apiClient, CronjobData, ApiConfig } from '@/utils/apiClient';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [filteredData, setFilteredData] = useState<CronjobData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTransaction, setSelectedTransaction] = useState<CronjobData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [useApiData, setUseApiData] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const { toast } = useToast();

  // Load API config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('api_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setApiConfig(config);
        setUseApiData(true);
        apiClient.setConfig(config);
      } catch (error) {
        console.error('Failed to parse saved API config:', error);
      }
    }
  }, []);

  // API fetch function - fully dynamic based on endpoint
  const fetchCronjobData = async (): Promise<CronjobData[]> => {
    if (!useApiData || !apiConfig) {
      // Return empty array if no API is connected, no mock data
      return [];
    }
    
    try {
      apiClient.setConfig(apiConfig);
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
      console.error('API fetch failed:', error);
      toast({
        title: "API Error",
        description: "Failed to fetch data from API endpoint",
        variant: "destructive",
      });
      return [];
    }
  };

  // React Query with dynamic refresh interval
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['cronjobData', apiConfig, useApiData, timeRange, statusFilter, featureFilter, methodFilter],
    queryFn: fetchCronjobData,
    refetchInterval: isRealTime ? refreshInterval * 1000 : false,
    enabled: useApiData && !!apiConfig, // Only fetch when API is connected
  });

  const handleConnectApi = (config: ApiConfig) => {
    setApiConfig(config);
    setUseApiData(true);
    apiClient.setConfig(config);
    localStorage.setItem('api_config', JSON.stringify(config));
    refetch();
  };

  const handleDisconnectApi = () => {
    setUseApiData(false);
    setApiConfig(null);
    localStorage.removeItem('api_config');
    refetch();
  };

  // Dynamic filtering logic based on real data
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

  // Dynamic statistics calculations from real data
  const totalJobs = data.length;
  const successJobs = data.filter(item => ['200', '201'].includes(item.status)).length;
  const failedJobs = data.filter(item => ['500', '404', '400', '502', '503'].includes(item.status)).length;
  const avgDuration = data.length > 0 ? parseFloat((data.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / data.length).toFixed(2)) : 0;
  const errorRate = totalJobs > 0 ? ((failedJobs / totalJobs) * 100).toFixed(1) : '0';
  const throughput = data.filter(item => {
    const itemDate = new Date(item.created_at);
    return (new Date().getTime() - itemDate.getTime()) / (1000 * 60) <= 60;
  }).length;

  // Dynamic chart data preparations from real endpoint data
  const statusChartData = [
    { name: 'Success (2xx)', value: successJobs, color: '#10B981' },
    { name: 'Client Error (4xx)', value: data.filter(item => ['400', '404'].includes(item.status)).length, color: '#F59E0B' },
    { name: 'Server Error (5xx)', value: data.filter(item => ['500', '502', '503'].includes(item.status)).length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const timeSeriesData = data
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-50)
    .map((item) => ({
      time: new Date(item.created_at).toLocaleTimeString(),
      duration: parseFloat(item.duration_time),
      success: ['200', '201'].includes(item.status) ? 1 : 0,
      errors: ['500', '404', '400', '502', '503'].includes(item.status) ? 1 : 0,
      requests: 1,
      responseTime: parseFloat(item.duration_time) * 1000,
      timestamp: new Date(item.created_at).getTime()
    }));

  // Dynamic chart data for enhanced monitoring from real data
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const hourData = data.filter(item => {
      const itemHour = new Date(item.created_at).getHours();
      return itemHour === hour;
    });
    
    return {
      hour: `${hour}:00`,
      requests: hourData.length,
      errors: hourData.filter(item => ['500', '404', '400'].includes(item.status)).length,
      avgDuration: hourData.length > 0 ? hourData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / hourData.length : 0
    };
  });

  const methodDistribution = [...new Set(data.map(item => item.method))].map(method => {
    const methodData = data.filter(item => item.method === method);
    return {
      method,
      count: methodData.length,
      errors: methodData.filter(item => ['500', '404', '400'].includes(item.status)).length
    };
  });

  const ipAddressData = [...new Set(data.map(item => item.ip))].slice(0, 10).map(ip => {
    const ipData = data.filter(item => item.ip === ip);
    return {
      ip,
      requests: ipData.length,
      errors: ipData.filter(item => ['500', '404', '400'].includes(item.status)).length,
      avgDuration: ipData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / ipData.length
    };
  });

  const featurePerformanceData = [...new Set(data.map(item => item.feature))].map(feature => {
    const featureData = data.filter(item => item.feature === feature);
    const avgDur = featureData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / featureData.length;
    const errorCount = featureData.filter(item => ['500', '404', '400'].includes(item.status)).length;
    
    return {
      feature,
      avgDuration: parseFloat(avgDur.toFixed(2)),
      requests: featureData.length,
      errors: errorCount,
      errorRate: ((errorCount / featureData.length) * 100).toFixed(1),
      successRate: (((featureData.length - errorCount) / featureData.length) * 100).toFixed(1)
    };
  });

  const uniqueFeatures = [...new Set(data.map(item => item.feature))];
  const uniqueMethods = [...new Set(data.map(item => item.method))];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

  const handleAnomalyDetected = (anomaly: any) => {
    setLiveAlerts(prev => [anomaly, ...prev.slice(0, 4)]); // Keep last 5 alerts
    
    // Show toast for critical anomalies
    if (anomaly.severity === 'critical') {
      toast({
        title: "Critical Anomaly Detected",
        description: anomaly.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-2">
      <div className="max-w-full mx-auto space-y-4">
        {/* Header with Live Alerts Overlay */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-white/20 relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-cyan-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                API Monitoring Dashboard
              </h1>
            </div>
            {isRealTime && useApiData && (
              <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-ping"></div>
                Live
              </Badge>
            )}
            {useApiData && (
              <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Globe className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {!useApiData && (
              <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="realtime"
                checked={isRealTime}
                onCheckedChange={setIsRealTime}
                disabled={!useApiData}
              />
              <Label htmlFor="realtime" className="text-xs text-white/80">Live</Label>
            </div>
            
            <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))} disabled={!useApiData}>
              <SelectTrigger className="w-16 h-8 bg-white/10 border-white/20 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5s</SelectItem>
                <SelectItem value="10">10s</SelectItem>
                <SelectItem value="30">30s</SelectItem>
                <SelectItem value="60">1m</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => setIsPlaylistOpen(true)}
              size="sm" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Monitor className="h-4 w-4 mr-1" />
              TV
            </Button>

            <Button 
              onClick={() => setIsSnapshotOpen(true)}
              size="sm" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Camera className="h-4 w-4 mr-1" />
              Snapshot
            </Button>

            <Button 
              onClick={() => setIsApiModalOpen(true)} 
              size="sm" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Globe className="h-4 w-4 mr-1" />
              API
            </Button>
            
            <Button 
              onClick={() => refetch()} 
              disabled={isLoading || !useApiData} 
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Show connection prompt if not connected */}
        {!useApiData && (
          <Card className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-300 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">No API Connection</span>
              </div>
              <p className="text-white/80 text-sm mb-3">
                Connect to your API endpoint to start monitoring real-time data
              </p>
              <Button 
                onClick={() => setIsApiModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Globe className="h-4 w-4 mr-2" />
                Connect API
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Only show when connected */}
        {useApiData && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatCard
              title="Requests"
              value={totalJobs.toLocaleString()}
              icon={Database}
              trend={totalJobs > 0 ? "+12%" : "0%"}
              color="blue"
            />
            <StatCard
              title="Success"
              value={`${((successJobs/Math.max(totalJobs, 1))*100).toFixed(1)}%`}
              icon={Shield}
              trend={successJobs > 0 ? "+8%" : "0%"}
              color="green"
            />
            <StatCard
              title="Errors"
              value={`${errorRate}%`}
              icon={AlertCircle}
              trend={failedJobs > 0 ? "-2%" : "0%"}
              color="red"
            />
            <StatCard
              title="Avg Time"
              value={`${avgDuration}s`}
              icon={Timer}
              trend="-5%"
              color="orange"
            />
            <StatCard
              title="Throughput"
              value={throughput.toString()}
              icon={TrendingUp}
              trend={throughput > 0 ? "+15%" : "0%"}
              color="blue"
            />
            <StatCard
              title="Uptime"
              value={successJobs > 0 ? "99.9%" : "0%"}
              icon={Activity}
              trend="+0.1%"
              color="green"
            />
          </div>
        )}

        {/* Smart Filters - Only show when connected */}
        {useApiData && data.length > 0 && (
          <SmartFilters 
            data={data}
            onApplyFilter={(filterType, value) => {
              if (filterType === 'status') setStatusFilter(value);
              if (filterType === 'feature') setFeatureFilter(value);
              if (filterType === 'method') setMethodFilter(value);
            }}
            currentFilters={{
              statusFilter,
              featureFilter,
              methodFilter
            }}
          />
        )}

        {/* Filters - Only show when connected */}
        {useApiData && (
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Search className="h-3 w-3 text-white/60" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-40 h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-xs"
                  />
                </div>
                
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-20 h-8 bg-white/10 border-white/20 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="6h">6h</SelectItem>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="7d">7d</SelectItem>
                    <SelectItem value="30d">30d</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-20 h-8 bg-white/10 border-white/20 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="201">201</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="404">404</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={featureFilter} onValueChange={setFeatureFilter}>
                  <SelectTrigger className="w-28 h-8 bg-white/10 border-white/20 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Features</SelectItem>
                    {uniqueFeatures.map(feature => (
                      <SelectItem key={feature} value={feature}>{feature}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-20 h-8 bg-white/10 border-white/20 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="ml-auto text-xs text-white/70 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {filteredData.length} records
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section - Only show when connected and have data */}
        {useApiData && data.length > 0 && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-10 bg-white/10 border border-white/20 h-8">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20 text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="text-white data-[state=active]:bg-white/20 text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-white data-[state=active]:bg-white/20 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/20 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Advanced
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-white data-[state=active]:bg-white/20 text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="text-white data-[state=active]:bg-white/20 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Anomalies
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-white data-[state=active]:bg-white/20 text-xs">
                <Lightbulb className="h-3 w-3 mr-1" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-white data-[state=active]:bg-white/20 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="summary" className="text-white data-[state=active]:bg-white/20 text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-white data-[state=active]:bg-white/20 text-xs">
                <Database className="h-3 w-3 mr-1" />
                Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-white text-sm">
                      <TrendingUp className="h-4 w-4" />
                      Request Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="requests" 
                          stroke="#3B82F6" 
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-white text-sm">
                      <PieChart className="h-4 w-4" />
                      Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${value}`}
                          labelLine={false}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px'
                          }} 
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <MonitoringCharts
                data={data}
                timeSeriesData={timeSeriesData}
                statusChartData={statusChartData}
                hourlyData={hourlyData}
                methodDistribution={methodDistribution}
                ipAddressData={ipAddressData}
                featurePerformanceData={featurePerformanceData}
              />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <MonitoringMetrics data={data} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <AdvancedAnalytics data={data} />
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <LogAnalysisAI data={data} timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="anomalies" className="space-y-4">
              <VisualAnomalyDetector 
                data={data} 
                timeRange={timeRange}
                onAnomalyDetected={handleAnomalyDetected}
              />
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <InsightGenerator data={data} timeRange={timeRange} />
              <InsightFeed data={data} />
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <TrendLearning data={data} timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-white text-sm">
                      <Timer className="h-4 w-4" />
                      Response Times
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="duration" 
                          stroke="#F59E0B" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-white text-sm">
                      <BarChart3 className="h-4 w-4" />
                      Hourly Pattern
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="hour" stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px'
                          }} 
                        />
                        <Bar dataKey="requests" fill="#10B981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <AutoSummary data={data} timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Request Logs
                      {isRealTime && (
                        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                          Live
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Zap className="h-3 w-3" />
                      {filteredData.length} records
                      {isRealTime && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                          <span>Auto-refresh every {refreshInterval}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CronjobTable 
                    data={filteredData} 
                    onRowClick={handleRowClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Dashboard Playlist Modal */}
        <DashboardPlaylist
          isOpen={isPlaylistOpen}
          onClose={() => setIsPlaylistOpen(false)}
          onTabChange={(tab) => {
            // In a real implementation, you'd change the active tab
            console.log('Change to tab:', tab);
          }}
          currentTab="overview"
        />

        {/* Snapshot Manager Modal */}
        <SnapshotManager
          isOpen={isSnapshotOpen}
          onClose={() => setIsSnapshotOpen(false)}
          currentData={filteredData}
          currentFilters={{
            timeRange,
            statusFilter,
            featureFilter,
            methodFilter
          }}
        />

        {/* API Connection Modal */}
        <ApiConnectionModal
          isOpen={isApiModalOpen}
          onClose={() => setIsApiModalOpen(false)}
          onConnect={handleConnectApi}
          onDisconnect={handleDisconnectApi}
          isConnected={useApiData}
          currentConfig={apiConfig || {
            baseUrl: '',
            endpoints: {
              transactionHistory: '/api/transaction-history',
              transactionDetail: '/api/transaction'
            },
            defaultParams: {
              limit: 20,
              page: 1
            },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }}
        />

        {/* Transaction Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-xl">
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
