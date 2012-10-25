/*globals define, window*/

"use strict";

define(function () {

    /*
        TODO: Find out what these are!!!
    */
    var bit = [];

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

    function rayCast(map, player, samples, theta) {

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
                        // face[i]=getTextureId(mapX,mapY);
                        // bit[i]=(y+distX/deltaY*stepY)%1 || 0;
                        break;
                    }
                    distX += deltaX;
                } else {
                    mapY += stepY;
                    if (map[mapY][mapX]) {
                        dist[i] = distY;
                        // face[i]=getTextureId(mapX,mapY);
                        // bit[i]=(x+distY/deltaX*stepX)%1 || 0;
                        break;
                    }
                    distY += deltaY;
                }

// if (itemFind[mapY][mapX] && !itemFind[mapY][mapX].dist) {
//     var sprite = itemFind[mapY][mapX];

//     // translate position to viewer space
//     var dx = sprite.x + 0.5 - player.pos.x;
//     var dy = sprite.y + 0.5 - player.pos.y;

//     // distance to sprite
//     sprite.dist = Math.sqrt(dx*dx + dy*dy);
//     // sprite angle relative to viewing angle
//     sprite.angle = Math.atan2(dy, dx) - player.pos.r;

//     sprites.push(sprite);
// }

// // Now order the sprites by distance from player
// // This is so when they are rendered they overlay in the correct order
// sprites.sort(function(a,b){
//     return b.dist - a.dist;
// });
            }
        }

        return dist;
    }

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
            false // 5 strafe right
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
            }
        },

        /*
            Tests if the given x/y is a usable space
        */

        testMapCollision: function (x, y, map) {

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
        },

        /*
            Updates the players position on the map based on currently pressed keys
        */

        move: function (player, map) {

            var key = this.keysPressed,
                change = false,
                oldX,
                oldY,
                newX,
                newY;

            if (key[0]) {
                if (!key[1]) {
                    player.pos.r -= 0.1; //left
                    change = true;
                }
            } else if (key[1]) {
                player.pos.r += 0.1; //right
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
                if (player.vel.y < 0.2) {
                    player.vel.y += 0.04;
                }
            } else if (key[5] && !key[4]) { // strafing right
                player.vel.r = 1.5;
                if (key[2] && !key[3]) {
                    player.vel.r = 1;
                }
                if (key[3] && !key[2]) {
                    player.vel.r = -0.5;
                }
                if (player.vel.y < 0.2) {
                    player.vel.y += 0.04;
                }
            } else if (player.vel.r) { // no strafing
                player.vel.y = 0;
                player.vel.r = 0;
            }

            if (key[2] && !key[3]) { // forward
                if (player.vel.y < 0.2) {
                    player.vel.y += 0.1;
                }
            } else if (key[3] && !key[2]) { // backward
                if (player.vel.y > -0.2) {
                    player.vel.y -= 0.1;
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

                if (this.testMapCollision(newX, oldY, map) === false) {
                    player.pos.x = newX;
                    oldX = newX;
                    change = true;
                }
                if (this.testMapCollision(oldX, newY, map) === false) {
                    player.pos.y = newY;
                    change = true;
                }
            }

            return change;
        },

        /*
            Draws a single frame from the view point of the player on the map
        */

        draw: function (canvas, player, map, samples, pixel) {

            var pi = Math.PI,
                theta = player.pos.r - pi / 6,
                dist  = rayCast(map, player, samples, theta),
                stack = [],
                ii,
                i,
                sample,
                d2,
                d,
                z,
                h,
                color;

            canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Here we order by distance
            for (ii = 0; ii < samples; ii = ii + 1) {
                theta += pi / (3 * samples);
                stack[ii] = [ii, theta, dist[ii]];
            }
            stack.sort(function (a, b) {
                return b[2] - a[2];
            });

            // Now we draw from the back to the front
            for (i = 0; i < samples; i = i + 1) {

                theta = stack[i][1];

                sample = stack[i][0];

                d2 = dist[sample];
                d = d2 * Math.cos(theta - player.pos.r);

                z = 1 - player.pos.z / 2;
                h = canvas.height / d;

// drawSprites( d2 );

// drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) takes an image, clips it to the rectangle (sx, sy, sw, sh),
// scales it to dimensions (dw, dh), and draws it on the canvas at coordinates (dx, dy).
// canvas.ctx.drawImage(
//     textures[face[sample]].img
//     bit[sample] * 63, // x
//     0, // y
//     1, // width
//     64, // height
//     sample * pixel, // x
//     (canvas.height/2) - h * z, // y
//     pixel, // width
//     h // height
// );
                color = Math.round(d2 * 10);
                canvas.ctx.fillStyle = "#" + rgbToHex(color, color, color);
                canvas.ctx.fillRect(sample * pixel, (canvas.height / 2) - h * z, pixel, h);
            }
        }
    };

    return Engine;
});