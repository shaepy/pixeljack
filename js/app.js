/* --------------------------------------- Variables -------------------------------------- */

let dealer = {cards: [], total: 0, hitCardIdx: 0, isBust: false}
let player = {cards: [], total: 0, hitCardIdx: 0, isBust: false}
let splitHand = {cards: [], total: 0, hitCardIdx: 0, isBust: false}
let activeHand = player
let bet = score = 0
let wallet = Number(localStorage.getItem('savedWallet')) || 200

/* --------------------------------------- Constants -------------------------------------- */

const allHands = [player, dealer, splitHand]
const srcUrl = window.location.hostname === '127.0.0.1' ? '' : '/pixeljack';
const savedHighScore = localStorage.getItem('savedHighScore')

const bodyElement = document.querySelector('body')
const actionsBar = document.querySelector('#actions')
const resultDiv = document.querySelector('#result')
const gameTable = document.querySelector('#game-table')
const gameBank = document.querySelector('#game-bank')
const homeScreen = document.querySelector('#home-screen')
const playAgainButtons = document.querySelector('#play-again-buttons')
const resetWallet = document.querySelector('#reset-wallet')
const scoreElements = document.querySelectorAll('.high-score')
const divToAddCardFlip = document.querySelector('#flip-animation-here')
const largeLogo = document.querySelector('#large-logo')
const smallLogo = document.querySelector('#small-logo')

const h2ResultElement = document.querySelector('#result h2')
const dealerCardsDiv = document.querySelector('#dealer-cards')
const playerCardsDiv = document.querySelector('#player-cards')
const dealerTotalDiv = document.querySelector('#dealer-total')
const playerTotalDiv = document.querySelector('#player-total')
const splitCardsDiv = document.querySelector('#splitHand-cards')
const splitTotalDiv = document.querySelector('#splitHand-total')
const firstHandDiv = document.querySelector('#split-view-1')
const secondHandDiv = document.querySelector('#split-view-2')

const hitButton = document.querySelector('#hit')
const standButton = document.querySelector('#stand')
const doubleButton = document.querySelector('#double')
const splitButton = document.querySelector('#split')
const actionButtons = document.querySelectorAll('#actions button')

/* ------------------------------------ Event Listeners ------------------------------------ */

document.body.addEventListener('click', playMusicTracks, {once: true})

document.querySelector('#start-game').addEventListener('click', () => {
    menuClickSound.play()
    if (wallet < bet) {
        turnDisplayToFlex([resetWallet])
        createTempMsg('You do not have enough coins. Reset to add more')
        return
    } else if (bet < 10) {
        createTempMsg('Choose a bet amount to start a game')
        return
    }
    bodyElement.style.backgroundImage = `url("${srcUrl}/assets/img/dealer-bg.png")`;
    turnDisplayToNone([homeScreen, largeLogo, playAgainButtons, resetWallet])
    turnDisplayToFlex([gameTable, smallLogo, gameBank, actionsBar])
    dealingCardsSound.play()
    startGame()
})

document.querySelector('#change-bet').addEventListener('click', () => {
    menuClickSound.play()
    resetGame()
    turnDisplayToNone([gameTable, resultDiv, smallLogo, secondHandDiv])
    turnDisplayToFlex([homeScreen, largeLogo])
    bodyElement.style.backgroundImage = `url("${srcUrl}/assets/img/pixel-casino-floor-bg.png")`;
    if (wallet < bet) turnDisplayToFlex([resetWallet])
})

document.querySelector('#play-again').addEventListener('click', () => {
    menuClickSound.play()
    if (wallet < bet) {
        turnDisplayToFlex([resetWallet])
        createTempMsg('You do not have enough coins. Reset to add more')
        return
    } else if (bet < 10) {
        createTempMsg('Choose a bet amount to start a game')
        return
    }
    resetGame()
    turnDisplayToNone([resultDiv, playAgainButtons, resetWallet, secondHandDiv])
    turnDisplayToFlex([actionsBar])
    startGame()
})

document.querySelector('#info-button').addEventListener('click', () => {
    menuClickSound.play()
    const instructions = document.querySelector('#instructions')
    window.getComputedStyle(instructions).display === 'flex' ? instructions.style.display = 'none':instructions.style.display = 'flex'
})

