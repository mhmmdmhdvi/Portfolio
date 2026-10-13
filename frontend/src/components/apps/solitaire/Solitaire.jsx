import { useState } from "react";
import { GameShell } from "../shared/GameShell";
import { Card, describeCard, SUIT_SYMBOLS } from "./Card";
import {
  canMove,
  createGame,
  drawCard,
  moveCards,
  SUITS,
  undo,
} from "./engine";
import "./solitaire.css";

const sameSource = (first, second) =>
  first?.pile === second?.pile &&
  first?.pileIndex === second?.pileIndex &&
  first?.cardIndex === second?.cardIndex;

function firstCard(state, source) {
  if (source?.pile === "waste") return state.waste.at(-1);
  if (source?.pile === "foundation")
    return state.foundations[source.pileIndex].at(-1);
  if (source?.pile === "tableau")
    return state.tableau[source.pileIndex][source.cardIndex];
  return null;
}

export function Solitaire({ active = true }) {
  const [game, setGame] = useState(() => createGame());
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(
    "Choose a card, then its destination.",
  );
  const locked = !active || game.won;
  const homeCount = game.foundations.reduce(
    (count, pile) => count + pile.length,
    0,
  );
  const foundationTarget = selected
    ? SUITS.findIndex((_, pileIndex) =>
        canMove(game, selected, { pile: "foundation", pileIndex }),
      )
    : -1;

  function clearSelection() {
    setSelected(null);
    setMessage("Choose a card, then its destination.");
  }

  function newGame() {
    setGame(createGame());
    setSelected(null);
    setMessage("New deal. Build the four suits from ace to king.");
  }

  function attemptMove(source, destination) {
    if (locked) return false;
    const next = moveCards(game, source, destination);
    if (next === game) {
      setMessage(
        "That move is not allowed. Try a highlighted pile, or clear the selection.",
      );
      return false;
    }
    setGame(next);
    setSelected(null);
    const target =
      destination.pile === "foundation"
        ? `${SUITS[destination.pileIndex]} foundation`
        : `column ${destination.pileIndex + 1}`;
    setMessage(
      next.won
        ? "You win! All 52 cards are in the foundations."
        : `Moved ${describeCard(firstCard(game, source))} to ${target}.`,
    );
    return true;
  }

  function selectOrMove(source) {
    if (locked) return;
    if (sameSource(selected, source)) {
      clearSelection();
      return;
    }
    if (
      selected &&
      source.pile !== "waste" &&
      !(
        source.pile === "tableau" &&
        selected.pile === "tableau" &&
        source.pileIndex === selected.pileIndex
      )
    ) {
      attemptMove(selected, { pile: source.pile, pileIndex: source.pileIndex });
      return;
    }
    const card = firstCard(game, source);
    if (!card?.faceUp) return;
    setSelected(source);
    const count =
      source.pile === "tableau"
        ? game.tableau[source.pileIndex].length - source.cardIndex
        : 1;
    setMessage(
      `${describeCard(card)}${count > 1 ? ` and ${count - 1} cards below` : ""} selected. Choose a destination.`,
    );
  }

  function chooseDestination(destination) {
    if (locked) return;
    if (selected) attemptMove(selected, destination);
    else
      setMessage(
        destination.pile === "foundation"
          ? "Select a matching ace to start this foundation."
          : "Select a king or a run starting with a king for an empty column.",
      );
  }

  function autoFoundation(source) {
    if (locked) return;
    const pileIndex = SUITS.findIndex((_, index) =>
      canMove(game, source, { pile: "foundation", pileIndex: index }),
    );
    if (pileIndex >= 0) attemptMove(source, { pile: "foundation", pileIndex });
    else setMessage("This card cannot move to a foundation yet.");
  }

  function draw() {
    if (locked) return;
    const next = drawCard(game);
    if (next === game) return;
    setGame(next);
    setSelected(null);
    setMessage(
      next.waste.length
        ? `${describeCard(next.waste.at(-1))} drawn.`
        : "Waste recycled. Draw again to turn over the next card.",
    );
  }

  function undoMove() {
    if (!active) return;
    setGame(undo(game));
    setSelected(null);
    setMessage("Last move undone.");
  }

  return (
    <div className="solitaire-app">
      <GameShell
        title="Solitaire"
        status={`${!active ? "Paused · " : game.won ? "You won! · " : ""}${game.moves} moves · ${homeCount}/52 home`}
        toolbar={
          <>
            <button
              type="button"
              className="game-button primary"
              onClick={newGame}
              disabled={!active}
            >
              New game
            </button>
            <button
              type="button"
              className="game-button"
              onClick={undoMove}
              disabled={!active || !game.history.length}
            >
              Undo
            </button>
            <button
              type="button"
              className="game-button"
              onClick={() => autoFoundation(selected)}
              disabled={locked || foundationTarget < 0}
            >
              To foundation
            </button>
            <button
              type="button"
              className="game-button"
              onClick={clearSelection}
              disabled={locked || !selected}
            >
              Clear selection
            </button>
          </>
        }
        footer="Click or tap a face-up card, then a pile. Double-click a top card or use To foundation. Build columns downward in alternating colors; only kings fill empty columns."
      >
        <div className="solitaire-board" dir="ltr">
          <div className="sol-layout">
            <p className="sol-message" role="status" aria-live="polite">
              {!active ? "Game paused while this window is inactive." : message}
            </p>
            <div className="sol-top-row">
              <div className="sol-pile">
                <Card
                  card={game.stock.at(-1)}
                  label={
                    game.stock.length
                      ? `Stock, ${game.stock.length} cards. Draw one card`
                      : game.waste.length
                        ? "Stock empty. Recycle the waste"
                        : "Stock and waste empty"
                  }
                  className="sol-stock"
                  onClick={draw}
                  disabled={
                    locked || (!game.stock.length && !game.waste.length)
                  }
                >
                  {!game.stock.length && (
                    <span className="sol-recycle" aria-hidden="true">
                      {game.waste.length ? "↻" : "—"}
                    </span>
                  )}
                  {game.stock.length > 0 && (
                    <span className="sol-stock-count" aria-hidden="true">
                      {game.stock.length}
                    </span>
                  )}
                </Card>
                <span className="sol-pile-label">Stock</span>
              </div>
              <div className="sol-pile">
                <Card
                  card={game.waste.at(-1)}
                  label={
                    game.waste.length
                      ? `${describeCard(game.waste.at(-1))}, top of waste. Select card`
                      : "Waste empty"
                  }
                  selected={selected?.pile === "waste"}
                  onClick={() => selectOrMove({ pile: "waste" })}
                  onDoubleClick={() => autoFoundation({ pile: "waste" })}
                  disabled={locked || !game.waste.length}
                >
                  {!game.waste.length && (
                    <span className="sol-empty-mark" aria-hidden="true">
                      —
                    </span>
                  )}
                </Card>
                <span className="sol-pile-label">
                  Waste{game.waste.length > 0 ? ` · ${game.waste.length}` : ""}
                </span>
              </div>
              <div aria-hidden="true" />
              {SUITS.map((suit, pileIndex) => {
                const pile = game.foundations[pileIndex];
                const source = { pile: "foundation", pileIndex };
                const legal = canMove(game, selected, source);
                return (
                  <div className="sol-pile" key={suit}>
                    <Card
                      card={pile.at(-1)}
                      label={`${suit} foundation, ${pile.length} cards${pile.length ? `, ${describeCard(pile.at(-1))} on top` : ", ace needed"}${legal ? ". Move selected card here" : ""}`}
                      selected={sameSource(selected, source)}
                      destination={legal}
                      onClick={() =>
                        pile.length
                          ? selectOrMove(source)
                          : chooseDestination(source)
                      }
                      disabled={locked}
                    >
                      {!pile.length && (
                        <span
                          className={`sol-empty-mark ${suit === "hearts" || suit === "diamonds" ? "sol-empty-red" : ""}`}
                          aria-hidden="true"
                        >
                          {SUIT_SYMBOLS[suit]}
                          <small>A</small>
                        </span>
                      )}
                    </Card>
                    <span className="sol-pile-label">{pile.length}/13</span>
                  </div>
                );
              })}
            </div>
            {game.won && (
              <div className="sol-win" role="status">
                You win! All 52 cards are in the foundations.
              </div>
            )}
            <div
              className="sol-tableau"
              role="group"
              aria-label="Seven tableau columns"
            >
              {game.tableau.map((column, pileIndex) => {
                const destination = { pile: "tableau", pileIndex };
                const legal = canMove(game, selected, destination);
                return (
                  <div
                    className={`sol-column ${legal ? "sol-legal-column" : ""}`}
                    role="group"
                    aria-label={`Tableau column ${pileIndex + 1}, ${column.length} cards`}
                    key={pileIndex}
                  >
                    <Card
                      label={`Empty tableau column ${pileIndex + 1}. Kings only${legal ? ". Move selected cards here" : ""}`}
                      className="sol-column-slot"
                      destination={legal && !column.length}
                      onClick={() => chooseDestination(destination)}
                      disabled={locked || !!column.length}
                      aria-hidden={column.length ? true : undefined}
                    >
                      <span className="sol-empty-mark" aria-hidden="true">
                        K
                      </span>
                    </Card>
                    {column.map((card, cardIndex) => {
                      const source = { pile: "tableau", pileIndex, cardIndex };
                      const inSelection =
                        selected?.pile === "tableau" &&
                        selected.pileIndex === pileIndex &&
                        cardIndex >= selected.cardIndex;
                      return (
                        <div
                          className={`sol-tableau-card ${!card.faceUp ? "sol-covered-card" : ""}`}
                          key={card.id}
                        >
                          <Card
                            card={card}
                            label={
                              card.faceUp
                                ? `${describeCard(card)}, tableau column ${pileIndex + 1}, card ${cardIndex + 1}${inSelection ? ", selected" : ""}${legal ? ". Move selected cards to this column" : ". Select this card and cards below"}`
                                : `Face-down card ${cardIndex + 1} in tableau column ${pileIndex + 1}`
                            }
                            selected={card.faceUp ? inSelection : undefined}
                            destination={
                              legal && cardIndex === column.length - 1
                            }
                            onClick={() => selectOrMove(source)}
                            onDoubleClick={() => autoFoundation(source)}
                            disabled={locked || !card.faceUp}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <p className="sol-rules">
              Draw one · Unlimited recycles · Undo up to 100 moves
            </p>
          </div>
        </div>
      </GameShell>
    </div>
  );
}
