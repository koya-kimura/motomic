class BPMManager {
    constructor(initialBPM = 120, maxTaps = 8, timeout = 4000) {
        this.initialBPM = initialBPM;
        this.tapTimes = [];
        this.maxTaps = maxTaps;
        this.timeout = timeout; // ミリ秒
    }

    // タップを記録
    tap() {
        const now = millis();

        // 古いタップは除外
        this.tapTimes = this.tapTimes.filter(t => now - t < this.timeout);
        this.tapTimes.push(now);

        // 上限を超えたら先頭から削除
        if (this.tapTimes.length > this.maxTaps) {
            this.tapTimes.shift();
        }
    }

    // BPMを取得（タップがなければ初期BPMを返す）
    getBPM() {
        if (this.tapTimes.length < 2) return this.initialBPM;

        let intervals = [];
        for (let i = 1; i < this.tapTimes.length; i++) {
            intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        return 60000 / avgInterval;
    }

    // 初期BPMを変更（オプション）
    setInitialBPM(bpm) {
        this.initialBPM = bpm;
    }

    // タップ履歴リセット
    reset() {
        this.tapTimes = [];
    }
}