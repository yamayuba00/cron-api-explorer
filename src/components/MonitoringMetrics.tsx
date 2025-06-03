
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Zap, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';

interface MonitoringMetricsProps {
  data: any[];
}

const MonitoringMetrics: React.FC<MonitoringMetricsProps> = ({ data }) => {
  // Calculate metrics
  const totalRequests = data.length;
  const successCount = data.filter(item => ['200', '201'].includes(item.status)).length;
  const errorCount = data.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
  const avgResponseTime = totalRequests > 0 ? 
    data.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / totalRequests : 0;
  
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
  
  // Simulated system metrics
  const cpuUsage = Math.random() * 40 + 30; // 30-70%
  const memoryUsage = Math.random() * 30 + 50; // 50-80%
  const diskUsage = Math.random() * 20 + 40; // 40-60%
  const networkThroughput = Math.random() * 100 + 50; // 50-150 MB/s

  const getHealthStatus = () => {
    if (successRate >= 95) return { status: 'Excellent', color: 'bg-green-500', textColor: 'text-green-600' };
    if (successRate >= 90) return { status: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    if (successRate >= 80) return { status: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { status: 'Poor', color: 'bg-red-500', textColor: 'text-red-600' };
  };

  const health = getHealthStatus();

  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    progress, 
    color = 'blue',
    animate = false 
  }: {
    title: string;
    value: number | string;
    unit?: string;
    icon: any;
    progress?: number;
    color?: string;
    animate?: boolean;
  }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100',
      purple: 'text-purple-600 bg-purple-100'
    };

    return (
      <Card className="bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300 hover:scale-105">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{title}</p>
              <div className="flex items-center gap-1">
                <span className={`text-2xl font-bold ${animate ? 'animate-pulse' : ''}`}>
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </span>
                {unit && <span className="text-sm text-gray-500">{unit}</span>}
              </div>
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          {progress !== undefined && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const AlertItem = ({ type, message, time }: { type: string; message: string; time: string }) => {
    const alertColors = {
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
      <div className={`p-3 rounded-lg border ${alertColors[type]} animate-fade-in`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        <p className="text-xs opacity-75 mt-1">{time}</p>
      </div>
    );
  };

  // Sample alerts
  const alerts = [
    { type: 'error', message: 'High error rate detected on /api/production/sync', time: '2 minutes ago' },
    { type: 'warning', message: 'Response time above threshold', time: '5 minutes ago' },
    { type: 'info', message: 'System backup completed successfully', time: '1 hour ago' }
  ];

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Activity className="h-4 w-4" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${health.color} animate-pulse`}></div>
              <span className="text-white font-medium">Overall Status: {health.status}</span>
            </div>
            <Badge className={`${health.textColor} bg-white/20 border-white/30`}>
              {successRate.toFixed(1)}% Uptime
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-white animate-pulse">{totalRequests}</div>
              <div className="text-xs text-white/70">Total Requests</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{successCount}</div>
              <div className="text-xs text-white/70">Successful</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-red-400 animate-bounce">{errorCount}</div>
              <div className="text-xs text-white/70">Errors</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{avgResponseTime.toFixed(2)}s</div>
              <div className="text-xs text-white/70">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={cpuUsage}
          unit="%"
          icon={Cpu}
          progress={cpuUsage}
          color={cpuUsage > 80 ? 'red' : cpuUsage > 60 ? 'yellow' : 'green'}
          animate={cpuUsage > 80}
        />
        <MetricCard
          title="Memory Usage"
          value={memoryUsage}
          unit="%"
          icon={HardDrive}
          progress={memoryUsage}
          color={memoryUsage > 85 ? 'red' : memoryUsage > 70 ? 'yellow' : 'blue'}
        />
        <MetricCard
          title="Disk Usage"
          value={diskUsage}
          unit="%"
          icon={HardDrive}
          progress={diskUsage}
          color="purple"
        />
        <MetricCard
          title="Network I/O"
          value={networkThroughput}
          unit="MB/s"
          icon={Network}
          color="green"
          animate={true}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Requests/min"
          value={Math.floor(totalRequests / 60)}
          icon={TrendingUp}
          color="blue"
          animate={true}
        />
        <MetricCard
          title="Avg Response Time"
          value={avgResponseTime}
          unit="s"
          icon={Clock}
          color={avgResponseTime > 5 ? 'red' : avgResponseTime > 2 ? 'yellow' : 'green'}
          animate={avgResponseTime > 5}
        />
        <MetricCard
          title="Active Connections"
          value={Math.floor(Math.random() * 50 + 10)}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Recent Alerts */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Shield className="h-4 w-4" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, index) => (
            <AlertItem
              key={index}
              type={alert.type}
              message={alert.message}
              time={alert.time}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringMetrics;
