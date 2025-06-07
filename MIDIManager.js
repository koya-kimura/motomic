/**
 * MIDIデバイスの管理を行うクラス
 * MIDIの入出力の初期化、メッセージの処理を担当
 */
class MIDIManager {
    /**
     * コンストラクタ
     * @property {MIDIOutput|null} midiOutput_ - MIDI出力デバイスのインスタンス
     * @property {boolean} midiSuccess_ - MIDI接続の成功状態
     */
    constructor() {
        this.midiOutput_ = null;      // MIDI出力デバイスの参照を保持
        this.midiSuccess_ = false;    // MIDI接続の成功フラグ
    }

    /**
     * MIDIデバイスの初期化を行うメソッド
     * Web MIDI APIを使用してMIDIアクセスをリクエスト
     * 1秒の遅延後に実行される
     */
    initializeMIDIDevices() {
        setTimeout(() => navigator.requestMIDIAccess().then(
            this.onMIDISuccess.bind(this),    // 成功時のコールバック
            this.onMIDIFailure.bind(this)     // 失敗時のコールバック
        ), 1000);
    }

    /**
     * MIDI接続成功時のコールバックメソッド
     * @param {MIDIAccess} midiAccess - MIDIAccessインターフェースのインスタンス
     */
    onMIDISuccess(midiAccess) {
        // 入力デバイスの取得
        const inputs = midiAccess.inputs.values();
        const input = inputs.next();

        // 入力デバイスが見つからない場合の処理
        if (input.done) {
            console.log("MIDI device not found");
            this.midiSuccess_ = false;
            return;
        }

        try {
            console.log("MIDI device ready!");
            // デバイス情報のログ出力（必要に応じてコメントアウトを解除）
            console.log("Manufacturer:", input.value.manufacturer);
            console.log("Input:", input.value.name);

            // MIDIメッセージ受信時のハンドラを設定
            // thisのコンテキストを保持するためにbindを使用
            input.value.onmidimessage = this.onMIDIMessage.bind(this);

            // 利用可能な出力ポートの取得と設定
            let outputs = Array.from(midiAccess.outputs.values());

            // 出力ポートが存在する場合の処理
            if (outputs.length > 0) {
                this.midiOutput_ = outputs[0];    // 最初の出力ポートを使用
                console.log("MIDI output port:", this.midiOutput_.name);
                this.midiSuccess_ = true;
            } else {
                // 出力ポートが見つからない場合
                console.log("MIDI output port not found");
                this.midiSuccess_ = false;
            }
        } catch (error) {
            // エラー発生時の処理
            console.error("MIDI device access error:", error);
            this.midiSuccess_ = false;
        }
    }

    /**
     * MIDI接続失敗時のコールバックメソッド
     * @param {string} msg - エラーメッセージ
     */
    onMIDIFailure(msg) {
        console.log("MIDI access failed. - " + msg);
    }
}
