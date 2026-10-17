export const resume = {
  name: "Mohammad Mahdavi",
  title: "Mid Level Full Stack Developer",
  summary:
    "Full stack developer with nearly two years of coding experience. Builds React applications with Go as the primary backend language, with additional experience in Django and Node.js.",
  pdf: {
    filename: "Mohammad-Mahdavi-Resume.pdf",
    url: "/api/content/resume/Mohammad-Mahdavi-Resume.pdf",
  },
  skills: [
    { title: "Frontend", items: ["React", "JavaScript", "Tailwind CSS", "Vite"] },
    { title: "Backend", items: ["Go (primary)", "Django", "Node.js"] },
    { title: "Data & tools", items: ["PostgreSQL", "Git"] },
    {
      title: "Working knowledge",
      items: ["DevOps fundamentals", "Database concepts", "Web security fundamentals"],
    },
  ],
  education: {
    degree: "Bachelor's degree in Computer Engineering",
    school: "Khayyam University",
    location: "Mashhad, Iran",
    period: "2021–2026",
  },
  experience: [
    {
      company: "Megatite",
      role: "Full Stack Developer",
      period: "2026–Present",
      bullets: [
        "Develops web applications for CRM operations, customer services, and event kiosks.",
        "Migrating the CRM backend from Node.js to Go.",
      ],
    },
  ],
  projects: [
    {
      id: "honor-preinvoice",
      name: "Honor PreInvoice",
      description: "Android app for creating pro forma invoices, managing customer and product details, and exporting PDF or Excel files formatted for A4 printing.",
      stack: ["React Native"],
    },
    {
      id: "megatite-crm",
      name: "Megatite CRM",
      description: "CRM for sales, accounting, inventory, and management.",
      bullets: [
        "Built a proforma workflow covering accountant approval, stock checks by product weight, shipment, and seller follow-up with customers.",
        "Added overview and dashboard views with seller income charts, city and customer filters, and sales metrics.",
      ],
      stack: ["React", "TypeScript", "Tailwind CSS", "Vite", "Node.js", "PostgreSQL", "Ubuntu"],
    },
    {
      id: "customers-club",
      name: "Megatite Customers Club",
      description: "Customer portal and landing page implemented from a UI/UX design.",
      bullets: [
        "Built signup and login, a customer dashboard, contact and about pages, and a slab-master leaderboard.",
        "Added landing page sections for top slab masters and pages for events and conferences.",
      ],
      stack: ["React", "JavaScript", "Tailwind CSS", "Vite", "Go", "PostgreSQL", "Ubuntu"],
    },
    {
      id: "gitshield",
      name: "GitShield",
      description: "Tool for scanning GitHub repositories for security leaks.",
      stack: ["React", "TypeScript", "Tailwind CSS", "Python", "Django", "PostgreSQL"],
    },
    {
      id: "secora",
      name: "Secora",
      description: "Interactive cybersecurity learning platform for schools and colleges.",
      bullets: [
        "Built learning flows for around 50 lessons combining puzzles, step-by-step exercises, hands-on practice, guides, and quizzes.",
        "Added a dashboard, levels, achievements, and a path finder to guide learners.",
      ],
      stack: ["React", "JavaScript", "Tailwind CSS", "Django", "PostgreSQL", "Ubuntu"],
    },
    {
      id: "chess-extension",
      name: "Chess AI Extension",
      description: "Chrome extension that analyzes online chess positions and suggests the best next move.",
      stack: ["HTML", "CSS", "JavaScript", "Chess library"],
    },
    {
      id: "megatite-chatbot",
      name: "Megatite AI Chatbot",
      description: "Event kiosk chatbot using Megatite documents and the ChatGPT API, presented with a 3D model.",
      stack: ["React", "JavaScript", "Tailwind CSS", "Django", "PostgreSQL", "Ubuntu"],
    },
    {
      id: "date",
      name: "Date",
      description: "First project: an interactive date invitation with a moving No button and reactive 3D models, followed by a page for location, date, time, and contact details.",
      stack: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    },
  ],
};
