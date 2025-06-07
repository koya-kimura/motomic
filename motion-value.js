class MotionValue {
    constructor(bpm = 120, index = 0) {
        this.index = index; // インデックス（オプション、必要に応じて使用）
        this.rleap = new Rleap(); // ランダム補間関数（各モードで使用可能）
        this.bpm = bpm;
        this.beatDurationMs = 60000 / bpm; // BPMから1拍の時間を算出

        this.startTime = millis(); // 再生開始時間
        this.lastBeat = -1;        // 最後に検知した拍数（整数）

        this.modeRequest = null;   // モード切り替え予約（拍ごとに反映）

        this.setupModeFuncs();            // モードごとの関数群を定義
        this.modes = Object.keys(this.modeFuncs); // モード名一覧（indexアクセス用）
        this.mode = this.modes[0];        // 初期モード（最初のモード名）
    }

    // 各モードごとの値の動き方（t: 拍単位の経過時間）
    setupModeFuncs() {
        this.modeFuncs = {
            zero: _ => 0,                            // 常に0（定値）
            one: _ => 1,                            // 常に1（定値）
            linearToggle: t => floor(t * 0.5) % 2,           // 線形トグル（0→1→0...）
            quantized4Step: t => floor(t % 4) / 4,             // 4ステップに量子化（0→0.25→0.5→0.75）
            randomStep: t => this.easeClampInOutCubic(this.rleap.get(floor(t))), // 拍ごとのランダムをイージング補間
            easedHoldStep: t => this.rleap.getWithHold(t * 0.5, 0.25),              // ランダム＋保持ステップ（holdあり）
            sineSmooth: t => map(sin(t * 0.5 * PI), -1, 1, 0, 1), // sin波（0→1→0）
            pulse: t => fract(t * 0.5),               // パルス状（0→1→0 の繰り返し）
        };
    }

    // 外部からインデックス指定でモードを予約（次の拍で反映）
    setModeIndex(index) {
        const i = constrain(floor(index), 0, this.modes.length - 1);
        if (this.modeRequest === null) {
            this.modeRequest = this.modes[i];
        }
    }

    // 現在の値を取得（時間とモードに基づく）
    getValue() {
        const now = millis();
        const elapsed = now - this.startTime;
        const currentBeat = floor(elapsed / this.beatDurationMs);

        // 拍が変わったらモード切り替えチェック
        if (currentBeat !== this.lastBeat) {
            this.onBeat(currentBeat);
            this.lastBeat = currentBeat;
        }

        const sp = max(round(midiManager.faderValues_[this.index] * 4), 1) / 4;
        const t = (elapsed / this.beatDurationMs) * sp;
        const func = this.modeFuncs[this.mode] || (x => x); // モード関数が見つからなければ線形代替
        return func(t);
    }

    // 拍の更新時に予約モードがあれば反映
    onBeat(beat) {
        if (this.modeRequest !== null) {
            this.mode = this.modeRequest;
            this.modeRequest = null;
        }
    }

    // BPMを再設定（内部拍計算も更新）
    setBPM(newBPM) {
        this.bpm = newBPM;
        this.beatDurationMs = 60000 / newBPM;
    }

    // 初期状態にリセット（再スタート用）
    reset() {
        this.startTime = millis();
        this.lastBeat = -1;
        this.modeRequest = null;
    }

    // 現在モード予約中かどうかを返す
    isWaiting() {
        return this.modeRequest !== null;
    }

    // イージング関数：easeClampInOutCubic（0→1→0の滑らかカーブ）
    easeClampInOutCubic(t) {
        if (t <= 0.1) return 0;
        if (t >= 0.9) return 1;

        // 0.1〜0.9 の範囲を 0〜1 に正規化
        let tt = map(t, 0.1, 0.9, 0, 1);

        // イージングを適用
        return tt < 0.5
            ? 4 * tt * tt * tt
            : 1 - pow(-2 * tt + 2, 3) / 2;
    }

    // イージング関数：easeOutCubic（早く動いて遅く止まる）
    easeOutCubic(t) {
        return 1 - pow(1 - t, 3);
    }
}