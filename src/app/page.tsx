import Hero from "./Hero";
import Features from "./Features";
import Showcase from "./Showcase";
import HowItWorks from "./HowItWorks";
import FixedBackground from "./FixedBackground";

export default function Home() {
  return (
    <>
      <FixedBackground />
      <main className="relative z-10">
        <Hero />
        <Features />
        <Showcase />
        <HowItWorks />
      </main>
    </>
  );
}
