precision mediump float;

varying vec2 vTexCoord;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tex;
uniform sampler2D u_uitex;

uniform float u_tileNum;
uniform float u_monochrome;
uniform float u_mosaic;
uniform bool u_gridRotate;
uniform float u_up;
uniform float u_down;
uniform float u_left;
uniform float u_right;

float PI=3.14159265358979;

float random(vec2 st){
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

mat2 rot(float angle){
    return mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
}

float atan2(float y,float x){
    return x==0.?sign(y)*PI/2.:atan(y,x);
}

vec2 xy2pol(vec2 xy){
    return vec2(atan2(xy.y,xy.x),length(xy));
}

vec2 pol2xy(vec2 pol){
    return pol.y*vec2(cos(pol.x),sin(pol.x));
}

float getLuminance(vec3 color){
    return dot(color,vec3(.299,.587,.114));
}

vec4 adjustMonochrome(vec4 col,float saturation){
    float luminance=floor(getLuminance(col.rgb)*5.)/5.;
    vec3 grayscale=vec3(luminance);
    vec3 mixedColor=mix(grayscale,col.rgb,saturation);
    return vec4(mixedColor,col.a);
}

// --- 新しく追加・整理したエフェクト関数 ---

/**
* グリッドを横16分割し、各セル内でUVを90度回転させる
* @param uv 元のUV座標
* @param resolution スクリーンの解像度
* @return 変換されたUV座標
*/
vec2 applyGridRotation(vec2 uv_in, vec2 resolution) {
    float grid_cols = 16.0;
    float grid_rows = grid_cols * (resolution.y / resolution.x);
    
    vec2 cell_idx = floor(uv_in * vec2(grid_cols, grid_rows));
    vec2 local_uv = fract(uv_in * vec2(grid_cols, grid_rows));
    
    vec2 centered_local_uv = local_uv - 0.5;
    vec2 rotated_local_uv = vec2(centered_local_uv.y, -centered_local_uv.x); // 時計回りに90度回転
    vec2 final_cell_uv = rotated_local_uv + 0.5;
    final_cell_uv = clamp(final_cell_uv, 0.0, 1.0);
    
    return (cell_idx + final_cell_uv) / vec2(grid_cols, grid_rows);
}

/**
* UV座標にタイリング効果を適用する
* @param uv 元のUV座標
* @param tileNum タイルの繰り返し回数
* @return 変換されたUV座標
*/
vec2 applyTiling(vec2 uv_in, float tileNum) {
    return fract(uv_in * tileNum);
}

/**
* UV座標にモザイク効果を適用する
* @param uv 元のUV座標
* @param mosaicLevel モザイクの強度 (0.0-1.0)
* @param resolution スクリーンの解像度
* @return 変換されたUV座標
*/
vec2 applyMosaic(vec2 uv_in,float mosaicLevel,vec2 resolution){
    if(mosaicLevel!=1.){// mosaicLevel が1.0 (無効) でない場合のみ適用
        float actual_mosaic_level=pow(2.,mosaicLevel*10.);
        vec2 aspect=resolution.xy/min(resolution.x,resolution.y);
        
        uv_in=uv_in*aspect;
        uv_in=floor(uv_in*actual_mosaic_level+.5)/actual_mosaic_level;
        uv_in=uv_in/aspect;
    }
    return uv_in;
}

// --- main関数 ---

void main(void){
    vec2 uv=vTexCoord;

    uv.x = mod((uv.x + u_right - u_left), 1.0); // 左右の移動
    uv.y = mod((uv.y + u_up - u_down), 1.0); // 上下の移動

    // 各エフェクトを関数として適用
    if(u_gridRotate) uv=applyGridRotation(uv,u_resolution);
    uv=applyTiling(uv,u_tileNum);
    uv=applyMosaic(uv,u_mosaic,u_resolution);
    
    // 最終的なUVでメインテクスチャをサンプリング
    vec4 col=texture2D(u_tex,uv);
    
    // モノクローム調整を適用 (直接調整関数を呼び出し)
    col=adjustMonochrome(col,u_monochrome);
    
    // UIテクスチャは元のUVでサンプリングし、合成
    vec4 ui=texture2D(u_uitex,vTexCoord);
    
    gl_FragColor=col+ui;
}