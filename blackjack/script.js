const suits = ['\u2660', '\u2665', '\u2666', '\u2663'];
const ranks = [
  { rank: 'A', value: [1, 11] },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 }
];
let deck = [];
let playerHand = [];
let dealerHand = [];
let balance = parseInt(localStorage.getItem('balance')) || 1000;
let currentBet = 0;

function updateBalance() {
  document.getElementById('balance-amount').textContent = balance;
  localStorage.setItem('balance', balance);
}

function adjustBet(amount) {
  const betInput = document.getElementById('bet');
  let val = parseInt(betInput.value) || 0;
  val += amount;
  if (val < 0) val = 0;
  if (val > balance) val = balance;
  betInput.value = val;
}

function newDeck() {
  const d = [];
  for (const suit of suits) {
    for (const r of ranks) {
      d.push({rank: r.rank, suit, value: r.value});
    }
  }
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function draw() {
  return deck.pop();
}

function start() {
  const betInput = document.getElementById('bet');
  currentBet = parseInt(betInput.value);
  if (isNaN(currentBet) || currentBet <= 0 || currentBet > balance) {
    setMessage('Invalid bet');
    return;
  }
  balance -= currentBet;
  updateBalance();

  deck = newDeck();
  playerHand = [draw(), draw()];
  dealerHand = [draw(), draw()];
  document.getElementById('hit').disabled = false;
  document.getElementById('stand').disabled = false;
  setMessage('');
  update();
}

function score(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else {
      total += card.value;
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function cardDiv(card) {
  const div = document.createElement('div');
  div.className = 'bg-white rounded border border-gray-300 w-14 h-20 flex items-center justify-center text-xl font-semibold animate__animated animate__fadeIn';
  div.textContent = card.rank + card.suit;
  if (card.suit === '\u2665' || card.suit === '\u2666') {
    div.classList.add('text-red-600');
  } else {
    div.classList.add('text-black');
  }
  return div;
}

function update() {
  const dealerDiv = document.getElementById('dealer-cards');
  dealerDiv.innerHTML = '';
  dealerHand.forEach(c => dealerDiv.appendChild(cardDiv(c)));
  document.getElementById('dealer-score').textContent = score(dealerHand);

  const playerDiv = document.getElementById('player-cards');
  playerDiv.innerHTML = '';
  playerHand.forEach(c => playerDiv.appendChild(cardDiv(c)));
  document.getElementById('player-score').textContent = score(playerHand);
}

function hit() {
  playerHand.push(draw());
  update();
  if (score(playerHand) > 21) {
    endGame('Bust! Dealer wins.', 'lose');
  }
}

function stand() {
  document.getElementById('hit').disabled = true;
  document.getElementById('stand').disabled = true;
  while (score(dealerHand) < 17) {
    dealerHand.push(draw());
  }
  const playerScore = score(playerHand);
  const dealerScore = score(dealerHand);
  let message = '';
  let result = '';
  if (dealerScore > 21 || playerScore > dealerScore) {
    message = 'You win!';
    result = 'win';
  } else if (playerScore === dealerScore) {
    message = "It's a tie.";
    result = 'tie';
  } else {
    message = 'Dealer wins.';
    result = 'lose';
  }
  endGame(message, result);
}

function endGame(msg, result) {
  update();
  setMessage(msg);
  document.getElementById('hit').disabled = true;
  document.getElementById('stand').disabled = true;
  if (result === 'win') {
    balance += currentBet * 2;
  } else if (result === 'tie') {
    balance += currentBet;
  }
  updateBalance();
}

function setMessage(msg) {
  document.getElementById('message').textContent = msg;
}

document.getElementById('deal').addEventListener('click', start);
document.getElementById('hit').addEventListener('click', hit);
document.getElementById('stand').addEventListener('click', stand);
document.getElementById('bet-dec').addEventListener('click', () => adjustBet(-5));
document.getElementById('bet-inc').addEventListener('click', () => adjustBet(5));

updateBalance();

