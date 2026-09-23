"use client";

const REASONS = [] as const;

const PARAGRAPHS = [
  "Because students shouldn't have to build alone.",
  "We saw a gap between what students learn and what they actually get to build.",
  "There are thousands of students with ideas, skills, and the willingness to create — but finding the right people, the right project, and a real opportunity to work together isn't always easy.",
  "Most platforms help you either learn, network, or showcase. Collivio brings those pieces together.",
] as const;

function splitWhyChars(text: string) {
  return text.split("").map((ch, i) => {
    if (ch === " ") {
      return (
        <span className="how-char inline-block" key={`sp-${i}`} style={{ width: "0.3em" }}>
          {" "}
        </span>
      );
    }
    if (ch === "?") {
      return (
        <span
          className="how-char inline-block"
          key={`q-${i}`}
          style={{
            background: "linear-gradient(135deg, #FFD84D, #FF7F9B)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {ch}
        </span>
      );
    }
    return (
      <span className="how-char inline-block" key={`${ch}-${i}`}>
        {ch}
      </span>
    );
  });
}

function splitChars(text: string) {
  return text.split("").map((ch, i) => {
    if (ch === " ") return " ";
    return (
      <span className="char" key={`${ch}-${i}`}>
        {ch}
      </span>
    );
  });
}

export default function WhyPanel() {
  return (
    <div className="why-panel relative w-full text-white">
      <div className="why-title-screen flex h-screen items-center justify-center px-6">
        <h1
          className="why-title text-center font-semibold tracking-tight text-white"
          style={{
            lineHeight: 1,
            padding: "0.2em 0.15em",
            margin: "-0.45em -0.15em",
          }}
        >
          <span className="block whitespace-nowrap text-7xl sm:text-8xl md:text-[9rem] lg:text-[11rem]">
            {splitWhyChars("Why Collivio?")}
          </span>
        </h1>
      </div>

      <div className="why-body pb-48 pt-4">
        <div className="mx-auto max-w-3xl px-6 pb-10">
          <div className="space-y-8">
            {PARAGRAPHS.map((text) => (
              <p
                key={text}
                className="why-paragraph text-xl font-normal leading-relaxed text-[#051230] sm:text-2xl"
              >
                {splitChars(text)}
              </p>
            ))}
          </div>
        </div>

        <div className="why-idea-block mx-auto max-w-3xl px-6 pb-16">
          <h2 className="why-idea-title mb-6 text-3xl font-semibold text-[#051230] sm:text-4xl">
            {splitChars("The idea behind Collivio")}
          </h2>
          <div className="space-y-6">
            <p className="why-paragraph text-lg font-normal leading-relaxed text-[#051230] sm:text-xl">
              {splitChars(
                "A student's potential shouldn't be limited by their college, their network, or whether they already know the right people."
              )}
            </p>
            <p className="why-paragraph text-lg font-normal leading-relaxed text-[#051230] sm:text-xl">
              {splitChars(
                "Collivio is built to make collaboration easier — connecting students, ideas, skills, and opportunities in one place."
              )}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6">
          <p className="why-tagline text-2xl font-semibold text-[#051230] sm:text-3xl">
            {splitChars(
              "Find your people. Build something real. Grow together."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
