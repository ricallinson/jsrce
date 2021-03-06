/*globals define, window*/

"use strict";

define(["lib/canvas", "lib/engine"], function (Canvas, Engine) {

    var viewport = new Canvas("viewport", 600, 600),
        viewmap = new Canvas("viewmap", 100, 100),
        viewplayer = new Canvas("viewplayer", 100, 100),
        engine = new Engine(viewport),

        /*
            A sample map in case one is not provided
        */

        map = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 1, 0, 1, 0, 0, 1, 1, 0, 1],
            [1, 1, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],

        /*
            Holds the players current position
        */

        player = {
            pos: {
                x: 1.1,
                y: 1.1,
                z: 1,
                r: 0.7
            },
            vel: {
                x: 0,
                y: 0,
                r: 0
            },
            movementSpeed: 0.03,
            rotationSpeed: 0.03,
            strafingSpeed: 0.05
        };

    window.addEventListener("keydown", function (e) {
        e.preventDefault();
        engine.changeKeyPressed(e.keyCode, true);
    }, false);

    window.addEventListener("keyup", function (e) {
        e.preventDefault();
        engine.changeKeyPressed(e.keyCode, false);
    }, false);

    function draw(map) {
        // Render the first frame
        engine.drawView(viewport, player, map, engine.samples, engine.pixel);
        // Render the map
        engine.drawMap(viewmap, player, map);
        // Render the player on the map overlay
        engine.drawPlayerOnMap(viewplayer, player, map);
    }

    draw(map);

    // Now loop
    setInterval(function () {
        if (engine.move(player, map)) {
            draw(map)
        }
    }, 1000 / 60);

});