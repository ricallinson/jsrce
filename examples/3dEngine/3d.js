// Geometry of a Model
var cubes = [];
class Cube {
  constructor(a) {
    this.offset = a;
    this.color = 'rgba(' + Math.floor(Math.random() * 256) + ',   ' + Math.floor(Math.random() * 256) + ', ' + Math.floor(Math.random() * 256) + ', 1)';
    var v = [-1, -1, -1,     1, -1, -1,    1, -1, 1,    
             -1, -1, 1,     -1, 1, -1,     1, 1, -1,
             1, 1, 1,       -1, 1, 1];
    var t = [0, 1, 2,    2, 3, 0,    4, 5, 6,    6, 7, 4,
             0, 1, 4,    1, 4, 5,    1, 2, 5,    2, 5, 6,
             2, 3, 6,    3, 6, 7,    3, 0, 7,    0, 7, 4
    ];
    this.dx = -25 + 5 * (this.offset / 10);
    this.dy = -3 + Math.random() * 6;
    this.dz = -25 + 5 * (this.offset % 10);
    this.trngls = [];
    this.points = [];
    for (var j = 0; j < v.length; j += 3) {
      this.points.push(this.dx + v[j], this.dy + v[j + 1], this.dz + v[j + 2]);
    }
    for (var j = 0; j < t.length; j++) {
      this.trngls.push(this.offset * 8 + t[j]);
    }
  }

}
for (var i = 0; i < 100; i++) {
  cubes.push(new Cube(i));
}

var cnv = document.getElementById("cnv"),
  ctx = cnv.getContext("2d");
cnv.width = 500;
cnv.height = 400;

update();
var pos = 0;
var angle = 0;
var left=false,right=false,up=false,down=false;
document.body.addEventListener('keydown', function(e) {
updateKeys(e.keyCode, true);
});
document.body.addEventListener('keyup', function(e) {
updateKeys(e.keyCode, false);
});

function updateKeys(code,val) {
  switch (code) {
    case 37:
      left=val;
      break; //Left key
    case 38:
      up=val;
      break; //Up key
    case 39:
      right=val;
      break; //Right key
    case 40:
      down=val;
      break; //Down key
  }
}

function handle(e) {

}
var positions = [];

function update() {
    if(left)angle-=2;
    if(right)angle+=2;
    if(up)pos+=2;
    if(down)pos-=2;

  positions = [];
  var t = Date.now(),
    ang =  (angle * 0.0123),
    s = Math.sin(ang),
    c = Math.cos(ang);
  var allPoints = [];
  var allTrngls = [];
  var allColors = [];
  var mat = [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 4 - (pos * 0.123)];
  ctx.clearRect(0, 0, 500, 500);
  for (var i = 0; i < cubes.length; i++) {
    allPoints.push(...cubes[i].points);
    allTrngls.push(...cubes[i].trngls);
    allColors.push(cubes[i].color);

  }
  draw(allPoints, allTrngls, mat, allColors);
  positions.sort(sortZ);
  paintFill(positions);
  window.requestAnimationFrame(update);
}
function paintFill(pos) {
  for (var i = 0; i < positions.length; i++) {
    ctx.beginPath();
    ctx.lineWidth = 5 / pos[i][0];
    ctx.moveTo(pos[i][1], pos[i][4]);
    ctx.lineTo(pos[i][2], pos[i][5]);
    ctx.lineTo(pos[i][3], pos[i][6]);
    ctx.lineTo(pos[i][1], pos[i][4]);
    //ctx.stroke();  //ctx.fill();
    ctx.fillStyle = pos[i][7];
    ctx.fill();
  }
}

function draw(ps, ts, m, color) {
  for (var i = 0; i < ts.length; i += 3) {
    var p0 = ts[i] * 3,
      p1 = ts[i + 1] * 3,
      p2 = ts[i + 2] * 3;
    var a = vertexShader(ps[p0], ps[p0 + 1], ps[p0 + 2], m);
    var b = vertexShader(ps[p1], ps[p1 + 1], ps[p1 + 2], m);
    var c = vertexShader(ps[p2], ps[p2 + 1], ps[p2 + 2], m);
    fragmentShader(a, b, c, color[Math.floor(i / 36)]);
  }
}

function vertexShader(x, y, z, m) {
  var x0 = m[0] * x + m[1] * y + m[2] * z + m[3];
  var y0 = m[4] * x + m[5] * y + m[6] * z + m[7];
  var z0 = m[8] * x + m[9] * y + m[10] * z + m[11];
  return [x0, y0, z0];
}

// you can make a Z-buffer, sampling from texture, phong shading...
function fragmentShader(a, b, c, color) {
  var z = Math.min(a[2], b[2], c[2]);
  
  if (z < 0) return;
  var x0 = 200 + 300 * a[0] / a[2],
    y0 = 150 + 300 * a[1] / a[2];
  var x1 = 200 + 300 * b[0] / b[2],
    y1 = 150 + 300 * b[1] / b[2];
  var x2 = 200 + 300 * c[0] / c[2],
    y2 = 150 + 300 * c[1] / c[2];
  positions.push([z, x0, x1, x2, y0, y1, y2, color]);
  // we should loop through all pixels of a 2D triangle ...
  // but we just stroke its outline
}

function sortZ(a, b) {
  return b[0] - a[0];
}
