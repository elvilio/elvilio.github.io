const $canvas = document.getElementById('main-canvas');
const $buffer = document.getElementById('buffer-canvas');
$canvas.style.width = window.innerWidth + 'px';
$canvas.style.height = window.innerHeight + 'px';

const RES = Math.sqrt(2);

$canvas.width = window.innerWidth * RES;
$canvas.height = window.innerHeight * RES;
$buffer.width = $canvas.width;
$buffer.height = $canvas.height;

const realCanvas = $canvas.getContext('2d');
const realBuffer = $buffer.getContext('2d');
beginAnimationLoop();

function beginAnimationLoop() {
	var anim = animation(realCanvas, realBuffer);
  setInterval(() => {
        anim.next();
    }, 1000 / 60);
}

function distanceVec(p1, p2) {
	return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function addVec(p1, p2) {
	return {x: p1.x+p2.x,y: p1.y+p2.y};
}

function multiplyVec(t, p) {
	return {x: t*p.x,y: t*p.y};
}

function normalizeVec(v) {
	const norm = Math.hypot(v.x,v.y);
  return {x: v.x/norm, y: v.y/norm};
}

function noiseFunct(x) {
	function baseNP(x) {
  	return (Math.sin(x + 1) + Math.sin(x * Math.PI / 2)) / 2;
  }
  return (Math.sin(x / 2) + Math.sin(x * Math.PI / 4) * baseNP(x / 2) + baseNP(x / 4)) / 3;
}

function createTurbulentLine(p1, p2) {
	const POINT_DENSITY = 0.5;
  const POINT_COUNT = distanceVec(p1, p2) / POINT_DENSITY;
	const seed = Math.random(0, 1e5);
  const line = new Path2D();
  const [x0, y0] = [p1.x,p1.y];
  const [x1, y1] = [p2.x,p2.y];
  const v = normalizeVec({x: x0-x1,y: y0-y1});
  const [vx, vy] = [v.x,v.y];
  const perp = {x: v.y,y: -v.x};
  
  line.moveTo(x0, y0);
  
  for (let i = 0; i <= POINT_COUNT; i++) {
  	const t = i / POINT_COUNT;
    const p = addVec(multiplyVec(t, p2),multiplyVec(1 - t, p1));
    const noise = 3.0 * noiseFunct(t * 400 * (RES**2) + seed) + 1.0 * noiseFunct(t * 400 * (RES**2) * 4);
    const temppx = addVec(p, multiplyVec(noise, perp));
    const [ppx, ppy] = [temppx.x,temppx.y];
    line.lineTo(ppx, ppy);
  }
  return line;  
}

function* animation(g, bg) {
	g.fillStyle = 'black';
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  g.imageSmoothingEnabled = false;
  bg.imageSmoothingEnabled = false;
  while (true) {
  	const size = getRandomInt(2, 7) * RES;
    const angle = getRandomArbitrary(0.0, Math.PI * 2);
    const dir = {x: Math.cos(angle), y: Math.sin(angle)};
    const perp = {x: dir.y, y: -dir.x};
    const pos = {
    	x: getRandomArbitrary(0, g.canvas.width),
      y: getRandomArbitrary(0, g.canvas.height)
    };
    const up_ = multiplyVec(+1.5 * g.canvas.width, dir);
    const dwn = multiplyVec(-1.5 * g.canvas.width, dir);
    const lft = multiplyVec(+1.5 * g.canvas.width, perp);
    const rgt = multiplyVec(-1.5 * g.canvas.width, perp);
    
    const p0 = addVec(pos, up_);
    const p1 = addVec(pos, dwn);
    const path = createTurbulentLine(p0, p1);
    const leftClip = new Path2D(path);
    const templ0 = addVec(pos, addVec(up_, lft));
    const [xl0, yl0] = [templ0.x,templ0.y];
    const templ1 = addVec(pos, addVec(dwn, lft));
    const [xl1, yl1] = [templ1.x,templ1.y];
    
    
    leftClip.lineTo(xl1, yl1);
		leftClip.lineTo(xl0, yl0);
		leftClip.closePath();
    
    
    const rightClip = new Path2D(path);
    const tempr0 = addVec(pos, addVec(up_, rgt));
    const [xr0, yr0] = [tempr0.x,tempr0.y];
    const tempr1 = addVec(pos, addVec(dwn, rgt))
    const [xr1, yr1] = [tempr1.x,tempr1.y];
    
    rightClip.lineTo(xr1, yr1);
    rightClip.lineTo(xr0, yr0);
    rightClip.closePath();
    
    g.lineWidth = 5 * RES;
    g.strokeStyle = '#fff';
    g.stroke(path);
    g.lineWidth = 3 * RES;
    g.strokeStyle = '#000';
    g.stroke(path);
    yield;
    for (let i = 0; i < size; i++) {
    	bg.save();
      bg.drawImage(g.canvas, perp.x, perp.y);
      bg.clip(rightClip);
      bg.drawImage(g.canvas, -perp.x, -perp.y);
      bg.restore();
      g.drawImage(bg.canvas, 0, 0);
      g.lineWidth = i;
      g.strokeStyle = '#000';
      g.stroke(path);
      yield;
    }
    yield;
	}
}