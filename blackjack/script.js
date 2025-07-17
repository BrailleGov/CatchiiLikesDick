const suits = ['\u2660', '\u2665', '\u2666', '\u2663'];
const ranks = [
  {rank: 'A', value: [1, 11]},
  {rank: '2', value: 2},
  {rank: '3', value: 3},
  {rank: '4', value: 4},
  {rank: '5', value: 5},
  {rank: '6', value: 6},
  {rank: '7', value: 7},
  {rank: '8', value: 8},
  {rank: '9', value: 9},
  {rank: '10', value: 10},
  {rank: 'J', value: 10},
  {rank: 'Q', value: 10},
  {rank: 'K', value: 10}
];
let deck = [];
let playerHand = [];
let dealerHand = [];

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
  div.className = 'bg-gray-700 rounded p-2 text-xl w-12 text-center animate__animated animate__fadeIn';
  div.textContent = card.rank + card.suit;
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
    endGame('Bust! Dealer wins.');
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
  if (dealerScore > 21 || playerScore > dealerScore) {
    message = 'You win!';
  } else if (playerScore === dealerScore) {
    message = "It's a tie.";
  } else {
    message = 'Dealer wins.';
  }
  endGame(message);
}

function endGame(msg) {
  update();
  setMessage(msg);
  document.getElementById('hit').disabled = true;
  document.getElementById('stand').disabled = true;
}

function setMessage(msg) {
  document.getElementById('message').textContent = msg;
}

document.getElementById('deal').addEventListener('click', start);
document.getElementById('hit').addEventListener('click', hit);
document.getElementById('stand').addEventListener('click', stand);

