"use client";

import { useState } from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CallToAction } from "@/components/sections/CallToAction";
import { Features } from "@/components/sections/Features";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Partners } from "@/components/sections/Partners";
import { Portals } from "@/components/sections/Portals";
import { StatsRow } from "@/components/sections/StatsRow";
import { LoginModal } from "@/components/ui/login-modal";

export default function Home() {
  const [loginOpen, setLoginOpen] = useState(false);
  const openLogin = () => setLoginOpen(true);

  return (
    <>
      <Navbar onOpenLogin={openLogin} />
      <main>
        <Hero onOpenLogin={openLogin} />
        <StatsRow />
        <HowItWorks />
        <Features />
        <Portals />
        <Partners />
        <CallToAction onOpenLogin={openLogin} />
      </main>
      <Footer />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
