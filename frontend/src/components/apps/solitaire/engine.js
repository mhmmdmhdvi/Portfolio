export const SUITS = ["spades", "hearts", "clubs", "diamonds"];
const HISTORY_LIMIT = 100;
const isRed = (card) => card.suit === "hearts" || card.suit === "diamonds";
const validIndex = (index, length) =>
  Number.isInteger(index) && index >= 0 && index < length;

export function createGame(random = Math.random) {
  const deck = SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      suit,
      rank: index + 1,
      faceUp: false,
    })),
  );
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  const tableau = Array.from({ length: 7 }, () => []);
  for (let row = 0; row < 7; row++)
    for (let column = row; column < 7; column++)
      tableau[column].push({ ...deck.pop(), faceUp: row === column });
  return {
    stock: deck,
    waste: [],
    tableau,
    foundations: SUITS.map(() => []),
    moves: 0,
    won: false,
    history: [],
  };
}

function sourceCards(state, source) {
  if (!source) return [];
  if (source.pile === "waste") return state.waste.slice(-1);
  if (source.pile === "foundation" && validIndex(source.pileIndex, 4))
    return state.foundations[source.pileIndex].slice(-1);
  if (source.pile === "tableau" && validIndex(source.pileIndex, 7)) {
    const column = state.tableau[source.pileIndex];
    if (validIndex(source.cardIndex, column.length))
      return column.slice(source.cardIndex);
  }
  return [];
}

function validRun(cards) {
  return (
    cards.length > 0 &&
    cards.every(
      (card, index) =>
        card.faceUp &&
        (index === 0 ||
          (cards[index - 1].rank === card.rank + 1 &&
            isRed(cards[index - 1]) !== isRed(card))),
    )
  );
}

export function canMove(state, source, destination) {
  if (state.won || !destination) return false;
  const cards = sourceCards(state, source);
  if (!validRun(cards)) return false;
  const first = cards[0];
  if (
    destination.pile === "foundation" &&
    validIndex(destination.pileIndex, 4)
  ) {
    if (source.pile === "foundation" || cards.length !== 1) return false;
    const target = state.foundations[destination.pileIndex];
    return (
      first.suit === SUITS[destination.pileIndex] &&
      first.rank === target.length + 1
    );
  }
  if (destination.pile === "tableau" && validIndex(destination.pileIndex, 7)) {
    if (source.pile === "tableau" && source.pileIndex === destination.pileIndex)
      return false;
    const target = state.tableau[destination.pileIndex].at(-1);
    return target
      ? target.faceUp &&
          target.rank === first.rank + 1 &&
          isRed(target) !== isRed(first)
      : first.rank === 13;
  }
  return false;
}

function rememberMove(state, changes) {
  const { history, ...position } = state;
  const next = { ...position, ...changes, moves: state.moves + 1 };
  return {
    ...next,
    won: isWon(next),
    history: [...history.slice(-(HISTORY_LIMIT - 1)), position],
  };
}

export function drawCard(state) {
  if (state.won) return state;
  if (state.stock.length) {
    return rememberMove(state, {
      stock: state.stock.slice(0, -1),
      waste: [...state.waste, { ...state.stock.at(-1), faceUp: true }],
    });
  }
  if (state.waste.length) {
    return rememberMove(state, {
      stock: state.waste
        .slice()
        .reverse()
        .map((card) => ({ ...card, faceUp: false })),
      waste: [],
    });
  }
  return state;
}

export function moveCards(state, source, destination) {
  if (!canMove(state, source, destination)) return state;
  const cards = sourceCards(state, source);
  const tableau = state.tableau.slice();
  const foundations = state.foundations.slice();
  let waste = state.waste;
  if (source.pile === "waste") waste = waste.slice(0, -1);
  else if (source.pile === "foundation")
    foundations[source.pileIndex] = foundations[source.pileIndex].slice(0, -1);
  else {
    const remaining = tableau[source.pileIndex].slice(0, source.cardIndex);
    if (remaining.length && !remaining.at(-1).faceUp)
      remaining[remaining.length - 1] = { ...remaining.at(-1), faceUp: true };
    tableau[source.pileIndex] = remaining;
  }
  if (destination.pile === "tableau")
    tableau[destination.pileIndex] = [
      ...tableau[destination.pileIndex],
      ...cards,
    ];
  else
    foundations[destination.pileIndex] = [
      ...foundations[destination.pileIndex],
      ...cards,
    ];
  return rememberMove(state, { tableau, foundations, waste });
}

export function undo(state) {
  if (!state.history.length) return state;
  return { ...state.history.at(-1), history: state.history.slice(0, -1) };
}

export function isWon(state) {
  return state.foundations.every(
    (pile, index) =>
      pile.length === 13 &&
      pile.every(
        (card, rankIndex) =>
          card.suit === SUITS[index] &&
          card.rank === rankIndex + 1 &&
          card.faceUp,
      ),
  );
}
