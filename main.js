let bpm = 130;
let motionGroup;
let mainTex;
let scene = [];
let isMonochrome = false;
let midiManager;
let bpmManager;
let showUI = false;
let pushCount = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);
    mainTex = createGraphics(width, height);

    scene.push(new Scene1());
    scene.push(new Scene2());

    motionGroup = new MotionGroup(8, bpm);

    midiManager = new APCMiniMK2Manager();
    midiManager.initializeMIDIDevices();

    bpmManager = new BPMManager(bpm, 8, 40000);

    noCursor();
}

function draw() {
    if(midiManager.midiSuccess_) {
        midiAssign();
    }

    background(0);
    mainTex.background(0);

    scene[pushCount%scene.length].draw(mainTex, motionGroup.getAllValues());
    image(mainTex, 0, 0, width, height);

    // debug
    if(showUI) {
        drawMotionGroupInfo(motionGroup);
    }

    mainTex.clear();

    midiManager.update();

    motionGroup.setBPM(bpmManager.getBPM());
}

function drawMotionGroupInfo(mg) {
    const margin = 10;
    const lineHeight = 20;
    const boxW = 220;
    const boxH = mg.values.length * lineHeight + 50;

    // 背景ボックス（半透明）
    noStroke();
    fill(0, 0, 100, 50);
    rect(margin, margin, boxW, boxH);

    textSize(14);
    textAlign(LEFT, CENTER);
    fill(255); // 黒文字（必要に応じて変更）

    // BPM表示
    text(`BPM: ${floor(mg.bpm)}`, margin + 10, margin + 15);

    // 各モーションの状態表示
    for (let i = 0; i < mg.values.length; i++) {
        const mode = mg.getCurrentMode(i);
        const val = mg.getValue(i).toFixed(3);
        const y = margin + 40 + i * lineHeight;
        text(`${i}: ${mode} (${val})`, margin + 10, y);
    }
  }

  function midiAssign() {
      for (let i in midiManager.gridRadioState_) {
          motionGroup.setModeIndex(i, midiManager.gridRadioState_[i]);
      }
  }

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
        bpmManager.tap();
    }

    // フルスクリーン
    if (keyCode == 32) {
        fullscreen(true);
    }

    if (key == "q" || key == "Q") {
        pushCount++;
    }

    if (key == "z" || key == "Z") {
        isMonochrome = !isMonochrome;
    }

    if (key == "p" || key == "P") {
        showUI = !showUI;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    mainTex = createGraphics(width, height);
}