import { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, Mail, Phone, 
  Calendar, ChevronLeft, ChevronRight, MessageSquare, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { getInquiries, updateInquiryStatus, deleteInquiry, Inquiry as APIInquiry } from '@/api/inquiries';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  productSku?: string;
  message: string;
  source: 'form' | 'whatsapp' | 'photo';
  status: 'new' | 'in-progress' | 'resolved';
  createdAt: string;
}

// Transform API inquiry to component inquiry format
function transformInquiry(apiInquiry: APIInquiry): Inquiry {
  return {
    id: apiInquiry._id,
    name: apiInquiry.name,
    company: '', // Not in API response
    email: apiInquiry.email,
    phone: apiInquiry.phone,
    productSku: undefined,
    message: apiInquiry.message,
    source: 'form', // Default to form
    status: apiInquiry.status,
    createdAt: apiInquiry.created_at,
  };
}

const statusColors = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const sourceIcons = {
  form: MessageSquare,
  whatsapp: MessageSquare,
  photo: Eye,
};

const AdminInquiries = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inquiries from API
  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      setError(null);
      try {
        const filter = statusFilter === 'all' ? undefined : statusFilter;
        const data = await getInquiries(filter);
        setInquiries(data.map(transformInquiry));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch inquiries');
        toast.error('Failed to load inquiries');
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, [statusFilter]);

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleStatusChange = async (inquiryId: string, newStatus: 'new' | 'in-progress' | 'resolved') => {
    try {
      await updateInquiryStatus(inquiryId, newStatus);
      // Update local state
      setInquiries(prev => 
        prev.map(inq => 
          inq.id === inquiryId ? { ...inq, status: newStatus } : inq
        )
      );
      toast.success('Inquiry status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update inquiry status');
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) {
      return;
    }

    try {
      await deleteInquiry(inquiryId);
      // Remove from local state
      setInquiries(prev => prev.filter(inq => inq.id !== inquiryId));
      toast.success('Inquiry deleted');
      // Close modal if the deleted inquiry was selected
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete inquiry');
    }
  };

  const handleExport = () => {
    toast.success('Exporting inquiries to CSV...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Inquiries</h1>
          <p className="text-muted-foreground">{inquiries.length} total inquiries</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-2">Error loading inquiries</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredInquiries.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No inquiries found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Inquiries will appear here when customers contact you'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inquiries List */}
      {!loading && !error && filteredInquiries.length > 0 && (
        <div className="space-y-3">
          {filteredInquiries.map((inquiry, idx) => {
            const SourceIcon = sourceIcons[inquiry.source];
            return (
              <motion.div
                key={inquiry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-lg font-medium">{inquiry.name[0]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{inquiry.name}</h3>
                            <Badge className={`text-xs ${statusColors[inquiry.status]}`}>
                              {inquiry.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{inquiry.company || inquiry.email}</p>
                          <p className="text-sm line-clamp-1">{inquiry.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <SourceIcon className="h-3 w-3" />
                          {inquiry.source}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Inquiry Detail Modal */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-2xl font-medium">{selectedInquiry.name[0]}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedInquiry.name}</h3>
                  <p className="text-muted-foreground">{selectedInquiry.company || selectedInquiry.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${selectedInquiry.email}`} className="hover:underline">
                    {selectedInquiry.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${selectedInquiry.phone}`} className="hover:underline">
                    {selectedInquiry.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedInquiry.productSku && (
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Product SKU</p>
                  <p className="font-mono text-sm">{selectedInquiry.productSku}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Message</p>
                <p className="text-sm">{selectedInquiry.message}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <Select 
                  value={selectedInquiry.status} 
                  onValueChange={(value) => handleStatusChange(selectedInquiry.id, value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-2" asChild>
                  <a href={`https://wa.me/${selectedInquiry.phone.replace(/\D/g, '')}`} target="_blank">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href={`mailto:${selectedInquiry.email}`}>
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => handleDelete(selectedInquiry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInquiries;
