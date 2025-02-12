const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 900;

class CharSquare {
    constructor(x, y, size, backColor, char){
        this.x = x;
        this.y = y;
        this.size = size;
        this.backColor = backColor;
        this.char = char;
    }

    draw(){
        ctx.fillStyle = this.backColor;
        // createConicGradient()
        ctx.shadowColor = "darkBlue";
        ctx.ShadowOffsetX = 25;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.size, this.size);

        ctx.fillStyle = "black";
        ctx.font=`${this.size * 0.8}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.char, this.x + this.size/2, this.y + this.size/2);
    }
}

const sqDe = new CharSquare(150,150,50,"white","で");

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sqDe.draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();