/**
 * APC Mini MK2 MIDIコントローラーを管理するクラス
 * MIDIManagerクラスを継承し、APC Mini MK2の特定の機能を実装
 */
class APCMiniMK2Manager extends MIDIManager {
    constructor() {
        super();

        // グリッドの状態を管理する配列
        this.gridRadioState_ = new Array(8).fill(0);  // 現在の押下状態

        // フェーダー関連の状態を管理する配列
        this.faderValues_ = new Array(9).fill(0);             // 現在のフェーダー値
        this.faderValuesPrev_ = new Array(9).fill(1);        // 前回のフェーダー値
        this.faderButtonState_ = new Array(9).fill(0);       // フェーダーボタンの押下状態
        this.faderButtonToggleState_ = new Array(9).fill(0); // フェーダーボタンのトグル状態

        // サイドボタンの状態を管理する配列
        this.sideButtonState_ = new Array(8).fill(0);        // サイドボタンの押下状態
        this.sideButtonToggleState_ = new Array(8).fill(0);  // サイドボタンのトグル状態
        this.sideButtonRadioNum_ = 0;
    }

    /**
     * フレームごとの更新処理を行うメソッド
     */
    update() {
        // MIDI出力の送信
        if (this.midiSuccess_) {
            this.midiOutputSend();
        }
    }

    /**
     * フェーダー値を更新するメソッド
     * @param {number} index - フェーダーのインデックス
     */
    updateFaderValue(index) {
        this.faderValues_[index] = this.faderButtonToggleState_[index] ? 1 : this.faderValuesPrev_[index];
    }

    /**
     * MIDIメッセージを受信した際の処理
     * @param {MIDIMessageEvent} message - 受信したMIDIメッセージ
     */
    onMIDIMessage(message) {
        const [status, note, velocity] = message.data;

        // フェーダーボタンとサイドボタンの処理
        if (status === 144) {
            // console.log(`MIDI status=${status}, note=${note}, velocity=${velocity}`);
            if (note >= 100 && note <= 107 || note == 122) {
                const buttonIndex = note >= 100 && note <= 107 ? note - 100 : 8;
                this.faderButtonState_[buttonIndex] = 1;
                if (velocity > 0) {
                    this.faderButtonToggleState_[buttonIndex] = 1 - this.faderButtonToggleState_[buttonIndex];
                    this.updateFaderValue(buttonIndex);
                }
            }
            else if (note >= 112 && note <= 119) {
                const buttonIndex = note - 112;
                this.sideButtonState_[buttonIndex] = 1;
                if (velocity > 0) {
                    this.sideButtonToggleState_[buttonIndex] = 1 - this.sideButtonToggleState_[buttonIndex];
                    this.sideButtonRadioNum_ = buttonIndex; // ラジオボタンの状態を更新
                }
            }
        }

        // グリッドボタンの処理
        if ((status === 144 || status === 128) && note >= 0 && note <= 63) {
            // console.log(`MIDI status=${status}, note=${note}, velocity=${velocity}`);
            const row = map(floor(note / 8), 0, 7, 7, 0);;
            const col = note % 8;
            if (velocity > 0) {
                this.gridRadioState_[col] = row;
            }
        }

        // フェーダーの処理
        else if (status === 176 && note >= 48 && note <= 56) {
            const faderIndex = note - 48;
            const normalizedValue = velocity / 127;
            this.faderValuesPrev_[faderIndex] = normalizedValue;
            this.updateFaderValue(faderIndex);
        }
    }

    /**
     * MIDI出力を送信するメソッド
     */
    midiOutputSend() {
        if (!this.midiOutput_) return;

        // フェーダーボタンの状態を送信
        this.faderButtonToggleState_.forEach((state, i) => {
            const midiNote = i < 8 ? 100 + i : 122;
            this.midiOutput_.send([0x90, midiNote, state * 127]);
        });

        // サイドボタンの状態を送信
        for(let i = 0; i < 8; i++) {
            const midiNote = 112 + i;
            const state = this.sideButtonRadioNum_ === i ? 127 : 0; // ラジオボタンの状態を反映
            this.midiOutput_.send([0x90, midiNote, state]);
        }

        // グリッドの状態を送信
        for(let row = 0; row < 8; row++) {
            for(let col = 0; col < 8; col++) {
                const state = this.gridRadioState_[col] == row ? 0.2 : 0;
                const index = col + map(row, 0, 7, 7, 0) * 8;
                this.midiOutput_.send([0x90, index, state * 127]);
            }
        }

        // フェーダー値の送信
        this.faderValues_.forEach((value, i) => {
            this.midiOutput_.send([0xB0, 48 + i, Math.round(value * 127)]);
        });
    }
}
