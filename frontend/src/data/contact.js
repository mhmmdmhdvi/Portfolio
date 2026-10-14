export const contactChannels = [
  {
    id: "email",
    icon: "mail",
    value: "mhmmd.mhdvi82@gmail.com",
    href: "mailto:mhmmd.mhdvi82@gmail.com",
    copyValue: "mhmmd.mhdvi82@gmail.com",
  },
  {
    id: "linkedin",
    icon: "link",
    value: "linkedin.com/in/mohammad-mahdavi-devops",
    href: "https://www.linkedin.com/in/mohammad-mahdavi-devops",
    copyValue: "https://www.linkedin.com/in/mohammad-mahdavi-devops",
    external: true,
  },
  {
    id: "phone",
    icon: "phone",
    value: "+98 939 236 0398",
    href: "tel:+989392360398",
    copyValue: "+989392360398",
  },
];

export const contactLocales = {
  en: {
    direction: "ltr",
    title: "Contact Me",
    toolbar: "Contact details",
    information: "Contact information",
    name: "Mohammad Mahdavi",
    role: "Mid Level Full Stack Developer",
    portrait: "Portrait of Mohammad Mahdavi",
    copy: "Copy",
    copied: "Copied",
    failed: "Couldn't copy. Select the address or number and copy it.",
    channels: {
      email: { label: "Email", action: "Send email", copy: "Copy email address", copied: "Email address copied." },
      linkedin: { label: "LinkedIn", action: "Open profile", copy: "Copy LinkedIn link", copied: "LinkedIn link copied." },
      phone: { label: "Phone", action: "Call", copy: "Copy phone number", copied: "Phone number copied." },
    },
  },
  fa: {
    direction: "rtl",
    title: "ارتباط با من",
    toolbar: "راه‌های ارتباطی",
    information: "اطلاعات تماس",
    name: "محمد مهدوی",
    role: "توسعه‌دهنده فول‌استک — سطح میانی",
    portrait: "تصویر محمد مهدوی",
    copy: "کپی",
    copied: "کپی شد",
    failed: "کپی نشد. آدرس یا شماره را انتخاب و کپی کنید.",
    channels: {
      email: { label: "ایمیل", action: "ارسال ایمیل", copy: "کپی آدرس ایمیل", copied: "آدرس ایمیل کپی شد." },
      linkedin: { label: "لینکدین", action: "مشاهده پروفایل", copy: "کپی لینک لینکدین", copied: "لینک لینکدین کپی شد." },
      phone: { label: "شماره تماس", action: "تماس", copy: "کپی شماره تماس", copied: "شماره تماس کپی شد." },
    },
  },
};
