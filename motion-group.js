class MotionGroup {
    constructor(count = 8, bpm = 120) {
        this.bpm = bpm;
        this.values = [];

        for (let i = 0; i < count; i++) {
            const mv = new MotionValue(bpm, i);
            this.values.push(mv);
        }
    }

    // 各 MotionValue の現在値を取得
    getValue(index) {
        if (index < 0 || index >= this.values.length) return 0;
        return this.values[index].getValue();
    }

    // すべての現在値を配列で取得（追加した関数）
    getAllValues() {
        return this.values.map(v => v.getValue());
    }

    // 全体に対して一括でモードを設定
    setModeIndexAll(index) {
        for (const mv of this.values) {
            mv.setModeIndex(index);
        }
    }

    // 個別にモードを変更
    setModeIndex(index, modeIndex) {
        if (index < 0 || index >= this.values.length) return;
        this.values[index].setModeIndex(modeIndex);
    }

    // 全体の BPM を変更
    setBPM(newBPM) {
        this.bpm = newBPM;
        for (const mv of this.values) {
            mv.setBPM(newBPM);
        }
    }

    // 全体リセット
    reset() {
        for (const mv of this.values) {
            mv.reset();
        }
    }

    // モード一覧の取得（0番目を基準）
    getModes() {
        return this.values[0]?.modes ?? [];
    }

    // 各 MotionValue の現在のモードを取得
    getCurrentMode(index = 0) {
        return this.values[index]?.mode ?? '';
    }
}