splitButton.addEventListener('click', () => {
    wallet -= bet
    bet += bet
    displayFunds()
    turnDisplayToFlex([secondHandDiv])
    setDisableAttr([splitButton, doubleButton])
    splitHand.cards.push(player.cards.pop())
    document.querySelectorAll('#player-cards img')[1].remove()
    splitHand.total = player.total = 0
    firstHandDiv.classList.add('cards-border')
    player.cards.push(getCard())
    splitHand.cards.push(getCard())
    addCardTotal()
    splitTotalDiv.innerText = splitHand.total
    playerTotalDiv.innerText = player.total
    playerCardsDiv.append(createCardImg(player.cards[1]))
    splitCardsDiv.append(createCardImg(splitHand.cards[0]), createCardImg(splitHand.cards[1]))
    createTempMsg('Your cards have been split')
    splitCardSound.play()
})

doubleButton.addEventListener('click', () => {
    if (wallet < bet) {
        createTempMsg('Your wallet is too low to double your bet')
        return
    }
    wallet -= bet
    bet += bet
    displayFunds()
    hit()
    if (!player.isBust) stand()
    bet = bet / 2
})

hitButton.addEventListener('click', hit)

standButton.addEventListener('click', () => {
    standSound.play()
    stand()
})

/* --------------------------------------- Bet Mechanic -------------------------------------- */

resetWallet.addEventListener('click', () => {wallet = 200, displayFunds(), coinJingleSound.play()})

document.querySelectorAll('.bet').forEach(b => b.addEventListener('click', (e) => {
    bet = Number(e.target.dataset.bet)
    selectCoinSound.play()
    displayFunds()
}))

const h3betAmounts = document.querySelectorAll('.bet-amnt')
const h3walletAmounts = document.querySelectorAll('.wallet-amnt')

function displayFunds() {
    h3betAmounts.forEach(amnt => amnt.innerText = bet)
    h3walletAmounts.forEach(amnt => amnt.innerText = wallet)
}

/* --------------------------------------- Start/Reset Game --------------------------------------- */

function startGame() {
    wallet -= bet
    displayFunds()
    dealCards()
    addCardTotal()
    displayCards()
    checkForBlackjack()
    if (window.getComputedStyle(instructions).display === 'flex') instructions.style.display = 'none'
}

function resetGame() {
    cardDeck.forEach(card => {
        card.hasBeenPlayed = false
        if (card.rank === 'ace') card.value = 11, card.aceValueChanged = false
    })
    if (activeHand === splitHand) activeHand = player
    allHands.forEach(hand => {hand.cards = [], hand.total = 0, hand.isBust = false})
    const resetDisplays = [
        h2ResultElement,
        dealerTotalDiv, 
        playerCardsDiv, 
        playerTotalDiv,
        splitCardsDiv,
        splitTotalDiv
    ]
    resetDisplays.forEach(div => div.innerText = '')
    removeDisableAttr([hitButton, standButton, doubleButton])
    // reset dealer cards
    divToAddCardFlip.classList.remove("flip-card-inner")
    document.querySelector('#hidden-card').remove()
    document.querySelectorAll('#dealer-cards img.dealer-card').forEach(img => img.remove())
}

/* --------------------------------------- Gameplay --------------------------------------- */

function getCard() {
    const cardDeckCopy = cardDeck.filter((card) => card.hasBeenPlayed === false)
    const x = Math.floor(Math.random() * cardDeckCopy.length)
    const matchIdx = cardDeck.findIndex((card) => card === cardDeckCopy[x])
    cardDeck[matchIdx].hasBeenPlayed = true
    return cardDeckCopy[x]
}

function dealCards() {
    dealer.cards.push(getCard(), getCard())
    player.cards.push(getCard(), getCard())
    if (player.cards[0].rank === player.cards[1].rank) {
        if (wallet < bet) {
            createTempMsg('You do not have enough coins to split your cards')
            return
        }
        removeDisableAttr([splitButton])
    }
}

function checkForAce(hand) {
    const aceIdx = hand.cards.findIndex(card => card.rank === 'ace' && !card.aceValueChanged)
    if (aceIdx !== -1) {
        hand.cards[aceIdx].value = 1
        hand.cards[aceIdx].aceValueChanged = true
        if (hand === player || hand === splitHand) {
            hand.total -= 10
            createTempMsg(`Your Ace value has changed from 11 to 1`)
        } else {
            dealer.total -= 10
        }
    }
}

