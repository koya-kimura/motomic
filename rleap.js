class Rleap {
    constructor(seed = Math.floor(Math.random() * 100000)) {
        this.seed = seed;
        this.rng = this.makeRNG(seed);
        this.lastFloor = null;
        this.v0 = null;
        this.v1 = null;
    }

    makeRNG(seed) {
        let state = seed;
        return function () {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }

    get(t) {
        const i0 = Math.floor(t);

        if (i0 !== this.lastFloor) {
            this.v0 = this.v1 ?? this.rng(); // v1を再利用 or 初回
            this.v1 = this.rng();
            this.lastFloor = i0;
        }

        const frac = t - i0;
        return lerp(this.v0, this.v1, frac);
    }

    getWithHold(t, holdDuration = 0.2) {
        const i0 = Math.floor(t);

        if (i0 !== this.lastFloor) {
            this.v0 = this.v1 ?? this.rng(); // v1 を初期化 or 再利用
            this.v1 = this.rng();
            this.lastFloor = i0;
        }

        const frac = t - i0;
        const motionPart = 1 - holdDuration; // 動く区間の長さ

        if (frac < motionPart) {
            // motionPart内では通常通り補間
            const tNorm = frac / motionPart;
            return lerp(this.v0, this.v1, tNorm);
        } else {
            // holdDuration中はそのままv1を保持
            return this.v1;
        }
    }

    reset() {
        this.rng = this.makeRNG(this.seed);
        this.lastFloor = null;
        this.v0 = null;
        this.v1 = null;
    }
  }