import Matter from "matter-js";

//Set up matter-js for physics
const Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite; // = world?

var engine = Engine.create();

// Set up HTML5 canvas element for 2d rendering
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const backgroundCanvas = document.getElementById("backgroundCanvas");
const bgctx = backgroundCanvas.getContext("2d");

canvas.width = backgroundCanvas.width = 500;
canvas.height = backgroundCanvas.height = 500;

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

function CreateCup(x, y, width, height) {
  return {
    topLeft: { x, y },
    bottomLeft: { x, y: y + height },
    bottomRight: { x: x + width, y: y + height },
    topRight: { x: x + width, y },
    width,
    height,
    bottomCenter: { x: x + width / 2, y: y + height },
  };
}
const cup = CreateCup(70, 60, 330, 390);

function DrawCup() {
  console.log("Drawing the cup");
  bgctx.lineWidth = 8;
  bgctx.beginPath();
  bgctx.moveTo(cup.topLeft.x, cup.topLeft.y); // top left
  bgctx.lineTo(cup.bottomLeft.x, cup.bottomLeft.y); // bottom left
  bgctx.lineTo(cup.bottomRight.x, cup.bottomRight.y); // bottom right
  bgctx.lineTo(cup.topRight.x, cup.topRight.y); // top right
  bgctx.stroke();
}

class CharSquare {
  constructor(x, y, size, backColor, char) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.backColor = backColor;
    this.char = char;
    this.deleted = false;
  }

  draw() {
    if (this.deleted) return;

    ctx.fillStyle = this.backColor;
    ctx.shadowColor = "darkBlue";
    ctx.ShadowOffsetX = 25;
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x, this.y, this.size, this.size);

    ctx.fillStyle = "black";
    ctx.font = `${this.size * 0.8}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.char, this.x + this.size / 2, this.y + this.size / 2);
  }
  delete() {
    this.deleted = true; // mark for deletion
  }
  fall() {
    ctx.translate();
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

// Game globals
let currentlyDisplayedObjs = [];
let currentlyNeededRomans = [];
let allowedCharacters = {};
const maxOnScreen = 1;
let currentlyOnScreen = 0;
let typedText = "";

function GenerateAvailableCharList() {
  allowedCharacters == {};
  for (const charSet in charSetSettings) {
    if (charSetSettings[charSet] && characterSets[charSet]) {
      allowedCharacters = { ...allowedCharacters, ...characterSets[charSet] };
    }
  }
}

function getRandomChar(obj) {
  const charSets = Object.keys(obj); // get array of keys (charsets)
  const randomSet = charSets[Math.floor(Math.random() * charSets.length)];
  const pair = { kana: randomSet, roman: obj[randomSet] };
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

function CheckWord(word) {
  currentlyNeededRomans.forEach((roman) => {
    if (word.toLowerCase() === roman) {
      CorrectWord(roman);
    }
  });
}

function CorrectWord(roman) {
  console.log(`Roman ${roman} is correct!`);
  roman.delete();
  typedText = "";
  CreateNewChar();
}

function CreateNewChar() {
  let x = Math.floor(74 + Math.random() * 300);
  let y = 100;
  let sizeNormal = 50;
  let newChar = getRandomChar(allowedCharacters);
  const newobj = new CharSquare(x, y, sizeNormal, "white", newChar.kana);
  currentlyDisplayedObjs.push(newobj);
  currentlyNeededRomans.push(newChar.roman);
  console.log(`current objs:`, currentlyDisplayedObjs);

  return newobj;
}

function NewGame() {
  GenerateAvailableCharList();
  CreateNewChar();
}

DrawCup();
NewGame();

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 300, 80, 80);
var boxB = Bodies.rectangle(350, 50, 80, 80);
var cupBottomPhys = Bodies.rectangle(
  (cup.bottomRight.x - cup.bottomLeft.x) / 2 + cup.bottomLeft.x,
  cup.bottomLeft.y,
  cup.bottomRight.x - cup.bottomLeft.x,
  8,
  { isStatic: true }
);

// add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, cupBottomPhys]);
var runner = Runner.create();
Runner.run(runner, engine);

function GameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // remove objs with "deleted" tag
  currentlyDisplayedObjs = currentlyDisplayedObjs.filter((obj) => !obj.deleted);
  // draw all objs
  currentlyDisplayedObjs.forEach((obj) => obj.draw());

  ctx.fillStyle = "red";
  ctx.fillRect(
    cupBottomPhys.position.x - 165,
    cupBottomPhys.position.y - 4,
    cup.width,
    8
  );
  ctx.fillRect(boxA.position.x - 25, boxA.position.y - 25, 50, 50);
  ctx.fillRect(boxB.position.x - 25, boxB.position.y - 25, 50, 50);
  requestAnimationFrame(GameLoop);
}
GameLoop();
