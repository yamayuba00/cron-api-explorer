
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Activity, Zap, Cpu, HardDrive, Network, Clock, Users, Shield, AlertTriangle } from 'lucide-react';

interface MonitoringChartsProps {
  data: any[];
  timeSeriesData: any[];
  statusChartData: any[];
  hourlyData: any[];
  methodDistribution: any[];
  ipAddressData: any[];
  featurePerformanceData: any[];
}

const MonitoringCharts: React.FC<MonitoringChartsProps> = ({
  data,
  timeSeriesData,
  statusChartData,
  hourlyData,
  methodDistribution,
  ipAddressData,
  featurePerformanceData
}) => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

  // Traffic monitoring data
  const trafficData = timeSeriesData.map((item, index) => ({
    ...item,
    traffic: Math.floor(Math.random() * 1000) + 500,
    bandwidth: Math.floor(Math.random() * 100) + 10,
    latency: Math.floor(Math.random() * 50) + 5
  }));

  // System health data
  const systemHealthData = [
    { name: 'CPU Usage', value: 65, threshold: 80, status: 'normal' },
    { name: 'Memory', value: 78, threshold: 85, status: 'warning' },
    { name: 'Disk I/O', value: 45, threshold: 70, status: 'normal' },
    { name: 'Network', value: 32, threshold: 90, status: 'normal' }
  ];

  // Performance radar data
  const performanceRadarData = [
    { subject: 'Response Time', A: 65, B: 75, fullMark: 100 },
    { subject: 'Throughput', A: 85, B: 80, fullMark: 100 },
    { subject: 'Availability', A: 98, B: 95, fullMark: 100 },
    { subject: 'Error Rate', A: 15, B: 20, fullMark: 100 },
    { subject: 'Latency', A: 70, B: 65, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Traffic Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5" />
              Real-time Traffic
              <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-ping"></div>
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
                <Area type="monotone" dataKey="traffic" stroke="#06B6D4" fillOpacity={1} fill="url(#trafficGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Network className="h-5 w-5" />
              Bandwidth & Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
                <Bar yAxisId="left" dataKey="bandwidth" fill="#8B5CF6" opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#F59E0B" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Cpu className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealthData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{item.value}%</span>
                      {item.status === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <Shield className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.value > item.threshold ? 'bg-red-500' : 
                        item.value > item.threshold * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5" />
              Performance Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={performanceRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.3)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
                <Radar name="Current" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Radar name="Previous" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ipAddressData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={100}
                  dataKey="requests"
                  label={({ ip, requests }) => `${ip}: ${requests}`}
                >
                  {ipAddressData.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <HardDrive className="h-5 w-5" />
              Response Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="requests" stroke="rgba(255,255,255,0.7)" name="Requests" />
                <YAxis dataKey="duration" stroke="rgba(255,255,255,0.7)" name="Duration" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
                <Scatter dataKey="duration" fill="#8B5CF6" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5" />
              Error Rate Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }} 
                />
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
      </div>
    </div>
  );
};

export default MonitoringCharts;
