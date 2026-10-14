const SHAPES = {
  p: <>
    <circle cx="32" cy="17" r="7.5" />
    <path d="M26 26h12c-1.5 8-1 13 4 18H22c5-5 5.5-10 4-18Z" />
    <path d="M24 26h16v4H24zM21 44h22l3 6H18zM17 50h30v6H17z" />
    <path className="chess-piece-detail" d="M23 47h18M21 53h22" />
  </>,
  r: <>
    <path d="M18 11h7v7h5v-7h5v7h5v-7h7v14l-7 5H25l-7-5Z" />
    <path d="M25 29h15l-2 15H27zM23 44h19l4 6H18zM17 50h30v6H17z" />
    <path className="chess-piece-detail" d="M22 23h21M27 33h11M22 47h20M21 53h22" />
  </>,
  n: <>
    <path d="M23 44c1-6 7-12 10-17l-8 4-9-3 1-6 13-10 4-5 5 7c7 4 11 12 10 21l-3 9Z" />
    <path d="M23 44h23l3 6H19zM17 50h33v6H17z" />
    <path className="chess-piece-detail" d="m21 23 7-3m10-4c7 6 9 14 6 24M24 47h21M21 53h25" />
    <circle className="chess-piece-eye" cx="32" cy="18" r="1.8" stroke="none" />
  </>,
  b: <>
    <circle cx="32" cy="10" r="3" />
    <path d="M32 13c-5 5-11 10-10 16 1 5 5 7 10 7s9-2 10-7c1-6-5-11-10-16Z" />
    <path d="M28 35h8l4 10H24zM22 45h20l4 5H18zM17 50h30v6H17z" />
    <path className="chess-piece-detail" d="m34 20-6 9M26 31h12M23 47h18M21 53h22" />
  </>,
  q: <>
    <path d="m16 18 8 10 1-14 7 12 7-12 1 14 8-10-6 20H22Z" />
    <circle cx="16" cy="15" r="3" /><circle cx="25" cy="12" r="3" />
    <circle cx="32" cy="10" r="3" /><circle cx="39" cy="12" r="3" /><circle cx="48" cy="15" r="3" />
    <path d="M23 34h18l-3 11H26zM23 45h18l5 5H18zM17 50h30v6H17z" />
    <path className="chess-piece-detail" d="M24 31h16M26 38h12M23 47h18M21 53h22" />
  </>,
  k: <>
    <path d="M29 7h6v5h5v5h-5v6h-6v-6h-5v-5h5z" />
    <path d="M32 25c-8-10-19-4-16 5l8 12h16l8-12c3-9-8-15-16-5Z" />
    <path d="M25 38h14l3 8H22zM22 46h20l4 4H18zM17 50h30v6H17z" />
    <path className="chess-piece-detail" d="M32 25v10M25 41h14M23 47h18M21 53h22" />
  </>,
};

export function ChessPiece({ color, type, className = "" }) {
  return (
    <svg className={`chess-piece-svg ${color === "w" ? "white" : "black"} ${className}`} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {SHAPES[type]}
    </svg>
  );
}
