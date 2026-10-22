/**
 * NON-PRODUCTION seed data for Collivio.
 *
 * Run with:
 *   npm run seed
 *
 * Refuses to run when NODE_ENV=production unless ALLOW_SEED=true.
 * Demo auth users are synthetic: they populate the platform but cannot log in.
 * Sign up normally to create a real account for yourself.
 */
import { db } from "../src/lib/db";
import {
  applicationStatusHistory,
  applications,
  bookmarks,
  communities,
  communityMembers,
  discussions,
  eventRegistrations,
  events,
  mediaPosts,
  notifications,
  opportunities,
  organizations,
  profiles,
  projectContributors,
  projects,
  resources,
} from "../src/lib/db/schema";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
  console.error("Refusing to seed production. Set ALLOW_SEED=true to override.");
  process.exit(1);
}

const day = 86_400_000;
const future = (days: number) => new Date(Date.now() + days * day);
const past = (days: number) => new Date(Date.now() - days * day);

const P = {
  aarav: "a0000000-0000-4000-8000-000000000001",
  priya: "a0000000-0000-4000-8000-000000000002",
  rohan: "a0000000-0000-4000-8000-000000000003",
  ananya: "a0000000-0000-4000-8000-000000000004",
  kabir: "a0000000-0000-4000-8000-000000000005",
  meera: "a0000000-0000-4000-8000-000000000006",
  dev: "a0000000-0000-4000-8000-000000000007",
  sara: "a0000000-0000-4000-8000-000000000008",
  nikhil: "a0000000-0000-4000-8000-000000000009",
  ishita: "a0000000-0000-4000-8000-00000000000a",
  admin: "a0000000-0000-4000-8000-00000000000b",
};

const O = {
  lumen: "b0000000-0000-4000-8000-000000000001",
  northstar: "b0000000-0000-4000-8000-000000000002",
};

const OP = {
  o1: "c0000000-0000-4000-8000-000000000001",
  o2: "c0000000-0000-4000-8000-000000000002",
  o3: "c0000000-0000-4000-8000-000000000003",
  o4: "c0000000-0000-4000-8000-000000000004",
  o5: "c0000000-0000-4000-8000-000000000005",
  o6: "c0000000-0000-4000-8000-000000000006",
  o7: "c0000000-0000-4000-8000-000000000007",
  o8: "c0000000-0000-4000-8000-000000000008",
};

const R = {
  r1: "d0000000-0000-4000-8000-000000000001",
  r2: "d0000000-0000-4000-8000-000000000002",
  r3: "d0000000-0000-4000-8000-000000000003",
  r4: "d0000000-0000-4000-8000-000000000004",
  r5: "d0000000-0000-4000-8000-000000000005",
  r6: "d0000000-0000-4000-8000-000000000006",
};

const M = {
  m1: "e0000000-0000-4000-8000-000000000001",
  m2: "e0000000-0000-4000-8000-000000000002",
  m3: "e0000000-0000-4000-8000-000000000003",
  m4: "e0000000-0000-4000-8000-000000000004",
  m5: "e0000000-0000-4000-8000-000000000005",
  m6: "e0000000-0000-4000-8000-000000000006",
  m7: "e0000000-0000-4000-8000-000000000007",
  m8: "e0000000-0000-4000-8000-000000000008",
};

const C = {
  c1: "f0000000-0000-4000-8000-000000000001",
  c2: "f0000000-0000-4000-8000-000000000002",
  c3: "f0000000-0000-4000-8000-000000000003",
  c4: "f0000000-0000-4000-8000-000000000004",
  c5: "f0000000-0000-4000-8000-000000000005",
  c6: "f0000000-0000-4000-8000-000000000006",
};

const E = {
  e1: "11000000-0000-4000-8000-000000000001",
  e2: "11000000-0000-4000-8000-000000000002",
  e3: "11000000-0000-4000-8000-000000000003",
  e4: "11000000-0000-4000-8000-000000000004",
  e5: "11000000-0000-4000-8000-000000000005",
};

const RES = {
  s1: "12000000-0000-4000-8000-000000000001",
  s2: "12000000-0000-4000-8000-000000000002",
  s3: "12000000-0000-4000-8000-000000000003",
  s4: "12000000-0000-4000-8000-000000000004",
  s5: "12000000-0000-4000-8000-000000000005",
  s6: "12000000-0000-4000-8000-000000000006",
};

const D = {
  d1: "13000000-0000-4000-8000-000000000001",
  d2: "13000000-0000-4000-8000-000000000002",
  d3: "13000000-0000-4000-8000-000000000003",
  d4: "13000000-0000-4000-8000-000000000004",
  d5: "13000000-0000-4000-8000-000000000005",
  d6: "13000000-0000-4000-8000-000000000006",
};

const A = {
  a1: "14000000-0000-4000-8000-000000000001",
  a2: "14000000-0000-4000-8000-000000000002",
  a3: "14000000-0000-4000-8000-000000000003",
  a4: "14000000-0000-4000-8000-000000000004",
};