function addCardTotal() {
    allHands.forEach(hand => hand.total = hand.cards.reduce((acc, card) => acc + card.value, 0))
    if (dealer.total > 21) checkForAce(dealer)
    if (splitHand.total > 21) checkForAce(splitHand)
    if (player.total > 21) {
        if (player.cards[0].rank === 'ace' && player.cards[1].rank === 'ace' && player.cards.length < 3 && splitHand.total <= 0) {
            player.total = 12
            return
        }
        checkForAce(player)
        if (player.total > 21) checkForAce(player)
    }
}

function checkForBlackjack() {
    if (player.total === 21 && dealer.total < 21) {
        setDisableAttr(actionButtons)
        wallet += bet + (bet * 1.5)
        h2ResultElement.innerText = 'Pixeljack! You Win'
        setTimeout(() => {blackjackSound.play()}, 200);
        setTimeout(revealHiddenCard, 300)
        setTimeout(displayFunds, 450)
        setTimeout(showResultScreen, 450)
    } else if (player.total === 21 && dealer.total === 21) stand()
}

function displayCards() {
    if (playerCardsDiv.innerHTML === '') {
        const hiddenCard = createCardImg(dealer.cards[0])
        hiddenCard.id = 'hidden-card'
        document.querySelector('.flip-card-front').append(hiddenCard)
        const dealer2ndCard = createCardImg(dealer.cards[1])
        dealer2ndCard.classList.add('dealer-card')
        dealerCardsDiv.append(dealer2ndCard)
        playerCardsDiv.append(createCardImg(player.cards[0]), createCardImg(player.cards[1]))
        dealerTotalDiv.innerText = dealer.cards[1].value
        playerTotalDiv.innerText = player.total
    }
    else {
        if (activeHand === player) {
            playerCardsDiv.append(createCardImg(activeHand.cards[activeHand.hitCardIdx]))
            playerTotalDiv.innerText = activeHand.total
        } else {
            splitCardsDiv.append(createCardImg(activeHand.cards[activeHand.hitCardIdx]))
            splitTotalDiv.innerText = activeHand.total
        }
    }
}

function hit() {
    const newCard = getCard()
    activeHand.cards.push(newCard)
    hitCardSound.play()
    if (player.cards.length > 2) setDisableAttr([splitButton, doubleButton])
    activeHand.hitCardIdx = activeHand.cards.findIndex((card) => card === newCard)
    addCardTotal()
    displayCards()
    if (activeHand.total === 21) {
        createTempMsg('Stand on 21')
        stand()
        return
    }
    checkForBust(activeHand)
}

function checkForBust(hand) {
    const createBustTag = (div) => {
        const bustTag = document.createElement('span')
        bustTag.innerText = 'BUST'
        div.append(bustTag)
    }
    if (player.total > 21 && splitHand.total > 21) {
        player.isBust = true
        splitHand.isBust = true
        createBustTag(splitTotalDiv)
        compareSplitResult()
        return
    }
    if (hand.total > 21) {
        if (splitHand.cards.length > 0) {
            hand.isBust = true
            if (hand === player) {createBustTag(playerTotalDiv)} 
            else {createBustTag(splitTotalDiv)}
            bustSound.play()
            stand()
            return
        } 
        hand.isBust = true
        createBustTag(playerTotalDiv)
        compareResult()
    }
}

function stand() {
    if (activeHand === player && splitHand.cards.length > 0) {
        activeHand = splitHand
        firstHandDiv.classList.remove('cards-border')
        secondHandDiv.classList.add('cards-border')
        return
    }
    setDisableAttr(actionButtons)
    setTimeout(revealHiddenCard, 300)
    while (dealer.total <= 16) dealerHit()
    compareResult()
}

function dealerHit() {
    const newCard = getCard()
    dealer.cards.push(newCard)
    dealer.hitCardIdx = dealer.cards.findIndex((card) => card === newCard)
    addCardTotal()
    if (dealer.total > 21) dealer.isBust = true
    const dealerHitCard = createCardImg(dealer.cards[dealer.hitCardIdx])
    dealerHitCard.classList.add('dealer-card')
    setTimeout(() => {
        dealerCardsDiv.append(dealerHitCard)
        dealerTotalDiv.innerText = dealer.total
    }, 300)
}

