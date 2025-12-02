import { Link } from 'react-router-dom';
import { 
  Package, FolderOpen, Tags, MessageSquare, TrendingUp,
  ArrowUpRight, Clock, FileUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { products, categories, brands } from '@/data/mockData';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Products', value: products.length, icon: Package, href: '/admin/products' },
  { label: 'Categories', value: categories.length, icon: FolderOpen, href: '/admin/categories' },
  { label: 'Brands', value: brands.length, icon: Tags, href: '/admin/brands' },
  { label: 'Inquiries', value: 12, icon: MessageSquare, href: '/admin/inquiries' },
];

const recentActivity = [
  { action: 'Product added', item: 'MCB SP 16A', time: '2 hours ago' },
  { action: 'Inquiry received', item: 'Bulk wiring quote', time: '4 hours ago' },
  { action: 'Catalog imported', item: 'ABB_2024.pdf', time: '1 day ago' },
  { action: 'Product updated', item: 'Polycab 4mm Wire', time: '2 days ago' },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-semibold">{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/import">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <FileUp className="h-5 w-5" />
                Import Catalog PDF
                <ArrowUpRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link to="/admin/products?action=new">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Package className="h-5 w-5" />
                Add New Product
                <ArrowUpRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link to="/admin/inquiries">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <MessageSquare className="h-5 w-5" />
                View Inquiries
                <ArrowUpRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.item}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            This Week's Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-semibold">284</p>
              <p className="text-sm text-muted-foreground">Page Views</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">47</p>
              <p className="text-sm text-muted-foreground">Product Views</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">12</p>
              <p className="text-sm text-muted-foreground">WhatsApp Clicks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
