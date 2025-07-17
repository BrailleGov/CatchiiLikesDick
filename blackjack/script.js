const suits = ['\u2660', '\u2665', '\u2666', '\u2663'];
const ranks = [
  {rank:'A', value:[1,11]},
  {rank:'2', value:2},
  {rank:'3', value:3},
  {rank:'4', value:4},
  {rank:'5', value:5},
  {rank:'6', value:6},
  {rank:'7', value:7},
  {rank:'8', value:8},
  {rank:'9', value:9},
  {rank:'10', value:10},
  {rank:'J', value:10},
  {rank:'Q', value:10},
  {rank:'K', value:10}
];

let deck = [];
let playerHand = [];
let dealerHand = [];
let balance = parseInt(localStorage.getItem('balance')) || 1000;
let currentBet = 0;
let inGame = false;
let muted = false;

// SOUND SETUP --------------------------------------------------------------
function writeStr(view, offset, str){for(let i=0;i<str.length;i++) view.setUint8(offset+i, str.charCodeAt(i));}
function toneDataUri(freq, duration){
    const sampleRate = 44100;
    const len = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + len*2);
    const view = new DataView(buffer);
    writeStr(view,0,'RIFF');
    view.setUint32(4,36+len*2,true);
    writeStr(view,8,'WAVE');
    writeStr(view,12,'fmt ');
    view.setUint32(16,16,true);
    view.setUint16(20,1,true);
    view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*2,true);
    view.setUint16(32,2,true);
    view.setUint16(34,16,true);
    writeStr(view,36,'data');
    view.setUint32(40,len*2,true);
    for(let i=0;i<len;i++){
        const t=i/sampleRate;
        const s=Math.sin(2*Math.PI*freq*t);
        view.setInt16(44+i*2,s*0.6*32767,true);
    }
    let bin='';
    const bytes=new Uint8Array(buffer);
    for(let b of bytes) bin+=String.fromCharCode(b);
    return 'data:audio/wav;base64,'+btoa(bin);
}

const sounds = {
    flip: new Howl({src:[toneDataUri(880,0.15)], volume:0.5}),
    chip: new Howl({src:[toneDataUri(440,0.1)], volume:0.5}),
    win: new Howl({src:[toneDataUri(660,0.3)], volume:0.5}),
    lose: new Howl({src:[toneDataUri(200,0.3)], volume:0.5})
};

function playSound(name){ if(!muted && sounds[name]) sounds[name].play(); }

// GAME LOGIC ---------------------------------------------------------------
function updateBalance(){
    document.getElementById('balance').textContent = balance;
    localStorage.setItem('balance', balance);
}

function newDeck(){
    const d = [];
    for(const suit of suits){
        for(const r of ranks){ d.push({rank:r.rank,suit,value:r.value}); }
    }
    for(let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
    return d;
}

function draw(){ return deck.pop(); }

function score(hand){
    let total = 0, aces=0;
    for(const c of hand){
        if(c.rank==='A'){aces++; total+=11;} else total+=c.value;
    }
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
}

function cardElem(card){
    const div=document.createElement('div');
    div.className='bg-white text-black w-14 h-20 rounded flex items-center justify-center text-xl font-semibold';
    if(card.suit==='\u2665' || card.suit==='\u2666') div.classList.add('text-red-600');
    div.textContent=card.rank+card.suit;
    return div;
}

function render(){
    const dealer=document.getElementById('dealer-cards');
    dealer.innerHTML='';
    dealerHand.forEach(c=>{
        const d=cardElem(c);
        dealer.appendChild(d);
        gsap.from(d,{rotationY:-180,duration:0.5,ease:'power2.out',onStart:()=>playSound('flip')});
    });
    document.getElementById('dealer-score').textContent=inGame?score(dealerHand):'';

    const player=document.getElementById('player-cards');
    player.innerHTML='';
    playerHand.forEach(c=>{
        const d=cardElem(c);
        player.appendChild(d);
        gsap.from(d,{rotationY:-180,duration:0.5,ease:'power2.out',onStart:()=>playSound('flip')});
    });
    document.getElementById('player-score').textContent=inGame?score(playerHand):'';
}

function startGame(){
    if(currentBet<=0 || currentBet>balance || inGame) return;
    inGame=true;
    balance-=currentBet; updateBalance();
    deck=newDeck();
    playerHand=[draw(),draw()];
    dealerHand=[draw(),draw()];
    document.querySelectorAll('#controls button').forEach(b=>b.disabled=false);
    document.querySelectorAll('.chip').forEach(c=>c.classList.add('pointer-events-none','opacity-50'));
    render();
}

function endRound(msg,result){
    inGame=false;
    document.querySelectorAll('#controls button').forEach(b=>b.disabled=true);
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('pointer-events-none','opacity-50'));
    if(result==='win') { balance+=currentBet*2; playSound('win'); }
    else if(result==='tie') { balance+=currentBet; }
    else if(result==='lose') { playSound('lose'); }
    updateBalance();
    showModal(msg);
}

function hit(){
    if(!inGame) return;
    playerHand.push(draw());
    render();
    if(score(playerHand)>21) endRound('Bust! Dealer wins.','lose');
}

function dealerPlay(){
    while(score(dealerHand)<17){ dealerHand.push(draw()); }
}

function stand(){
    if(!inGame) return;
    dealerPlay();
    const ps=score(playerHand); const ds=score(dealerHand);
    if(ds>21 || ps>ds) endRound('You win!','win');
    else if(ps===ds) endRound("It's a tie.",'tie');
    else endRound('Dealer wins.','lose');
}

function doubleDown(){
    if(!inGame || balance<currentBet) return;
    balance-=currentBet; currentBet*=2; updateBalance();
    hit();
    if(inGame) stand();
}

function resetGame(){
    currentBet=0;
    playerHand=[]; dealerHand=[];
    document.getElementById('current-bet').textContent=0;
    render();
}

function chipClick(e){
    if(inGame) return;
    const val=parseInt(e.currentTarget.dataset.value);
    if(balance>=val){
        currentBet+=val; balance-=val; updateBalance();
        document.getElementById('current-bet').textContent=currentBet;
        playSound('chip');
        gsap.from(e.currentTarget,{y:-20,duration:0.2,ease:'bounce'});
    }
}

function showModal(text){
    const modal=document.getElementById('modal');
    document.getElementById('modal-message').textContent=text;
    modal.classList.remove('hidden');
    gsap.fromTo(modal.children[0],{scale:0.8,opacity:0},{scale:1,opacity:1,duration:0.3});
}

function hideModal(){
    const modal=document.getElementById('modal');
    modal.classList.add('hidden');
    resetGame();
}

function toggleSound(){
    muted=!muted;
    Howler.mute(muted);
    document.getElementById('sound-icon').innerHTML = muted?
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5L6 9H2v6h4l5 4V5zM19 5l-6 6m0 0l6 6"/>' :
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5L6 9H2v6h4l5 4V5z"/>';
}

// EVENT LISTENERS ----------------------------------------------------------
document.getElementById('deal').addEventListener('click', startGame);
document.getElementById('hit').addEventListener('click', hit);
document.getElementById('stand').addEventListener('click', stand);
document.getElementById('double').addEventListener('click', doubleDown);
document.getElementById('reset').addEventListener('click', hideModal);
document.getElementById('sound-btn').addEventListener('click', toggleSound);
document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click', chipClick));

updateBalance();
render();
