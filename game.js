// game.js — state management, game logic, DOM rendering

// ── AI Opponents ──────────────────────────────────────────────────
const AIs = [
  {
    id: "chatgpt", label: "ChatGPT", diff: "Easy", logo: "🤖",
    color: "#10b981",
    desc: "Stands on 14+. Gives you a fighting chance.",
    standOn: 14, hitSoft17: false,
  },
  {
    id: "gemini", label: "Gemini", diff: "Medium", logo: "💫",
    color: "#4f8ef7",
    desc: "Standard casino rules. Stands on hard 17.",
    standOn: 17, hitSoft17: false,
  },
  {
    id: "claude", label: "Claude", diff: "Hard", logo: "🔮",
    color: "#f59e0b",
    desc: "Optimal play. Reads the table like a pro.",
    standOn: 17, hitSoft17: false,
  },
  {
    id: "grok", label: "Grok", diff: "Expert", logo: "⚡",
    color: "#a855f7",
    desc: "Hits soft 17. Unpredictable and aggressive.",
    standOn: 17, hitSoft17: true,
  },
];

// Chip denominations and their colours
const CHIPS = [
  { amt: 5,   color: "#22c55e" },
  { amt: 10,  color: "#3b82f6" },
  { amt: 25,  color: "#f59e0b" },
  { amt: 50,  color: "#ef4444" },
  { amt: 100, color: "#a855f7" },
  { amt: 500, color: "#ec4899" },
];

// ── Game state ────────────────────────────────────────────────────
const state = {
  ai:         null,
  deck:       [],
  playerHand: [],
  dealerHand: [],
  phase:      "bet",   // "bet" | "play" | "result"
  chips:      1000,
  bet:        0,
  revealed:   false,   // whether dealer's hole card is face-up
  outcome:    null,    // "bj" | "win" | "lose" | "bust" | "push"
  stats:      { w: 0, l: 0, p: 0, bj: 0 },
};

// ── DOM shortcuts ─────────────────────────────────────────────────
const el = (id) => document.getElementById(id);

// ── Select screen ─────────────────────────────────────────────────
function buildSelectScreen() {
  const grid = el("ai-grid");
  grid.innerHTML = "";

  AIs.forEach((ai) => {
    const btn = document.createElement("button");
    btn.className = "ai-card";
    btn.innerHTML = `
      <div class="ai-card-top">
        <span class="ai-logo">${ai.logo}</span>
        <div>
          <div class="ai-name" style="color:${ai.color}">${ai.label}</div>
          <div class="ai-diff">${ai.diff}</div>
        </div>
      </div>
      <div class="ai-desc">${ai.desc}</div>
    `;
    btn.addEventListener("mouseenter", () => {
      btn.style.borderColor = ai.color;
      btn.style.boxShadow   = `0 0 20px ${ai.color}30`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.borderColor = "";
      btn.style.boxShadow   = "";
    });
    btn.addEventListener("click", () => startSession(ai));
    grid.appendChild(btn);
  });
}

// ── Start a session with chosen AI ───────────────────────────────
function startSession(ai) {
  state.ai         = ai;
  state.chips      = 1000;
  state.bet        = 0;
  state.stats      = { w: 0, l: 0, p: 0, bj: 0 };
  state.phase      = "bet";
  state.playerHand = [];
  state.dealerHand = [];
  state.outcome    = null;
  state.revealed   = false;

  el("select-screen").classList.add("hidden");
  el("game-screen").classList.remove("hidden");
  render();
}

// ── Master render ─────────────────────────────────────────────────
function render() {
  renderTopBar();
  renderStats();
  renderHands();
  renderOutcome();
  renderActionBar();
}

function renderTopBar() {
  const ai = state.ai;
  const badge = el("ai-badge");
  badge.textContent    = `${ai.logo} vs ${ai.label} · ${ai.diff}`;
  badge.style.color    = ai.color;
  badge.style.borderColor = ai.color + "44";
  badge.style.boxShadow   = `0 0 10px ${ai.color}22`;
  el("chips-display").textContent = `💰 ${state.chips.toLocaleString()}`;
}

function renderStats() {
  const { w, l, p, bj } = state.stats;
  el("stats-row").innerHTML = `
    <div class="stat-box"><div class="stat-val" style="color:#22c55e">${w}</div><div class="stat-lbl">Win</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#ef4444">${l}</div><div class="stat-lbl">Loss</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#64748b">${p}</div><div class="stat-lbl">Push</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#fbbf24">${bj}</div><div class="stat-lbl">BJ ⚡</div></div>
  `;
}

