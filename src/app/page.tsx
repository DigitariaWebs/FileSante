"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
import { ROLE_HOME, useAuth } from "@/lib/filesante/auth";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const openLogin = () => setLoginOpen(true);

  // Auto-open login if redirected from a gated route.
  useEffect(() => {
    if (params.get("login") === "1") setLoginOpen(true);
  }, [params]);

  // If already authenticated, bounce to role home unless explicitly browsing.
  useEffect(() => {
    if (user && params.get("logout") !== "1" && params.get("stay") !== "1") {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, params, router]);

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
