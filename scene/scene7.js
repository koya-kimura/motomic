class Scene7 {
    draw(tex, params){
        tex.background(0);

        tex.push();
        tex.translate(width/2, height/2);
        for(let i = 0; i < params.length; i++){
            const radius = map(params[i], 0, 1, 0.3, 1.0) * min(width, height) * map(Easing.easeInOutSine(abs(gvm.count() % 2 - 1)), 0, 1, 0.3, 0.5);;
            const sw = min(width, height) * map(sin(TAU * i / params.length + gvm.count() * 2.0), -1, 1, 0.003, 0.05);

            tex.noFill();
            tex.stroke(cp[i % cp.length]);
            tex.strokeWeight(sw);
            tex.ellipse(0, 0, radius * 2, radius * 2);
        }
        tex.pop();
    }

    resize() {

    }
}