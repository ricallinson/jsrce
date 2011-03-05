YUI().use('node','ray-casting-engine','websocket-items','datasource','json', function(Y) {
  var screen = Y.one('#game-screen');

  // First we setup the screen
  screen.insert('<div id="sky"></div>')
  screen.insert('<div id="floor"></div>');
  screen.insert('<canvas id="canvas"></canvas>');
  screen.insert('<div id="overlay"></div>');
  screen.insert('<div id="info"></div>');
  screen.insert('<div id="console"><div id="life">0</div></div>');

  var sky = Y.one('#sky'),
      floor = Y.one('#floor'),
      canvas = Y.one('#canvas'),
      overlay = Y.one('#overlay'),
      info = Y.one('#info'),
      console = Y.one('#console');

  var width = 640,
      height = 480,
      wad = 'wads/'+screen.getAttribute('class')+'/';

  screen.setStyle('position','relative');
  screen.setStyle('width',width+'px');
  screen.setStyle('height',height+'px');

  sky.setStyle('position','absolute');
  sky.setStyle('left','0');
  sky.setStyle('top','0');
  sky.setStyle('width',width+'px');
  sky.setStyle('height',height+'px');
  sky.setStyle('background','#ccd url('+wad+'sky.jpg) repeat -1174px 0pt');

  floor.setStyle('position','absolute');
  floor.setStyle('left','0');
  floor.setStyle('top',height/2+'px');
  floor.setStyle('width',width+'px');
  floor.setStyle('height',height/2+'px');
  floor.setStyle('background','#565 url('+wad+'floor.png)');

  canvas.setStyle('position','absolute');
  canvas.setStyle('left','0');
  canvas.setStyle('top','0');
  canvas.set('width',width);
  canvas.set('height',height);

  overlay.setStyle('position','absolute');
  overlay.setStyle('left','0');
  overlay.setStyle('top','0');
  overlay.setStyle('width',width+'px');
  overlay.setStyle('height',height+'px');
  overlay.setStyle('opacity','0');

  info.setStyle('position','absolute');
  info.setStyle('left','0');
  info.setStyle('top','0');
  info.setStyle('width',width+'px');
  info.setStyle('height',height+'px');
  info.setStyle('opacity','0');

  console.setStyle('position','absolute');
  console.setStyle('left','0');
  console.setStyle('top',height+'px');
  console.setStyle('width',(width)+'px');
  
  /**
   * Loads a WAD file from a remote location
   **/
  var data = new Y.DataSource.IO({source: wad+'main.json'});

  data.sendRequest({
    request: '',
    callback: {
      success: function(e){
        var wadObj = Y.JSON.parse(e.data.responseText),
            wadSocket = new Y.items(wadObj);
        
        wadObj.dir = wad;

        Y.rce(sky,floor,canvas,overlay,wadSocket.start(30),false);
      },
      failure: function(e){
        alert(e.error.message);
      }
    }
  });

  var soundStart = window.Audio && new Audio(wad+'start.wav');
  var soundPain  = window.Audio && new Audio(wad+'pain.wav');

  Y.Global.on('rce:start', function(life) {
    console.one('#life').setContent(life);
    soundStart.play();
  });

  Y.Global.on('rce:die', function() {
    info.setStyle('opacity','0.7');
    info.setStyle('background','url('+wad+'overlay-dead.gif) no-repeat center bottom');
  });

  Y.Global.on('rce:pain', function(life) {
    var next = parseInt(overlay.getStyle('opacity'));
    if(next>0)return;
    overlay.setStyle('opacity','0.8');
    overlay.setStyle('background','url('+wad+'overlay-pain.gif) no-repeat center bottom');

    soundPain.play();

    var fade = function(){
      next = parseFloat(overlay.getStyle('opacity'))-0.1;
      overlay.setStyle('opacity',next);
      if(next>0) setTimeout(fade,300);
    };

    console.one('#life').setContent(life);

    fade();
  });
});