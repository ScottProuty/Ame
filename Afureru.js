import Matter from "matter-js";

// Set up HTML5 canvas element for 2d rendering
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const backgroundCanvas = document.getElementById("backgroundCanvas");
const bgctx = backgroundCanvas.getContext("2d");

canvas.width = backgroundCanvas.width = 800;
canvas.height = backgroundCanvas.height = 700;

// Matter-js globals
const Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Composite = Matter.Composite;
const engine = Engine.create();
const world = engine.world;
var runner;

// Game globals
let currentlyDisplayedObjs = [];
let allowedCharacters = {};
let typedText = "";
let score = 0;
let highScore = 0;
let scoreElement;
let lastScoreElement;
let highScoreElement;
let settingsModal;
let errorModal;
let flowTimer;
const cup = createCup(235, 180, 330, 400, 55);

// Game settings globals
let charSetSettings = {
  hiragana: true,
  hiraganaDiacritics: true,
  katakana: true,
  katakanaDiacritics: true,
  kanji: false,
};
engine.gravity.y = 0.9;
let flowRate = 1000; // ms

// prettier-ignore
const characterSets = {
    hiragana: {
    あ: "a",   い: "i",   う: "u",   え: "e",  お: "o",
    か: "ka",  き: "ki",  く: "ku",  け: "ke", こ: "ko",
    さ: "sa",  し: "shi", す: "su",  せ: "se", そ: "so",
    た: "ta",  ち: "chi", つ: "tsu", て: "te", と: "to",
    な: "na",  に: "ni",  ぬ: "nu",  ね: "ne", の: "no",
    は: "ha",  ひ: "hi",  ふ: "fu",  へ: "he", ほ: "ho", // TODO: accept "ha" or "wa"
    ま: "ma",  み: "mi",  む: "mu",  め: "me", も: "mo",
    や: "ya",             ゆ: "yu",            よ: "yo",
    ら: "ra",  り: "ri",  る: "ru",  れ: "re", ろ: "ro",
    わ: "wa",  を: "o",   ん: "n" 
    },
    hiraganaDiacritics: {
    が: "ga",  ぎ: "gi",  ぐ: "gu",  げ: "ge",  ご: "go",
    ざ: "za",  じ: "ji",  ず: "zu",  ぜ: "ze",  ぞ: "zo",
    だ: "da",  ぢ: "ji",  づ: "zu",  で: "de",  ど: "do",
    ば: "ba",  び: "bi",  ぶ: "bu",  べ: "be",  ぼ: "bo",
    ぱ: "pa",  ぴ: "pi",  ぷ: "pu",  ぺ: "pe",  ぽ: "po",
    }, 
    katakana: {
    ア: "a",  イ: "i",   ウ: "u",   エ: "e",  オ: "o",
    カ: "ka", キ: "ki",  ク: "ku",  ケ: "ke", コ: "ko",
    サ: "sa", シ: "shi", ス: "su",  セ: "se", ソ: "so",
    タ: "ta", チ: "chi", ツ: "tsu", テ: "te", ト: "to",
    ナ: "na", ニ: "ni",  ヌ: "nu",  ネ: "ne", ノ: "no",
    ハ: "ha", ヒ: "hi",  フ: "fu",  ヘ: "he", ホ: "ho",
    マ: "ma", ミ: "mi",  ム: "mu",  メ: "me", モ: "mo",
    ヤ: "ya",            ユ: "yu",            ヨ: "yo",
    ラ: "ra", リ: "ri",  ル: "ru",  レ: "re", ロ: "ro",
    ワ: "wa", ン: "n"
    },
    katakanaDiacritics: {
    ガ: "ga",  ギ: "gi",  グ: "gu",  ゲ: "ge",  ゴ: "go",
    ザ: "za",  ジ: "ji",  ズ: "zu",  ゼ: "ze",  ゾ: "zo",
    ダ: "da",  ヂ: "ji",  ヅ: "zu",  デ: "de",  ド: "do",
    バ: "ba",  ビ: "bi",  ブ: "bu",  ベ: "be",  ボ: "bo",
    パ: "pa",  ピ: "pi",  プ: "pu",  ペ: "pe",  ポ: "po",
    },
    kanji: {
      私: "watashi", 雨:"ame", 行: "iku", 
    }
};

