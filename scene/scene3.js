class Circle {
    // 定数
    static MIN_INITIAL_VELOCITY = -2; // 初期速度の最小値
    static MAX_INITIAL_VELOCITY = 2; // 初期速度の最大値
    static DAMPING_FACTOR = 0.98; // 衝突時の速度減衰係数

    constructor(x, y, r, vx, vy) {
        this.x = x;
        this.y = y;
        this.r = r; // 半径
        this.vx = vx;
        this.vy = vy;
        this.mass = r; // 質量は半径に比例すると仮定
        this.c = random(cp); // ランダムな色相を設定
        this.seed = random(10000);
    }

    // 円を移動させ、画面外に出たら再配置する
    moveAndRespawn(sp) {
        const vx = this.vx * sp; // スピードを掛ける
        const vy = this.vy * sp;
        this.x += vx;
        this.y += vy;
        this.x -= Scene3.FLOW_FORCE; // 右から左へ流れる力を加える

        // 左端からフレームアウトしたら右端から再生成 (中央が0,0の座標系)
        if (this.x + this.r < -width / 2) {
            this.respawn();
        }
    }

    // 円を右端に再生成する (中央が0,0の座標系)
    respawn() {
        this.x = width / 2 + this.r * Scene3.RESPAWN_OFFSET_FACTOR; // 画面の右端外側
        this.y = random(-height / 2 + this.r, height / 2 - this.r); // ランダムなY座標に再生成
        this.vx = random(Circle.MIN_INITIAL_VELOCITY, Circle.MAX_INITIAL_VELOCITY); // 速度をリセット
        this.vy = random(Circle.MIN_INITIAL_VELOCITY, Circle.MAX_INITIAL_VELOCITY);
        this.hue = random(360); // 色も新しくする
    }

    // Y軸方向の壁衝突のみをチェック（X軸は流れとリスポーンで管理） (中央が0,0の座標系)
    checkWallCollision() {
        // 下の壁に衝突
        if (this.y + this.r > height / 2) {
            this.y = height / 2 - this.r;
            this.vy *= -1;
        }
        // 上の壁に衝突
        else if (this.y - this.r < -height / 2) {
            this.y = -height / 2 + this.r;
            this.vy *= -1;
        }
    }

    // 他の円との衝突をチェックし、反発させる
    checkCircleCollision(other) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let distance = dist(this.x, this.y, other.x, other.y); // p5.jsのdist()関数を使用
        let minDist = this.r + other.r;

        if (distance < minDist) {
            // めり込みの解消（質量に基づいて押し戻す）
            let overlap = minDist - distance;
            let normalX = dx / distance; // 衝突方向の単位法線ベクトル
            let normalY = dy / distance;

            let totalMass = this.mass + other.mass;
            let pushAmountThis = overlap * (other.mass / totalMass);
            let pushAmountOther = overlap * (this.mass / totalMass);

            this.x -= pushAmountThis * normalX;
            this.y -= pushAmountThis * normalY;
            other.x += pushAmountOther * normalX;
            other.y += pushAmountOther * normalY;

            // 衝突後の速度計算（弾性衝突）
            let tangentX = -normalY; // 接線ベクトル
            let tangentY = normalX;

            let dp1 = this.vx * normalX + this.vy * normalY; // ボール1の法線方向速度成分
            let dt1 = this.vx * tangentX + this.vy * tangentY; // ボール1の接線方向速度成分

            let dp2 = other.vx * normalX + other.vy * normalY; // ボール2の法線方向速度成分
            let dt2 = other.vx * tangentX + other.vy * tangentY; // ボール2の接線方向速度成分

            // 1次元弾性衝突の公式を法線方向速度に適用
            let p1_after_normal = ((this.mass - other.mass) * dp1 + 2 * other.mass * dp2) / (this.mass + other.mass);
            let p2_after_normal = ((other.mass - this.mass) * dp2 + 2 * this.mass * dp1) / (this.mass + other.mass);

            // 最終的な速度を計算（法線方向と接線方向の速度を再結合）
            this.vx = p1_after_normal * normalX + dt1 * tangentX;
            this.vy = p1_after_normal * normalY + dt1 * tangentY;
            other.vx = p2_after_normal * normalX + dt2 * tangentX;
            other.vy = p2_after_normal * normalY + dt2 * tangentY;

            // 衝突時の速度減衰
            this.vx *= Circle.DAMPING_FACTOR;
            this.vy *= Circle.DAMPING_FACTOR;
            other.vx *= Circle.DAMPING_FACTOR;
            other.vy *= Circle.DAMPING_FACTOR;
        }
    }

    // 円を描画する
    display(tex) {
        const n = noise(this.seed, 4279) < 0.5 ? 0 : floor(map(pow(noise(this.seed), 2), 0, 1, 3, 10));
        const sp = map(pow(noise(this.seed), 0.5), 0, 1, 0.005, 0.03); // 調整

        tex.noStroke();
        tex.fill(this.c);
        tex.push();
        tex.translate(this.x, this.y);
        tex.rotate(-frameCount * sp);

        if (n == 0) {
            tex.circle(0, 0, this.r * 2);
        } else {
            tex.beginShape();
            for (let i = 0; i < n; i++) {
                const angle = TAU * i / n;
                const x = this.r * cos(angle);
                const y = this.r * sin(angle);

                tex.vertex(x, y);
            }
            tex.endShape(CLOSE);
        }

        tex.pop();
    }
}

