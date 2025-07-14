class Scene4 {
    draw(tex, params) {
        this.updateSceneState(); // シーンの状態を更新
        this.renderScene(tex); // シーンを描画
    }

    constructor() {
        this.gridElements = []; // グリッド上に配置される個々の描画要素のデータ配列
        this.currentGridDensity = null; // グリッドの現在の行/列数 (例: 3x3, 5x5)
        this.shouldShowRandomly = false; // 各要素をランダムに表示するかどうかのフラグ
        this.isWavyMotionEnabled = false; // 要素の波打つ動きが有効かどうかのフラグ
        this.displaySequenceRatio = 1; // 要素の表示シーケンス速度を調整する比率
        this.backgroundColor = null; // 現在の背景色
        this.objectFillColor = null; // 現在のオブジェクトの塗りつぶし色
        this.currentObjectType = "circle"; // 現在描画するオブジェクトのタイプ (circle, rectangle, text)
        this.isObjectRotationEnabled = false; // 個々のオブジェクトの回転が有効かどうかのフラグ
        this.isEyeMovementEnabled = false; // オブジェクトの黒目のような円運動が有効かどうかのフラグ (追加)
        this.hasHorizontalOffset = false; // オブジェクトが水平方向にずれる効果が有効かどうかのフラグ
        this.textForObject = "HELLO"; // textタイプの場合に表示する文字列
        this.objectBaseScale = 1; // オブジェクトの基準スケール（個別の大きさ調整用）

        // --- renderScene内で共通で使用するノイズ（現在はseededRandom）シードをプロパティとして持つ ---
        // シード値はinitializeSceneState()で初期化されます
        this.seed_scaleBaseX = 0;
        this.seed_scaleBaseY = 0;
        this.seed_scaleSwitch = 0;
        this.seed_globalRotation = 0;
        this.seed_waveOffset = 0;
        this.seed_individualRotation1 = 0;
        this.seed_individualRotation2 = 0;
        this.seed_individualScaleY1 = 0;
        this.seed_individualScaleY2 = 0;
        this.seed_globalScaleDecision = 0;

        this.nowCount = 0;
        this.preCount = 0;


        this.initializeSceneState(); // 初期状態を設定するメソッド
        this.assignSceneColors();    // 初期カラーを選択するメソッド
    }

    // シーン全体の初期状態（グリッドパターン、オブジェクトタイプ、動きの有無など）を設定
    initializeSceneState() {
        this.currentObjectType = random(["circle", "rectangle", "text"]);
        this.textForObject = random(["HELLO", "MORNING", "p5js"]);
        this.objectBaseScale = random() < 0.8 ? 1 : random(0.5, 0.9);
        this.hasHorizontalOffset = random() < 0.5;
        this.shouldShowRandomly = random() < 0.3;
        this.isWavyMotionEnabled = random() < 0.4;
        this.displaySequenceRatio = random() < 0.5 ? 1 : random(0.3, 0.8);

        this.currentGridDensity = floor(random(1, 3)) * 2 + 1; // 1, 3, 5 のいずれかになるように

        // 黒目回転と個別オブジェクト回転/スケールの排他制御
        // 50%の確率でどちらか一方のアニメーションを有効にする
        if (random() < 0.5) {
            this.isEyeMovementEnabled = true; // 黒目回転を有効
            this.isObjectRotationEnabled = false; // 個別オブジェクト回転・Yスケールを無効
        } else {
            this.isEyeMovementEnabled = false; // 黒目回転を無効
            this.isObjectRotationEnabled = true; // 個別オブジェクト回転・Yスケールを有効
        }

        // 単一列/行の場合の中心位置またはランダムなオフセット
        const fixedGridCoord = random() < 0.5 ? floor(this.currentGridDensity / 2) : floor(random(this.currentGridDensity));
        let numColumns = this.currentGridDensity;
        let numRows = this.currentGridDensity;

        const layoutType = random(["horizontal", "vertical", "grid"]); // グリッドのレイアウトタイプ
        if (layoutType === "horizontal") numRows = 1;
        if (layoutType === "vertical") numColumns = 1;

        this.gridElements = [];
        for (let col = 0; col < numColumns; col++) {
            for (let row = 0; row < numRows; row++) {
                let actualCol = col;
                let actualRow = row;

                if (numColumns === 1) actualCol = fixedGridCoord;
                if (numRows === 1) actualRow = fixedGridCoord;

                this.gridElements.push({ gridX: actualCol, gridY: actualRow }); // グリッド内の論理座標
            }
        }

        // グリッド要素の表示モードを決定
        // "random", "sequential", "centerOut" のいずれかを選択
        const mode = random(["random", "sequential", "centerOut"]);

        if (mode === "random") {
            // ランダムにシャッフル
            this.gridElements = shuffle(this.gridElements);
        } else if (mode === "centerOut") {
            // 中心から外側に向かってソート
            const centerX = (numColumns - 1) / 2;
            const centerY = (numRows - 1) / 2;

            this.gridElements.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.gridX - centerX, 2) + Math.pow(a.gridY - centerY, 2));
                const distB = Math.sqrt(Math.pow(b.gridX - centerX, 2) + Math.pow(b.gridY - centerY, 2));
                return distA - distB;
            });
        }

        // --- シーン初期化時にseededRandom用のシードを設定 ---
        // 各ノイズカーブ（seededRandomの乱数系列）の初期シードを決定
        this.seed_scaleBaseX = random(10000);
        this.seed_scaleBaseY = random(10000);
        this.seed_scaleSwitch = random(10000);
        this.seed_globalRotation = random(10000);
        this.seed_waveOffset = random(10000);
        this.seed_individualRotation1 = random(10000);
        this.seed_individualRotation2 = random(10000);
        this.seed_individualScaleY1 = random(10000);
        this.seed_individualScaleY2 = random(10000);
        this.seed_globalScaleDecision = random(10000); // 以前のnoise(..., 27587)に相当
    }

    // 利用可能な色から背景色とオブジェクト色をランダムに選択
    assignSceneColors() {
        let tempColors = ["#F15946", "#5681CB", "#FAAA2D", "#296647", "#453945"];

        // 1色目を選択し、配列から削除
        let firstColorIndex = floor(random(tempColors.length));
        this.backgroundColor = tempColors[firstColorIndex];
        tempColors.splice(firstColorIndex, 1);

        // 残りの配列から2色目を選択
        let secondColorIndex = floor(random(tempColors.length));
        this.objectFillColor = tempColors[secondColorIndex];
    }

    // シーンの状態を更新（アニメーションのサイクルごとに呼び出される）
    updateSceneState() {
        // ANIMATION_CYCLE_FRAMESの周期でグリッドパターンと色を更新
        this.nowCount = floor(gvm.count()); // 現在のアニメーションサイクルのカウント
        if (this.nowCount !== this.preCount) {
            this.initializeSceneState(); // シーンの状態を再初期化
            this.assignSceneColors();    // 色を再割り当て
            this.preCount = this.nowCount; // 前回のカウントを更新
        }
    }

    // シーンの描画
    renderScene(tex) {
        tex.background(this.backgroundColor);

        // --- 全体のアニメーションパラメータの計算を分割 ---
        // 現在のフレームが属するアニメーションサイクルの「世代」を示すシード
        // これをseededRandomに加算することで、サイクルごとに異なるランダムな結果が得られる
        const currentCycleGenerationSeed = floor(gvm.count());

        // スケールアニメーションの基準値計算
        const randomValScaleBaseX = seededRandom(currentCycleGenerationSeed + this.seed_scaleBaseX);
        const randomValScaleBaseY = seededRandom(currentCycleGenerationSeed + this.seed_scaleBaseY);
        const scaleDecisionRandom = seededRandom(currentCycleGenerationSeed + this.seed_scaleSwitch);

        const scaleFactorBase1 = scaleDecisionRandom < 0.9 ? map(easeInOutQuint(randomValScaleBaseX), 0, 1, 0.3, 0.6) : map(randomValScaleBaseY, 0, 1, 1.5, 2.5);
        const scaleFactorBase2 = scaleDecisionRandom < 0.9 ? map(easeInOutQuint(randomValScaleBaseX), 0, 1, 0.3, 0.6) : map(randomValScaleBaseY, 0, 1, 1.5, 2.5);

        // currentOverallScale: 正規化された進行度とイージング関数を適用した最終的な全体スケール
        const globalScaleDecisionNoise = seededRandom(currentCycleGenerationSeed + this.seed_globalScaleDecision);
        const currentOverallScale = map(
            (globalScaleDecisionNoise < 0.3) ? easeOutCubic(fract(gvm.count())) : 1,
            0, 1, scaleFactorBase1, scaleFactorBase2
        );

        // アスペクト比の変化（現在は固定値1）
        const currentAspectRatio = 1;

        // rotationDegrees: 全体の回転角度 (90度単位の離散的な回転)
        const rotationDegrees = floor(seededRandom(currentCycleGenerationSeed + this.seed_globalRotation) * 100) * TAU / 4;

        tex.push();
        tex.translate(width / 2, height / 2); // キャンバス中央を原点に設定
        tex.rotate(rotationDegrees);
        tex.scale(currentOverallScale * currentAspectRatio, currentOverallScale);

        // 各グリッド要素を描画
        for (let i = 0; i < this.gridElements.length; i++) {
            const item = this.gridElements[i]; // 個々のグリッド要素
            const baseItemSize = min(width, height) / this.currentGridDensity; // 各要素の基準サイズ

            // --- 個別オブジェクトの位置と動きの計算を分割 ---
            const displayX = item.gridX * baseItemSize + baseItemSize * 0.5 - min(width, height) / 2;
            const displayY = item.gridY * baseItemSize + baseItemSize * 0.5 - min(width, height) / 2;
            const currentObjectSize = baseItemSize * 0.5 * this.objectBaseScale;

            const waveOffsetRandomSeed = seededRandom(currentCycleGenerationSeed + this.seed_waveOffset);
            const waveDisplacement = sin(map(item.gridX, 0, this.currentGridDensity - 1, 0, PI) + frameCount * 0.05 + waveOffsetRandomSeed * TAU * 10) * baseItemSize * 0.5;

            const horizontalShift = this.hasHorizontalOffset * (fract(gvm.count()) > 0.5) * map(sin(displayY * 0.005), -1, 1, -0.2, 0.2) * baseItemSize;

            // --- 黒目のような円運動の計算 ---
            let eyeMovementX = 0;
            let eyeMovementY = 0;
            if (this.isEyeMovementEnabled) {
                const eyeMovementRadius = baseItemSize * map(abs(easeInOutQuint(fract(gvm.count())) - 0.5), 0.5, 0, 0, 0.1); // 円運動の半径 (オブジェクトサイズの5%程度)
                // 角度はframeCountとiを使って個体差を出し、アニメーションの進行度も考慮
                const eyeMovementAngle = noise(i) * TAU + easeInOutQuint(fract(gvm.count())) * TAU;
                eyeMovementX = cos(eyeMovementAngle) * eyeMovementRadius;
                eyeMovementY = sin(eyeMovementAngle) * eyeMovementRadius;
            }
            // --- 黒目のような円運動の計算 終わり ---

            // --- 個別オブジェクトのアニメーションパラメータの計算を分割 ---
            const itemDisplayThreshold = map(i, 0, this.gridElements.length, 0, this.displaySequenceRatio);

            // 個別オブジェクトの回転とYスケールアニメーションのノイズ（seededRandom）判定と値
            let individualRotationAngle = 0;
            let individualScaleY = 1;

            if (this.isObjectRotationEnabled) { // isObjectRotationEnabledがtrueの場合のみ計算
                const randomValIndividualRot1 = seededRandom(i + currentCycleGenerationSeed + this.seed_individualRotation1);
                const randomValIndividualRot2 = seededRandom(currentCycleGenerationSeed + this.seed_individualRotation2);
                const isIndividualRotationTriggered = (randomValIndividualRot1 < 0.2 || randomValIndividualRot2 < 0.2);
                individualRotationAngle = isIndividualRotationTriggered ? easeOutCubic(fract(gvm.count())) * TAU : 0;

                const randomValIndividualScaleY1 = seededRandom(i + currentCycleGenerationSeed + this.seed_individualScaleY1);
                const randomValIndividualScaleY2 = seededRandom(currentCycleGenerationSeed + this.seed_individualScaleY2);
                const isIndividualScaleYTriggered = (isIndividualRotationTriggered && (randomValIndividualScaleY1 < 0.2 || randomValIndividualScaleY2 < 0.2));
                individualScaleY = isIndividualScaleYTriggered ? cos(easeOutCubic(fract(gvm.count())) * TAU) : 1;
            }


            // 正規化された全体進行度と要素ごとのしきい値に基づいて表示を判断
            if (fract(gvm.count()) > itemDisplayThreshold || this.gridElements.length === 1 || this.shouldShowRandomly) {
                tex.push();
                tex.noStroke();
                tex.fill(this.objectFillColor);

                // 位置と動きの適用
                // 黒目回転が有効な場合はeyeMovementX/Yを加算
                tex.translate(displayX + horizontalShift + eyeMovementX, displayY + waveDisplacement * this.isWavyMotionEnabled + eyeMovementY);
                tex.rotate(individualRotationAngle); // 個別オブジェクトの回転
                tex.scale(1, individualScaleY); // 個別オブジェクトのY方向スケール

                this.drawObject(tex, currentObjectSize, i); // 描画ロジックを別のメソッドに分離
                tex.pop();
            }
        }
        tex.pop();
    }

    // オブジェクトの描画ロジックを分離したメソッド
    drawObject(tex, size, index) {
        if (this.currentObjectType === "circle") {
            tex.circle(0, 0, size);
        } else if (this.currentObjectType === "rectangle") {
            tex.rectMode(CENTER);
            tex.rect(0, 0, size, size);
        } else if (this.currentObjectType === "text") {
            const charArray = [...this.textForObject]; // 文字列を文字配列に変換
            const charToDisplay = charArray[index % charArray.length];
            tex.textAlign(CENTER, CENTER);
            tex.textSize(size);
            tex.textFont("Helvetica"); // フォント指定
            tex.text(charToDisplay, 0, 0);
        } else {
            // デフォルトの描画（予期せぬcurrentObjectTypeの場合）
            tex.circle(0, 0, size);
        }
    }
}

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

function easeInOutQuint(x) {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

function seededRandom(seed, min = 0, max = 1) {
    let x = 0;
    push();
    randomSeed(seed); // p5.jsのrandomSeedを使用してシードを設定
    x = random(min, max);
    pop();
    return x;
}