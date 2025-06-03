
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: string;
  color: 'blue' | 'green' | 'red' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    green: 'text-green-400 bg-green-500/20 border-green-500/30',
    red: 'text-red-400 bg-red-500/20 border-red-500/30',
    orange: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
  };

  const trendColor = trend.startsWith('+') ? 'text-green-400' : trend.startsWith('-') ? 'text-red-400' : 'text-gray-400';

  return (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20 transition-all duration-300 hover:shadow-2xl hover:bg-white/15 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{title}</p>
            <p className="text-2xl font-bold text-white mt-1 group-hover:scale-105 transition-transform duration-200">{value}</p>
            <p className={`text-xs mt-1 ${trendColor} flex items-center gap-1`}>
              {trend.startsWith('+') && <span>↗</span>}
              {trend.startsWith('-') && <span>↘</span>}
              {trend} from last week
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${colorClasses[color]} group-hover:scale-110 transition-all duration-200`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