// =====================================================================
// Scene3 クラス: 複数の円の生成、更新、描画を管理
// =====================================================================

class Scene3 {
    // 定数
    static FLOW_FORCE = 3.5; // 右から左へ流れる力の強さ
    static MIN_BALL_RADIUS_RATIO = 0.03; // 短い辺に対するボール半径の最小比率 (直径10%)
    static MAX_BALL_RADIUS_RATIO = 0.2; // 短い辺に対するボール半径の最大比率 (直径20%)
    static RESPAWN_OFFSET_FACTOR = 2; // 再生成位置オフセット (半径の何倍外側か)
    static INITIAL_X_OFFSET_FACTOR = 3; // 初期X座標オフセット (幅＋半径の何倍外側か)

    constructor(numCircles=20) {
        this.circles = []; // Circleオブジェクトを格納する配列
        this.numCircles = numCircles;
        this.initializeCircles(); // 円を初期配置
    }

    // 指定された数の円を初期化し、配列に追加 (中央が0,0の座標系)
    initializeCircles() {
        this.circles = []; // 既存の円をクリア
        let minDim = min(width, height); // キャンバスの短い辺の長さ

        let minRadius = minDim * Scene3.MIN_BALL_RADIUS_RATIO;
        let maxRadius = minDim * Scene3.MAX_BALL_RADIUS_RATIO;

        for (let i = 0; i < this.numCircles; i++) {
            let r = map(pow(random(), 4), 0, 1, minRadius, maxRadius); // 半径をレスポンシブに調整
            // 初期位置を画面の右端からさらに外側に設定 (幅 / 2 + 半径の1倍～3倍)
            let x = random(width * 0.5, width / 2 + r * Scene3.INITIAL_X_OFFSET_FACTOR);
            let y = random(-height / 2 + r, height / 2 - r); // 画面内に収まるY座標に設定
            let vx = random(Circle.MIN_INITIAL_VELOCITY, Circle.MAX_INITIAL_VELOCITY); // 初期速度
            let vy = random(Circle.MIN_INITIAL_VELOCITY, Circle.MAX_INITIAL_VELOCITY);
            this.circles.push(new Circle(x, y, r, vx, vy));
        }
    }

    // 全ての円の状態を更新し、描画する
    draw(tex, params) {
        const angle = params[0] * PI * 0.5;
        const scl = map(params[1], 0, 1, 1, 3); // キャンバスサイズに応じてスケール

        // if(params[3] > 0.5) tex.background(cp[floor(gvm.count()) % cp.length]); // 背景色を設定 (GVMのカウントに基づく)
        tex.push();
        tex.translate(width / 2, height / 2); // キャンバスの中心を原点に設定
        tex.rotate(angle); // キャンバスサイズに応じてスケール
        tex.scale(scl);
        for (let i = 0; i < this.circles.length; i++) {
            let c1 = this.circles[i];
            c1.moveAndRespawn(map(pow(params[2], 3), 0, 1, 1, 10)); // 移動と再配置
            c1.checkWallCollision(); // Y軸の壁衝突チェック

            // 他の円との衝突をチェック (二重チェックを避けるため j = i + 1 から開始)
            for (let j = i + 1; j < this.circles.length; j++) {
                let c2 = this.circles[j];
                c1.checkCircleCollision(c2);
            }
            c1.display(tex); // 円を描画
        }
        tex.pop();
    }

    colorPaletteUpdate(){
        for (let i = 0; i < this.circles.length; i++) {
            this.circles[i].c = random(cp); // 各円の色をランダムに更新
        }
    }

    // ウィンドウサイズ変更時に円の位置とサイズを調整 (中央が0,0の座標系)
    adjustCirclePositions() {
        let minDim = min(width, height);
        let minRadius = minDim * Scene3.MIN_BALL_RADIUS_RATIO;
        let maxRadius = minDim * Scene3.MAX_BALL_RADIUS_RATIO;

        for (let circle of this.circles) {
            // 半径を新しいスケールに調整
            // 現在の比率を維持しつつ、新しいキャンバスサイズに対する最小/最大半径内に収める
            let oldMinDim = min(pmouseX, pmouseY) > 0 ? min(pmouseX, pmouseY) : width; // ざっくりとした前回の短い辺
            let scaleFactor = minDim / oldMinDim;
            circle.r = constrain(circle.r * scaleFactor, minRadius, maxRadius);
            circle.mass = circle.r; // 質量も更新

            // X/Y座標をキャンバス内に収まるように調整 (流れがあるのでX制約は緩めに)
            circle.x = constrain(circle.x, -width / 2 - circle.r, width / 2 + circle.r); // 画面の左右外側まで移動を許容
            circle.y = constrain(circle.y, -height / 2 + circle.r, height / 2 - circle.r);
        }
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

    resize() {

    }
}