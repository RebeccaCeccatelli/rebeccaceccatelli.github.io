// ─────────────────────────────────────────────────────────────────────────────
// All the editable content of the site lives here (except the newsletter,
// which lives in src/content/cues, and longer articles in src/content/notes).
// ─────────────────────────────────────────────────────────────────────────────

export const profile = {
  name: "Rebecca Ceccatelli",
  tagline: "Computer engineer & concert pianist",
  intro:
    "Growing up, classical music and maths were my daily bread — no wonder I ended up with degrees in Piano Performance and Computer Engineering. I build data systems, research generative models for music, and still can't walk past a piano.",
  location: "Zürich · Boston · Florence",
  email: "rebeccaceccatelli@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/rebeccaceccatelli/",
    github: "https://github.com/RebeccaCeccatelli",
    youtube: "https://www.youtube.com/@RebeccaCeccatelli-z9z",
  },
  // Put a PDF at public/cv.pdf and set this to "/cv.pdf" to show a download button.
  // (Use a version without phone numbers / date of birth.)
  cvPdf: null as string | null,
};

export const sections = [
  { href: "/work/", label: "Work", title: "Professional", blurb: "Data engineering, distributed systems and research — the CV, properly laid out." },
  { href: "/music/", label: "Music", title: "Music", blurb: "Twenty years at the piano, a Master's in Performance, and recordings from the stage." },
  { href: "/tonic/", label: "Tonic", title: "Tonic — the thesis", blurb: "Energy-Based Transformers that draft, score and refine music. MIT Media Lab × ETH Zürich." },
  { href: "/life/", label: "Life", title: "Life", blurb: "Passions, small stories and photos with the people who make it fun." },
  { href: "/cues/", label: "Cues", title: "Thoughts & Cues", blurb: "A running log of art, music, books and ideas I found worth passing on." },
] as const;

// ── Professional ────────────────────────────────────────────────────────────

export type Role = { org: string; place: string; role: string; when: string; text: string; tags?: string[] };

export const experience: Role[] = [
  {
    org: "Swiss Life", place: "Zürich, Switzerland", role: "Quant Developer · Working Student", when: "Feb 2025 — Present",
    text: "Developing and maintaining efficient SQL queries and Airflow pipelines to streamline data workflows. Setting up and optimising infrastructure for Azure servers and the data lake, improving data accessibility with thorough documentation and version control. Contributed to a successful data-provider migration.",
    tags: ["SQL", "Airflow", "Azure"],
  },
  {
    org: "Lumiphase", place: "Zürich, Switzerland", role: "Test Engineer · Working Student", when: "Mar 2024 — Aug 2024",
    text: "Supported the R&D team operating wafer-level test systems: preparing and calibrating wafer-prober equipment for accurate, consistent measurements, and writing software to specify test procedures and for data acquisition and analysis.",
    tags: ["Photonics", "Test automation", "Python"],
  },
  {
    org: "V-Nova", place: "London, United Kingdom", role: "Software Engineering Intern", when: "Mar 2023 — Jun 2023",
    text: "Visual Quality & QA team. Built a new feature of their evaluation framework: a frame-by-frame heat-map analysis between original and reconstructed video to assess the quality of a chosen codec.",
    tags: ["Video codecs", "Computer vision"],
  },
  {
    org: "“Luigi Cherubini” Music Conservatory", place: "Florence, Italy", role: "Music Internship · Assistant Teacher", when: "Oct 2018 — Oct 2019",
    text: "Assistant teacher in Maestro Prestia’s piano classes.",
  },
  {
    org: "“Giuseppe Verdi” Music School", place: "Prato, Italy", role: "Music Internship", when: "Jan 2018 — Feb 2018",
    text: "Assistant teacher in piano, chamber music, choir and orchestra classes; helped organise the school’s concert season.",
  },
];

export const research: Role[] = [
  {
    org: "MIT Media Lab", place: "Cambridge, USA", role: "Visiting Researcher · Master’s Thesis", when: "Mar 2026 — 2026",
    text: "Energy-Based Transformers for real-time symbolic music generation in Prof. Joe Paradiso’s Responsive Environments group: interpretable, controllable and coherent generative models inspired by brain-like energy dynamics.",
    tags: ["PyTorch", "EBMs", "Transformers"],
  },
  {
    org: "UC Berkeley & Cornell (remote)", place: "", role: "Research Collaboration", when: "Oct 2024 —",
    text: "With Prof. Natacha Crooks (Berkeley) and Dr. Shir Cohen (Cornell): a novel decentralised oblivious storage system supporting ACID transactions.",
    tags: ["Distributed systems", "Security"],
  },
  {
    org: "IBM Research × ETH Zürich", place: "", role: "Team Project", when: "",
    text: "The potential, impact and future of AI and generative AI in IBM Systems, in particular IBM Z.",
  },
];

