import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Our Store",
    details: ["30 A Corner Market, Malviya Nagar", "Maharishi Dayanand Marg", "New Delhi – 110017"],
  },
  {
    icon: Phone,
    title: "Call or WhatsApp",
    details: ["9654102758", "(10:00 AM – 7:30 PM)"],
  },
  {
    icon: Clock,
    title: "Operating Hours",
    details: ["Monday – Sunday", "10:00 AM – 7:30 PM"],
  },
];

const Contact = () => {
  const handleDirections = () => {
    window.open("https://maps.google.com/?q=30+A+Corner+Market+Malviya+Nagar+New+Delhi+110017", "_blank");
  };

  const handleCall = () => {
    window.location.href = "tel:+919654102758";
  };

  return (
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Get In Touch</h2>
          <p className="text-lg text-muted-foreground">
            Visit us at our store or reach out for quick assistance
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Map Placeholder */}
            <Card className="shadow-card overflow-hidden">
              <div className="h-[400px] bg-muted relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3505.012827743395!2d77.20827731508026!3d28.533199982452733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce204634ddddd%3A0x9e2a145f6e98c4d8!2sCorner%20Market%2C%20Malviya%20Nagar%2C%20New%20Delhi%2C%20Delhi%20110017!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="New Delhi Electricals Location"
                ></iframe>
                <div className="absolute bottom-4 right-4">
                  <Button onClick={handleDirections} variant="cta" size="sm">
                    <Navigation className="mr-2" size={16} />
                    Get Directions
                  </Button>
                </div>
              </div>
            </Card>

            {/* Contact Info Cards */}
            <div className="space-y-6">
              {contactInfo.map((info) => (
                <Card key={info.title} className="shadow-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <info.icon className="text-primary" size={20} />
                      </div>
                      <CardTitle className="text-lg">{info.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {info.details.map((detail, idx) => (
                      <p key={idx} className={idx === 0 ? "font-semibold" : "text-muted-foreground"}>
                        {detail}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ))}

              <Button onClick={handleCall} variant="cta" size="lg" className="w-full">
                <Phone className="mr-2" />
                Call Now: 9654102758
              </Button>
            </div>
          </div>

          {/* Service Area Notice */}
          <Card className="shadow-card bg-accent/5 border-accent/20">
            <CardContent className="py-6 text-center">
              <p className="text-lg">
                <span className="font-semibold">Delivering Across Delhi NCR</span>
                <span className="mx-3">•</span>
                Same-Day Delivery Available in South Delhi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;