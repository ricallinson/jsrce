/*globals define, window*/

"use strict";

define(["lib/canvas", "lib/engine"], function (Canvas, Engine) {

    var drawMap = false,
        viewport,
        viewmap,
        viewplayer,
        engine,
        height = window.innerHeight,
        width = window.innerWidth,
        touchRotation = 5000,

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
            rotationSpeed: 0.03
        };

    // Use the smallest side
    if (height > width) {
        height = width;
    } else {
        width = height;
    }

    viewport = new Canvas("viewport", width, height);
    engine = new Engine(viewport);

    // Setup user-agent based numbers
    // alert(navigator.userAgent);
    if (/Android/.test(navigator.userAgent)) {
        player.movementSpeed = player.movementSpeed * 2.5;
        engine.pixel = 4;
        touchRotation = 2500;
    }
    if (/iPad/.test(navigator.userAgent)) {
        touchRotation = 10000;
    }

    // Always move forward
    engine.changeKeyPressed(38, true);

    /*
        Move vars
    */
    var down = false,
        x = 0;

    function rotatePlayer(player, x, newX) {
        if (down) {
            if (x > newX) {
                player.rotationSpeed = ((x - newX) / touchRotation) * 1;
                engine.changeKeyPressed(39, false);
                engine.changeKeyPressed(37, true);
            } else if (x < newX) {
                player.rotationSpeed = ((newX - x) / touchRotation) * 1;
                engine.changeKeyPressed(37, false);
                engine.changeKeyPressed(39, true);
            } else {
                engine.changeKeyPressed(37, false);
                engine.changeKeyPressed(39, false);
            }
            // document.getElementById("show").innerHTML = player.rotationSpeed;
        }
    }

    /*
        Touch events
    */

    window.addEventListener('touchstart', function(e) {
        e.preventDefault();
        down = true;
        x = e.touches.item(0).clientX;
    }, false);
    window.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var newX = e.touches.item(0).clientX;
        if (down) {
            rotatePlayer(player, x, newX);
        }
    }, false);
    window.addEventListener('touchend', function(e) {
        e.preventDefault();
        down = false;
        engine.changeKeyPressed(37, false);
        engine.changeKeyPressed(39, false);
    }, false);

    /*
        Mouse down and move
    */

    window.addEventListener("mousedown", function (e) {
        down = true;
        x = e.x;
    }, false);
    window.addEventListener("mousemove", function (e) {
        var newX = e.x;
        if (down) {
            rotatePlayer(player, x, newX);
        }
    }, false);
    window.addEventListener("mouseup", function (e) {
        down = false;
        engine.changeKeyPressed(37, false);
        engine.changeKeyPressed(39, false);
    }, false);

    /*
        Key down
    */
    window.addEventListener("keydown", function (e) {
        if (e.keyCode === 37 || e.keyCode === 39) {
            engine.changeKeyPressed(e.keyCode, true);
        }
    }, false);
    window.addEventListener("keyup", function (e) {
        if (e.keyCode === 37 || e.keyCode === 39) {
            engine.changeKeyPressed(e.keyCode, false);
        }
    }, false);

    // Render the first frame
    engine.drawView(viewport, player, map, engine.samples, engine.pixel);

    if (drawMap) {
        // Setup the map
        viewmap = new Canvas("viewmap", 100, 100);
        viewplayer = new Canvas("viewplayer", 100, 100);
        // Render the map
        engine.drawMap(viewmap, player, map);
        // Render the player on the map overlay
        engine.drawPlayerOnMap(viewplayer, player, map);
    }

    // Now loop
    setInterval(function () {
        if (engine.move(player, map)) {
            // Render the next frame in the viewprot
            engine.drawView(viewport, player, map, engine.samples, engine.pixel);
            if (drawMap) {
                // Render the map in case the walls changed
                engine.drawMap(viewmap, player, map);
                // Render the players postion on the map overlay
                engine.drawPlayerOnMap(viewplayer, player, map);
            }
        }
    }, 1000 / 60);
});