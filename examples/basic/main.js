/*globals define, window*/

"use strict";

define(["lib/canvas", "lib/gameloop"], function (canvas, GameLoop) {

    var loop = new GameLoop(canvas);

    window.addEventListener("keydown", function (e) {
        e.preventDefault();
        loop.changeKeyPressed(e.keyCode, true);
    }, false);

    window.addEventListener("keyup", function (e) {
        e.preventDefault();
        loop.changeKeyPressed(e.keyCode, false);
    }, false);

    // Render the first frame
    loop.draw(canvas, loop.map, loop.player, loop.samples, loop.pixel);

    // Now loop
    setInterval(function () {
        if (loop.move(loop.player, loop.map)) {
            loop.draw(canvas, loop.map, loop.player, loop.samples, loop.pixel);
        }
    }, 50);

});