function renderHands() {
  // Dealer
  renderCardRow("dealer-cards", state.dealerHand, /* hideHole= */ !state.revealed);
  const dTotal = handTotal(state.dealerHand);
  el("dealer-label").textContent =
    state.revealed && state.dealerHand.length
      ? `Dealer · ${dTotal > 21 ? "BUST" : dTotal}`
      : "Dealer";

  // Player
  renderCardRow("player-cards", state.playerHand, false);
  const pTotal = handTotal(state.playerHand);
  el("player-label").textContent =
    state.playerHand.length
      ? `You · ${pTotal > 21 ? "BUST" : pTotal}`
      : "You";
}

function renderCardRow(containerId, hand, hideHole) {
  const wrap = el(containerId);
  wrap.innerHTML = "";
  hand.forEach((card, i) => {
    const div = document.createElement("div");
    const hidden = hideHole && i === 1;
    if (hidden) {
      div.className = "card back";
      div.innerHTML = `<div class="card-suit">♠</div>`;
    } else {
      const red = card.s === "♥" || card.s === "♦";
      div.className = `card ${red ? "red" : "black"}`;
      div.innerHTML = `<div class="card-val">${card.v}</div><div class="card-suit">${card.s}</div>`;
    }
    wrap.appendChild(div);
  });
}

function renderOutcome() {
  const msg = el("outcome-msg");
  if (!state.outcome) { msg.textContent = ""; msg.style.cssText = ""; return; }

  const COLORS = { bj:"#fbbf24", win:"#22c55e", push:"#94a3b8", lose:"#ef4444", bust:"#ef4444" };
  const gain   = Math.floor(state.bet * 1.5); // for blackjack display (already paid out)

  const TEXTS = {
    bj:   `BLACKJACK! +${gain}`,
    win:  `YOU WIN  +${state.bet}`,
    push: "PUSH — BET RETURNED",
    lose: `DEALER WINS  -${state.bet}`,
    bust: `BUST  -${state.bet}`,
  };

  const col = COLORS[state.outcome] || "#e2e8f0";
  msg.textContent      = TEXTS[state.outcome] || "";
  msg.style.color      = col;
  msg.style.textShadow = `0 0 22px ${col}55`;
}

// ── Action bar ────────────────────────────────────────────────────
function renderActionBar() {
  const bar = el("action-bar");

  if (state.phase === "bet") {
    bar.innerHTML = `
      <div class="bet-amount">
        ${state.bet > 0 ? `Bet: <strong>${state.bet}</strong>` : "&nbsp;"}
      </div>
      <div class="chip-row">
        ${CHIPS.map(({ amt, color }) => {
          const off = state.chips < amt ? "disabled" : "";
          return `<button class="chip" style="color:${color};border-color:${color};box-shadow:0 0 8px ${color}33"
            ${off} onclick="addChip(${amt})">${amt}</button>`;
        }).join("")}
      </div>
      <div class="bet-controls">
        <button class="btn btn-clear" onclick="clearBet()" ${state.bet === 0 ? "disabled" : ""}>Clear</button>
        <button class="btn btn-allin" onclick="allIn()"    ${state.chips === 0 ? "disabled" : ""}>All In</button>
        <button class="btn btn-deal"  onclick="deal()"     ${state.bet === 0 ? "disabled" : ""}>DEAL</button>
      </div>
    `;

  } else if (state.phase === "play") {
    const canDouble = state.playerHand.length === 2 && state.chips >= state.bet;
    bar.innerHTML = `
      <div class="play-controls">
        <button class="btn btn-hit"    onclick="hit()">HIT</button>
        <button class="btn btn-stand"  onclick="stand()">STAND</button>
        ${canDouble ? `<button class="btn btn-double" onclick="doubleDown()">2×</button>` : ""}
      </div>
    `;

  } else if (state.phase === "result") {
    const broke = state.chips <= 0;
    bar.innerHTML = `
      ${broke ? `<div class="refill-note">Out of chips! Refilling 1,000 🎰</div>` : ""}
      <button class="btn btn-next" onclick="nextRound()">NEXT ROUND →</button>
    `;
  }
}