export const education: Role[] = [
  {
    org: "ETH Zürich", place: "Switzerland", role: "MSc Computer Science", when: "Oct 2023 — 2026",
    text: "Major in Data Management Systems, minor in Programming Languages & Software Engineering. Big Data, Cloud Computing Architecture, Automated Software Testing, Distributed Computing, Machine Learning, Information Security.",
  },
  {
    org: "Cornell · Max Planck · Maryland", place: "Germany", role: "Pre-doctoral Research School · Full scholarship", when: "Jul — Aug 2024",
    text: "Research trends in computer science: modern graph algorithms, high-performance computing, programmable photonics.",
  },
  {
    org: "University of Florence", place: "Italy", role: "BEng Computer Engineering · 110/110 summa cum laude", when: "Sep 2019 — Sep 2023",
    text: "Thesis with Prof. Enrico Vicario: “TravelBuddy” — bounded-context and framework-instance patterns in a microservices application for booking and locating tourist services on street maps.",
  },
  {
    org: "University College London", place: "United Kingdom", role: "Statistics with R · 98/100, 1st in class", when: "Jul — Aug 2022",
    text: "From descriptive statistics and hypothesis testing to regression, multivariate analysis and model optimisation.",
  },
  {
    org: "“Luigi Cherubini” Conservatory", place: "Florence, Italy", role: "Master’s in Classical Piano Performance · 110/110 summa cum laude", when: "Nov 2010 — Oct 2018",
    text: "Also completed the Bachelor’s-equivalent in two years instead of three, and the high-school-equivalent diploma in four instead of five.",
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["Python", "C", "C++", "Java", "TypeScript", "JavaScript", "SQL", "R", "Matlab"] },
  { group: "ML", items: ["PyTorch", "Hugging Face Transformers", "scikit-learn", "Torchvision"] },
  { group: "Data & Cloud", items: ["Airflow", "Azure", "Spark", "MapReduce", "Kubernetes", "Neo4j"] },
];

export const credentials = [
  { what: "Huawei “Seeds for the Future”", detail: "100/100 · 5G, digital power, AI, cloud", when: "2022" },
  { what: "TOEFL iBT", detail: "108", when: "2022" },
  { what: "IELTS Academic", detail: "7.5 (C1)", when: "2022" },
  { what: "GRE General", detail: "320", when: "2022" },
  { what: "Society of Women Engineers", detail: "Collegiate member", when: "" },
];

export const languages = ["Italian — native", "English — fluent", "German — basic"];

// ── Music ───────────────────────────────────────────────────────────────────

export const recital = {
  title: "Graduation Recital",
  where: "Florence, October 2018",
  playlist: "https://www.youtube.com/playlist?list=PLoL0dyKqu5aOG-TV-xkKTVRxKJOu2FiFL",
  videos: [
    { id: "SBEOFwq0iB4", composer: "Bach – Busoni", piece: "Chaconne in D minor" },
    { id: "rY09sJUe9iw", composer: "Claude Debussy", piece: "Images, Book II, L. 111" },
    { id: "Flh5iEWA8uw", composer: "Alexander Scriabin", piece: "Étude Op. 8 No. 11 in B-flat minor" },
    { id: "IW5Si4yzO4A", composer: "Isaac Albéniz", piece: "Triana (Iberia, VI)" },
    { id: "1OHRrlnGZWc", composer: "Robert Schumann", piece: "Gesänge der Frühe, Op. 133" },
    { id: "S9uiSa6L790", composer: "Francis Poulenc", piece: "Piano Concerto, FP 146 — I" },
    { id: "6KN6NZVqu2M", composer: "Francis Poulenc", piece: "Piano Concerto, FP 146 — II" },
    { id: "UcMAYosz1BE", composer: "Francis Poulenc", piece: "Piano Concerto, FP 146 — III" },
  ],
};

export const musicTimeline = [
  { when: "2007", text: "First concerts — the beginning of thirteen years of solo and chamber performances." },
  { when: "2010", text: "Admitted to the “Luigi Cherubini” Conservatory of Florence, aged ten." },
  { when: "2018", text: "Master’s in Classical Piano Performance, 110/110 summa cum laude. Assistant teaching in Prato and Florence." },
  { when: "2026", text: "Back to Shostakovich’s Preludes & Fugues — and teaching machines to write music at the MIT Media Lab." },
];

// ── Thesis: Tonic ───────────────────────────────────────────────────────────

