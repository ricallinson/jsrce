YUI.add('wad-editor', function(Y) {

    function Map(wad){
        this.wad = wad;
        this.lastPlayerPos = '';
        this.lastItemPos   = [];
        this.curPalette = {type:'wall', id: 1};
        this.wallColors = ['#fff', '#999', '#777', '#999', '#777'];
        this.itemColors = ['green'];
    }

    Map.prototype = {
        drawMap: function(node){

            var table = Y.Node.create('<table id="wad-editor-map"></table>'),
                x, y;

            table.setStyle('borderCollapse', 'collapse');

            for (y = 0; y < this.wad.map.length; y++)
            {
                var row = Y.Node.create('<tr/>');
                table.append(row);

                for (x = 0; x < this.wad.map[0].length; x++) {
                    
                    var td = Y.Node.create('<td/>');

                    td.set('id', 'cord-'+x+'-'+y)
                    td.setStyle('border', 'solid 1px black');
                    td.setStyle('backgroundColor', this.wallColors[this.wad.map[y][x]]);
                    td.setStyle('width', '8px');
                    td.setStyle('height', '8px');

                    row.append(td);
                }
            }

            node.append(table);

            node.append(Y.Node.create('<div id="wad-editor-palette"></div>'));

            this.drawWalls(node.one('#wad-editor-palette'));
            this.drawItems(node.one('#wad-editor-palette'));

            node.one('#wad-editor-map').on('click', this.listenForEdit, this);
            
            Y.Global.on('rce:player-move', this.updatePlayerPosition, this);
            Y.Global.on('rce:item-move', this.updateItemPosition, this);
        },

        cleanPalette: function(){
            Y.Node.one('#wad-editor-walls').get('children').removeClass('selected');
            Y.Node.one('#wad-editor-items').get('children').removeClass('selected');
        },

        drawWalls: function(node){
            var palette = Y.Node.create('<div id="wad-editor-walls"></div>'),
                textures = this.wad.textures,
                i;

            for (i=1; i < textures.length; i++) {

                var img = Y.Node.create('<img/>');

                img.setAttribute('src', this.wad.dir+textures[i].src);
                img.set('id', 'wad-texture-'+i);

                if(i==1) img.addClass('selected');

                palette.append(img);
            }

            node.append(palette);

            node.one('#wad-editor-walls').on('click', this.selectWall, this);
        },

        selectWall: function(e){

            this.cleanPalette();

            e.target.addClass('selected');

            this.curPalette = {type:'wall', id: e.target.get('id').replace('wad-texture-', '')};
        },

        drawItems: function(node){
            var palette = Y.Node.create('<div id="wad-editor-items"></div>'),
                items = this.wad.items,
                i;

            for (i=0; i < items.length; i++) {

                var img = Y.Node.create('<img/>');

                img.setAttribute('src', this.wad.dir+items[i].src);
                img.set('id', 'wad-item-'+i);

                palette.append(img);
            }

            node.append(palette);

            node.one('#wad-editor-items').on('click', this.selectItem, this);
        },

        selectItem: function(e){

            this.cleanPalette();

            e.target.addClass('selected');

            this.curPalette = {type:'item', id: e.target.get('id').replace('wad-item-', '')};
        },

        updatePlayerPosition: function(pos){
            var id, td, xy;

            if(this.lastPlayerPos){
                id = this.lastPlayerPos;
                td = Y.one('#cord-'+id);
                xy = td.get('id').replace('cord-', '').split('-');
                td.setStyle('backgroundColor', this.wallColors[this.wad.map[xy[1]][xy[0]]]);
            }

            id = Math.floor(pos.x)+'-'+Math.floor(pos.y);
            td = Y.one('#cord-'+id);
            td.setStyle('backgroundColor', 'red');

            this.lastPlayerPos = id;
        },

        updateItemPosition: function(pos){
            var id, td, xy;

            if(this.lastItemPos[pos.id]){
                id = this.lastItemPos[pos.id];
                td = Y.one('#cord-'+id);
                xy = td.get('id').replace('cord-', '').split('-');
                td.setStyle('backgroundColor', this.wallColors[this.wad.map[xy[1]][xy[0]]]);
            }

            id = Math.floor(pos.x)+'-'+Math.floor(pos.y);
            td = Y.one('#cord-'+id);
            td.setStyle('backgroundColor', this.itemColors[pos.type]);

            this.lastItemPos[pos.id] = id;
        },

        listenForEdit: function(e){
            var td, xy;

            td = e.target;
            xy = e.target.get('id').replace('cord-', '').split('-');

            if(this.curPalette.type == 'wall'){

                var wall = this.wad.map[xy[1]][xy[0]];

                wall = this.wad.map[xy[1]][xy[0]] = wall ? 0 : this.curPalette.id;

                td.setStyle('backgroundColor', this.wallColors[wall]);

            }else{

                var item = this.wad.items[this.curPalette.id];

                this.wad.itemMap.push({typeId: this.curPalette.id, type: item, x: parseInt(xy[0]), y: parseInt(xy[1])});
            }
        }
    }

    Y.namespace('editor');

    Y.editor = Map;

}, '0.1.0' /* module version */, {
    requires: ['node']
});