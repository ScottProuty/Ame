import Matter from "matter-js";

//Set up matter-js for physics
const Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Composite = Matter.Composite;

var engine = Engine.create();
const world = engine.world;

// Set up HTML5 canvas element for 2d rendering
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const backgroundCanvas = document.getElementById("backgroundCanvas");
const bgctx = backgroundCanvas.getContext("2d");

canvas.width = backgroundCanvas.width = 800;
canvas.height = backgroundCanvas.height = 700;

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
  console.log("Drawing the cup");
  //const chamferSize = cup.width / 10;
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

// Game settings
let charSetSettings = {
  hiragana: true,
  hiraganaDiactirics: false,
  katakana: true,
  katakanaDiacritics: false,
  kanji: false,
};
engine.gravity.y = 0.9;
let flowRate = 1000; // ms

// Game globals
let currentlyDisplayedObjs = [];
let allowedCharacters = {};
const maxOnScreen = 1;
let currentlyOnScreen = 0;
let typedText = "";
let score = 0;
let highScore = 0;
let scoreElement;
let flowTimer;
const cup = createCup(235, 150, 330, 400);

window.onload = function () {
  scoreElement = document.getElementById("score");
};

function GenerateAvailableCharList() {
  allowedCharacters == {};
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

function CheckWord(word) {
  currentlyDisplayedObjs.forEach((obj) => {
    if (word.toLowerCase() === obj.roman) {
      CorrectWord(obj.roman);
      obj.delete();
    }
  });
}

function CorrectWord(roman) {
  console.log(`Roman "${roman}" is correct!`);
  typedText = "";
  AddScore();
}

function AddScore() {
  score += 5;
  updateScore();
}

function updateScore() {
  scoreElement.innerText = score;
  if (score > 199) scoreElement.style.fontSize = "xxx-large";
  else if (score > 99) {
    scoreElement.style.fontSize = "xx-large";
  } else if (score > 49) scoreElement.style.fontSize = "x-large";
  else scoreElement.style.fontSize = "large";

  animateScore();

  function animateScore() {
    scoreElement.classList.add("pop");
    const duration =
      parseFloat(getComputedStyle(scoreElement).transitionDuration) * 1000;
    setTimeout(() => {
      scoreElement.classList.remove("pop");
    }, duration); // must match css anim duration
  }
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
    let y = 50;
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
function SetScoreboard() {
  document.getElementById("lastScore").innerText = score;
  if (score > highScore) {
    document.getElementById("highScore").innerText = score;
    highScore = score;
  }
}

function NewGame() {
  console.log("New Game!");
  GenerateAvailableCharList();
  CreateNewBlock();
  StartFlow();
}

function GameOver() {
  StopFlow();
  SetScoreboard();
  score = 0;
  updateScore();
  EraseAllBlocks();
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

DrawCup(cup);
CreateCupPhysics();

var runner = Runner.create();
Runner.run(runner, engine);

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
GameLoop();
