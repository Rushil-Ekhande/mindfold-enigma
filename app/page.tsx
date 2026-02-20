// ============================================================================
// Landing Page — Composes all landing sections
// ============================================================================

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HeroScrollSection from "@/components/landing/HeroScrollSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <HeroScrollSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ReviewsSection />
      <PricingSection />
      <Footer />
    </>
  );
}