// ── Betting actions ───────────────────────────────────────────────
function addChip(amt) {
  if (state.chips < amt) return;
  Sound.chip();
  state.bet   += amt;
  state.chips -= amt;
  render();
}
function clearBet() {
  if (state.bet === 0) return;
  Sound.chip();
  state.chips += state.bet;
  state.bet    = 0;
  render();
}
function allIn() {
  if (state.chips === 0) return;
  Sound.chip();
  state.bet   += state.chips;
  state.chips  = 0;
  render();
}

// ── Deal ──────────────────────────────────────────────────────────
function deal() {
  if (state.bet === 0) return;
  state.deck = makeDeck();

  // Draw 4 cards: p1, d1, p2, d2
  const p1 = state.deck.shift();
  const d1 = state.deck.shift();
  const p2 = state.deck.shift();
  const d2 = state.deck.shift();

  Sound.card();
  state.playerHand = [p1, p2];
  state.dealerHand = [d1, d2];
  state.revealed   = false;
  state.outcome    = null;
  state.phase      = "play";

  render();

  // Immediate blackjack check
  const pTotal = handTotal(state.playerHand);
  const dTotal = handTotal(state.dealerHand);
  if (pTotal === 21) {
    state.revealed = true;
    setTimeout(() => {
      finishRound(dTotal === 21 ? "push" : "bj");
      render();
    }, 400);
  }
}

// ── Player actions ────────────────────────────────────────────────
function hit() {
  if (state.phase !== "play") return;
  Sound.card();
  state.playerHand.push(state.deck.shift());
  if (handTotal(state.playerHand) > 21) {
    state.revealed = true;
    finishRound("bust");
  }
  render();
}

function stand() {
  if (state.phase !== "play") return;
  state.revealed = true;
  render();                          // flip hole card first
  setTimeout(runDealerAI, 420);      // then dealer plays
}

function doubleDown() {
  if (state.phase !== "play") return;
  if (state.chips < state.bet) return;
  state.chips -= state.bet;
  state.bet   *= 2;
  Sound.card();
  state.playerHand.push(state.deck.shift());
  state.revealed = true;
  if (handTotal(state.playerHand) > 21) {
    finishRound("bust");
    render();
  } else {
    render();
    setTimeout(runDealerAI, 500);
  }
}

// ── Dealer AI ─────────────────────────────────────────────────────
function runDealerAI() {
  const ai = state.ai;

  const shouldHit = () => {
    const t = handTotal(state.dealerHand);
    if (t < ai.standOn) return true;
    if (ai.hitSoft17 && isSoft17(state.dealerHand)) return true;
    return false;
  };

  const step = () => {
    if (shouldHit()) {
      Sound.card();
      state.dealerHand.push(state.deck.shift());
      render();
      setTimeout(step, 500);          // animate each dealer card
    } else {
      const pt = handTotal(state.playerHand);
      const dt = handTotal(state.dealerHand);
      if      (dt > 21 || pt > dt) finishRound("win");
      else if (dt > pt)            finishRound("lose");
      else                         finishRound("push");
      render();
    }
  };
  step();
}

// ── Finish round — pay out chips ──────────────────────────────────
function finishRound(result) {
  state.outcome = result;
  state.phase   = "result";

  if (result === "bj") {
    const gain = Math.floor(state.bet * 1.5);   // 3:2 payout
    state.chips += state.bet + gain;
    state.stats.w++;
    state.stats.bj++;
    Sound.bj();
  } else if (result === "win") {
    state.chips += state.bet * 2;
    state.stats.w++;
    Sound.win();
  } else if (result === "bust" || result === "lose") {
    // chips already deducted at bet time
    state.stats.l++;
    Sound.lose();
  } else {
    // push
    state.chips += state.bet;        // return stake
    state.stats.p++;
    Sound.push();
  }
}

// ── Next round ────────────────────────────────────────────────────
function nextRound() {
  if (state.chips <= 0) state.chips = 1000;
  state.playerHand = [];
  state.dealerHand = [];
  state.bet        = 0;
  state.outcome    = null;
  state.revealed   = false;
  state.phase      = "bet";
  render();
}

// ── Back button ───────────────────────────────────────────────────
el("btn-back").addEventListener("click", () => {
  el("game-screen").classList.add("hidden");
  el("select-screen").classList.remove("hidden");
});

// ── Boot ──────────────────────────────────────────────────────────
buildSelectScreen();
