YUI.add('websocket-items', function(Y) {

  Y.namespace('items');

  var WebsocketItems = function(wadObj){
    this.wad = wadObj;
  }

  WebsocketItems.prototype = {

    start: function(size){

      this.wad.start.x  = size/2;
      this.wad.start.y  = size/2;
      this.wad.itemFind = [];
      
      this.wad.map = this.newMap(size);

      //this.wad.itemMap = [];

      var items   = this.wad.items,
          itemMap = this.wad.itemMap;

      /**
       * This is where a websocket will receive data;
       *
       * [
       *   {guid:0,type:0,action:"move",x:1.328,y:6.987},
       *   {guid:1,type:0,action:"move",x:1.328,y:6.987},
       *   {guid:2,type:0,action:"move",x:1.328,y:6.987},
       *   {guid:3,type:0,action:"move",x:1.328,y:6.987}
       * ]
       **/
      var guid = 0, type = 0;
      var id = setInterval( function(){

        itemMap[guid] = {
          type: items[type],
          action: 'move',
          x: itemMap[guid].x + 0.2,
          y: itemMap[guid].y + 0.2
        }

        if(itemMap[guid].x > size-10) {
          clearInterval(id);
          itemMap[guid+1] = {type: items[type], x: 4, y: 4}; // Add a new user
        }
      }, 100);

      /**
       * This is where a websocket will push data;
       *
       * {type:0,action:"move",x:1.328,y:6.987}
       **/
      Y.Global.on('rce:move', function(data) {
        //Y.log(data);
      });

      return this.wad;
    },

    newMap: function(max){
      var map = [];
      max--;

      for(var y=0; y<=max; y++){
        map[y] = [];
        for(var x=0; x<=max; x++){
          if(y == 0 || y == max || x == 0 || x == max){
            map[y][x] = 1;
          }else{
            map[y][x] = 0;
          }
        }
      }

      return map;
    }

  }

  Y.items = WebsocketItems;

}, '0.1.0' /* module version */, {
  requires: []
});