/*globals define, window*/

"use strict";

define(["lib/canvas", "lib/engine"], function (canvas, Engine) {

    var engine = new Engine(canvas),

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
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
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
            }
        };

    // // http://paulirish.com/2011/requestanimationframe-for-smart-animating
    // // shim layer with setTimeout fallback
    // window.requestAnimFrame = (function () {
    //     return window.requestAnimationFrame ||
    //         window.webkitRequestAnimationFrame ||
    //         window.mozRequestAnimationFrame ||
    //         window.oRequestAnimationFrame ||
    //         window.msRequestAnimationFrame ||
    //         function (callback) {
    //             window.setTimeout(callback, 1000 / 60);
    //         };
    // }());

    window.addEventListener("keydown", function (e) {
        e.preventDefault();
        engine.changeKeyPressed(e.keyCode, true);
    }, false);

    window.addEventListener("keyup", function (e) {
        e.preventDefault();
        engine.changeKeyPressed(e.keyCode, false);
    }, false);

    // Render the first frame
    engine.draw(canvas, player, map, engine.samples, engine.pixel);

    // Now loop
    setInterval(function () {
        if (engine.move(player, map)) {
            engine.draw(canvas, player, map, engine.samples, engine.pixel);
        }
    }, 50);

});