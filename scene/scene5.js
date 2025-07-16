class Scene5 {
    constructor() {
        PatternManager.register("horizontal", new HorizontalSlide());
        this.flowManager = new FlowManager();
    }

    draw(tex, params){
        tex.background(0);

        this.flowManager.update();
        this.flowManager.draw(tex, params);
    }

    colorPaletteUpdate() {
        this.flowManager.blocks.forEach(block => {
            block.cells.forEach(cell => {
                cell.c1 = random(cp);
                const others = cp.filter(c => c !== cell.c1);
                cell.c2 = others.length > 0 ? random(others) : cell.c1
            }
            );
        });
    }


    resize() {
        this.flowManager = new FlowManager();
    }
}

function easeInOutSine(t) {
    return -0.5 * (cos(PI * t) - 1);
}

// === 各パターンの描画戦略 ===
class HorizontalSlide {
    draw(tex, params, cell, progress) {
        const w = min(cell.width, cell.height);

        const h = map(params[4], 0, 1, 0.3, 0.8) * cell.height;
        const y = map(Easing.easeInOutQuint(abs((gvm.count() + (this.uNoise(cell.seed) > 0.5)) % 2 - 1)), 0, 1, 0, cell.height - h);
        tex.push();
        tex.noStroke();
        tex.fill(red(cell.c1), green(cell.c1), blue(cell.c1), Easing.easeInOutQuint(map(params[6], 0, 1, 1, 0.2)) * 255);
        tex.rect(0, y, cell.width, h);
        tex.pop();

        const rectScale = params[1];
        tex.push();
        tex.noStroke();
        tex.fill(red(cell.c2), green(cell.c2), blue(cell.c2), Easing.easeInOutQuint(map(params[7], 0, 1, 1, 0.2)) * 255);
        tex.rect(0, 0, cell.width, cell.height * rectScale);
        tex.pop();

        const scaleWeight = map(params[0], 0, 1, 0.5, 1);
        const arr = ["流", "場", "音", "拍", "動"]
        const index = floor((this.uNoise(cell.seed) * arr.length + (fract(gvm.count()) > 0.5) * floor(frameCount) * params[2])) % arr.length;
        tex.push();
        tex.translate(cell.width * 0.5, cell.height * 0.5);
        if(cell.width > cell.height){
            tex.scale(cell.width / w * scaleWeight, 1);
        } else {
            tex.scale(1, cell.height / w * scaleWeight);
        }
        tex.noStroke();
        tex.fill(0, params[5] * 255);
        tex.textAlign(CENTER, CENTER);
        tex.textSize(w);
        tex.textFont("Noto Sans JP");
        tex.text(arr[index], 0, 0);
        tex.pop();
    }

    uNoise(seed) {
        // 現在の random 状態を保存
        const currentState = randomSeed.__state || null;

        // 決定的にする
        randomSeed(seed);
        const value = random();

        // 状態を復元
        if (currentState !== null) {
            // randomSeed() を上書きする前に random() を呼ぶことで擬似的に戻す
            randomSeed(currentState);
        }

        return value;
    }
}

// === PatternManager: 描画パターンの管理 ===
class PatternManager {
    static patterns = {};

    static register(name, patternInstance) {
        this.patterns[name] = patternInstance;
    }

    static getRandomPattern(seed) {
        const keys = Object.keys(this.patterns);
        randomSeed(seed);
        const name = random(keys);
        return this.patterns[name];
    }

    static draw(tex, params, cell, pattern, progress) {
        pattern.draw(tex, params, cell, progress);
    }
}

// === CellData: セル（1つの矩形）を表すデータクラス ===
class CellData {
    constructor(posX, posY, width, height, seed, gridW, gridH) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.gridW = gridW;
        this.gridH = gridH;

        const palette = [...cp]; // グローバルな cp を保護
        this.c1 = random(palette);
        const others = palette.filter(c => c !== this.c1);
        this.c2 = others.length > 0 ? random(others) : this.c1;

        this.pattern = PatternManager.getRandomPattern(this.seed);
    }

    draw(tex, params, offsetX, margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    }) {
        const interval = 150;
        const progress = map(abs(frameCount % (interval * 2) - interval), 0, interval, 0, 1);

        const drawX = offsetX + this.posX + margin.left;
        const drawY = this.posY + margin.top;
        const drawW = this.width - margin.left - margin.right;
        const drawH = this.height - margin.top - margin.bottom;

        tex.push();
        tex.translate(drawX, drawY);

        tex.fill(this.c2);
        PatternManager.draw(
            tex,
            params,
            {
            width: drawW,
            height: drawH,
            gridW: this.gridW,
            gridH: this.gridH,
            seed: this.seed,
            c1: this.c1,
            c2: this.c2
        },
            this.pattern,
            progress
        );

        tex.pop();
    }
}

// === FlowBlock: セルのまとまり（スライドする1つの画面） ===
class FlowBlock {
    constructor(gridCols, gridRows, cellSize, offsetX, minDivSize = 2) {
        this.cells = [];
        this.offsetX = offsetX;
        this.gridCols = gridCols;
        this.gridRows = gridRows;
        this.cellSize = cellSize;
        this.minDivSize = minDivSize;

        this.generateCells();
    }

    generateCells() {
        this.cells = [];

        const split = (gx, gy, gw, gh) => {
            if (gw <= this.minDivSize || gh <= this.minDivSize) {
                this.cells.push(new CellData(
                    gx * this.cellSize,
                    gy * this.cellSize,
                    gw * this.cellSize,
                    gh * this.cellSize,
                    floor(random(999999)),
                    gw,
                    gh
                ));
                return;
            }

            const splitW = floor(random(1, gw));
            const splitH = floor(random(1, gh));

            split(gx, gy, splitW, splitH);
            split(gx + splitW, gy, gw - splitW, splitH);
            split(gx, gy + splitH, splitW, gh - splitH);
            split(gx + splitW, gy + splitH, gw - splitW, gh - splitH);
        };

        split(0, 0, this.gridCols, this.gridRows);
    }

    update(speed, canvasWidth) {
        this.offsetX -= speed;
        if (this.offsetX <= -canvasWidth) {
            this.offsetX += 2 * canvasWidth;
            this.generateCells();
        }
    }

    draw(tex, params, margin) {
        for (let cell of this.cells) {
            cell.draw(tex, params, this.offsetX, margin);
        }
    }
}

// === FlowManager: 全体の流れ管理 ===
class FlowManager {
    constructor() {
        this.gridRows = 8;
        this.cellSize = height / this.gridRows;
        this.gridCols = pow(2, round(Math.log2(width / this.cellSize)));
        this.canvasWidth = this.gridCols * this.cellSize;
        this.speed = 2;

        this.cellMargin = {
            top: min(width, height) * 0.01 * 0.5,
            right: min(width, height) * 0.01 * 0.5 * 0.5,
            bottom: min(width, height) * 0.01 * 0.5,
            left: min(width, height) * 0.01 * 0.5
        };

        this.blocks = [
            new FlowBlock(this.gridCols, this.gridRows, this.cellSize, 0),
            new FlowBlock(this.gridCols, this.gridRows, this.cellSize, this.canvasWidth)
        ];
    }

    update() {
        for (let block of this.blocks) {
            block.update(this.speed, this.canvasWidth);
        }
    }

    draw(tex, params) {
        for (let block of this.blocks) {
            block.draw(tex, params, this.cellMargin);
        }
    }
}

// イージング
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}