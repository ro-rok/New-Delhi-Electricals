import { useState } from 'react';
import { 
  Search, Filter, Download, Calendar, User, FileUp, 
  Package, Edit, Trash2, Eye, Clock, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type LogAction = 'import' | 'create' | 'update' | 'delete' | 'view' | 'export';

interface ActivityLog {
  id: string;
  action: LogAction;
  entity: 'product' | 'category' | 'brand' | 'inquiry' | 'catalog';
  entityName: string;
  details: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

// TODO: Replace with API call when backend endpoint is available
const mockLogs: ActivityLog[] = [];

const actionIcons: Record<LogAction, typeof FileUp> = {
  import: FileUp,
  create: Package,
  update: Edit,
  delete: Trash2,
  view: Eye,
  export: Download,
};

const actionColors: Record<LogAction, string> = {
  import: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  create: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  update: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  view: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  export: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

const AdminLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = 
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const handleExport = () => {
    toast.success('Exporting activity logs...');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Activity Logs</h1>
          <p className="text-muted-foreground">Track all admin actions and changes</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Actions', value: mockLogs.length, icon: Clock },
          { label: 'Imports', value: mockLogs.filter(l => l.action === 'import').length, icon: FileUp },
          { label: 'Products Created', value: mockLogs.filter(l => l.action === 'create' && l.entity === 'product').length, icon: Package },
          { label: 'Updates', value: mockLogs.filter(l => l.action === 'update').length, icon: Edit },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="inquiry">Inquiry</SelectItem>
                <SelectItem value="catalog">Catalog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, idx) => {
                const ActionIcon = actionIcons[log.action];
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border"
                  >
                    <TableCell>
                      <Badge className={`gap-1 ${actionColors[log.action]}`}>
                        <ActionIcon className="h-3 w-3" />
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{log.entity}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.entityName}</p>
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                        {log.metadata && (
                          <div className="flex gap-2 mt-1">
                            {Object.entries(log.metadata).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{log.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.timestamp)}
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;