class Scene6 {
    draw(tex, params){
        tex.push();
        tex.background(0);
        for(let i in params){
            const r = map(i, 0, params.length, 0, 255);
            const w = map(params[i], 0, 1, 0.1, 0.8) * width;
            const h = height / (params.length + 1) * 0.8;
            const x = width / 2 - w / 2;
            const y = map(i, 0, params.length+1, 0, height) + h / 2;

            tex.push();
            tex.translate(x, y);
            tex.noStroke();
            tex.fill(cp[i % cp.length]);
            tex.rect(0, 0, w, h);
            tex.pop();
        }
        tex.pop();
    }
}