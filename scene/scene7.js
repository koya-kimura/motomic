class Scene7 {
    draw(tex, params){
        tex.background(0);

        tex.push();
        tex.translate(width/2, height/2);
        tex.scale(pow(2, floor(params[0] * 3))); // 1, 2, 4, 8倍
        for(let i = 0; i < 4; i ++){
            for(let j = 0; j < 4; j ++){
                const x = map(i, 0, 3, -width/2, width/2);
                const y = map(j, 0, 3, -height/2, height/2);
                const r = min(width, height) * 0.1;
                
                tex.push();
                tex.translate(x, y);
                tex.noStroke();
                tex.fill(cp[i % cp.length]);
                tex.ellipse(0, 0, r * 2);
                tex.pop();
            }
        }
        tex.pop();
    }
}