import Hero from "./Hero";
import Features from "./Features";
import FixedBackground from "./FixedBackground";

export default function Home() {
  return (
    <>
      <FixedBackground />
      <main className="relative z-10">
        <Hero />
        <Features />
      </main>
    </>
  );
}
