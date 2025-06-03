
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, RefreshCw, FileText, Database, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransactionDetailsProps {
  transaction: any;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  if (!transaction) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transaction Selected</h3>
          <p className="text-gray-600 text-center">
            Pilih baris dari tabel untuk melihat detail transaksi lengkap
          </p>
        </CardContent>
      </Card>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Data has been copied to clipboard",
    });
  };

  const downloadJson = () => {
    const dataStr = JSON.stringify(transaction, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaction-${transaction.Id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseTransactionData = () => {
    try {
      return JSON.parse(transaction.desc_transaction);
    } catch (error) {
      return null;
    }
  };

  const transactionData = parseTransactionData();

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatJsonForDisplay = (data: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    
    if (data === null) return 'null';
    if (typeof data === 'undefined') return 'undefined';
    if (typeof data === 'string') return `"${data}"`;
    if (typeof data === 'number' || typeof data === 'boolean') return String(data);
    
    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      const items = data.map(item => 
        `${spaces}  ${formatJsonForDisplay(item, indent + 1)}`
      ).join(',\n');
      return `[\n${items}\n${spaces}]`;
    }
    
    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) return '{}';
      const items = entries.map(([key, value]) => 
        `${spaces}  "${key}": ${formatJsonForDisplay(value, indent + 1)}`
      ).join(',\n');
      return `{\n${items}\n${spaces}}`;
    }
    
    return String(data);
  };

  const renderJsonTree = (data: any, parentKey: string = '', level: number = 0) => {
    if (typeof data !== 'object' || data === null) {
      return (
        <span className={`text-sm ${typeof data === 'string' ? 'text-green-600' : typeof data === 'number' ? 'text-blue-600' : 'text-gray-600'}`}>
          {JSON.stringify(data)}
        </span>
      );
    }

    if (Array.isArray(data)) {
      return (
        <div className="ml-4">
          {data.map((item, index) => {
            const itemKey = `${parentKey}[${index}]`;
            const isExpanded = expandedItems.has(itemKey);
            
            return (
              <div key={index} className="border-l border-gray-200 pl-4 my-2">
                <button
                  onClick={() => toggleExpanded(itemKey)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>{isExpanded ? '▼' : '▶'}</span>
                  Item {index + 1}
                  {item.parent_id && (
                    <Badge variant="outline" className="text-xs">
                      {item.parent_id}
                    </Badge>
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-2">
                    {renderJsonTree(item, itemKey, level + 1)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="ml-4">
        {Object.entries(data).map(([key, value]) => {
          const itemKey = `${parentKey}.${key}`;
          const isExpanded = expandedItems.has(itemKey);
          const isObject = typeof value === 'object' && value !== null;
          
          return (
            <div key={key} className="my-1">
              {isObject ? (
                <>
                  <button
                    onClick={() => toggleExpanded(itemKey)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>{isExpanded ? '▼' : '▶'}</span>
                    <span className="text-purple-600">{key}</span>
                    {Array.isArray(value) && (
                      <Badge variant="outline" className="text-xs">
                        {value.length} items
                      </Badge>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-1">
                      {renderJsonTree(value, itemKey, level + 1)}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-600">{key}:</span>
                  {renderJsonTree(value, itemKey, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Parse duration_time to number to avoid toFixed error
  const durationTime = parseFloat(transaction.duration_time);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Transaction Details - ID: {transaction.Id}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(transaction.created_at).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(transaction, null, 2))}>
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
              <Button variant="outline" size="sm" onClick={downloadJson}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transaction">Transaction Data</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Feature:</span>
                  <span className="text-sm">{transaction.feature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Endpoint:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{transaction.endpoint}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Method:</span>
                  <Badge variant="outline">{transaction.method}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={
                    ['200', '201'].includes(transaction.status) ? 'bg-green-100 text-green-800' :
                    ['400', '404'].includes(transaction.status) ? 'bg-yellow-100 text-yellow-800' :
                    ['500', '502', '503'].includes(transaction.status) ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {transaction.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">IP Address:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{transaction.ip}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Duration:</span>
                  <span className={`text-sm font-semibold ${
                    durationTime > 3 ? 'text-red-600' : 
                    durationTime > 1 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {durationTime < 1 ? 
                      `${(durationTime * 1000).toFixed(0)}ms` : 
                      `${durationTime.toFixed(2)}s`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">User Agent:</span>
                  <span className="text-xs text-gray-600 max-w-48 truncate">{transaction.user_agent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{new Date(transaction.created_at).toLocaleString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transaction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Parsed Transaction Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionData ? (
                <ScrollArea className="h-96 w-full">
                  <div className="font-mono text-sm">
                    {renderJsonTree(transactionData)}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Invalid JSON data in transaction</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Raw JSON Data
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(JSON.stringify(transaction, null, 2))}
                  className="ml-auto"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="relative">
                  <pre className="text-xs bg-gray-50 p-4 rounded-md font-mono leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                    <code className="language-json">
                      {formatJsonForDisplay(transaction)}
                    </code>
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionDetails;
