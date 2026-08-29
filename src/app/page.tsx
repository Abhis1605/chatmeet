import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import FeaturesSection from "@/components/landing/FeaturesSection";
import RoomsVsGroups from "@/components/landing/RoomsVsGroups";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Navbar />
      <Hero />
      <Problem />
      <FeaturesSection />
      <RoomsVsGroups />
    </main>
  );
}