function createCup(x, y, width, height, chamferSize = width / 10) {
  return {
    topLeft: { x, y },
    bottomLeft: { x, y: y + height },
    bottomRight: { x: x + width, y: y + height },
    topRight: { x: x + width, y },
    width,
    height,
    bottomCenter: { x: x + width / 2, y: y + height },
    chamferSize,
  };
}

function DrawCup(cup) {
  bgctx.lineWidth = 8;
  bgctx.beginPath();
  bgctx.moveTo(cup.topLeft.x, cup.topLeft.y); // top left
  bgctx.lineTo(cup.bottomLeft.x, cup.bottomLeft.y - cup.chamferSize); // bottom left (start chamfer)
  bgctx.lineTo(cup.bottomLeft.x + cup.chamferSize, cup.bottomLeft.y); // bottom left (finish chamfer)
  bgctx.lineTo(cup.bottomRight.x - cup.chamferSize, cup.bottomRight.y); // bottom right (start chamfer)
  bgctx.lineTo(cup.bottomRight.x, cup.bottomRight.y - cup.chamferSize); // bottom right (finish chamfer)
  bgctx.lineTo(cup.topRight.x, cup.topRight.y); // top right
  bgctx.stroke();
}

function CreateCupPhysics() {
  const cupEdgewidth = 8;
  var cupBottomPhys = Bodies.rectangle(
    cup.bottomCenter.x,
    cup.bottomLeft.y,
    cup.bottomRight.x - cup.bottomLeft.x - 2 * cup.chamferSize,
    cupEdgewidth,
    { isStatic: true }
  );
  var cupRightPhys = Bodies.rectangle(
    cup.topRight.x,
    (cup.bottomRight.y - cup.topRight.y) / 2 + cup.topRight.y,
    cupEdgewidth,
    cup.height - cup.chamferSize,
    { isStatic: true }
  );

  var cupLeftPhys = Bodies.rectangle(
    cup.topLeft.x,
    (cup.bottomLeft.y - cup.topLeft.y) / 2 + cup.topLeft.y,
    cupEdgewidth,
    cup.height - cup.chamferSize,
    { isStatic: true }
  );

  const leftChamferVertices = [
    { x: cup.bottomLeft.x, y: cup.bottomLeft.y - cup.chamferSize }, // Top-left
    { x: cup.bottomLeft.x, y: cup.bottomLeft.y }, // Bottom-left
    { x: cup.bottomLeft.x + cup.chamferSize, y: cup.bottomLeft.y }, // Bottom-right
  ];

  const rightChamferVertices = [
    { x: cup.bottomRight.x, y: cup.bottomRight.y - cup.chamferSize }, // Top-right
    { x: cup.bottomRight.x, y: cup.bottomRight.y }, // Bottom-right
    { x: cup.bottomRight.x - cup.chamferSize, y: cup.bottomRight.y }, // Bottom-left
  ];
  const leftChamferPhys = Matter.Bodies.fromVertices(
    cup.bottomLeft.x + cup.chamferSize / 2,
    cup.bottomLeft.y - cup.chamferSize / 2,
    [leftChamferVertices],
    { isStatic: true }
  );

  const rightChamferPhys = Matter.Bodies.fromVertices(
    cup.bottomRight.x - cup.chamferSize / 2,
    cup.bottomRight.y - cup.chamferSize / 2,
    [rightChamferVertices],
    { isStatic: true }
  );
  Composite.add(engine.world, [
    cupBottomPhys,
    cupRightPhys,
    cupLeftPhys,
    leftChamferPhys,
    rightChamferPhys,
  ]);
}

class CharSquare {
  constructor(x, y, size, backColor, kana) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.backColor = backColor;
    this.kana = kana;
    this.roman = allowedCharacters[kana];
    this.deleted = false;

