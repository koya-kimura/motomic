const bpm = 130;
const gvm = new GVM(bpm);
let motionGroup;
let mainTex;
let uiTex;
let scene = [];
let sceneNum = 0;
let midiManager;
let showUI = false;

let postShader;
let LOGO_IMAGE;
let pushCount = 0; // キー押下回数をカウントする変数

const COLOR_PALETTE = [
    "#6b2a7b", // 鮮やかな紫 (主軸)
    "#d74c91", // ホットピンク
    "#1e7e28", // 鮮やかな黄緑
    "#df3a0d", // 鮮やかな赤 (オレンジ寄り)
    "#136a87", // 明るい水色
    "#FFD700", // 鮮やかな金色/黄色
    "#cada19", // 暗めの紫 (より深い紫)
    "#b9d9e1"  // 明るい黄緑 (ライムグリーン)
  ];
let cp = ["#ffffff"]; // 現在のカラーパレット
let keyToggleArr = [false, false, false, false, false, false, false, false]; // キーのトグル状態
const keyArr = ["z", "x", "c", "v", "b", "n", "m", ","]; // 監視するキー

function preload() {
    postShader = loadShader('shader/main.vert', 'shader/main.frag');
    LOGO_IMAGE = loadImage('asset/Flow.png');
}


function setup() {
    frameRate(30);
    createCanvas(windowWidth, windowHeight, WEBGL);
    mainTex = createGraphics(width, height);
    uiTex = createGraphics(width, height);

    scene.push(new Scene1());
    scene.push(new Scene2());
    scene.push(new Scene3());
    scene.push(new Scene4());
    scene.push(new Scene5());
    scene.push(new Scene6());
    scene.push(new Scene7());

    motionGroup = new MotionGroup(8, bpm);

    midiManager = new APCMiniMK2Manager();
    midiManager.initializeMIDIDevices();

    updateColorPalette();

    noCursor();
}

function draw() {
    if (midiManager.midiSuccess_) {
        midiAssign();
    }

    background(0);
    mainTex.background(0);

    const sceneIndex = midiManager.sideButtonRadioNum_ == 7 ? floor(gvm.count() % scene.length) : midiManager.sideButtonRadioNum_ % scene.length;
    scene[sceneIndex].draw(mainTex, motionGroup.getAllValues());

    // debug
    if (showUI) {
        drawMotionGroupInfo(motionGroup);
    }

    shader(postShader);
    postShader.setUniform('u_resolution', [width, height]);
    postShader.setUniform('u_tex', mainTex);
    postShader.setUniform('u_uitex', uiTex);
    postShader.setUniform('u_time', millis() / 1000.0);
    postShader.setUniform('u_tileNum', floor(midiManager.faderValues_[0] * 5) + 1);
    postShader.setUniform('u_monochrome', map(midiManager.faderValues_[1], 0, 1, 1, 0));
    postShader.setUniform('u_mosaic', map(midiManager.faderValues_[2], 0, 1, 1, 0.15));
    postShader.setUniform('u_gridRotate', midiManager.faderValues_[3] == 1);
    postShader.setUniform('u_up', midiManager.faderValues_[4] * 0.5);
    postShader.setUniform('u_down', midiManager.faderValues_[5] * 0.5);
    postShader.setUniform('u_left', midiManager.faderValues_[6] * 0.5);
    postShader.setUniform('u_right', midiManager.faderValues_[7] * 0.5);

    rect(0, 0, width, height);

    mainTex.clear();
    uiTex.clear();

    midiManager.update();
    motionGroup.setBPM(gvm.getBPM());
}

