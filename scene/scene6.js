class Scene6 {
    draw(tex, params){
        const maxRadius = min(width, height) * 0.4;

        tex.push();
        tex.translate(width / 2, height / 2);
        tex.rotate(millis() * 0.0001); // 時間に応じて回転

        for (let i = 0; i < params.length; i++) {
            const angle = TAU * i / params.length;

            tex.push();
            tex.rotate(angle);
            tex.stroke(255);
            tex.line(0, 0, maxRadius, 0);

            const m = 5;
            for (let j = 0; j < m - 1; j++) {
                const x = map(j, 0, m - 2, 1 / m, 1) * maxRadius;
                tex.line(x, min(width, height) * 0.01, x, -min(width, height) * 0.01);
            }
            tex.pop();
        }

        for (let i = 0; i < params.length; i++) {
            // GVMのgetInterpolatedValueを使用して補間された値を取得
            // cycleLength: 8拍、easeDuration: 1拍、easeFunc: Easing.easeOutSine を例として設定
            // RleapのgetWithHoldのホールド効果を再現するため、easeDurationを短く設定すると良いでしょう。
            const radius1 = maxRadius * map(params[i], 0, 1, 0.1, 1.0);
            const angle1 = TAU * i / params.length;
            const x1 = radius1 * cos(angle1);
            const y1 = radius1 * sin(angle1);

            const angle2 = TAU * (i + 1) / params.length;
            // 次の要素も同様にGVMから値を取得
            const radius2 = maxRadius * map(params[(i+1) % params.length], 0, 1, 0.1, 1.0);
            const x2 = radius2 * cos(angle2);
            const y2 = radius2 * sin(angle2);

            tex.noStroke();
            tex.fill(cp[i % cp.length]);

            tex.beginShape();
            tex.vertex(0, 0);
            tex.vertex(x1, y1);
            tex.vertex(x2, y2);
            tex.endShape(CLOSE);
        }

        tex.pop();
    }

    resize() {

    }
}