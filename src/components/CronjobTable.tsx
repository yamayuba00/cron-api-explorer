
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis 
} from '@/components/ui/pagination';

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

type SortField = 'Id' | 'feature' | 'status' | 'duration_time' | 'created_at';
type SortDirection = 'asc' | 'desc';

const CronjobTable: React.FC<CronjobTableProps> = ({ data, onRowClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'duration_time') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    } else if (sortField === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (sortField === 'Id') {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-3 w-3" /> : 
      <ChevronDown className="h-3 w-3" />;
  };

  const getStatusBadge = (status: string) => {
    const isSuccess = ['200', '201'].includes(status);
    const isClientError = ['400', '404'].includes(status);
    const isServerError = ['500', '502', '503'].includes(status);
    
    let className = 'border transition-all duration-200 hover:scale-105 ';
    if (isSuccess) {
      className += 'bg-green-100 text-green-800 border-green-200 animate-pulse';
    } else if (isClientError) {
      className += 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (isServerError) {
      className += 'bg-red-100 text-red-800 border-red-200 animate-bounce';
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
      <Badge className={`${colors[method] || 'bg-gray-100 text-gray-800 border-gray-200'} font-mono text-xs border transition-all duration-200 hover:scale-105`}>
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
    if (durationNum > 10) return 'text-red-600 font-semibold animate-pulse';
    if (durationNum > 5) return 'text-yellow-600 font-medium';
    if (durationNum > 2) return 'text-orange-600';
    return 'text-green-600';
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
            className="cursor-pointer transition-all duration-200 hover:scale-105"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Show</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-20 h-8 bg-white/10 border-white/20 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-white/70">entries</span>
        </div>
        
        <div className="text-sm text-white/70">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} results
        </div>
      </div>

      <div className="rounded-md border bg-white/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200/50">
              <TableHead className="w-16 font-semibold">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('Id')}
                  className="h-8 p-0 hover:bg-transparent flex items-center gap-1"
                >
                  ID
                  <SortIcon field="Id" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('feature')}
                  className="h-8 p-0 hover:bg-transparent flex items-center gap-1"
                >
                  Feature
                  <SortIcon field="feature" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">Endpoint</TableHead>
              <TableHead className="font-semibold">Method</TableHead>
              <TableHead className="font-semibold">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="h-8 p-0 hover:bg-transparent flex items-center gap-1"
                >
                  Status
                  <SortIcon field="status" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">IP Address</TableHead>
              <TableHead className="font-semibold">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('duration_time')}
                  className="h-8 p-0 hover:bg-transparent flex items-center gap-1"
                >
                  Duration
                  <SortIcon field="duration_time" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('created_at')}
                  className="h-8 p-0 hover:bg-transparent flex items-center gap-1"
                >
                  Created At
                  <SortIcon field="created_at" />
                </Button>
              </TableHead>
              <TableHead className="w-24 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow 
                key={item.Id} 
                className="hover:bg-white/60 transition-all duration-200 border-b border-gray-100/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium text-gray-900">{item.Id}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm text-gray-900">{item.feature}</div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100/80 px-2 py-1 rounded font-mono transition-all duration-200 hover:bg-gray-200/80">
                    {item.endpoint}
                  </code>
                </TableCell>
                <TableCell>{getMethodBadge(item.method)}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100/80 px-2 py-1 rounded font-mono transition-all duration-200 hover:bg-gray-200/80">
                    {item.ip}
                  </code>
                </TableCell>
                <TableCell>
                  <span className={`text-sm transition-all duration-200 ${getDurationColor(item.duration_time)}`}>
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
                    className="h-8 w-8 p-0 hover:bg-blue-100 transition-all duration-200 hover:scale-110"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {paginatedData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 animate-bounce"></div>
              <p className="text-lg font-medium">No data found</p>
              <p className="text-sm">Try adjusting your filters or time range</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </PaginationItem>

              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && <PaginationEllipsis />}
                </>
              )}

              {renderPaginationItems()}

              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <PaginationEllipsis />}
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default CronjobTable;