// 白で書いて加算する
function drawMotionGroupInfo(mg) {
    const lineHeight = min(width, height) * 0.02;
    uiTex.image(LOGO_IMAGE, min(width, height) * 0.05, min(width, height) * 0.05, min(width, height) * 0.15, min(width, height) * 0.15 * LOGO_IMAGE.height / LOGO_IMAGE.width)

    uiTex.fill(255); // 黒文字（必要に応じて変更）
    uiTex.noStroke()

    // BPM表示
    uiTex.textAlign(RIGHT, TOP);
    uiTex.textSize(min(width, height) * 0.02);
    uiTex.textFont("Helvetica");
    uiTex.text(`BPM: ${floor(mg.bpm)}`, width * 0.97, height * 0.05);

    // 各モーションの状態表示
    uiTex.textSize(min(width, height) * 0.015);
    for (let i = 0; i < mg.values.length; i++) {
        const mode = mg.getCurrentMode(i);
        const val = mg.getValue(i).toFixed(2);
        const y = min(width, height) * 0.085 + i * lineHeight;
        uiTex.text(`param ${i} : ${val}`, width * 0.97, y);
    }

    uiTex.push();
    for (let i in Object.keys(motionGroup.values[0].modeFuncs)) {
        const modeName = Object.keys(motionGroup.values[0].modeFuncs)[i];
        const y = height * 0.45 + (mg.values.length + parseInt(i)) * lineHeight;
        uiTex.textAlign(LEFT, TOP);
        uiTex.textSize(min(width, height) * 0.015);
        uiTex.textFont("Helvetica");
        uiTex.fill(255);
        uiTex.noStroke();
        uiTex.text(`Func${i} : ${modeName}`, min(width, height) * 0.05, y);
    }
    uiTex.pop();
    
    // midi トグル状態の表示
    for(let i = 0; i < 8; i ++){
        for(let j = 0; j < 8; j ++){
            const isToggled = midiManager.gridRadioState_[i] == j;
            const s = min(width, height) * 0.02;
            const x = min(width, height) * 0.05 + i * s;
            const y = min(width, height) * 0.95 - map(j, 0, 7, 8, 1) * s;

            uiTex.push();
            uiTex.rectMode(CENTER);
            uiTex.translate(x+s * 0.5, y+s * 0.5);
            if(isToggled) {
                uiTex.fill(255); // トグル状態がtrueのときは白
                uiTex.noStroke();
                uiTex.rect(0, 0, s * 0.9, s * 0.9); // 正方形を描画
            } else {
                uiTex.noFill(); // トグル状態がfalseのときは塗りつぶさない
                uiTex.stroke(255); // 枠線は白
                uiTex.strokeWeight(1);
                uiTex.rect(0, 0, s * 0.8, s * 0.8); // 正方形を
            }
            uiTex.pop();
        }
    }

    drawColorPaletteVisual(uiTex, width * 0.97, height * 0.95, min(width, height) * 0.02, 0.5);

    const l = map(abs((gvm.count() * 0.25) % 2 - 1), 0, 1, 0, 0.2) * min(width, height);
    uiTex.push();
    uiTex.noFill();
    uiTex.stroke(220);
    uiTex.strokeWeight(1);
    uiTex.translate(width * 0.5, height * 0.5);
    uiTex.scale(0.95);
    uiTex.line(-l * 0.5, -height * 0.5, l * 0.5, -height * 0.5);
    uiTex.line(-l * 0.5, height * 0.5, l * 0.5, height * 0.5);
    uiTex.line(-width * 0.5, -l * 0.5, -width * 0.5, l * 0.5);
    uiTex.line(width * 0.5, -l * 0.5, width * 0.5, l * 0.5);
    uiTex.pop();

    uiTex.push();
    uiTex.textAlign(CENTER, CENTER);
    uiTex.textSize(min(width, height) * 0.02)
    uiTex.textFont("Helvetica")
    uiTex.fill(200)
    uiTex.noStroke();
    uiTex.text("*made with p5.js*", width * 0.5, height * 0.95);
    uiTex.pop();
}

