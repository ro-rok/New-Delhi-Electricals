import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEOHead } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { apiPost } from "@/lib/api";
import { z } from "zod";
import Footer from "@/components/Footer";

// Contact form validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number (use format: +1234567890 or 1234567890)"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

const ContactPageContent = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Real-time validation for individual fields
  const validateField = (field: keyof ContactFormData, value: string) => {
    try {
      const fieldSchema = contactFormSchema.shape[field];
      fieldSchema.parse(value);
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormErrors((prev) => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  const handleFieldChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate on blur/change for real-time feedback
    if (value) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: keyof ContactFormData) => {
    const value = formData[field];
    if (value) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setSubmitSuccess(false);
    setSubmitError(null);

    // Validate all fields
    try {
      contactFormSchema.parse(formData);
      setFormErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof ContactFormData] = err.message;
          }
        });
        setFormErrors(errors);
        return;
      }
    }

    // Submit to API
    setIsSubmitting(true);

    try {
      const response = await apiPost("/api/inquiries", formData);

      if (response.success) {
        // Show success message
        setSubmitSuccess(true);
        setSubmitError(null);
        
        // Clear form
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
        setFormErrors({});

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Show error message but preserve form data
        setSubmitError(response.error?.message || "Failed to submit inquiry. Please try again.");
        setSubmitSuccess(false);
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred. Please try again.");
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Us - New Delhi Electricals"
        description="Get in touch with New Delhi Electricals for inquiries, quotes, and support. We're here to help with all your electrical needs."
        type="website"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground">
              Have questions or need assistance? We're here to help you with all your electrical needs.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                  <CardDescription>Reach out to us through any of these channels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Address</h3>
                      <p className="text-sm text-muted-foreground">
                        30 A Corner Market, Malviya Nagar<br />
                        New Delhi – 110017
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <p className="text-sm text-muted-foreground">
                        <a href="tel:+919654102758" className="hover:text-primary transition-colors">
                          +91 9654102758
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-sm text-muted-foreground">
                        <a href="mailto:contact@newdelhielectricals.com" className="hover:text-primary transition-colors">
                          contact@newdelhielectricals.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Operating Hours</h3>
                      <p className="text-sm text-muted-foreground">
                        Monday – Sunday<br />
                        10:00 AM – 7:30 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Quick Response</h3>
                  <p className="text-sm text-muted-foreground">
                    We typically respond to inquiries within 2 hours during business hours.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Success Message */}
                  {submitSuccess && (
                    <Alert className="mb-6 bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">
                        Thank you for contacting us! We've received your inquiry and will get back to you within 2 hours.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Message */}
                  {submitError && (
                    <Alert className="mb-6 bg-red-50 border-red-200">
                      <AlertDescription className="text-red-800">
                        {submitError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        onBlur={() => handleFieldBlur("name")}
                        placeholder="Your full name"
                        className={formErrors.name ? "border-red-500" : ""}
                        disabled={isSubmitting}
                      />
                      {formErrors.name && (
                        <p className="text-sm text-red-500">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        onBlur={() => handleFieldBlur("email")}
                        placeholder="your.email@example.com"
                        className={formErrors.email ? "border-red-500" : ""}
                        disabled={isSubmitting}
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-500">{formErrors.email}</p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        onBlur={() => handleFieldBlur("phone")}
                        placeholder="+919876543210 or 9876543210"
                        className={formErrors.phone ? "border-red-500" : ""}
                        disabled={isSubmitting}
                      />
                      {formErrors.phone && (
                        <p className="text-sm text-red-500">{formErrors.phone}</p>
                      )}
                    </div>

                    {/* Subject Field */}
                    <div className="space-y-2">
                      <Label htmlFor="subject">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleFieldChange("subject", e.target.value)}
                        onBlur={() => handleFieldBlur("subject")}
                        placeholder="What is your inquiry about?"
                        className={formErrors.subject ? "border-red-500" : ""}
                        disabled={isSubmitting}
                      />
                      {formErrors.subject && (
                        <p className="text-sm text-red-500">{formErrors.subject}</p>
                      )}
                    </div>

                    {/* Message Field */}
                    <div className="space-y-2">
                      <Label htmlFor="message">
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleFieldChange("message", e.target.value)}
                        onBlur={() => handleFieldBlur("message")}
                        placeholder="Please provide details about your inquiry..."
                        rows={6}
                        className={formErrors.message ? "border-red-500" : ""}
                        disabled={isSubmitting}
                      />
                      {formErrors.message && (
                        <p className="text-sm text-red-500">{formErrors.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Minimum 10 characters, maximum 2000 characters
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const ContactPage = () => {
  return (
    <ErrorBoundary>
      <ContactPageContent />
    </ErrorBoundary>
  );
};

export default ContactPage;