function compareResult() {
    if (activeHand === splitHand) {
        compareSplitResult()
        return
    }
    if (player.isBust) {
        setDisableAttr(actionButtons)
        setTimeout(revealHiddenCard, 300)
        setTimeout(showResultScreen, 450)
        setTimeout(() => {bustSound.play()}, 500);
        h2ResultElement.innerText = `You Bust`
        return
    }
    if (dealer.isBust || player.total - dealer.total > 0) {
        wallet += bet * 2
        h2ResultElement.innerText = 'You Win'
        setTimeout(() => {winSound.play()}, 500);
    } else if (player.total - dealer.total === 0) {
        wallet += bet
        h2ResultElement.innerText = `Push`
        setTimeout(() => {pushSound.play()}, 400);
    } else { 
        h2ResultElement.innerText = `You Lose`
        setTimeout(() => {loseSound.play()}, 400);
    }
    setTimeout(displayFunds, 450)
    setTimeout(showResultScreen, 450)
}

function compareSplitResult() {
    if (player.isBust && splitHand.isBust) {
        setDisableAttr(actionButtons)
        setTimeout(revealHiddenCard, 300)
        setTimeout(showResultScreen, 450)
        setTimeout(() => {bustSound.play()}, 500);
        h2ResultElement.innerText = `Both Hands Bust`
        bet = bet / 2
        return
    }
    function compareHands(handTotal, label) {
        if (dealer.isBust || handTotal - dealer.total > 0) {
            wallet += bet
            h2ResultElement.innerHTML += ` ${label} Wins<br>`
            setTimeout(() => {winSound.play()}, 500);
        } else if (handTotal - dealer.total === 0) {
            wallet += bet / 2
            h2ResultElement.innerHTML += ` ${label} Push<br>`
            setTimeout(() => {pushSound.play()}, 400);
        } else {
            h2ResultElement.innerHTML += ` ${label} Loses<br>`
            setTimeout(() => {loseSound.play()}, 400);
        }
    }
    if (!player.isBust) {compareHands(player.total, '1st Hand')}
    if (!splitHand.isBust) {compareHands(splitHand.total, '2nd Hand')}
    setTimeout(displayFunds, 450)
    setTimeout(showResultScreen, 450)
    bet = bet / 2
}

function revealHiddenCard() {
    divToAddCardFlip.classList.add("flip-card-inner")
    dealerTotalDiv.innerText = dealer.total
}

function showResultScreen() {
    localStorage.setItem('savedWallet', wallet)
    turnDisplayToFlex([resultDiv, playAgainButtons])
    turnDisplayToNone([actionsBar])
    secondHandDiv.classList.remove('cards-border')
    h3betAmounts[0].innerText = '0'
    if (wallet > score) {
        score = wallet
        if (score > savedHighScore) localStorage.setItem('savedHighScore', score)
        turnDisplayToFlex([document.querySelector('#game-score'), document.querySelector('#home-score')])
        createTempMsg(`Your high score is now ${score}`)
        scoreElements.forEach(display => display.innerText = score)
    }
}

/* --------------------------------------- UI / Visuals -------------------------------------- */

const turnDisplayToFlex = (arr) => arr.forEach(el => el.style.display = 'flex')
const turnDisplayToNone = (arr) => arr.forEach(el => el.style.display = 'none')
const setDisableAttr = (arr) => arr.forEach(el => {if (el.disabled === false) el.setAttribute('disabled', '')})
const removeDisableAttr = (arr) => arr.forEach(el => {if (el.disabled === true) el.removeAttribute('disabled')})

function createCardImg(card) {
    const cardImage = document.createElement('img')
    cardImage.classList.add('card')
    cardImage.alt = `${card.suit} ${card.rank}`
    cardImage.src = card.src
    return cardImage
}

function handleFadeEffect(element) {
    element.style.display = 'flex'
    requestAnimationFrame(() => element.classList.add('fade-in'))
    setTimeout(() => {
        element.classList.remove('fade-in')
        element.classList.add('fade-out')
        setTimeout(() => {
            element.style.display = 'none'
            element.classList.remove('fade-out')
            element.innerText = ''
        }, 1000)
    }, 2000)
}

function createTempMsg(string) {
    const pElement = document.createElement('p')
    pElement.innerText = string
    const tempMsgDiv = document.querySelector('#temp-msg')
    tempMsgDiv.append(pElement)
    handleFadeEffect(tempMsgDiv)
}

/* ------------------------------------- Audio / Mute Buttons ------------------------------------ */