async function main() {
  console.log("Seeding Collivio demo data…");

  await db
    .insert(profiles)
    .values([
      {
        id: P.aarav,
        authUserId: "seed-aarav",
        email: "aarav@seed.collivio.local",
        role: "student",
        displayName: "Aarav Mehta",
        avatarUrl: "https://i.pravatar.cc/300?img=11",
        bio: "CS undergrad building developer tools and ML side projects. Currently exploring retrieval-augmented generation.",
        college: "IIT Bombay",
        degree: "B.Tech",
        branch: "Computer Science",
        graduationYear: 2027,
        skills: ["TypeScript", "React", "Python", "PyTorch", "PostgreSQL"],
        interests: ["AI", "Developer tools", "Open source"],
        githubUrl: "https://github.com/",
        linkedinUrl: "https://linkedin.com/",
        onboarded: true,
      },
      {
        id: P.priya,
        authUserId: "seed-priya",
        email: "priya@seed.collivio.local",
        role: "student",
        displayName: "Priya Sharma",
        avatarUrl: "https://i.pravatar.cc/300?img=32",
        bio: "Product designer who codes. I care about accessible interfaces and campus communities.",
        college: "BITS Pilani",
        degree: "B.Des",
        branch: "Interaction Design",
        graduationYear: 2026,
        skills: ["Figma", "Design systems", "React", "Accessibility"],
        interests: ["Design", "EdTech", "Communities"],
        onboarded: true,
      },
      {
        id: P.rohan,
        authUserId: "seed-rohan",
        email: "rohan@seed.collivio.local",
        role: "student",
        displayName: "Rohan Iyer",
        avatarUrl: "https://i.pravatar.cc/300?img=13",
        bio: "Embedded systems and IoT. I build sensor networks for campus sustainability projects.",
        college: "NIT Trichy",
        degree: "B.Tech",
        branch: "Electronics",
        graduationYear: 2026,
        skills: ["C++", "ESP32", "MQTT", "PCB design"],
        interests: ["IoT", "Sustainability", "Hardware"],
        onboarded: true,
      },
      {
        id: P.ananya,
        authUserId: "seed-ananya",
        email: "ananya@seed.collivio.local",
        role: "student",
        displayName: "Ananya Rao",
        avatarUrl: "https://i.pravatar.cc/300?img=45",
        bio: "ML researcher in training. Working on multilingual NLP and low-resource datasets.",
        college: "IIIT Hyderabad",
        degree: "M.Tech",
        branch: "Computer Science",
        graduationYear: 2027,
        skills: ["Python", "NLP", "Transformers", "Hugging Face"],
        interests: ["NLP", "Research", "Open datasets"],
        onboarded: true,
      },
      {
        id: P.kabir,
        authUserId: "seed-kabir",
        email: "kabir@seed.collivio.local",
        role: "student",
        displayName: "Kabir Singh",
        avatarUrl: "https://i.pravatar.cc/300?img=15",
        bio: "Full-stack developer shipping side projects every month. Next.js and Postgres enthusiast.",
        college: "VIT Vellore",
        degree: "B.Tech",
        branch: "Information Technology",
        graduationYear: 2026,
        skills: ["Next.js", "Node.js", "Drizzle", "Tailwind CSS"],
        interests: ["Startups", "Web", "Hackathons"],
        onboarded: true,
      },
      {
        id: P.meera,
        authUserId: "seed-meera",
        email: "meera@seed.collivio.local",
        role: "student",
        displayName: "Meera Nair",
        avatarUrl: "https://i.pravatar.cc/300?img=47",
        bio: "Data science student interested in public policy and civic data.",
        college: "NIT Surathkal",
        degree: "B.Tech",
        branch: "Data Science",
        graduationYear: 2027,
        skills: ["Python", "Pandas", "SQL", "Data visualization"],
        interests: ["Civic tech", "Data", "Policy"],
        onboarded: true,
      },
      {
        id: P.dev,
        authUserId: "seed-dev",
        email: "dev@seed.collivio.local",
        role: "student",
        displayName: "Dev Patel",
        avatarUrl: "https://i.pravatar.cc/300?img=12",
        bio: "Robotics and computer vision. Building autonomous rover prototypes.",
        college: "IIT Delhi",
        degree: "B.Tech",
        branch: "Mechanical Engineering",
        graduationYear: 2026,
        skills: ["ROS", "OpenCV", "Python", "CAD"],
        interests: ["Robotics", "Computer vision", "Hardware"],
        onboarded: true,
      },
      {
        id: P.sara,
        authUserId: "seed-sara",
        email: "sara@seed.collivio.local",
        role: "student",
        displayName: "Sara Khan",
        avatarUrl: "https://i.pravatar.cc/300?img=25",
        bio: "Campus photographer and content writer. Documenting student life one frame at a time.",
        college: "Delhi University",
        degree: "B.A.",
        branch: "English Literature",
        graduationYear: 2027,
        skills: ["Photography", "Copywriting", "Lightroom", "Storytelling"],
        interests: ["Media", "Campus life", "Design"],
        onboarded: true,
      },
      {
        id: P.nikhil,
        authUserId: "seed-nikhil",
        email: "nikhil@lumenlabs.example",
        role: "business",
        displayName: "Nikhil Verma",
        avatarUrl: "https://i.pravatar.cc/300?img=52",
        bio: "Talent lead at Lumen Labs.",
        college: "Lumen Labs",
        onboarded: true,
      },
      {
        id: P.ishita,
        authUserId: "seed-ishita",
        email: "ishita@northstar.example",
        role: "business",
        displayName: "Ishita Bose",
        avatarUrl: "https://i.pravatar.cc/300?img=44",
        bio: "Research programs at Northstar.",
        college: "Northstar Research",
        onboarded: true,
      },
      {
        id: P.admin,
        authUserId: "seed-admin",
        email: "admin@seed.collivio.local",
        role: "admin",
        displayName: "Collivio Admin",
        onboarded: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(organizations)
    .values([
      {
        id: O.lumen,
        ownerId: P.nikhil,
        name: "Lumen Labs",
        slug: "lumen-labs",
        website: "https://example.com",
        logoUrl: "https://i.pravatar.cc/300?img=52",
        description:
          "A product studio building accessible learning tools for students. We hire interns across engineering, design and data.",
        verified: true,
        verificationStatus: "approved",
      },
      {
        id: O.northstar,
        ownerId: P.ishita,
        name: "Northstar Research",
        slug: "northstar-research",
        website: "https://example.com",
        logoUrl: "https://i.pravatar.cc/300?img=44",
        description:
          "An applied research lab focused on multilingual AI, climate data and human-centred computing.",
        verified: true,
        verificationStatus: "approved",
      },
    ])
    .onConflictDoNothing();

  const opps = [
    {
      id: OP.o1,
      title: "Frontend Engineering Intern",
      slug: "frontend-engineering-intern-lumen",
      type: "internship" as const,
      description:
        "Join Lumen Labs for a 12-week internship building accessible learning interfaces with Next.js and TypeScript. You will work directly with designers and senior engineers, ship real features and take part in weekly product reviews.",
      responsibilities:
        "Build reusable React components, improve accessibility, write tests and collaborate on design reviews.",
      eligibility: "Current students graduating in 2026–2028 with a portfolio of web projects.",
      skills: ["React", "TypeScript", "CSS", "Accessibility"],
      preferredSkills: ["Next.js", "Testing"],
      location: "Bengaluru",
      remote: "hybrid" as const,
      compensation: "₹40,000 / month stipend",
      duration: "12 weeks",
      deadline: future(24),
      requiredDocuments: ["Resume", "Portfolio"],
      status: "published" as const,
      publishedAt: past(3),
      organizationId: O.lumen,
      createdBy: P.nikhil,
    },
    {
      id: OP.o2,
      title: "Applied ML Research Intern",
      slug: "applied-ml-research-intern-northstar",
      type: "research" as const,
      description:
        "Work with the Northstar multilingual NLP team on low-resource language datasets. You will help design experiments, clean datasets, run evaluations and contribute to an internal research report.",
      responsibilities:
        "Prepare datasets, fine-tune transformer models, run ablations and document results.",
      eligibility: "Students with coursework in ML/NLP and comfortable with Python.",
      skills: ["Python", "PyTorch", "NLP"],
      preferredSkills: ["Hugging Face", "Statistics"],
      location: "Remote",
      remote: "remote" as const,
      compensation: "₹35,000 / month stipend",
      duration: "6 months",
      deadline: future(18),
      requiredDocuments: ["Resume"],
      status: "published" as const,
      publishedAt: past(5),
      organizationId: O.northstar,
      createdBy: P.ishita,
    },
    {
      id: OP.o3,
      title: "Product Design Intern",
      slug: "product-design-intern-lumen",
      type: "internship" as const,
      description:
        "Shape the student experience across web and mobile. You will own small end-to-end design problems, prototype in Figma and collaborate closely with engineering.",
      responsibilities:
        "User research, wireframes, high-fidelity prototypes and design QA.",
      eligibility: "Design students with a strong portfolio; coding is a plus.",
      skills: ["Figma", "Prototyping", "User research"],
      preferredSkills: ["Design systems", "Accessibility"],
      location: "Bengaluru",
      remote: "onsite" as const,
      compensation: "₹35,000 / month stipend",
      duration: "10 weeks",
      deadline: future(12),
      requiredDocuments: ["Resume", "Portfolio"],
      status: "published" as const,
      publishedAt: past(1),
      organizationId: O.lumen,
      createdBy: P.nikhil,
    },
    {
      id: OP.o4,
      title: "Backend Engineering Intern",
      slug: "backend-engineering-intern-lumen",
      type: "internship" as const,
      description:
        "Help build the APIs and data pipelines behind Lumen's learning platform. You will work with PostgreSQL, serverless functions and observability tooling.",
      responsibilities:
        "Design REST endpoints, write migrations, improve query performance and add integration tests.",
      eligibility: "Students comfortable with SQL and at least one backend language.",
      skills: ["Node.js", "PostgreSQL", "API design"],
      preferredSkills: ["Drizzle ORM", "Serverless"],
      location: "Remote",
      remote: "remote" as const,
      compensation: "₹45,000 / month stipend",
      duration: "12 weeks",
      deadline: future(30),
      requiredDocuments: ["Resume"],
      status: "published" as const,
      publishedAt: past(7),
      organizationId: O.lumen,
      createdBy: P.nikhil,
    },
    {
      id: OP.o5,
      title: "Climate Data Research Fellowship",
      slug: "climate-data-research-fellowship",
      type: "scholarship" as const,
      description:
        "A 10-week funded fellowship for students working on climate datasets, civic dashboards or environmental sensing. Includes mentorship and a stipend.",
      responsibilities:
        "Complete a scoped research project, publish a short report and present at demo day.",
      eligibility: "Undergraduate or postgraduate students in any discipline.",
      skills: ["Data analysis", "Python", "Storytelling"],
      preferredSkills: ["GIS", "Data visualization"],
      location: "Remote",
      remote: "remote" as const,
      compensation: "₹25,000 grant",
      duration: "10 weeks",
      deadline: future(40),
      requiredDocuments: ["Resume", "Project proposal"],
      status: "published" as const,
      publishedAt: past(9),
      organizationId: O.northstar,
      createdBy: P.ishita,
    },
    {
      id: OP.o6,
      title: "Campus Innovation Hackathon 2026",
      slug: "campus-innovation-hackathon-2026",
      type: "hackathon" as const,
      description:
        "A 36-hour hackathon for student teams solving campus and community problems. Tracks include sustainability, accessibility and student wellbeing.",
      responsibilities: "Form a team, build a prototype and present to judges.",
      eligibility: "Teams of 2–4 currently enrolled students.",
      skills: ["Product thinking", "Prototyping"],
      preferredSkills: ["Any stack"],
      location: "IIT Bombay",
      remote: "onsite" as const,
      compensation: "₹1,00,000 prize pool",
      duration: "36 hours",
      deadline: future(15),
      requiredDocuments: [],
      status: "published" as const,
      publishedAt: past(2),
      organizationId: O.lumen,
      createdBy: P.nikhil,
    },
    {
      id: OP.o7,
      title: "Junior Data Analyst",
      slug: "junior-data-analyst-lumen",
      type: "job" as const,
      description:
        "A full-time entry-level role for graduating students. You will turn product data into decisions through dashboards, experiments and clear storytelling.",
      responsibilities:
        "Build dashboards, define metrics, run analyses and present findings to product teams.",
      eligibility: "Graduating in 2026; strong SQL and communication skills.",
      skills: ["SQL", "Python", "Statistics"],
      preferredSkills: ["dbt", "Looker"],
      location: "Bengaluru",
      remote: "hybrid" as const,
      compensation: "₹9–12 LPA",
      duration: "Full-time",
      deadline: future(45),
      requiredDocuments: ["Resume"],
      status: "published" as const,
      publishedAt: past(11),
      organizationId: O.lumen,
      createdBy: P.nikhil,
    },
    {
      id: OP.o8,
      title: "Open Source Documentation Contributor",
      slug: "open-source-documentation-contributor",
      type: "other" as const,
      description:
        "Help improve onboarding docs for an open-source data toolkit. A flexible, remote contribution with a small stipend and mentorship.",
      responsibilities: "Write tutorials, improve API references and review community PRs.",
      eligibility: "Students with strong writing skills and basic Python knowledge.",
      skills: ["Technical writing", "Python", "Git"],
      preferredSkills: ["Docs-as-code"],
      location: "Remote",
      remote: "remote" as const,
      compensation: "₹15,000 stipend",
      duration: "6 weeks",
      deadline: future(20),
      requiredDocuments: ["Writing sample"],
      status: "published" as const,
      publishedAt: past(4),
      organizationId: O.northstar,
      createdBy: P.ishita,
    },
  ];

  await db.insert(opportunities).values(opps).onConflictDoNothing();

  await db
    .insert(projects)
    .values([
      {
        id: R.r1,
        ownerId: P.aarav,
        title: "CampusRAG — an assistant for course material",
        slug: "campusrag-assistant",
        description:
          "A retrieval-augmented assistant that answers questions from lecture notes and past papers. Built as a student project to make revision faster and more reliable.",
        abstract:
          "We chunk course PDFs, generate embeddings and retrieve grounded context before calling an LLM. The system cites the source page for each answer.",
        objectives:
          "Reduce hallucination on course questions and measure answer grounding against a hand-labelled set.",
        category: "AI / ML",
        techStack: ["Next.js", "Python", "pgvector", "OpenAI"],
        skillsRequired: ["Frontend", "Evaluation", "Information retrieval"],
        coverImageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        githubUrl: "https://github.com/",
        status: "published",
        visibility: "public",
        collaborationOpen: true,
      },
      {
        id: R.r2,
        ownerId: P.priya,
        title: "Quiet Campus — accessible wayfinding",
        slug: "quiet-campus-wayfinding",
        description:
          "A mobile-first wayfinding concept for neurodivergent students. It highlights low-sensory routes, quiet study spots and accessible entrances.",
        abstract:
          "Co-designed with 14 students, the prototype pairs a campus map with sensory information and crowd estimates.",
        objectives: "Test whether sensory-aware routing improves confidence navigating campus.",
        category: "Design",
        techStack: ["Figma", "React", "Mapbox"],
        skillsRequired: ["UX research", "Frontend"],
        coverImageUrl:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
        demoUrl: "https://example.com",
        status: "published",
        visibility: "public",
        collaborationOpen: true,
      },
      {
        id: R.r3,
        ownerId: P.rohan,
        title: "Campus Air — low-cost sensor network",
        slug: "campus-air-sensor-network",
        description:
          "An IoT network of ESP32 sensors measuring PM2.5, temperature and humidity across campus. Data streams to a dashboard used by the sustainability office.",
        abstract:
          "Six prototype nodes transmit readings over MQTT. Calibration against a reference sensor reduced error by 18%.",
        objectives: "Deploy 12 nodes and publish open data for student research.",
        category: "IoT / Hardware",
        techStack: ["ESP32", "MQTT", "InfluxDB", "Grafana"],
        skillsRequired: ["Embedded C", "Data visualization"],
        coverImageUrl:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        status: "published",
        visibility: "public",
        collaborationOpen: true,
      },
      {
        id: R.r4,
        ownerId: P.ananya,
        title: "IndicEval — multilingual evaluation set",
        slug: "indiceval-multilingual-evaluation",
        description:
          "A small, carefully curated evaluation set for question answering in Hindi, Marathi and Telugu. Includes annotation guidelines and baseline results.",
        abstract:
          "We collected 1,200 question-answer pairs from public domain texts and validated them with two annotators.",
        objectives: "Release the dataset with clear licensing and reproducible baselines.",
        category: "Research",
        techStack: ["Python", "Hugging Face", "spaCy"],
        skillsRequired: ["Linguistics", "Data annotation", "Python"],
        paperUrl: "https://example.com",
        status: "published",
        visibility: "public",
        collaborationOpen: true,
      },
      {
        id: R.r5,
        ownerId: P.kabir,
        title: "StudySync — find your focus group",
        slug: "studysync-focus-group",
        description:
          "A small tool that matches students into weekly focus sessions based on courses, time zones and study preferences.",
        abstract:
          "Built over a weekend hackathon. Includes availability matching, session reminders and a lightweight accountability log.",
        objectives: "Run a two-week pilot with 50 students and measure session completion.",
        category: "Startup / Prototype",
        techStack: ["Next.js", "Postgres", "Resend"],
        skillsRequired: ["Product", "Backend"],
        demoUrl: "https://example.com",
        status: "published",
        visibility: "public",
        collaborationOpen: false,
      },
      {
        id: R.r6,
        ownerId: P.dev,
        title: "RoverVision — obstacle detection on a budget",
        slug: "rovervision-obstacle-detection",
        description:
          "A computer-vision pipeline for a low-cost autonomous rover. Runs a quantized detector on a Raspberry Pi and streams detections to an operator view.",
        abstract:
          "We compare YOLO and MobileNet backbones under fixed compute budgets and report latency/accuracy trade-offs.",
        objectives: "Reach 8 FPS on-device while keeping false positives under 5%.",
        category: "Robotics",
        techStack: ["Python", "OpenCV", "Raspberry Pi", "ROS"],
        skillsRequired: ["Computer vision", "Embedded ML"],
        coverImageUrl:
          "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
        status: "published",
        visibility: "public",
        collaborationOpen: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(projectContributors)
    .values([
      { projectId: R.r1, userId: P.aarav, role: "owner", canEdit: true },
      { projectId: R.r1, userId: P.ananya, role: "contributor", canEdit: true },
      { projectId: R.r2, userId: P.priya, role: "owner", canEdit: true },
      { projectId: R.r3, userId: P.rohan, role: "owner", canEdit: true },
      { projectId: R.r4, userId: P.ananya, role: "owner", canEdit: true },
      { projectId: R.r5, userId: P.kabir, role: "owner", canEdit: true },
      { projectId: R.r6, userId: P.dev, role: "owner", canEdit: true },
    ])
    .onConflictDoNothing();

  await db
    .insert(mediaPosts)
    .values([
      {
        id: M.m1,
        authorId: P.sara,
        caption: "Golden hour over the main quad",
        description: "A quiet evening after exams week.",
        imageUrl:
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1000&q=80",
        album: "Campus evenings",
        college: "Delhi University",
        tags: ["campus", "golden-hour"],
        visibility: "public",
        createdAt: past(1),
      },
      {
        id: M.m2,
        authorId: P.priya,
        caption: "Design jam — day two",
        description: "Sticky notes everywhere, but we shipped a prototype.",
        imageUrl:
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
        album: "Design jams",
        college: "BITS Pilani",
        tags: ["design", "workshop"],
        visibility: "public",
        createdAt: past(2),
      },
      {
        id: M.m3,
        authorId: P.kabir,
        caption: "Late-night build session",
        description: "Hackathon prep with the StudySync crew.",
        imageUrl:
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
        album: "Hackathons",
        college: "VIT Vellore",
        tags: ["hackathon", "team"],
        visibility: "public",
        createdAt: past(3),
      },
      {
        id: M.m4,
        authorId: P.aarav,
        caption: "Whiteboard before the demo",
        description: "RAG pipeline sketch, version four.",
        imageUrl:
          "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80",
        album: "Research lab",
        college: "IIT Bombay",
        tags: ["research", "ai"],
        visibility: "public",
        createdAt: past(4),
      },
      {
        id: M.m5,
        authorId: P.sara,
        caption: "Library light",
        description: "The reading room at 4pm.",
        imageUrl:
          "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1000&q=80",
        album: "Campus spaces",
        college: "Delhi University",
        tags: ["library", "campus"],
        visibility: "public",
        createdAt: past(5),
      },
      {
        id: M.m6,
        authorId: P.rohan,
        caption: "Sensor node v2",
        description: "Smaller enclosure, better airflow, same messy wiring.",
        imageUrl:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
        album: "Campus Air",
        college: "NIT Trichy",
        tags: ["iot", "hardware"],
        visibility: "public",
        createdAt: past(6),
      },
      {
        id: M.m7,
        authorId: P.ananya,
        caption: "Annotation sprint",
        description: "Two languages down, one to go.",
        imageUrl:
          "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1000&q=80",
        album: "IndicEval",
        college: "IIIT Hyderabad",
        tags: ["nlp", "research"],
        visibility: "public",
        createdAt: past(7),
      },
      {
        id: M.m8,
        authorId: P.dev,
        caption: "Rover field test",
        description: "First successful autonomous run across the courtyard.",
        imageUrl:
          "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80",
        album: "Robotics",
        college: "IIT Delhi",
        tags: ["robotics", "field-test"],
        visibility: "public",
        createdAt: past(8),
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(communities)
    .values([
      {
        id: C.c1,
        slug: "iitb-cs",
        name: "IIT Bombay CS",
        description:
          "Course questions, project showcases and lab updates for the IIT Bombay computer science community.",
        guidelines: "Be specific, search before posting and credit your sources.",
        college: "IIT Bombay",
        category: "college",
        joinPolicy: "request",
        createdBy: P.aarav,
      },
      {
        id: C.c2,
        slug: "design-collective",
        name: "Design Collective",
        description:
          "A cross-campus space for product, graphic and interaction designers to share work and get feedback.",
        guidelines: "Give constructive feedback and respect unfinished work.",
        category: "design",
        joinPolicy: "open",
        createdBy: P.priya,
      },
      {
        id: C.c3,
        slug: "ai-research-circle",
        name: "AI Research Circle",
        description:
          "Paper reading groups, experiment notes and collaboration calls for students working in AI and ML.",
        category: "research",
        joinPolicy: "open",
        createdBy: P.ananya,
      },
      {
        id: C.c4,
        slug: "campus-builders",
        name: "Campus Builders",
        description:
          "For students shipping side projects, startups and open-source tools. Share progress and find teammates.",
        category: "technology",
        joinPolicy: "open",
        createdBy: P.kabir,
      },
      {
        id: C.c5,
        slug: "campus-photography",
        name: "Campus Photography",
        description:
          "Photo walks, editing tips and a place to share the small moments of student life.",
        category: "media",
        joinPolicy: "open",
        createdBy: P.sara,
      },
      {
        id: C.c6,
        slug: "sustainability-guild",
        name: "Sustainability Guild",
        description:
          "Student projects on energy, waste, mobility and climate data across campuses.",
        category: "interest",
        joinPolicy: "open",
        createdBy: P.rohan,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(communityMembers)
    .values([
      { communityId: C.c1, userId: P.aarav, role: "owner", status: "active" },
      { communityId: C.c1, userId: P.kabir, role: "member", status: "active" },
      { communityId: C.c1, userId: P.ananya, role: "moderator", status: "active" },
      { communityId: C.c2, userId: P.priya, role: "owner", status: "active" },
      { communityId: C.c2, userId: P.sara, role: "member", status: "active" },
      { communityId: C.c3, userId: P.ananya, role: "owner", status: "active" },
      { communityId: C.c3, userId: P.aarav, role: "member", status: "active" },
      { communityId: C.c3, userId: P.dev, role: "member", status: "active" },
      { communityId: C.c4, userId: P.kabir, role: "owner", status: "active" },
      { communityId: C.c4, userId: P.meera, role: "member", status: "active" },
      { communityId: C.c5, userId: P.sara, role: "owner", status: "active" },
      { communityId: C.c5, userId: P.priya, role: "member", status: "active" },
      { communityId: C.c6, userId: P.rohan, role: "owner", status: "active" },
      { communityId: C.c6, userId: P.meera, role: "member", status: "active" },
    ])
    .onConflictDoNothing();

  await db
    .insert(discussions)
    .values([
      {
        id: D.d1,
        communityId: C.c2,
        authorId: P.priya,
        title: "How do you present unfinished work without losing the plot?",
        slug: "presenting-unfinished-work",
        body: "I'm preparing a portfolio review and most of my best projects are half-finished. How do you frame work-in-progress so reviewers see the thinking instead of the gaps?",
        tags: ["portfolio", "feedback"],
        createdAt: past(1),
      },
      {
        id: D.d2,
        communityId: C.c3,
        authorId: P.ananya,
        title: "Weekly paper club: retrieval evaluation metrics",
        slug: "paper-club-retrieval-evaluation",
        body: "This week we're reading two papers on evaluating retrieval quality beyond recall@k. Drop your notes and questions here before Friday's call.",
        tags: ["nlp", "papers"],
        createdAt: past(2),
        pinned: true,
      },
      {
        id: D.d3,
        communityId: C.c4,
        authorId: P.kabir,
        title: "Looking for a backend collaborator for StudySync",
        slug: "studysync-backend-collaborator",
        body: "The pilot went well and we're opening the matching engine. Looking for someone comfortable with Postgres and scheduling logic. Small time commitment, real users.",
        tags: ["collaboration", "backend"],
        createdAt: past(3),
      },
      {
        id: D.d4,
        communityId: C.c1,
        authorId: P.aarav,
        title: "Best electives for someone moving into ML systems?",
        slug: "electives-ml-systems",
        body: "Trying to plan next semester. Has anyone taken the distributed systems elective alongside ML? Curious about the workload and whether the projects overlap.",
        tags: ["courses", "advice"],
        createdAt: past(4),
      },
      {
        id: D.d5,
        communityId: C.c5,
        authorId: P.sara,
        title: "Photo walk this Saturday — golden hour route",
        slug: "photo-walk-saturday",
        body: "Meeting at the north gate at 5pm. Route covers the old library, the quad and the rooftop. Bring any camera, phones are welcome.",
        tags: ["photography", "meetup"],
        createdAt: past(5),
      },
      {
        id: D.d6,
        communityId: C.c6,
        authorId: P.rohan,
        title: "Open dataset: three months of campus air quality",
        slug: "campus-air-quality-dataset",
        body: "We cleaned and published the first three months of sensor readings. Looking for students interested in analysing seasonal patterns or building a public dashboard.",
        tags: ["data", "climate"],
        createdAt: past(6),
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(events)
    .values([
      {
        id: E.e1,
        organizerId: P.kabir,
        title: "Campus Builders Demo Night",
        slug: "campus-builders-demo-night",
        description:
          "Five student teams show what they shipped this month. Short demos, honest feedback and time to meet collaborators.",
        type: "talk",
        startsAt: future(5),
        endsAt: future(5.1),
        timezone: "Asia/Kolkata",
        location: "VIT Vellore — Innovation Hub",
        capacity: 120,
        eligibility: "Open to all students.",
      },
      {
        id: E.e2,
        organizerId: P.priya,
        title: "Portfolio Review Clinic",
        slug: "portfolio-review-clinic",
        description:
          "Bring a work-in-progress portfolio and get structured feedback from designers and seniors. Small groups, sign-up required.",
        type: "workshop",
        startsAt: future(9),
        endsAt: future(9.15),
        timezone: "Asia/Kolkata",
        location: "Online",
        onlineUrl: "https://example.com",
        capacity: 30,
        eligibility: "Design students and self-taught designers.",
      },
      {
        id: E.e3,
        organizerId: P.ananya,
        title: "AI Research Open House",
        slug: "ai-research-open-house",
        description:
          "Lab tours, short research talks and a poster session for students curious about getting into research.",
        type: "talk",
        startsAt: future(14),
        endsAt: future(14.2),
        timezone: "Asia/Kolkata",
        location: "IIIT Hyderabad — Research Block",
        capacity: 200,
      },
      {
        id: E.e4,
        organizerId: P.rohan,
        title: "Sustainability Hack Weekend",
        slug: "sustainability-hack-weekend",
        description:
          "A two-day hack focused on campus energy, waste and mobility. Teams of up to four; hardware and datasets provided.",
        type: "hackathon",
        startsAt: future(21),
        endsAt: future(22.5),
        timezone: "Asia/Kolkata",
        location: "NIT Trichy",
        capacity: 80,
        registrationDeadline: future(16),
      },
      {
        id: E.e5,
        organizerId: P.sara,
        title: "Golden Hour Photo Walk",
        slug: "golden-hour-photo-walk",
        description:
          "A relaxed campus photo walk. All skill levels welcome; we finish with a quick edit session at the cafe.",
        type: "other",
        startsAt: future(3),
        endsAt: future(3.1),
        timezone: "Asia/Kolkata",
        location: "Delhi University — North Gate",
        capacity: 25,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(eventRegistrations)
    .values([
      { eventId: E.e1, userId: P.aarav, status: "registered" },
      { eventId: E.e1, userId: P.priya, status: "registered" },
      { eventId: E.e3, userId: P.aarav, status: "registered" },
      { eventId: E.e5, userId: P.priya, status: "registered" },
    ])
    .onConflictDoNothing();

  await db
    .insert(resources)
    .values([
      {
        id: RES.s1,
        authorId: P.aarav,
        title: "DSA revision sheet — graphs and DP",
        description:
          "A condensed revision sheet with patterns, complexity notes and 40 practice problems for graph and dynamic programming interviews.",
        category: "study-guide",
        subject: "Data Structures",
        college: "IIT Bombay",
        url: "https://example.com",
        tags: ["dsa", "interviews", "graphs"],
      },
      {
        id: RES.s2,
        authorId: P.priya,
        title: "Design system starter for student projects",
        description:
          "Tokens, type scale and accessible component patterns you can drop into a student project. Figma file plus CSS variables.",
        category: "template",
        subject: "Design",
        url: "https://example.com",
        tags: ["figma", "design-system", "accessibility"],
      },
      {
        id: RES.s3,
        authorId: P.ananya,
        title: "Fine-tuning small language models: field notes",
        description:
          "Practical notes from fine-tuning 1–3B parameter models on a single GPU, including dataset prep, LoRA settings and evaluation pitfalls.",
        category: "tutorial",
        subject: "Machine Learning",
        url: "https://example.com",
        tags: ["llm", "lora", "training"],
      },
      {
        id: RES.s4,
        authorId: P.rohan,
        title: "ESP32 sensor node build guide",
        description:
          "Bill of materials, wiring diagram and firmware template for a low-cost environmental sensor node publishing over MQTT.",
        category: "tutorial",
        subject: "Embedded Systems",
        url: "https://example.com",
        tags: ["esp32", "iot", "mqtt"],
      },
      {
        id: RES.s5,
        authorId: P.meera,
        title: "SQL for analytics — practice dataset",
        description:
          "A small public dataset with 25 analytics questions covering joins, window functions and cohort analysis.",
        category: "notes",
        subject: "Databases",
        url: "https://example.com",
        tags: ["sql", "analytics", "practice"],
      },
      {
        id: RES.s6,
        authorId: P.sara,
        title: "Telling a story with five photos",
        description:
          "A short guide to sequencing images for a campus story, with prompts for captions and ethical consent notes.",
        category: "reference",
        subject: "Media",
        url: "https://example.com",
        tags: ["photography", "storytelling"],
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(applications)
    .values([
      {
        id: A.a1,
        opportunityId: OP.o1,
        studentId: P.aarav,
        status: "under_review",
        coverLetter:
          "I've built several Next.js projects and care about accessible interfaces. I'd love to work on the learning platform this summer.",
        portfolioUrl: "https://example.com",
      },
      {
        id: A.a2,
        opportunityId: OP.o2,
        studentId: P.ananya,
        status: "shortlisted",
        coverLetter:
          "My current project is a multilingual evaluation set for Indic languages. This role is directly aligned with my research interests.",
      },
      {
        id: A.a3,
        opportunityId: OP.o3,
        studentId: P.priya,
        status: "submitted",
        coverLetter: "Portfolio attached. I'm especially interested in the student onboarding flow.",
        portfolioUrl: "https://example.com",
      },
      {
        id: A.a4,
        opportunityId: OP.o1,
        studentId: P.kabir,
        status: "rejected",
        coverLetter: "I build with Next.js daily and would love to contribute.",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(applicationStatusHistory)
    .values([
      {
        id: "15000000-0000-4000-8000-000000000001",
        applicationId: A.a1,
        status: "submitted",
        changedBy: P.aarav,
      },
      {
        id: "15000000-0000-4000-8000-000000000002",
        applicationId: A.a1,
        status: "under_review",
        changedBy: P.nikhil,
      },
      {
        id: "15000000-0000-4000-8000-000000000003",
        applicationId: A.a2,
        status: "submitted",
        changedBy: P.ananya,
      },
      {
        id: "15000000-0000-4000-8000-000000000004",
        applicationId: A.a2,
        status: "shortlisted",
        changedBy: P.ishita,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(bookmarks)
    .values([
      {
        id: "16000000-0000-4000-8000-000000000001",
        userId: P.aarav,
        entityType: "project",
        entityId: R.r2,
      },
      {
        id: "16000000-0000-4000-8000-000000000002",
        userId: P.aarav,
        entityType: "opportunity",
        entityId: OP.o2,
      },
      {
        id: "16000000-0000-4000-8000-000000000003",
        userId: P.priya,
        entityType: "resource",
        entityId: RES.s3,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(notifications)
    .values([
      {
        id: "17000000-0000-4000-8000-000000000001",
        userId: P.aarav,
        type: "application",
        title: "Application under review",
        body: "Lumen Labs moved your Frontend Engineering Intern application to under review.",
        href: "/applications",
        createdAt: past(1),
      },
      {
        id: "17000000-0000-4000-8000-000000000002",
        userId: P.aarav,
        type: "collaboration",
        title: "New collaboration request",
        body: "Priya Sharma wants to join CampusRAG as a contributor.",
        href: `/research/${R.r1}`,
        createdAt: past(2),
      },
      {
        id: "17000000-0000-4000-8000-000000000003",
        userId: P.aarav,
        type: "event",
        title: "Event reminder",
        body: "AI Research Open House starts in one week.",
        href: "/events",
        createdAt: past(3),
      },
    ])
    .onConflictDoNothing();

  console.log("Seed complete:");
  console.log(`  ${Object.keys(P).length} profiles`);
  console.log(`  ${opps.length} opportunities`);
  console.log(`  6 projects, 8 media posts`);
  console.log(`  6 communities, 6 discussions`);
  console.log(`  5 events, 6 resources`);
  console.log("\nDemo profiles are synthetic and cannot sign in. Create your own account via /auth/signup.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
