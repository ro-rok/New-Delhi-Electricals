import { Link } from 'react-router-dom';
import { 
  Package, FolderOpen, Tags, MessageSquare, TrendingUp,
  ArrowUpRight, Clock, FileUp, Eye, MousePointer, MessageCircle, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getProducts, getCategories, getBrands } from '@/api/products';
import { getTrackingSummary, TrackingSummary } from '@/api/tracking';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [productsCount, setProductsCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [brandsCount, setBrandsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, catsList, brandsList, trackingData] = await Promise.all([
          getProducts({ pageSize: 1 }),
          getCategories(),
          getBrands(),
          getTrackingSummary('7d'),
        ]);
        setProductsCount(productsResponse.total);
        setCategoriesCount(catsList.length);
        setBrandsCount(brandsList.length);
        setTracking(trackingData);
      } catch (error) {
              } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Products', value: productsCount, icon: Package, href: '/admin/products' },
    { label: 'Categories', value: categoriesCount, icon: FolderOpen, href: '/admin/categories' },
    { label: 'Brands', value: brandsCount, icon: Tags, href: '/admin/brands' },
    { label: 'Inquiries', value: 0, icon: MessageSquare, href: '/admin/inquiries' },
  ];

  const recentActivity = [
    { action: 'Product added', item: 'MCB SP 16A', time: '2 hours ago' },
    { action: 'Inquiry received', item: 'Bulk wiring quote', time: '4 hours ago' },
    { action: 'Catalog imported', item: 'ABB_2024.pdf', time: '1 day ago' },
    { action: 'Product updated', item: 'Polycab 4mm Wire', time: '2 days ago' },
  ];
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
          <div className="grid grid-cols-4 gap-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-semibold">{tracking?.pageViews ?? 0}</p>
              <p className="text-sm text-muted-foreground">Page Views</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-semibold">{tracking?.productViews ?? 0}</p>
              <p className="text-sm text-muted-foreground">Product Views</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-semibold">{tracking?.whatsappClicks ?? 0}</p>
              <p className="text-sm text-muted-foreground">WhatsApp Clicks</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                <Search className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-3xl font-semibold">{tracking?.searches ?? 0}</p>
              <p className="text-sm text-muted-foreground">Searches</p>
            </motion.div>
          </div>

          {/* Top Viewed Products */}
          {tracking?.topProducts && tracking.topProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Most Viewed Products</h4>
              <div className="space-y-2">
                {tracking.topProducts.slice(0, 5).map((product, idx) => (
                  <div key={product.productId} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5">#{idx + 1}</span>
                      <span className="text-sm">{product.name}</span>
                    </div>
                    <span className="text-sm font-medium">{product.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
