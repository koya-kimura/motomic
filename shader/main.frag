precision mediump float;

varying vec2 vTexCoord;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tex;
uniform sampler2D u_uitex;

uniform float u_tileNum;
uniform float u_monochrome;
uniform float u_mosaic;

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
    // 輝度を計算
    float luminance=floor(getLuminance(col.rgb)*5.)/5.;// 0.0 ~ 1.0 の範囲に正規化
    
    // グレースケールの色
    vec3 grayscale=vec3(luminance);
    
    vec3 mixedColor=mix(grayscale,col.rgb,saturation);
    
    return vec4(mixedColor,col.a);
}

void main(void){
    vec2 uv=vTexCoord;
    
    uv=fract(uv*u_tileNum);
    
    if(uv!=vec2(1.)){
        float mosaicLevel=pow(2.,u_mosaic*10.);
        vec2 aspect=u_resolution.xy/min(u_resolution.x,u_resolution.y);
        uv=uv*aspect;
        uv=floor(uv*mosaicLevel+.5)/mosaicLevel;
        uv=uv/aspect;
    }
    
    vec4 col=texture2D(u_tex,uv);
    
    col=adjustMonochrome(col,u_monochrome);
    
    vec4 ui=texture2D(u_uitex,vTexCoord);
    
    gl_FragColor=col+ui;
}