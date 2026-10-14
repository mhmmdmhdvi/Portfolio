export const SUIT_SYMBOLS = {
  spades: "♠",
  hearts: "♥",
  clubs: "♣",
  diamonds: "♦",
};
const RANK_NAMES = { 1: "Ace", 11: "Jack", 12: "Queen", 13: "King" };
const RANK_MARKS = { 1: "A", 11: "J", 12: "Q", 13: "K" };
const PIPS = {
  2: [[1, 2], [5, 2]],
  3: [[1, 2], [3, 2], [5, 2]],
  4: [[1, 1], [1, 3], [5, 1], [5, 3]],
  5: [[1, 1], [1, 3], [3, 2], [5, 1], [5, 3]],
  6: [[1, 1], [1, 3], [3, 1], [3, 3], [5, 1], [5, 3]],
  7: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3], [5, 1], [5, 3]],
  8: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3], [4, 2], [5, 1], [5, 3]],
  9: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 2], [4, 1], [4, 3], [5, 1], [5, 3]],
  10: [[1, 1], [1, 3], [2, 1], [2, 2], [2, 3], [4, 1], [4, 2], [4, 3], [5, 1], [5, 3]],
};

export function describeCard(card) {
  return `${RANK_NAMES[card.rank] || card.rank} of ${card.suit[0].toUpperCase()}${card.suit.slice(1)}`;
}

export function CardFace({ card }) {
  if (!card.faceUp)
    return <span className="sol-card-back" aria-hidden="true" />;
  const mark = RANK_MARKS[card.rank] || card.rank;
  const symbol = SUIT_SYMBOLS[card.suit];
  return (
    <span className="sol-card-face" aria-hidden="true">
      <span className="sol-card-corner">
        <b>{mark}</b>
        <span>{symbol}</span>
      </span>
      {PIPS[card.rank] && (
        <span className="sol-card-pips">
          {PIPS[card.rank].map(([row, column], index) => (
            <span key={index} style={{ gridRow: row, gridColumn: column, transform: row > 3 ? "rotate(180deg)" : undefined }}>{symbol}</span>
          ))}
        </span>
      )}
      <span className={`sol-card-center ${PIPS[card.rank] ? "sol-card-mobile-symbol" : ""}`}>
        {card.rank > 10 ? <><b>{mark}</b><small>{symbol}</small></> : symbol}
      </span>
      <span className="sol-card-corner sol-card-corner-bottom">
        <b>{mark}</b>
        <span>{symbol}</span>
      </span>
    </span>
  );
}

export function Card({
  card,
  label,
  selected,
  destination,
  className = "",
  children,
  ...props
}) {
  const color =
    card?.suit === "hearts" || card?.suit === "diamonds"
      ? "sol-red"
      : "sol-black";
  return (
    <button
      type="button"
      className={`sol-card ${card ? color : "sol-empty"} ${card && !card.faceUp ? "sol-face-down" : ""} ${selected ? "sol-selected" : ""} ${destination ? "sol-destination" : ""} ${className}`}
      aria-label={label}
      aria-pressed={selected === undefined ? undefined : !!selected}
      {...props}
    >
      {card && <CardFace card={card} />}
      {children}
    </button>
  );
}
