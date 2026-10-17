import { resume } from "./resume";
import screenshots from "./projectImages.json";

const details = {
  secora: { type: "Web", color: "#2858b7", accent: "#afcfff", summary: "Cybersecurity lessons with puzzles, practice and quizzes." },
  "honor-preinvoice": { type: "Mobile", color: "#182638", accent: "#ffd438", summary: "Create pro forma invoices and export A4 PDF or Excel files." },
  "megatite-crm": { type: "Web", color: "#30546e", accent: "#b9dfef", summary: "Sales, accounting and inventory management." },
  gitshield: { type: "Web", color: "#164b3d", accent: "#96e7c7", summary: "Scan GitHub repositories for security leaks." },
  "megatite-chatbot": { type: "Web", color: "#243457", accent: "#8acfdc", summary: "Event kiosk chatbot using Megatite documents." },
  "customers-club": { type: "Web", color: "#345a50", accent: "#c5e5b3", summary: "Customer portal with events and a slab-master leaderboard." },
  "chess-extension": { type: "Extensions", color: "#655038", accent: "#f4d88e", summary: "Chrome extension for chess position analysis." },
  date: { type: "Web", color: "#864364", accent: "#ffd0e1", summary: "Interactive date invitation." },
};

export const projects = Object.entries(details).map(([id, detail]) => ({
  ...resume.projects.find((project) => project.id === id),
  ...detail,
  images: screenshots[id]?.images ?? [],
  cover: screenshots[id]?.cover,
}));

export function findProject(id) {
  return projects.find((project) => project.id === id);
}
