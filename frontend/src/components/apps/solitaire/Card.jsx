export const SUIT_SYMBOLS = {
  spades: "♠",
  hearts: "♥",
  clubs: "♣",
  diamonds: "♦",
};
const RANK_NAMES = { 1: "Ace", 11: "Jack", 12: "Queen", 13: "King" };
const RANK_MARKS = { 1: "A", 11: "J", 12: "Q", 13: "K" };

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
      <span className="sol-card-center">{symbol}</span>
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