const selectCoinSound = new Audio(`${srcUrl}/assets/audio/chips-stack.mp3`)
const dealingCardsSound = new Audio(`${srcUrl}/assets/audio/dealing-cards.mp3`)
const splitCardSound = new Audio(`${srcUrl}/assets/audio/card-split.mp3`)
const hitCardSound = new Audio(`${srcUrl}/assets/audio/card-hit.mp3`)
const standSound = new Audio(`${srcUrl}/assets/audio/stand-chips.mp3`)
const pushSound = new Audio(`${srcUrl}/assets/audio/push.mp3`)
const bustSound = new Audio(`${srcUrl}/assets/audio/bust.mp3`)
const loseSound = new Audio(`${srcUrl}/assets/audio/death.mp3`)
const winSound = new Audio(`${srcUrl}/assets/audio/win.mp3`)
const blackjackSound = new Audio(`${srcUrl}/assets/audio/blackjack.mp3`)
const coinJingleSound = new Audio(`${srcUrl}/assets/audio/coin-jingle.mp3`)
const menuClickSound = new Audio(`${srcUrl}/assets/audio/menu-select.mp3`)
const happyPixelTrack = new Audio(`${srcUrl}/assets/audio/happy-bg-music.mp3`)
const pixDreamsTrack = new Audio(`${srcUrl}/assets/audio/pixel-dreams-bg-music.mp3`)
const adventureTrack = new Audio(`${srcUrl}/assets/audio/adventure-theme-bg-music.mp3`)
const retroArcadeTrack = new Audio(`${srcUrl}/assets/audio/retro-arcade-bg-music.mp3`)
const retroGameTrack = new Audio(`${srcUrl}/assets/audio/retro-game-bg-music.mp3`)

dealingCardsSound.playbackRate = 1.5
hitCardSound.playbackRate = 1.5
loseSound.playbackRate = 1.5
coinJingleSound.playbackRate = 1.5
menuClickSound.playbackRate = 1.9
pushSound.playbackRate = 1.1
bustSound.playbackRate = 1.1
blackjackSound.playbackRate = 1.3

const masterVolume = [selectCoinSound, hitCardSound, splitCardSound, bustSound, loseSound, blackjackSound, coinJingleSound, standSound]
masterVolume.forEach(s => s.volume = 0.16)
winSound.volume = 0.06
menuClickSound.volume = 0.07
pushSound.volume = 0.09
dealingCardsSound.volume = 0.14

const soundElements = [
    selectCoinSound, dealingCardsSound, hitCardSound, splitCardSound, coinJingleSound, 
    pushSound, bustSound, loseSound, blackjackSound, winSound, menuClickSound, standSound
]

const bgMusicTracks = [retroArcadeTrack, retroGameTrack, happyPixelTrack, pixDreamsTrack, adventureTrack]
happyPixelTrack.playbackRate = 0.97
happyPixelTrack.volume = 0.012
retroArcadeTrack.volume = 0.012
retroGameTrack.volume = 0.012
pixDreamsTrack.volume = 0.014
adventureTrack.volume = 0.014

let soundIsMuted = false
const muteButton = document.querySelector('#mute-button')
muteButton.addEventListener('click', () => {
    soundIsMuted = !soundIsMuted
    soundElements.forEach(sound => sound.muted = soundIsMuted)
    soundIsMuted ? muteButton.src = `${srcUrl}/assets/img/pixel-muted.png`:muteButton.src = `${srcUrl}/assets/img/pixel-sound.png`
    menuClickSound.play()
})

let bgIsMuted = false
const musicButton = document.querySelector('#music-button')
musicButton.addEventListener('click', () => {
    bgIsMuted = !bgIsMuted
    bgMusicTracks.forEach(track => track.muted = bgIsMuted)
    bgIsMuted ? musicButton.src = `${srcUrl}/assets/img/music-off.png`:musicButton.src = `${srcUrl}/assets/img/music-on.png`
    menuClickSound.play()
})

let currentTrackIdx = 0
function playMusicTracks() {
    const track = bgMusicTracks[currentTrackIdx]
    track.play()
    track.addEventListener('ended', () => {
        currentTrackIdx = (currentTrackIdx + 1) % bgMusicTracks.length
        playMusicTracks()
    }, {once: true})
}

/* --------------------------------------- Execute on Start -------------------------------------- */

if (savedHighScore > 0) {
    score = savedHighScore
    scoreElements.forEach(scoreElement => scoreElement.innerText = savedHighScore)
    turnDisplayToFlex([document.querySelector('#game-score'), document.querySelector('#home-score')])
}

displayFunds()