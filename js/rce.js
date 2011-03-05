YUI.add('ray-casting-engine', function(Y) {

  Y.namespace('rce');

  // Screen DOM nodes
  var sky, floor, canvas, overlay, wad;

  var screen = {
    width:   0,
    height:  0,
    dist:    0, // Distance
    samples: 0,
    pixel:   1
  };

  // Game State
  var cycleCode; // Holder for the CycleID
  var map      = []; // The game map in which we play
  var mapsize  = {height:0, width:0};
  var mapLos   = []; // The players Line Of Sight over the map (Array of x/y cords)
  var mapLosWall = []; // The x/y cords of the wall directly in the players line of sight
  var mapLosNull = []; // The x/y cords of the space directly in front of the last wall in the players line of sight
  var textures = []; // The avaliable textures for the map
  var itemFind = []; // Quick lookup table for finding items in the map
  var itemMap  = []; // Locations of in-game items
  var items    = []; // Directory of avaliable items
  var sprites  = []; // List of items to be rendered in the current view
  var buildMap = false;

  // Player State
  var player = {
    life: 100,
    pos: {
      x: 0,
      y: 0,
      z: 1,
      r: Math.PI
    },
    vel: {
      x: 0,
      y: 0,
      r: 0
    },
    jumping: 0,
    crouching: 0,
    removing: 0
  };

  // Helpers
  var pi=Math.PI;

  // No Idea ?
  var face = [];
  var bit  = [];

  /**
   * Start the Ray Casting Engine
   **/
  Y.rce = function(s,f,c,o,w,b) {
    sky = s;
    floor = f;
    canvas = c._node.getContext("2d");
    overlay = o;
    wad = w;
    buildMap = b || false;

    screen.width   = c.get('width');
    screen.height  = c.get('height');
    screen.dist    = (screen.width/2) / Math.tan(( (60 * Math.PI / 180) / 2));
    screen.pixel   = 1;
    screen.samples = screen.width/screen.pixel;

    sky._node.style.backgroundPosition = Math.floor(-player.pos.r/(2*pi)*2400)+"px 0";

    initWad(w,w.dir);

    drawCanvas();
    
    cycleCode = setInterval(cycle, 35);

    Y.log('Engine started with WAD at location: '+w.dir, "info",  "rce");

    triggerStart();
  };

  /**
   * Use a new WAD and prime its sprites
   **/
  function initWad(wad,wadDir){
    map      = wad.map;
    textures = wad.textures;
    itemMap  = wad.itemMap;
    items    = wad.items;

    player.pos.x = wad.start.x;
    player.pos.y = wad.start.y;

    mapsize.height = map.length-1;
    mapsize.width  = map[0].length-1;

    initTextures(wadDir);
    initSprites(wadDir);
  }

  /**
   * Load all the texture images
   **/
  function initTextures(wadDir){
    for (var i=0;i<textures.length;i++) {
      textures[i].img     = new Image();
      textures[i].img.src = wadDir+textures[i].src;
    }
  }

  /**
   * Load all the items into the Item Map
   **/
  function initSprites(wadDir){
    for (var i=0;i<items.length;i++) {
      var item = items[i];
      // For each item load the image
      item.img     = new Image();
      item.img.src = wadDir+item.src;
      item.width   = item.img.width;
      item.height  = item.img.height;
    }

    for (var i=0;i<itemMap.length;i++) {
      itemMap[i].type = items[itemMap[i].type];
    }

    // Prime the itemFind lookup array
    itemFind = [];
	for (var y=0;y<map.length;y++) itemFind[y] = [];

	for (var i=0;i<itemMap.length;i++) {
		var sprite = itemMap[i];
        itemFind[sprite.y][sprite.x] = sprite;
	}
  }

  function initLineOfSight(){
    var los = getLineOfSight(player.pos.x,player.pos.y,player.pos.r);

    mapLos = [];
	for (var y=0;y<map.length;y++) mapLos[y] = [];

	for (var i=0;i<los.length;i++) {
      var square = los[i];
      mapLos[square.y][square.x] = true;
	}

    mapLosWall = los[los.length-1];
    mapLosNull = los[los.length-2] || los[los.length-1];

    //Y.log(JSON.stringify(mapLosWall));
  }

  function getTextureId(x,y){
    if(buildMap && x==mapLosWall.x && y==mapLosWall.y) return 0;
    return map[y][x];
  }

  function getLineOfSight(x, y, r){
    var i = 0, nextX, nextY, stack = [];
    while(i<100){
      var nextX=Math.floor(x+Math.cos(r)*i);
      var nextY=Math.floor(y+Math.sin(r)*i);

      stack[i] = {x:nextX,y:nextY};
      //Y.log(nextX+'x'+nextY);
      if (map[nextY][nextX] != 0){
        //Y.log(JSON.stringify(stack));
        return stack;
      }
      i++;
    }
  }

  function triggerStart(){
    Y.Global.fire('rce:start',player.life);
  }

  function triggerDie(intCode){
    clearInterval(intCode);
    Y.Global.fire('rce:die');
  }

  function triggerPain(){
    player.life--;
    Y.Global.fire('rce:pain',player.life);
  }

  function drawCanvas(){
    canvas.clearRect(0,0, screen.width, screen.height);

    clearSprites();
    initLineOfSight();

    var theta = player.pos.r-pi/6;
    var dist  = rayCast(theta);
    var stack = [];

    // Here we order by distance
    for(var ii=0; ii<screen.samples; ii++) {
      theta+=pi/(3*screen.samples);
      stack[ii] = [ii, theta, dist[ii]];
    }

    stack.sort(function(a,b){
      return b[2] - a[2]
    });

    // Now we draw from the back to the front
    for (var i=0; i<screen.samples; i++) {
      theta = stack[i][1];

      var sample = stack[i][0];

      var d2=dist[sample];
      var d=d2*Math.cos(theta-player.pos.r);

      var z=1-player.pos.z/2;
      var h=screen.height/d;

      drawSprites( d2 );

      // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) takes an image, clips it to the rectangle (sx, sy, sw, sh),
      // scales it to dimensions (dw, dh), and draws it on the canvas at coordinates (dx, dy).
      canvas.drawImage(textures[face[sample]].img, bit[sample]*63, 0, 1, 64, sample*screen.pixel, (screen.height/2)-h*z, screen.pixel, h);
    }

    // we do this to force any sprites close to the view to be rendered
    drawSprites( d2, true );
  }

  function drawSprites(depth, force){
    // Do some stuff here to make it faster
    for (var i=0;i<sprites.length;i++) {
      var sprite = sprites[i];

      if( !sprite.rendered && ( sprite.dist > depth || force ) ){
        // size of the sprite
        var size = screen.dist / (Math.cos(sprite.angle) * sprite.dist);
        var dbx  = size > 0 ? size : 0;
        var dby  = size > 0 ? size : 0;

        // x-position on screen
        var x = Math.tan(sprite.angle) * screen.dist;

        var dw = screen.width/2+x-size/2;
        var dh = (((screen.height-size)/2)-(screen.height/sprite.dist)*(0.5-player.pos.z/2));

        var frame  = 0;
        var width  = sprite.type.width;
        var height = sprite.type.height;

        // If we have actions use them
        if(sprite.type.actions){
          var actions = sprite.type.actions;
          var current = sprite.action || 'still';
          frame = Math.floor(actions[current].next)*64;
          width = 64;

          actions[current].next = actions[current].next+0.25 > actions[current].end ? actions[current].start : actions[current].next+0.25;
        }
        //tail("sample:"+sample+" dist:"+dist+" depth:"+depth+" - "+sprite.type+"@"+sprite.width+"x"+sprite.height+" dimensions@"+dw+"x"+dh+" coordinates@"+dbx+"x"+dby);

        // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) takes an image, clips it to the rectangle (sx, sy, sw, sh),
        // scales it to dimensions (dw, dh), and draws it on the canvas at coordinates (dx, dy).
        canvas.drawImage(sprite.type.img, frame, 0, width, height, dw, dh, dbx, dby);

        sprite.rendered = true;
      }
    }
  }

  function clearSprites(){
    for (var i=0;i<sprites.length;i++) {
      sprites[i].dist = null;
      sprites[i].angle = null;
      sprites[i].rendered = false;
    }

    sprites = [];
  }
  
  function rayCast(theta){
    var dist=[];

    var x = player.pos.x, y = player.pos.y;
    var deltaX, deltaY;
    var distX, distY;
    var stepX, stepY;
    var mapX, mapY

    var atX=Math.floor(x), atY=Math.floor(y);

    for (var i=0; i<screen.samples; i++) {
      theta+=pi/(3*screen.samples)+2*pi;
      theta%=2*pi;

      mapX = atX, mapY = atY;

      deltaX=1/Math.cos(theta);
      deltaY=1/Math.sin(theta);

      if (deltaX>0) {
        stepX = 1;
        distX = (mapX + 1 - x) * deltaX;
      }
      else {
        stepX = -1;
        distX = (x - mapX) * (deltaX*=-1);
      }
      if (deltaY>0) {
        stepY = 1;
        distY = (mapY + 1 - y) * deltaY;
      }
      else {
        stepY = -1;
        distY = (y - mapY) * (deltaY*=-1);
      }

      while (true) {
        if (distX < distY) {
          mapX += stepX;
          if (map[mapY][mapX]) {
            dist[i]=distX;
            face[i]=getTextureId(mapX,mapY);
            bit[i]=(y+distX/deltaY*stepY)%1 || 0;
            break;
          }
          distX += deltaX;
        }
        else {
          mapY += stepY;
          if (map[mapY][mapX]) {
            dist[i]=distY;
            face[i]=getTextureId(mapX,mapY);
            bit[i]=(x+distY/deltaX*stepX)%1 || 0;
            break;
          }
          distY += deltaY;
        }

        if (itemFind[mapY][mapX] && !itemFind[mapY][mapX].dist) {
          var sprite = itemFind[mapY][mapX];

          // translate position to viewer space
          var dx = sprite.x + 0.5 - player.pos.x;
          var dy = sprite.y + 0.5 - player.pos.y;

          // distance to sprite
          sprite.dist = Math.sqrt(dx*dx + dy*dy);
          // sprite angle relative to viewing angle
          sprite.angle = Math.atan2(dy, dx) - player.pos.r;

          sprites.push(sprite);
        }

        // Now order the sprites by distance from player
        // This is so when they are rendered they overlay in the correct order
        sprites.sort(function(a,b){
          return b.dist - a.dist;
        });
      }
    }

    return dist;
  }
  
  function isBlocking(x, y, item){
    // If there is some error block
    if ( isNaN(x) || isNaN(y) ) return true;
    
    // first make sure that we cannot move outside the boundaries of the level
	if (y < 0 || y >= mapsize.height || x < 0 || x >= mapsize.width) return true;

    var xx,yy; // make some vars
    
    if(item){ // If we have an item do a simple calc
      xx = Math.floor(x);
      yy = Math.floor(y);
      if (map[yy][xx] != 0) return true;
      if (itemFind[yy][xx] && itemFind[yy][xx].type.block){
        if(item != itemFind[yy][xx]) return true;
      }
    }
    else{ // If we don't have an item work harder
      for (var i=-0.1; i<=0.1; i+=0.2) {
        xx=Math.floor(x+i);
        for (var j=-0.1; j<=0.1; j+=0.2) {
          yy=Math.floor(y+j);
          if (map[yy][xx] != 0) return true;
          if (itemFind[yy][xx] && itemFind[yy][xx].type.block) return true;
        }
      }
    }
    
    return false;
  }

  /**
   * The main game cycle
   **/
  function cycle(){
    if(player.life<=0) return triggerDie(cycleCode);
    
    var change=false;

    if (player.removing && !key[8]){
      player.removing = 0;
    }
    else if(!player.removing && key[8]){ // remove a wall
      removeWall(mapLosWall.x,mapLosWall.y);
      player.removing = 1;
      change=true;
    }

    if (player.inserting && !key[9]){
      player.inserting = 0;
    }
    else if(!player.inserting && key[9]){ // remove a wall
      insertWall(mapLosNull.x,mapLosNull.y,1);
      player.inserting = 1;
      change=true;
    }

    if (player.marking && !key[10]){
      player.marking = 0;
    }
    else if(!player.marking && key[10]){ // mark a wall
      markWall(mapLosWall.x,mapLosWall.y,3);
      player.marking = 1;
      change=true;
    }

    if (player.jumping) {
      player.jumping--;
      change=true;
      player.pos.z = 1 + player.jumping*(20-player.jumping)/110;
    }
    else if (key[6]) player.jumping=20;

    if (key[7]){
      if (player.crouching < 6) player.crouching++;
      change=true;
      player.pos.z = 1 - (player.crouching/10);
    }
    else if (player.crouching) {
      player.crouching--;
      change=true;
      player.pos.z = 1 - (player.crouching/10);
    }

    if (key[0]) {
      if (!key[1]) {
        player.pos.r-=0.15; //left
        change=true;
      }
    }
    else if (key[1]) {
      player.pos.r+=0.15; //right
      change=true;
    }

    if (change) {
      player.pos.r+=2*pi;
      player.pos.r%=2*pi;
      sky._node.style.backgroundPosition = Math.floor(-player.pos.r/(2*pi)*2400)+"px 0";
    }

    if (key[4] && !key[5]) { // strafing left
      player.vel.r = -1.5;
      if ( key[2] && !key[3] ) player.vel.r = -1;
      if ( key[3] && !key[2] ) player.vel.r = 0.5;
      if ( player.vel.y<0.2 ) player.vel.y += 0.04;
    }
    else if (key[5] && !key[4]) { // strafing right
      player.vel.r = 1.5;
      if ( key[2] && !key[3] ) player.vel.r = 1;
      if ( key[3] && !key[2] ) player.vel.r = -0.5;
      if ( player.vel.y<0.2 ) player.vel.y += 0.04;
    }
    else if(player.vel.r){ // no strafing
      player.vel.y = 0;
      player.vel.r = 0;
    }

    if (key[2] && !key[3]) { // forward
      if (player.vel.y<0.2) player.vel.y += 0.14;
    }
    else if (key[3] && !key[2]) { // backward
      if (player.vel.y>-0.2) player.vel.y -= 0.14;
    }
    else { // stop moving
      if (player.vel.y<-0.02) player.vel.y += 0.015;
      else if (player.vel.y>0.02) player.vel.y -= 0.015;
      else player.vel.y=0;
    }

    if (player.vel.y!=0) {

      var oldX=player.pos.x;
      var oldY=player.pos.y;
      var newX=oldX+Math.cos(player.pos.r+player.vel.r)*player.vel.y;
      var newY=oldY+Math.sin(player.pos.r+player.vel.r)*player.vel.y;

      if (!isBlocking(newX, oldY)) {
        player.pos.x=newX;
        oldX=newX;
        change=true;
      }
      if (!isBlocking(oldX, newY)) {
        player.pos.y=newY;
        change=true;
      }
    }

    if(change){
      Y.Global.fire('rce:move',{type:0,action:"move",x:player.pos.x,y:player.pos.y});
    }

    // This checks all items are correct in "itemFind"
    if(cleanItemFind()) change = true;

    // This moves any moving items
    if(simple_ai()) change = true;

    change = true; // Do this to force a render all the time

    if(change) drawCanvas();
  }

  function removeWall(x,y){

    if(!buildMap) return;

    x = Math.floor(x);
    y = Math.floor(y);

    // first make sure that we cannot move outside the boundaries of the level
	if (y <= 0 || y >= mapsize.height || x <= 0 || x >= mapsize.width) return;

    map[y][x] = 0;
  }

  function insertWall(x,y,texture){

    if(!buildMap) return;
    
    x = Math.floor(x);
    y = Math.floor(y);

    // first make sure that we cannot move outside the boundaries of the level
	if (y <= 0 || y >= mapsize.height || x <= 0 || x >= mapsize.width) return;

    if( Math.floor(player.pos.x) != x && Math.floor(player.pos.y) != y){
      map[y][x] = texture;
    }
  }

  function markWall(x,y,texture){

    if(!buildMap) return;
    
    x = Math.floor(x);
    y = Math.floor(y);

    // Make sure we are marking a wall
    if(map[y][x]<=0) return;

    // We cannot mark the boundaries of the level
	if (y <= 0 || y >= mapsize.height || x <= 0 || x >= mapsize.width) return;

    map[y][x]=texture;
  }
  
  /****************************************************************************
   * I'm not sure about the stuff below this point                            *
   ****************************************************************************/

  var key=[
    0, // 0 left
    0, // 1 right
    0, // 2 forward
    0, // 3 backward
    0, // 4 straf left
    0, // 5 straf right
    0, // 6 jump
    0, // 7 crouch
    0, // 8 Remove Wall
    0, // 9 Insert Wall
    0, // 10 Mark Wall
  ];

  function changeKey(which, to){ //Y.log(which);
	switch (which){
      case 37:key[0]=to;break; // left "left"
      //case 38:key[2]=to;break; // up "forward"
      case 39:key[1]=to;break; // right "right"
      //case 40:key[3]=to;break; // down "backward"

      case 65:key[4]=to;break; // A "straf left"
      case 87:key[2]=to;break; // W "forward"
      case 68:key[5]=to;break; // D "straf right"
      case 83:key[3]=to;break; // S "backward"

      case 32:key[6]=to;break; // space "Jump"
      case 16:key[7]=to;break; // left shift "Crouch"

      case 38:key[8]=to;break; // up "remove wall"
      case 40:key[9]=to;break; // down "insert wall"
      case 70:key[10]=to;break; // F "mark wall"
	}
  }

  Y.on("keydown", function(e){changeKey(e.keyCode, 1);} );
  Y.on("keyup",   function(e){changeKey(e.keyCode, 0);} );

  /**
   * This function cleans the itemFind array
   **/
  function cleanItemFind(){

    var clean = [],
        change = false;

    for(var i in itemFind){
      clean[i] = [];
    }

    for (var i=0;i<itemMap.length;i++) {
      var sprite = itemMap[i];
      clean[Math.floor(sprite.y)][Math.floor(sprite.x)] = sprite;

      if(clean[Math.floor(sprite.y)][Math.floor(sprite.x)] != itemFind[Math.floor(sprite.y)][Math.floor(sprite.x)]){
        change = true;
      }
	}

    itemFind = clean;

    return change;
  }

  function simple_ai() {
    var change = false;

    for (var i=0;i<itemMap.length;i++) {
      var item = itemMap[i];

      if(item.type.speed){
        item.action = 'still';

        var dx = player.pos.x - item.x;
        var dy = player.pos.y - item.y;
        // distance from enemy to to player
        var dist = Math.sqrt(dx*dx + dy*dy);
        // if distance is more than X, then enemy must chase player
        if (dist > 1 && dist < 10) {
          var angle = Math.atan2(dy, dx);
          item.rDeg = angle * 180 / Math.PI;
          item.r = angle;

          var moveStep = (1000 / 30) * 0.1 * item.type.speed;
          var oldX = item.x;
          var oldY = item.y;
          // calculate new position with simple trigonometry
          var newX = item.x + Math.cos(item.r) * moveStep;
          var newY = item.y + Math.sin(item.r) * moveStep;

          var pos = checkCollision(item.x, item.y, newX, newY, 0.5, item);

          if( pos.x != item.x || pos.y != item.y ){
            item.x = pos.x;
            item.y = pos.y;
            itemFind[Math.floor(oldY)][Math.floor(oldX)]     = null; // remove old loc
            itemFind[Math.floor(item.y)][Math.floor(item.x)] = item; // add new loc
            item.action = 'move';
            change = true;
          }
        }
        else if(dist <= 1){
          triggerPain();
          item.action = 'attack';
          change = true;
        }
      }
    }

    return change;
  }

  function checkCollision(fromX, fromY, toX, toY, radius, item) {
	var pos = {
      x : fromX,
      y : fromY
	};

	if (toY < 0 || toY >= mapsize.height || toX < 0 || toX >= mapsize.width)
      return pos;

	if (isBlocking(toX,toY,item)) return pos;

	pos.x = toX;
	pos.y = toY;

    var blockX      = Math.floor(toX);
	var blockY      = Math.floor(toY);
	var blockTop    = isBlocking(blockX,blockY-1,item);
	var blockBottom = isBlocking(blockX,blockY+1,item);
	var blockLeft   = isBlocking(blockX-1,blockY,item);
	var blockRight  = isBlocking(blockX+1,blockY,item);

	if (blockTop != 0 && toY - blockY < radius) {
      toY = pos.y = blockY + radius;
	}
	if (blockBottom != 0 && blockY+1 - toY < radius) {
      toY = pos.y = blockY + 1 - radius;
	}
	if (blockLeft != 0 && toX - blockX < radius) {
      toX = pos.x = blockX + radius;
	}
	if (blockRight != 0 && blockX+1 - toX < radius) {
      toX = pos.x = blockX + 1 - radius;
	}

	// is tile to the top-left a wall
	if (isBlocking(blockX-1,blockY-1,item) != 0 && !(blockTop != 0 && blockLeft != 0)) {
      var dx = toX - blockX;
      var dy = toY - blockY;
      if (dx*dx+dy*dy < radius*radius) {
        if (dx*dx > dy*dy)
          toX = pos.x = blockX + radius;
        else
          toY = pos.y = blockY + radius;
      }
	}
	// is tile to the top-right a wall
	if (isBlocking(blockX+1,blockY-1,item) != 0 && !(blockTop != 0 && blockRight != 0)) {
      var dx = toX - (blockX+1);
      var dy = toY - blockY;
      if (dx*dx+dy*dy < radius*radius) {
        if (dx*dx > dy*dy)
          toX = pos.x = blockX + 1 - radius;
        else
          toY = pos.y = blockY + radius;
      }
	}
	// is tile to the bottom-left a wall
	if (isBlocking(blockX-1,blockY+1,item) != 0 && !(blockBottom != 0 && blockBottom != 0)) {
      var dx = toX - blockX;
      var dy = toY - (blockY+1);
      if (dx*dx+dy*dy < radius*radius) {
        if (dx*dx > dy*dy)
          toX = pos.x = blockX + radius;
        else
          toY = pos.y = blockY + 1 - radius;
      }
	}
	// is tile to the bottom-right a wall
	if (isBlocking(blockX+1,blockY+1,item) != 0 && !(blockBottom != 0 && blockRight != 0)) {
      var dx = toX - (blockX+1);
      var dy = toY - (blockY+1);
      if (dx*dx+dy*dy < radius*radius) {
        if (dx*dx > dy*dy)
          toX = pos.x = blockX + 1 - radius;
        else
          toY = pos.y = blockY + 1 - radius;
      }
	}

	return pos;
  }

}, '0.1.0' /* module version */, {
  requires: ['node','event-custom']
});