import { useState } from 'react';
import { 
  User, Lock, Bell, Shield, Globe, Palette,
  Save, Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const AdminSettings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Profile
    username: 'admin',
    email: 'admin@nde.com',
    
    // Security
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    
    // Notifications
    emailOnInquiry: true,
    emailOnImport: true,
    emailDigest: false,
    
    // Site
    siteName: 'NDE Electricals',
    whatsappNumber: '+919654102758',
    currency: 'INR',
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved`);
  };

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and site settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="site" className="gap-2">
            <Globe className="h-4 w-4" />
            Site
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary-foreground">
                      {settings.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{settings.username}</h3>
                    <p className="text-sm text-muted-foreground">{settings.email}</p>
                    <Badge variant="secondary" className="mt-2">Administrator</Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={(e) => updateSetting('username', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('Profile')} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your login credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={settings.currentPassword}
                      onChange={(e) => updateSetting('currentPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={settings.newPassword}
                    onChange={(e) => updateSetting('newPassword', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={settings.confirmPassword}
                    onChange={(e) => updateSetting('confirmPassword', e.target.value)}
                  />
                </div>
                <Button onClick={() => handleSave('Password')} className="gap-2">
                  <Lock className="h-4 w-4" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {settings.twoFactorEnabled 
                        ? 'Your account is protected with 2FA'
                        : 'Enable 2FA for enhanced security'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      updateSetting('twoFactorEnabled', checked);
                      toast.success(checked ? '2FA enabled' : '2FA disabled');
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    key: 'emailOnInquiry',
                    label: 'New Inquiry Alert',
                    description: 'Get notified when a new customer inquiry is submitted',
                  },
                  {
                    key: 'emailOnImport',
                    label: 'Import Completion',
                    description: 'Get notified when a catalog import is completed',
                  },
                  {
                    key: 'emailDigest',
                    label: 'Daily Digest',
                    description: 'Receive a daily summary of activity',
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onCheckedChange={(checked) => updateSetting(item.key, checked)}
                    />
                  </div>
                ))}

                <Separator />

                <Button onClick={() => handleSave('Notification')} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Site Tab */}
        <TabsContent value="site">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Site Configuration</CardTitle>
                <CardDescription>General settings for your catalog</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    value={settings.whatsappNumber}
                    onChange={(e) => updateSetting('whatsappNumber', e.target.value)}
                    placeholder="+91..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +91 for India)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Currency is fixed to INR for this catalog
                  </p>
                </div>

                <Separator />

                <Button onClick={() => handleSave('Site')} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;