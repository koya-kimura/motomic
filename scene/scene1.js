class Scene1 {
    draw(tex, params){

        const isMonochrome = true;

        tex.push();
        tex.translate(width/2, height/2);

        tex.background(0);

        const canvasAngle = map(params[4], 0, 1, -PI*0.5, PI*0.5);
        const canvasScale = map(params[1], 0, 1, 1, 3);

        tex.rotate(canvasAngle);
        tex.scale(canvasScale);

        const gridCount = 8;
        const fullSize = max(tex.width, tex.height) * sqrt(2);
        const cellSize = fullSize / gridCount;
        const lineLength = cellSize * map(params[3], 0, 1, 0.2, 1.0); // 線の長さ
        const offsetFactor = params[6];
        const noiseFactor = params[7];
        const lineSize = map(params[2], 0, 1, 1, cellSize); // 線の太さ

        // 全体の移動説ある、、？ 別シーンとの棲み分けかも

        for (let x = -fullSize / 2 + cellSize / 2; x <= fullSize / 2; x += cellSize) {
            for (let y = -fullSize / 2 + cellSize / 2; y <= fullSize / 2; y += cellSize) {
                tex.push();

                let offsetX = x * offsetFactor + map(this.uNoise(this.uNoise(x) * 4792 + this.uNoise(y) * 1872), 0, 1, -cellSize, cellSize) * noiseFactor;
                let offsetY = y * offsetFactor + map(this.uNoise(this.uNoise(x) * 7941 + this.uNoise(y) * 9824), 0, 1, -cellSize, cellSize) * noiseFactor;
                let angle = map(params[5], 0, 1, -PI * 0.5, PI * 0.5) + this.uNoise(this.uNoise(x) * 1234 + this.uNoise(y) * 4321) * TAU * params[5];

                tex.translate(offsetX, offsetY);
                tex.rotate(angle);

                tex.strokeWeight(lineSize);
                tex.stroke(cp[floor(this.uNoise(this.uNoise(x) * 4792 + this.uNoise(y) * 1872) * cp.length) | 0]);
                tex.strokeCap(SQUARE);
                tex.line(-lineLength*0.5, 0, lineLength*0.5, 0);

                tex.pop();
            }
        }

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