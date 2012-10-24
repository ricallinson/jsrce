/*globals define, window*/

"use strict";

define(["lib/canvas", "lib/engine"], function (canvas, Engine) {

    var engine = new Engine(canvas);

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
    engine.draw(canvas, engine.player, engine.map, engine.samples, engine.pixel);

    // Now loop
    setInterval(function () {
        if (engine.move(engine.player, engine.map)) {
            engine.draw(canvas, engine.player, engine.map, engine.samples, engine.pixel);
        }
    }, 50);

});