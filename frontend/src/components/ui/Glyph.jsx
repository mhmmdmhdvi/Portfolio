const paths = {
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  phone: <path d="M8 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-4l-5-2-2 3a15 15 0 0 1-7-7l3-2z" />,
  link: <><path d="m10 13 4-4M8 15l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 9l2-2a4 4 0 0 0-6-6L7 6a4 4 0 0 0 0 6" transform="translate(2 2)" /></>,
  external: <><path d="M14 3h7v7M21 3l-9 9M11 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" /></>,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  minimize: <path d="M5 12h14" />,
  maximize: <rect x="6" y="6" width="12" height="12" />,
  restore: (
    <>
      <path d="M9 5h10v10M5 9h10v10H5z" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  up: <path d="m6 15 6-6 6 6" />,
  back: <path d="m11 5-7 7 7 7M4 12h16" />,
  forward: <path d="m13 5 7 7-7 7M20 12H4" />,
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6.5 6.5a8 8 0 0 1 13 3M4.5 14.5a8 8 0 0 0 13 3" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7" />
    </>
  ),
  desktop: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="1" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v12M9 8l11-2" />
      <ellipse cx="6" cy="18" rx="3" ry="2" />
      <ellipse cx="17" cy="15" rx="3" ry="2" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="9" r="1.5" />
      <path d="m4 19 7-7 4 4 3-3 3 3" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="m17 10 4-3v10l-4-3" />
    </>
  ),
  folder: <path d="M3 7V4h7l2 3h9v13H3z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  more: (
    <>
      <circle cx="5" cy="12" r=".8" />
      <circle cx="12" cy="12" r=".8" />
      <circle cx="19" cy="12" r=".8" />
    </>
  ),
  sort: (
    <>
      <path d="M7 4v16m-3-3 3 3 3-3M14 5h7M14 10h5M14 15h3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  list: <path d="M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1" />,
  wifi: (
    <>
      <path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0" />
      <circle cx="12" cy="20" r=".7" />
    </>
  ),
  volume: (
    <>
      <path d="m11 4-5 5H2v6h4l5 5zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
    </>
  ),
  mute: (
    <>
      <path d="m11 4-5 5H2v6h4l5 5zM16 9l6 6m0-6-6 6" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <path d="M22 10v4M5 10h12v4H5z" />
    </>
  ),
  bluetooth: <path d="m7 6 10 12-5 4V2l5 4L7 18" />,
  airplane: (
    <path d="m2 12 8-3V3c0-2 4-2 4 0v6l8 3v3l-8-2v6l3 2v1l-5-1-5 1v-1l3-2v-6l-8 2z" />
  ),
  moon: <path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" />
    </>
  ),
  power: (
    <>
      <path d="M12 2v10M7 5a9 9 0 1 0 10 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  check: <path d="m5 12 4 4L20 5" />,
  pin: <path d="m8 3 8 2-1 6 4 4-7-1-6 6m2-17 1 7-4 4 7 0" />,
  cut: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="m4 3 12 12M20 3 8 15" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M15 8V3H3v13h5" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z" />
      <path d="m7 12 3 3 7-7" />
    </>
  ),
  taskview: (
    <>
      <rect x="2" y="4" width="13" height="16" rx="1" />
      <rect x="17" y="4" width="5" height="16" rx="1" />
    </>
  ),
  widgets: (
    <>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M10 3v18M10 12h12" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M7 15h10" />
    </>
  ),
};

export function Glyph({ name, size = 20, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name] ?? paths.document}
    </svg>
  );
}