export const tonic = {
  title: "Tonic",
  subtitle: "Energy-Based Transformers for Symbolic Music Generation and Single- and Multi-Attribute Control",
  where: "Master’s thesis · MIT Media Lab × ETH Zürich · 2026",
  people: [
    "Supervised by Prof. Dr. Roger Wattenhofer (ETH) and Prof. Joseph A. Paradiso (MIT)",
    "Advised by Lancelot Blanchard (MIT)",
  ],
  summary:
    "Most AI models write music by picking each next step outright. Tonic drafts it first, scores how well it fits with an energy, and improves it. Add a musical goal to that same energy and Tonic steers toward it — louder, longer or higher notes. It is compared with traditional models of the same size, trained on the same music.",
  steps: [
    { n: "01", title: "Draft", text: "Make a first guess at what comes next in the music." },
    { n: "02", title: "Score", text: "A Transformer assigns the draft an energy: low when it fits the music, high when it doesn’t." },
    { n: "03", title: "Refine", text: "Follow the energy downhill, polishing the draft step by step until it settles." },
    { n: "04", title: "Steer", text: "Add a musical goal to the energy — dynamics, duration, pitch — and the same descent bends toward it." },
  ],
  stats: [
    { value: "20,441", label: "clips in the listening archive" },
    { value: "66", label: "listeners in the blind survey" },
    { value: "3", label: "model families compared" },
  ],
  links: [
    { label: "Project home", href: "https://rebeccaceccatelli.github.io/tonic/", note: "Everything in one place" },
    { label: "Simply explained", href: "https://rebeccaceccatelli.github.io/tonic/how-it-works/", note: "No maths, a few things to listen to" },
    { label: "Showcase", href: "https://rebeccaceccatelli.github.io/music_EBT/", note: "Selected tracks, Tonic vs Llama and GPT-2" },
    { label: "Listening archive", href: "https://rebeccaceccatelli.github.io/listening-archive/", note: "Every clip from the final experiments" },
    { label: "Survey results", href: "https://rebeccaceccatelli.github.io/tonic/survey-results/", note: "What the listeners heard" },
    { label: "Thesis (PDF)", href: "https://rebeccaceccatelli.github.io/tonic/thesis/Tonic_thesis.pdf", note: "Method, experiments, results" },
    { label: "Take the survey", href: "https://rebeccaceccatelli.github.io/listening-study/survey/", note: "English · ", alt: { label: "italiano", href: "https://rebeccaceccatelli.github.io/listening-study/survey/it/" } },
  ],
  repos: [
    { label: "music_EBT", href: "https://github.com/RebeccaCeccatelli/music_EBT", note: "Training, inference, guidance, demo" },
    { label: "anticipation-musicEBT", href: "https://github.com/RebeccaCeccatelli/anticipation-musicEBT", note: "Anticipation · GigaMIDI extension" },
    { label: "eth-mit-master-thesis", href: "https://github.com/RebeccaCeccatelli/eth-mit-master-thesis", note: "The thesis source" },
    { label: "tonic", href: "https://github.com/RebeccaCeccatelli/tonic", note: "Project front page" },
    { label: "listening-archive", href: "https://github.com/RebeccaCeccatelli/listening-archive", note: "Archive site" },
    { label: "listening-study", href: "https://github.com/RebeccaCeccatelli/listening-study", note: "Survey site" },
  ],
};

// ── Life ────────────────────────────────────────────────────────────────────
// DRAFT copy, written from your CV — rewrite in your own voice.

export const passions = [
  { title: "Poetry & literature", text: "French, Russian, Italian, American… anything. Montale is never far away.", glyph: "❦" },
  { title: "Jazz", text: "The other side of the keyboard — and of the record collection.", glyph: "♪" },
  { title: "Running", text: "3.5 km regional champion in 2021; the Pisa half-marathon in 2020. The Marathon des Sables is on the list.", glyph: "↗" },
  { title: "Art & architecture", text: "Art Nouveau, expressionist colour, and regular pilgrimages to the Kunsthaus.", glyph: "◐" },
  { title: "Creative writing", text: "Two poetry competitions and two essay competitions won, so far.", glyph: "✎" },
  { title: "Table tennis", text: "Fast hands, from the piano, presumably.", glyph: "●" },
  { title: "Robots & jetpacks", text: "Self-explanatory.", glyph: "✦" },
  { title: "Sudoku", text: "For trains, airports and waiting rooms.", glyph: "▦" },
];

export const anecdotes = [
  { title: "A national champion of tongue-twisters — in German", text: "My German is officially “basic”. Somehow I still won a national tongue-twister competition in it." },
  { title: "Eight years of conservatory in fast-forward", text: "I finished the conservatory’s high-school diploma in four years instead of five and the bachelor’s in two instead of three — then a Master’s in Piano Performance at eighteen." },
  { title: "From Florence to Zürich to Boston", text: "Three cities, three languages, and a piano-shaped excuse to find a practice room in each of them." },
];
