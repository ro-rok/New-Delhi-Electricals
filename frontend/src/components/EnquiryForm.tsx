import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EnquiryForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    requirements: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in name and phone number",
        variant: "destructive",
      });
      return;
    }

    // Create WhatsApp message
    const message = `*New Enquiry from Website*\n\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}\nRequirements: ${formData.requirements}`;
    const whatsappUrl = `https://wa.me/919654102758?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank");
    
    toast({
      title: "Redirecting to WhatsApp",
      description: "You can also attach photos/PDFs in WhatsApp chat",
    });

    // Reset form
    setFormData({ name: "", phone: "", address: "", requirements: "" });
    setFiles(null);
  };

  return (
    <section id="enquiry-form" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Send Your Enquiry</CardTitle>
              <CardDescription className="text-base">
                Share your requirements and we'll get back to you within 2 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Your location in Delhi NCR"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="List the products you need (switches, wires, lights, fans, etc.)"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Upload Photos/PDF (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Input
                      id="file"
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => setFiles(e.target.files)}
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="mx-auto mb-2 text-muted-foreground" size={32} />
                      <p className="text-sm text-muted-foreground">
                        {files && files.length > 0
                          ? `${files.length} file(s) selected`
                          : "Click to upload site photos, product lists, or requirements"}
                      </p>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Files will be shared via WhatsApp after form submission
                  </p>
                </div>

                <Button type="submit" size="lg" variant="cta" className="w-full">
                  <Send className="mr-2" />
                  Send Enquiry via WhatsApp
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EnquiryForm;