function drawColorPaletteVisual(tex, endX, endY, squareSize, marginRatio) {
    tex.push(); // テクスチャの描画設定を一時保存

    const margin = squareSize * marginRatio; // マージンを計算
    const effectiveSize = squareSize + margin; // 実質的な各要素の幅（正方形のサイズ＋マージン）

    // 右下から左に8個の正方形を並べるため、ループは逆順
    // または、全体の幅を計算してstartXを調整する方法もあります
    // 今回は全体の幅を計算して、描画開始X座標を決定します

    const totalWidth = COLOR_PALETTE.length * squareSize + (COLOR_PALETTE.length - 1) * margin;
    const actualStartX = endX - totalWidth; // 右下のX座標から全体の幅を引いて、描画の開始X座標を算出

    for (let i = 0; i < COLOR_PALETTE.length; i++) {
        const color = COLOR_PALETTE[i];
        const isToggled = keyToggleArr[i];

        // 各正方形の左上X座標を計算
        const xPos = actualStartX + i * effectiveSize;
        // 各正方形の左上Y座標を計算（endYからsquareSizeを引く）
        const yPos = endY - squareSize;

        tex.fill(color);
        tex.stroke(color);
        tex.strokeWeight(2); // 枠線の太さ

        if (isToggled) {
            // trueの場合は塗りつぶし
            tex.rect(xPos, yPos, squareSize, squareSize);
        } else {
            // falseの場合は枠線のみ
            tex.noFill();
            tex.rect(xPos, yPos, squareSize, squareSize);
        }
    }

    tex.pop(); // テクスチャの描画設定を復元
  }

function midiAssign() {
    for (let i in midiManager.gridRadioState_) {
        motionGroup.setModeIndex(i, midiManager.gridRadioState_[i]);
    }
}

// TODO: キープレスでも変化できるようになっているが、この辺りは変化させる必要あり
function keyPressed() {
    if (!midiManager.midiSuccess_) {
        const keyNum = parseInt(key); // '1'〜'8' → 1〜8 の数値に変換

        if (keyNum >= 1 && keyNum <= 8) {
            const index = keyNum - 1; // MotionValueのインデックス（0〜7）

            // 例: モードを次に進める（wrap-around）
            const currentMode = motionGroup.values[index].mode;
            const modes = motionGroup.getModes();
            const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;

            motionGroup.setModeIndex(index, nextIndex);
        }
    }

    if (keyCode === 13) {
        gvm.tapTempo();
        console.log("BPM:", gvm.getBPM().toFixed(2));
    }

    // フルスクリーン
    if (keyCode == 32) {
        fullscreen(true);
    }

    if (key == "q" || key == "Q") {
        pushCount++;
    }

    if (key == "p" || key == "P") {
        showUI = !showUI;
    }

    let keyIndex = keyArr.indexOf(key);
    if (keyIndex !== -1) {
        // 個別キーのトグル
        keyToggleArr[keyIndex] = !keyToggleArr[keyIndex];
    } else if (key === '.') {
        // 全てをfalseにする
        for (let i = 0; i < keyToggleArr.length; i++) {
            keyToggleArr[i] = false;
        }
    } else if (key === '/') {
        // 全てをtrueにする
        for (let i = 0; i < keyToggleArr.length; i++) {
            keyToggleArr[i] = true;
        }
    }
    // どのキーが押されても、最後にパレットを更新
    updateColorPalette();
    scene[2].colorPaletteUpdate(); // シーン3の色更新メソッドを呼び出す
    scene[4].colorPaletteUpdate(); // シーン4の色更新メソッド
}

function updateColorPalette() {
    cp = []; // cpをクリア
    for (let i = 0; i < keyToggleArr.length; i++) {
        if (keyToggleArr[i]) {
            cp.push(COLOR_PALETTE[i]);
        }
    }

    if (cp.length === 0) {
        cp.push("#fff"); // 白を追加
        // console.log("No colors selected. Added white to palette.");
    }
  }

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    mainTex = createGraphics(width, height);
    uiTex = createGraphics(width, height);
    for(let i = 0; i < scene.length; i++) {
        scene[i].resize();
    }
}
