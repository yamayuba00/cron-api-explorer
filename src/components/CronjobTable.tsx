
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink } from 'lucide-react';

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

interface CronjobTableProps {
  data: CronjobData[];
  onRowClick: (transaction: CronjobData) => void;
}

const CronjobTable: React.FC<CronjobTableProps> = ({ data, onRowClick }) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      'Success': 'bg-green-100 text-green-800 border-green-200',
      'Failed': 'bg-red-100 text-red-800 border-red-200',
      'Processing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Warning': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return (
      <Badge className={`${variants[status] || 'bg-gray-100 text-gray-800'} border`}>
        {status}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      'GET': 'bg-blue-100 text-blue-800',
      'POST': 'bg-green-100 text-green-800',
      'PUT': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${colors[method] || 'bg-gray-100 text-gray-800'} font-mono text-xs`}>
        {method}
      </Badge>
    );
  };

  const formatDuration = (duration: number) => {
    return duration < 1 ? `${(duration * 1000).toFixed(0)}ms` : `${duration.toFixed(2)}s`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Feature</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.Id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{item.Id}</TableCell>
              <TableCell>
                <div className="font-medium text-sm">{item.feature}</div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {item.endpoint}
                </code>
              </TableCell>
              <TableCell>{getMethodBadge(item.method)}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {item.ip}
                </code>
              </TableCell>
              <TableCell>
                <span className={`text-sm ${item.duration_time > 3 ? 'text-red-600 font-semibold' : item.duration_time > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
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
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No data found</p>
        </div>
      )}
    </div>
  );
};

export default CronjobTable;
