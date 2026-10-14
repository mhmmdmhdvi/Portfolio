import { resume } from "./resume";
import { resumeFa } from "./resume.fa";

export const resumePortrait = "/assets/images/mohammad-mahdavi-portrait.jpg";

export const resumeLocales = {
  en: {
    ...resume,
    language: "en",
    direction: "ltr",
    labels: {
      toolbar: "Curriculum vitae",
      download: "Download CV",
      document: "Resume document",
      portrait: "Portrait of Mohammad Mahdavi",
      sidebar: "Skills and education",
      skills: "Technical skills",
      education: "Education",
      profile: "Profile",
      experience: "Experience",
      projects: "Projects",
      stack: "Stack",
    },
  },
  fa: {
    ...resumeFa,
    language: "fa",
    direction: "rtl",
    labels: {
      toolbar: "رزومه",
      download: "دریافت PDF",
      document: "متن رزومه",
      portrait: "تصویر محمد مهدوی",
      sidebar: "مهارت‌ها و تحصیلات",
      skills: "مهارت‌های فنی",
      education: "تحصیلات",
      profile: "معرفی",
      experience: "سوابق کاری",
      projects: "پروژه‌ها",
      stack: "فناوری‌ها",
    },
  },
};

export function getResumeLocale(language) {
  return language === "fa" ? resumeLocales.fa : resumeLocales.en;
}
