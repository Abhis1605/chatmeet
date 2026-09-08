import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import FeaturesSection from "@/components/landing/FeaturesSection";
import RoomsVsGroups from "@/components/landing/RoomsVsGroups";
import SuccessStories from "@/components/landing/SuccessStories";
import FAQSection from "@/components/landing/FAQSection";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Navbar />
      <Hero />
      <Problem />
      <FeaturesSection />
      <RoomsVsGroups />
      <SuccessStories />
      <FAQSection />
    </main>
  );
}
