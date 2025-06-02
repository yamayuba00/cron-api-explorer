
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface CronjobData {
  Id: string;
  feature: string;
  endpoint: string;
  method: string;
  desc_transaction: string;
  status: string;
  ip: string;
  user_agent: string;
  duration_time: string;
  created_at: string;
}

interface CronjobTableProps {
  data: CronjobData[];
  onRowClick: (transaction: CronjobData) => void;
}

const CronjobTable: React.FC<CronjobTableProps> = ({ data, onRowClick }) => {
  const getStatusBadge = (status: string) => {
    const isSuccess = ['200', '201'].includes(status);
    const isClientError = ['400', '404'].includes(status);
    const isServerError = ['500', '502', '503'].includes(status);
    
    let className = 'border ';
    if (isSuccess) {
      className += 'bg-green-100 text-green-800 border-green-200';
    } else if (isClientError) {
      className += 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (isServerError) {
      className += 'bg-red-100 text-red-800 border-red-200';
    } else {
      className += 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    return (
      <Badge className={className}>
        {status}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      'GET': 'bg-blue-100 text-blue-800 border-blue-200',
      'POST': 'bg-green-100 text-green-800 border-green-200',
      'PUT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'DELETE': 'bg-red-100 text-red-800 border-red-200',
      'CRON': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    return (
      <Badge className={`${colors[method] || 'bg-gray-100 text-gray-800 border-gray-200'} font-mono text-xs border`}>
        {method}
      </Badge>
    );
  };

  const formatDuration = (duration: string) => {
    const durationNum = parseFloat(duration);
    return durationNum < 1 ? `${(durationNum * 1000).toFixed(0)}ms` : `${durationNum.toFixed(2)}s`;
  };

  const getDurationColor = (duration: string) => {
    const durationNum = parseFloat(duration);
    if (durationNum > 10) return 'text-red-600 font-semibold';
    if (durationNum > 5) return 'text-yellow-600 font-medium';
    if (durationNum > 2) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="rounded-md border bg-white/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200/50">
            <TableHead className="w-16 font-semibold">ID</TableHead>
            <TableHead className="font-semibold">Feature</TableHead>
            <TableHead className="font-semibold">Endpoint</TableHead>
            <TableHead className="font-semibold">Method</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">IP Address</TableHead>
            <TableHead className="font-semibold">Duration</TableHead>
            <TableHead className="font-semibold">Created At</TableHead>
            <TableHead className="w-24 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.Id} className="hover:bg-white/60 transition-colors border-b border-gray-100/50">
              <TableCell className="font-medium text-gray-900">{item.Id}</TableCell>
              <TableCell>
                <div className="font-medium text-sm text-gray-900">{item.feature}</div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100/80 px-2 py-1 rounded font-mono">
                  {item.endpoint}
                </code>
              </TableCell>
              <TableCell>{getMethodBadge(item.method)}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100/80 px-2 py-1 rounded font-mono">
                  {item.ip}
                </code>
              </TableCell>
              <TableCell>
                <span className={`text-sm ${getDurationColor(item.duration_time)}`}>
                  {formatDuration(item.duration_time)}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(item.created_at).toLocaleString('id-ID')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRowClick(item)}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-medium">No data found</p>
            <p className="text-sm">Try adjusting your filters or time range</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CronjobTable;
