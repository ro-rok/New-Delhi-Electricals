import { useState } from 'react';
import { 
  Search, Filter, Download, Eye, Mail, Phone, 
  Calendar, ChevronLeft, ChevronRight, MessageSquare
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

interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  productSku?: string;
  message: string;
  source: 'form' | 'whatsapp' | 'photo';
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  createdAt: string;
}

const mockInquiries: Inquiry[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    company: 'Kumar Constructions',
    email: 'rajesh@kumar.com',
    phone: '+91 98765 43210',
    productSku: 'LK-ENT-SW-01',
    message: 'Need bulk quote for 200 units of Entice switches for upcoming project',
    source: 'form',
    status: 'new',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    company: 'Home Interiors',
    email: 'priya@homeint.com',
    phone: '+91 87654 32109',
    message: 'Looking for complete electrical solution for 3BHK apartment',
    source: 'whatsapp',
    status: 'contacted',
    createdAt: '2024-01-14T15:45:00Z'
  },
  {
    id: '3',
    name: 'Amit Patel',
    company: 'Patel Electricals',
    email: 'amit@patel.com',
    phone: '+91 76543 21098',
    message: 'Photo order attached - please match and quote',
    source: 'photo',
    status: 'quoted',
    createdAt: '2024-01-13T09:15:00Z'
  },
];

const statusColors = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  quoted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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

  const filteredInquiries = mockInquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    toast.success('Exporting inquiries to CSV...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Inquiries</h1>
          <p className="text-muted-foreground">{mockInquiries.length} total inquiries</p>
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
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
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
                        <p className="text-sm text-muted-foreground mb-2">{inquiry.company}</p>
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
                <div>
                  <h3 className="text-lg font-semibold">{selectedInquiry.name}</h3>
                  <p className="text-muted-foreground">{selectedInquiry.company}</p>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInquiries;
