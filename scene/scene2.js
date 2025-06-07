class Scene2 {
    draw(tex, params){
        tex.push();
        tex.translate(width / 2, height / 2);

        tex.colorMode(HSB, 360, 100, 100);

        const backgroundHue = map(params[0], 0, 1, 0, 360 * 2) % 360;
        const canvasSaturation = isMonochrome ? 0 : 90;
        const objectBrightness = isMonochrome ? 0 : 95;
        const canvasBrightness = 95;

        tex.background(backgroundHue, canvasSaturation, canvasBrightness);

        const canvasScale = map(params[1], 0, 1, 1, 3);

        tex.scale(canvasScale);

        const chars = ["晴", "流", "雨", "雪", "霧", "雷", "風"];
        const gridCount = 8;
        const fullSize = max(tex.width, tex.height) * sqrt(2);
        const cellSize = fullSize / gridCount;
        const lineSize = map(params[2], 0, 1, 0.2, 1.0) * cellSize; // 線の太さ

        // 全体の移動説ある、、？ 別シーンとの棲み分けかも

        for (let x = -fullSize / 2 + cellSize / 2; x <= fullSize / 2; x += cellSize) {
            for (let y = -fullSize / 2 + cellSize / 2; y <= fullSize / 2; y += cellSize) {
                const offsetY = fract(millis() * 0.0005) * cellSize;
                const offsetX = params[3] * cellSize;
                const charIndex = floor(map(params[4], 0, 1, 0, chars.length-1));
                const char = chars[charIndex];

                tex.push();

                tex.translate(x + offsetX, y + offsetY);

                tex.textAlign(CENTER, CENTER);
                tex.textSize(lineSize);
                tex.noStroke();
                tex.fill((backgroundHue + 180) % 360, canvasSaturation, objectBrightness);
                tex.text(char, 0, 0);

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