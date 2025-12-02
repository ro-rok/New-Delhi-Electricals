import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppButton = () => {
  const handleClick = () => {
    const message = encodeURIComponent("Hi! I need help with electrical products.");
    window.open(`https://wa.me/919654102758?text=${message}`, "_blank");
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      variant="cta"
      className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 shadow-elevated hover:scale-110 transition-transform p-0"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle size={28} />
    </Button>
  );
};

export default WhatsAppButton;