export const wallpapers = [
  {
    id: "portfolio-blue",
    label: "Portfolio Blue",
    src: "/assets/wallpapers/portfolio-blue-desktop-v2.jpg",
    portraitSrc: "/assets/wallpapers/portfolio-blue-portrait-v2.jpg",
    introduction: true,
  },
  { id: "bloom-light", label: "Windows (light)", src: "/assets/wallpapers/bloom-light.jpg" },
  { id: "bloom-dark", label: "Windows (dark)", src: "/assets/wallpapers/bloom-dark.jpg" },
];

export function getWallpaper(id) {
  return wallpapers.find((wallpaper) => wallpaper.id === id) ?? wallpapers[0];
}
