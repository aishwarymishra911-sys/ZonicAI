// cards.js — deck & hand utilities (pure functions, no DOM, no state)

const SUITS  = ["♠", "♥", "♦", "♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

/** Returns a fresh shuffled 52-card deck */
function makeDeck() {
  const deck = [];
  for (const s of SUITS)
    for (const v of VALUES)
      deck.push({ s, v });
  return shuffleArray(deck);
}

/** Fisher-Yates shuffle (returns new array) */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Returns blackjack total for a hand array */
function handTotal(hand) {
  let total = 0;
  let aces  = 0;
  for (const card of hand) {
    if (card.v === "A") {
      aces++;
    } else if (["J","Q","K"].includes(card.v)) {
      total += 10;
    } else {
      total += parseInt(card.v, 10);
    }
  }
  // Add aces: 11 if it doesn't bust, otherwise 1
  for (let i = 0; i < aces; i++) {
    total += (total + 11 <= 21) ? 11 : 1;
  }
  return total;
}

/** True when hand is a soft 17 (ace counted as 11 giving total 17) */
function isSoft17(hand) {
  if (handTotal(hand) !== 17) return false;
  let pip = 0, aces = 0;
  for (const c of hand) {
    if (c.v === "A") aces++;
    else if (["J","Q","K"].includes(c.v)) pip += 10;
    else pip += parseInt(c.v, 10);
  }
  return aces > 0 && pip + 11 === 17;
}
