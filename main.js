const cp = ["#F15946", "#5681CB", "#FAAA2D", "#296647", "#453945"];
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

function preload() {
    postShader = loadShader('shader/main.vert', 'shader/main.frag');
}


function setup() {
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
    postShader.setUniform('u_monochrome', midiManager.faderValues_[1]);
    postShader.setUniform('u_mosaic', midiManager.faderValues_[2]);
    postShader.setUniform('u_radius', midiManager.faderValues_[3]);

    rect(0, 0, width, height);

    mainTex.clear();
    uiTex.clear();

    midiManager.update();
    motionGroup.setBPM(gvm.getBPM());
}

// 白で書いて加算する
function drawMotionGroupInfo(mg) {
    const margin = 10;
    const lineHeight = 20;
    const boxW = 220;
    const boxH = mg.values.length * lineHeight + 50;

    // 背景ボックス（半透明）
    uiTex.background(0, 0, 0);
    uiTex.noStroke();
    uiTex.fill(0, 0, 100, 50);
    uiTex.rect(margin, margin, boxW, boxH);

    uiTex.textSize(14);
    uiTex.textAlign(LEFT, CENTER);
    uiTex.fill(255); // 黒文字（必要に応じて変更）

    // BPM表示
    uiTex.text(`BPM: ${floor(mg.bpm)}`, margin + 10, margin + 15);

    // 各モーションの状態表示
    for (let i = 0; i < mg.values.length; i++) {
        const mode = mg.getCurrentMode(i);
        const val = mg.getValue(i).toFixed(3);
        const y = margin + 40 + i * lineHeight;
        uiTex.text(`${i}: ${mode} (${val})`, margin + 10, y);
    }
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
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    mainTex = createGraphics(width, height);
    uiTex = createGraphics(width, height);
}