    // attach matter.js body
    this.body = Matter.Bodies.rectangle(x, y, size, size, {
      restitution: 0.6, // Bounciness
      friction: 0.5,
      density: 0.02,
    });
    Composite.add(engine.world, this.body);
  }

  draw() {
    if (this.deleted) return;

    const { x, y } = this.body.position;
    const angle = this.body.angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = this.backColor;
    ctx.shadowColor = "darkBlue";
    ctx.ShadowOffsetX = 25;
    ctx.shadowBlur = 10;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    // draw kana character:
    ctx.fillStyle = "black";
    ctx.font = `${this.size * 0.8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.kana, 0, 0);

    ctx.restore();
  }
  delete() {
    this.deleted = true; // mark for deletion
    Composite.remove(engine.world, this.body);
    Matter.World.remove(world, this.body); // remove phys part
  }
}

window.onload = function () {
  GetElements();

  AddHideOnClickEventListener(settingsModal);
  AddHideOnClickEventListener(errorModal);
};

function GetElements() {
  scoreElement = document.getElementById("score");
  lastScoreElement = document.getElementById("lastScore");
  highScoreElement = document.getElementById("highScore");
  settingsModal = document.getElementById("settingsModal");
  errorModal = document.getElementById("errorModal");
}

function AddHideOnClickEventListener(element) {
  element.addEventListener("click", (event) => {
    if (event.target === element) {
      element.classList.add("hidden");
    }
  });
}

function GenerateAvailableCharList() {
  allowedCharacters = {};
  for (const charSet in charSetSettings) {
    // charSet loops through hiragana, katakana, etc
    if (charSetSettings[charSet] && characterSets[charSet]) {
      // if "set: true" and exists in characterSets
      allowedCharacters = { ...allowedCharacters, ...characterSets[charSet] };
    } // allowedCharacters = {あ: 'a', い: 'i', etc}
  }
}

function getRandKanaRomanPair() {
  const allKana = Object.keys(allowedCharacters); // allKana: ['あ', 'い', etc]
  const randKana = allKana[Math.floor(Math.random() * allKana.length)];
  const pair = { kana: randKana, roman: allowedCharacters[randKana] };
  console.log(`New pair: ${pair.kana} ${pair.roman}`);
  return pair;
}

document.addEventListener("keydown", (event) => {
  if (event.key.length === 1) {
    typedText += event.key;
    CheckWord(typedText);
  } else if (event.key === "Backspace") {
    typedText = typedText.slice(0, -1);
  } else if (event.key === "Enter") {
    typedText = "";
  }
  document.getElementById("typedText").innerText = typedText;
});

document.getElementById("endGameBtn").addEventListener("click", () => {
  GameOver();
});
document.getElementById("newGameBtn").addEventListener("click", () => {
  NewGame();
});
document.getElementById("settingsBtn").addEventListener("click", () => {
  openSettings();
});
document.getElementById("closeSettingsBtn").addEventListener("click", () => {
  closeSettings();
});

function CheckWord(word) {
  let numSimultaneouslyCorrect = 0;
  currentlyDisplayedObjs.forEach((obj) => {
    if (word.toLowerCase() === obj.roman) {
      numSimultaneouslyCorrect++;
      console.log(`Roman "${obj.roman}" is correct!`);
      obj.delete();
      typedText = "";
    }
  });
  if (numSimultaneouslyCorrect > 0) AddScore(numSimultaneouslyCorrect);
}

function CreateNewBlock() {
  const newBlock = CreateKanaBlock();
  SetNewBlockInitialVelocity();
  currentlyDisplayedObjs.push(newBlock);
  //console.log(`current objs:`, currentlyDisplayedObjs);

  function SetNewBlockInitialVelocity() {
    let initialVelocity = 1.7;
    if (newBlock.x > cup.bottomCenter.x) initialVelocity = -initialVelocity;

    Body.setVelocity(newBlock.body, {
      x: Math.random() * initialVelocity,
      y: 0,
    });
  }

  function CreateKanaBlock() {
    let x = Math.floor(cup.topLeft.x + Math.random() * cup.width);
    let y = -50;
    let sizeNormal = 50;
    let newPair = getRandKanaRomanPair();
    const newBlock = new CharSquare(x, y, sizeNormal, "white", newPair.kana);
    return newBlock;
  }
}

function EraseAllBlocks() {
  currentlyDisplayedObjs.forEach((block) => {
    block.delete();
  });
}

function StartFlow() {
  if (!flowTimer) flowTimer = setInterval(CreateNewBlock, flowRate);
}

function StopFlow() {
  clearInterval(flowTimer);
  flowTimer = null;
}

// *** Scoring ***
function AddScore(numCorrect) {
  let regularScore = 5 * numCorrect;
  let bonus = 2 * (numCorrect - 1);
  score += regularScore + bonus;
  console.log(`Scored ${regularScore + bonus} points!`);
  updateScore(bonus);
}

const boxShadowBlurSpreadMultipliers = [
  { blur: 37, spread: 67 },
  { blur: 20, spread: 29 },
  { blur: 17, spread: 22 },
];
const boxShadowColors = [
  "rgb(255, 236, 236)",
  "rgb(255, 123, 0)",
  "rgb(106, 0, 255)",
];

function updateScore(bonus = 0) {
  scoreElement.innerText = score;
  StyleScore();
  updateBoxShadow();
  AnimateScore();

  function StyleScore() {
    if (score > 450) scoreElement.style.fontSize = "xxx-large";
    else if (score > 199) {
      scoreElement.style.fontSize = "xx-large";
    } else if (score > 100) scoreElement.style.fontSize = "x-large";
    else scoreElement.style.fontSize = "large";
    scoreElement.style.setProperty("--score-size", `${score / 4.5}px`);
  }
  function updateBoxShadow() {
    const shadows = boxShadowBlurSpreadMultipliers.map((bs, i) => {
      return `0px 0px ${score / bs.blur}px ${score / bs.spread}px ${
        boxShadowColors[i]
      }`;
    });
    scoreElement.style.boxShadow = shadows.join(", ");
  }
  function AnimateScore() {
    scoreElement.classList.add("pop");
    const duration =
      parseFloat(getComputedStyle(scoreElement).transitionDuration) * 1000;
    setTimeout(() => {
      scoreElement.classList.remove("pop");
    }, duration); // must match css anim duration
  }
}

let isHighScore = () => score > highScore;

function SaveScores() {
  lastScoreElement.innerText = score;
  localStorage.setItem("lastScore", score);
  if (isHighScore()) {
    highScoreElement.innerText = score;
    highScore = score;
    localStorage.setItem("highScore", score);
  }
}

function initScoreBoard() {
  highScore = parseInt(localStorage.getItem("highScore")) || 0;
  console.log(highScoreElement.innerText);
  highScoreElement.innerText = highScore;
}
function ToggleSettingsButton(enableBool) {
  document.getElementById("settingsBtn").disabled = !enableBool;
}

function GetChecked(id) {
  return document.getElementById(id).checked;
}
function LoadKanaSettings() {
  charSetSettings.hiragana = GetChecked("hiraganaCbx");
  charSetSettings.katakana = GetChecked("katakanaCbx");
  charSetSettings.hiraganaDiacritics = GetChecked("hiraganaDiacriticsCbx");
  charSetSettings.katakanaDiacritics = GetChecked("katakanaDiacriticsCbx");
}

function CharsetIsEmpty() {
  if (Object.keys(allowedCharacters).length === 0) {
    console.log("No allowed characters!");
    document.getElementById("errorModal").classList.remove("hidden");
    return true;
  }
  return false;
}

function NewGame() {
  console.log("New Game!");
  LoadKanaSettings();
  ToggleSettingsButton(false);
  GenerateAvailableCharList();
  if (CharsetIsEmpty()) {
    ToggleSettingsButton(true);
    return;
  }
  CreateNewBlock();
  StartFlow();
}

function GameOver() {
  StopFlow();
  SaveScores();
  score = 0;
  updateScore();
  EraseAllBlocks();
  ClearTypedText();
  ToggleSettingsButton(true);
}

function ClearTypedText() {
  typedText = "";
  document.getElementById("typedText").innerText = typedText;
}

function CheckForBlockBelowCanvas() {
  Matter.Events.on(engine, "afterUpdate", function () {
    // Check each body in world
    const bodies = Matter.Composite.allBodies(engine.world);

    bodies.forEach((body) => {
      const canvasHeight = document.getElementById("gameCanvas").height;
      if (
        body.position.y >
        canvasHeight + body.bounds.max.y - body.bounds.min.y
      ) {
        console.log("Body has fallen off canvas");
        Matter.World.remove(engine.world, body);
        GameOver();
      }
    });
  });
}

function openSettings() {
  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

function CreateGame() {
  DrawCup(cup);
  CreateCupPhysics();
  //initScoreBoard();
}

function GameLoop() {
  Matter.Engine.update(engine); // update physics
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
  // remove objs with "deleted" tag
  currentlyDisplayedObjs = currentlyDisplayedObjs.filter((obj) => !obj.deleted);
  // draw all objs
  currentlyDisplayedObjs.forEach((obj) => obj.draw());
  CheckForBlockBelowCanvas();
  requestAnimationFrame(GameLoop);
}

document.addEventListener("DOMContentLoaded", () => {
  CreateGame();
});

GameLoop();
