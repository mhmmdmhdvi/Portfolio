const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const opposite = { up: "down", down: "up", left: "right", right: "left" };
const sameCell = (first, second) => first && second && first.x === second.x && first.y === second.y;

export function placeFood(snake, size, seed) {
  const occupied = new Set(snake.map(({ x, y }) => y * size + x));
  const free = [];
  for (let cell = 0; cell < size * size; cell++) {
    if (!occupied.has(cell)) free.push(cell);
  }
  if (!free.length) return { food: null, seed };
  const nextSeed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  const cell = free[Math.floor((nextSeed / 4294967296) * free.length)];
  return { food: { x: cell % size, y: Math.floor(cell / size) }, seed: nextSeed };
}

export function createSnake({ size = 20, seed = 1 } = {}) {
  const center = Math.floor(size / 2);
  const length = Math.min(3, size);
  const head = Math.max(center, length - 1);
  const snake = Array.from({ length }, (_, index) => ({ x: head - index, y: center }));
  return {
    size,
    snake,
    direction: "right",
    nextDirection: null,
    ...placeFood(snake, size, seed >>> 0),
    score: 0,
    status: "ready",
  };
}

export function startSnake(state) {
  return ["ready", "paused"].includes(state.status)
    ? { ...state, status: "playing", nextDirection: null }
    : state;
}

export function pauseSnake(state) {
  return state.status === "playing" ? { ...state, status: "paused", nextDirection: null } : state;
}

export function turnSnake(state, direction) {
  // One accepted turn per tick prevents right -> up -> left from reversing into the body.
  if (state.status !== "playing" || !directions[direction] || state.nextDirection
    || direction === state.direction || direction === opposite[state.direction]) return state;
  return { ...state, nextDirection: direction };
}

export function stepSnake(state) {
  if (state.status !== "playing") return state;
  const direction = state.nextDirection || state.direction;
  const delta = directions[direction];
  const head = { x: state.snake[0].x + delta.x, y: state.snake[0].y + delta.y };
  const eating = sameCell(head, state.food);
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (head.x < 0 || head.y < 0 || head.x >= state.size || head.y >= state.size
    || body.some((cell) => sameCell(cell, head))) {
    return { ...state, direction, nextDirection: null, status: "lost" };
  }
  const snake = [head, ...body];
  const full = snake.length === state.size * state.size;
  return {
    ...state,
    snake,
    direction,
    nextDirection: null,
    ...(eating ? placeFood(snake, state.size, state.seed) : {}),
    score: state.score + (eating ? 1 : 0),
    status: full ? "won" : "playing",
  };
}
