import Hero from "@/components/Hero";
import EnquiryForm from "@/components/EnquiryForm";
import ProductCategories from "@/components/ProductCategories";
import AboutUs from "@/components/AboutUs";
import WhyChooseUs from "@/components/WhyChooseUs";
import Contact from "@/components/Contact";
import WhatsAppButton from "@/components/WhatsAppButton";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <ProductCategories />
      <WhyChooseUs />
      <AboutUs />
      <EnquiryForm />
      <Contact />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;