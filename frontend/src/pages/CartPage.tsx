import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingCart, MessageCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProductUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { PAGE_SEO } from '@/lib/seo';
import { ProductImagePlaceholder } from '@/components/ui/ProductImagePlaceholder';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice, trackWhatsAppClick } = useApp();
  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    whatsappNumber: '',
    email: '',
    gstNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (productId: string, change: number) => {
    const item = cart.find(item => item.product.id === productId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity > 0) {
        updateQuantity(productId, newQuantity);
      } else {
        removeFromCart(productId);
      }
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.businessName || !formData.whatsappNumber) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Name, Business Name, WhatsApp Number)',
        variant: 'destructive',
      });
      return;
    }

    // Validate WhatsApp number format (basic validation)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = formData.whatsappNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !phoneRegex.test(cleanPhone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit WhatsApp number',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    trackWhatsAppClick();

    // Build product list message
    const productList = cart.map(item => {
      return `• ${item.product.name} (SKU: ${item.product.sku})${item.quantity > 1 ? ` x${item.quantity}` : ''}`;
    }).join('\n');

    // Build enquiry message
    let message = `*Product Enquiry*\n\n`;
    message += `*Customer Details:*\n`;
    message += `Name: ${formData.name}\n`;
    message += `Business Name: ${formData.businessName}\n`;
    if (formData.email) {
      message += `Email: ${formData.email}\n`;
    }
    if (formData.gstNumber) {
      message += `GST Number: ${formData.gstNumber}\n`;
    }
    message += `WhatsApp: ${formData.whatsappNumber}\n\n`;
    message += `*Products Requested:*\n${productList}\n\n`;
    message += `Total Items: ${cart.reduce((sum, item) => sum + item.quantity, 0)}\n`;
    message += `Total Value: ₹${totalPrice.toLocaleString('en-IN')}\n\n`;
    message += `Please provide availability and best pricing for the above products.`;

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/919654102758?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Clear cart and form
    clearCart();
    setFormData({
      name: '',
      businessName: '',
      whatsappNumber: '',
      email: '',
      gstNumber: '',
    });
    setIsEnquiryOpen(false);
    setIsSubmitting(false);

    toast({
      title: 'Enquiry Sent!',
      description: 'Redirecting to WhatsApp. Your cart has been cleared.',
    });

    // Navigate to home after a short delay
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead {...PAGE_SEO.cart} />
        <Header />
        <main className="pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-6">
            <div className="text-center py-20">
              <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h1 className="text-3xl font-semibold mb-4">Your cart is empty</h1>
              <p className="text-muted-foreground mb-8">Start adding products to your cart to get started.</p>
              <Button asChild>
                <Link to="/">Browse Products</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
        <WhatsAppFab />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...PAGE_SEO.cart} />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-semibold">Shopping Cart</h1>
            <div className="w-32" /> {/* Spacer for alignment */}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cart.map((item, index) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border rounded-2xl p-6"
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <Link
                        to={getProductUrl(item.product)}
                        className="flex-shrink-0 w-24 h-24 rounded-xl bg-secondary flex items-center justify-center overflow-hidden"
                      >
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ProductImagePlaceholder className="w-full h-full scale-[0.4]" />
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={getProductUrl(item.product)}
                          className="block mb-2 hover:text-primary transition-colors"
                        >
                          <h3 className="font-medium text-lg line-clamp-2">{item.product.name}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-2">SKU: {item.product.sku}</p>
                        <p className="text-lg font-semibold">₹{item.product.listPrice.toLocaleString('en-IN')}</p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2 border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.product.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                        <p className="text-xl font-semibold">
                          ₹{(item.product.listPrice * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <Dialog open={isEnquiryOpen} onOpenChange={setIsEnquiryOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Proceed to Enquire
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Customer Information</DialogTitle>
                      <DialogDescription>
                        Please provide your details to proceed with the enquiry
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEnquirySubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessName">
                          Business Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="businessName"
                          type="text"
                          required
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          placeholder="Enter your business name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">
                          WhatsApp Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="whatsappNumber"
                          type="tel"
                          required
                          value={formData.whatsappNumber}
                          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-muted-foreground text-xs">(Optional)</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your.email@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">
                          GST Number <span className="text-muted-foreground text-xs">(Optional)</span>
                        </Label>
                        <Input
                          id="gstNumber"
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                          placeholder="15-character GST number"
                          maxLength={15}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsEnquiryOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Sending...' : 'Send Enquiry'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
};

export default CartPage;

