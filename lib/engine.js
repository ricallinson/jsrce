/*globals define, window, Image*/

"use strict";

define(function () {

    var /*
            TODO: Remmove, used for picking texture
        */
        face = [],

        /*
            TODO: Remmove, used for setting texture
        */
        bit = [],

        /*
            Temp
        */

        imageObj;

    imageObj = new Image();
    imageObj.src = "wall.gif";

    /*
        RGB to Hex
    */
    function rgbToHex(R, G, B) {

        function toHex(n) {
            n = parseInt(n, 10);
            if (isNaN(n)) {
                return "00";
            }
            n = Math.max(0, Math.min(n, 255));
            return "0123456789ABCDEF".charAt((n - n % 16) / 16) + "0123456789ABCDEF".charAt(n % 16);
        }

        return toHex(R) + toHex(G) + toHex(B);
    }

    /*
        The magic
    */

    function castRays(map, player, samples, theta) {

        var dist = [],
            pi = Math.PI,
            x = player.pos.x,
            y = player.pos.y,
            deltaX,
            deltaY,
            distX,
            distY,
            stepX,
            stepY,
            mapX,
            mapY,
            atX = Math.floor(x),
            atY = Math.floor(y),
            i;

        for (i = 0; i < samples; i = i + 1) {

            theta += pi / (3 * samples) + 2 * pi;
            theta %= 2 * pi;

            mapX = atX;
            mapY = atY;

            deltaX = 1 / Math.cos(theta);
            deltaY = 1 / Math.sin(theta);

            if (deltaX > 0) {
                stepX = 1;
                distX = (mapX + 1 - x) * deltaX;
            } else {
                stepX = -1;
                distX = (x - mapX) * (deltaX *= -1);
            }

            if (deltaY > 0) {
                stepY = 1;
                distY = (mapY + 1 - y) * deltaY;
            } else {
                stepY = -1;
                distY = (y - mapY) * (deltaY *= -1);
            }

            while (true) {
                if (distX < distY) {
                    mapX += stepX;
                    if (map[mapY][mapX]) {
                        dist[i] = distX;
                        face[i] = map[mapY][mapX];
                        bit[i] = (y + distX / deltaY * stepY) % 1 || 0;
                        break;
                    }
                    distX += deltaX;
                } else {
                    mapY += stepY;
                    if (map[mapY][mapX]) {
                        dist[i] = distY;
                        face[i] = map[mapY][mapX];
                        bit[i] = (x + distY / deltaX * stepX) % 1 || 0;
                        break;
                    }
                    distY += deltaY;
                }
            }
        }

        return dist;
    }

    /*
        Tests if the given x/y is a usable space
    */

    function testMapCollision(x, y, map) {

        var xx,
            yy,
            i,
            j;

        // If there is some error block
        if (isNaN(x) || isNaN(y)) {
            return true;
        }

        for (i = -0.1; i <= 0.1; i += 0.2) {
            xx = Math.floor(x + i);
            for (j = -0.1; j <= 0.1; j += 0.2) {
                yy = Math.floor(y + j);
                if (map[yy][xx] !== 0) {
                    return true;
                }
            }
        }

        return false;
    }

    /*
        Returns a list of map cords that are in the line of sight of the player
    */

    function getLineOfSight(player, map) {

        var i = 0,
            nextX,
            nextY,
            stack = [];

        while (i < 100) {

            nextX = Math.floor(player.pos.x + Math.cos(player.pos.r) * i);
            nextY = Math.floor(player.pos.y + Math.sin(player.pos.r) * i);

            stack[i] = {
                x: nextX,
                y: nextY
            };

            // If the map point has a value
            if (map[nextY][nextX]) {
                return stack;
            }

            i = i + 1;
        }

        return stack;
    }

    /*
        Change the code of a map point
    */

    function changeMapCode(x, y, map, code) {

        x = Math.floor(x);
        y = Math.floor(y);

        // We cannot change the boundaries of the map
        if (y <= 0 || y >= map.length - 1 || x <= 0 || x >= map[0].length - 1) {
            return;
        }

        map[y][x] = code;
    }

    /*
        The Ray Casting Engine
    */

    function Engine(canvas) {
        this.canvas = canvas;
        // Used when drawing sprites
        // this.dist = (canvas.width / 2) / Math.tan(((60 * Math.PI / 180) / 2));
        this.samples = Math.round(this.canvas.width / this.pixel);
    }

    Engine.prototype = {

        /*
            The canvas object
        */

        canvas: null,

        /*
            The ray casting resolution width in pixels
        */

        pixel: 1,

        /*
            The number of vertical lines to be rendered at the width of "pixel"
        */

        samples: null,

        /*
            Holds the state of the currently pressed keys
        */

        keysPressed: [
            false, // 0 left
            false, // 1 right
            false, // 2 forward
            false, // 3 backward
            false, // 4 strafe left
            false, // 5 strafe right
            false, // 6 remove wall
            false // 7 add wall
        ],

        /*
            Alters the state of the currently pressed keys array 
        */

        changeKeyPressed: function (keyNum, to) {

            switch (keyNum) {
            // Arrow keys
            case 37:
                this.keysPressed[0] = to;
                break; // left "rotate left"
            case 38:
                this.keysPressed[2] = to;
                break; // up "forward"
            case 39:
                this.keysPressed[1] = to;
                break; // right "rotate right"
            case 40:
                this.keysPressed[3] = to;
                break; // down "backward"
            // wasd keys
            case 65:
                this.keysPressed[4] = to;
                break; // A "strafe left"
            case 87:
                this.keysPressed[2] = to;
                break; // W "forward"
            case 68:
                this.keysPressed[5] = to;
                break; // D "strafe right"
            case 83:
                this.keysPressed[3] = to;
                break; // S "backward"
            case 49:
                this.keysPressed[6] = to;
                break; // 1 "remove wall"
            case 50:
                this.keysPressed[7] = to;
                break; // 2 "add wall"
            }
        },

        /*
            Updates the players position on the map based on currently pressed keys
        */

        move: function (player, map) {

            var key = this.keysPressed,
                change = false,
                cord,
                oldX,
                oldY,
                newX,
                newY;

            // remove wall
            if (key[6]) {
                cord = getLineOfSight(player, map).pop();
                if (cord) {
                    changeMapCode(cord.x, cord.y, map, 0);
                    change = true;
                }
            }

            // add wall
            if (key[7]) {
                cord = getLineOfSight(player, map).slice(0, -1).pop();
                if (cord) {
                    changeMapCode(cord.x, cord.y, map, 1);
                    change = true;
                }
            }

            // rotate left and right
            if (key[0]) {
                if (!key[1]) {
                    player.pos.r -= player.rotationSpeed; //left
                    change = true;
                }
            } else if (key[1]) {
                player.pos.r += player.rotationSpeed; //right
                change = true;
            }

            if (change) {
                player.pos.r += 2 * Math.PI;
                player.pos.r %= 2 * Math.PI;
                // sky._node.style.backgroundPosition = Math.floor(-player.pos.r/(2*pi)*2400)+"px 0";
            }

            if (key[4] && !key[5]) { // strafing left
                player.vel.r = -1.5;
                if (key[2] && !key[3]) {
                    player.vel.r = -1;
                }
                if (key[3] && !key[2]) {
                    player.vel.r = 0.5;
                }
                if (player.vel.y < player.strafingSpeed) {
                    player.vel.y += player.strafingSpeed / 2;
                }
            } else if (key[5] && !key[4]) { // strafing right
                player.vel.r = 1.5;
                if (key[2] && !key[3]) {
                    player.vel.r = 1;
                }
                if (key[3] && !key[2]) {
                    player.vel.r = -0.5;
                }
                if (player.vel.y < player.strafingSpeed) {
                    player.vel.y += player.strafingSpeed / 2;
                }
            } else if (player.vel.r) { // no strafing
                player.vel.y = 0;
                player.vel.r = 0;
            }

            if (key[2] && !key[3]) { // forward
                if (player.vel.y < player.movementSpeed) {
                    player.vel.y += player.movementSpeed / 4;
                }
            } else if (key[3] && !key[2]) { // backward
                if (player.vel.y > -player.movementSpeed) {
                    player.vel.y -= player.movementSpeed / 4;
                }
            } else { // stop moving
                if (player.vel.y < -0.02) {
                    player.vel.y += 0.015;
                } else if (player.vel.y > 0.02) {
                    player.vel.y -= 0.015;
                } else {
                    player.vel.y = 0;
                }
            }

            if (player.vel.y !== 0) {

                oldX = player.pos.x;
                oldY = player.pos.y;
                newX = oldX + Math.cos(player.pos.r + player.vel.r) * player.vel.y;
                newY = oldY + Math.sin(player.pos.r + player.vel.r) * player.vel.y;

                if (testMapCollision(newX, oldY, map) === false) {
                    player.pos.x = newX;
                    oldX = newX;
                    change = true;
                }
                if (testMapCollision(oldX, newY, map) === false) {
                    player.pos.y = newY;
                    change = true;
                }
            }

            return change;
        },

        /*
            Draws a single frame from the view point of the player on the map
        */

        drawView: function (canvas, player, map, samples, pixel) {

            samples = samples / pixel;

            var pi = Math.PI,
                theta = player.pos.r - pi / 6,
                dist  = castRays(map, player, samples, theta),
                stack = [],
                ii,
                i,
                sample,
                d2,
                d,
                z,
                h,
                color,
                grad;

            canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Here we order by distance
            for (ii = 0; ii < samples; ii = ii + 1) {
                theta += pi / (3 * samples);
                stack[ii] = [ii, theta, dist[ii]];
            }
            stack.sort(function (a, b) {
                return b[2] - a[2];
            });

            // Now we draw the walls from the back to the front
            for (i = 0; i < samples; i = i + 1) {

                theta = stack[i][1];

                sample = stack[i][0];

                d2 = dist[sample];
                d = d2 * Math.cos(theta - player.pos.r);

                z = 1 - player.pos.z / 1.7;
                h = canvas.height / d;

                // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) takes an image, clips it to the rectangle (sx, sy, sw, sh),
                // scales it to dimensions (dw, dh), and draws it on the canvas at coordinates (dx, dy).
                if (false) { // use textures
                    canvas.ctx.drawImage(
                        imageObj, //textures[face[sample]].img
                        bit[sample] * 63, // x
                        0, // y
                        1, // width
                        64, // height
                        sample * pixel, // x
                        (canvas.height / 2) - h * z, // y
                        pixel, // width
                        h // height
                    );
                } 

                // Add color depth to the sample
                color = Math.round(d2 * 20);
                canvas.ctx.fillStyle = "rgba(" + (color * face[sample]) + ", " + color + ", " + color + ", 0.5)";//"#" + rgbToHex(color, color, color);
                canvas.ctx.fillRect(sample * pixel, (canvas.height / 2) - h * z, pixel, h); // x, y, width, height

                // http://lodev.org/cgtutor/raycasting2.html
                // Calculate the floor using a linear gradient from start to end of line
                if (false) { // show floor
                    grad = canvas.ctx.createLinearGradient(0, h, 0, canvas.height);
                    color = (canvas.height / 2) - h * z;
                    grad.addColorStop(0, "#" + rgbToHex(color, color, color));
                    grad.addColorStop(1, "#222");
                    canvas.ctx.fillStyle = grad;
                    canvas.ctx.fillRect(sample * pixel, (((canvas.height / 2) - h * z) + h), pixel, canvas.height); // x, y, width, height
                }  
            }
        },

        drawMap: function (canvas, player, map) {

            var scale = canvas.width / map.length,
                x,
                y;

            // Draw the map
            canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (y = 0; y < map.length; y = y + 1) {
                for (x = 0; x < map[0].length; x = x + 1) {

                    if (map[y][x] > 0) {

                        if (map[y][x] === 12 || map[y][x] === 21) {
                            canvas.ctx.fillStyle = "rgb(255,255,200)";
                        } else {
                            canvas.ctx.fillStyle = "rgb(200,200,200)";
                        }

                        canvas.ctx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
            }
        },

        drawPlayerOnMap: function (canvas, player, map) {

            var scale = canvas.width / map.length,
                fFOV = 60 * Math.PI / 180,
                fViewRightX,
                fViewRightY,
                fViewLeftX,
                fViewLeftY;

            // Draw the player
            canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);

            canvas.ctx.strokeStyle = "red";

            fViewRightX = (6) * Math.cos(fFOV / 2) + player.pos.x;
            fViewRightY = (6) * Math.sin(fFOV / 2) + player.pos.y;
            fViewLeftX = (6) * Math.cos(-fFOV / 2) + player.pos.x;
            fViewLeftY = (6) * Math.sin(-fFOV / 2) + player.pos.y;

            canvas.ctx.beginPath();
            canvas.ctx.arc(player.pos.x * scale, player.pos.y * scale, scale / 5, 0, Math.PI * 2, true);
            canvas.ctx.closePath();
            canvas.ctx.fillStyle = "red";
            canvas.ctx.fill();

            canvas.ctx.save();

            canvas.ctx.fillStyle = "rgba(255,0,0,0.2)";

            canvas.ctx.translate(player.pos.x * scale, player.pos.y * scale);
            canvas.ctx.rotate(player.pos.r);
            canvas.ctx.translate(-player.pos.x * scale, -player.pos.y * scale);

            canvas.ctx.beginPath();
            canvas.ctx.moveTo(fViewRightX * scale, fViewRightY * scale);
            canvas.ctx.lineTo(player.pos.x * scale, player.pos.y * scale);
            canvas.ctx.lineTo(fViewLeftX * scale, fViewLeftY * scale);
            canvas.ctx.fill();
            canvas.ctx.stroke();

            canvas.ctx.restore();
        }
    };

    return Engine;
});