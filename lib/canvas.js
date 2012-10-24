/*globals define, window, document, navigator*/

"use strict";

define(function () {

    console.log("Starting canvas setup");

    var canvas = {
            // set up some inital values
            width: 480,
            height:  320,
            scale:  1,
            // the position of the canvas
            // in relation to the screen
            offset: {top: 0, left: 0},
            // we'll set the rest of these
            // in the init function
            RATIO:  null,
            currentWidth: null,
            currentHeight: null,
            element: null,
            ctx: null,
            ua: null,
            android: null,
            ios: null
        };

    canvas.resize = function () {

        canvas.currentHeight = window.innerHeight;
        // resize the width in proportion
        // to the new height
        canvas.currentWidth = canvas.currentHeight * canvas.RATIO;

        // this will create some extra space on the
        // page, allowing us to scroll pass
        // the address bar, and thus hide it.
        if (canvas.android || canvas.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }

        // set the new canvas style width & height
        // note: our canvas is still 320x480 but
        // we're essentially scaling it with CSS
        canvas.element.style.width = canvas.currentWidth + 'px';
        canvas.element.style.height = canvas.currentHeight + 'px';

        // the amount by which the css resized canvas
        // is different to the actual (480x320) size.
        canvas.scale = canvas.currentWidth / canvas.width;
        // position of canvas in relation to
        // the screen
        canvas.offset.top = canvas.element.offsetTop;
        canvas.offset.left = canvas.element.offsetLeft;

        // we use a timeout here as some mobile
        // browsers won't scroll if there is not
        // a small delay
        window.setTimeout(function () {
            window.scrollTo(0, 1);
        }, 1);
    };

    // the proportion of width to height
    canvas.RATIO = canvas.width / canvas.height;
    // these will change when the screen is resize
    canvas.currentWidth = canvas.width;
    canvas.currentHeight = canvas.height;
    // this is our canvas element
    canvas.element = document.getElementsByTagName('canvas')[0];
    // it's important to set this
    // otherwise the browser will
    // default to 320x200
    canvas.element.width = canvas.width;
    canvas.element.height = canvas.height;
    // the canvas context allows us to 
    // interact with the canvas api
    canvas.ctx = canvas.element.getContext('2d');
    // we need to sniff out android & ios
    // so we can hide the address bar in
    // our resize function
    canvas.ua = navigator.userAgent.toLowerCase();
    canvas.android = canvas.ua.indexOf('android') > -1 ? true : false;
    canvas.ios = (canvas.ua.indexOf('iphone') > -1 || canvas.ua.indexOf('ipad') > -1) ? true : false;

    // // listen for clicks
    // window.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     canvas.Input.set(e);
    // }, false);

    // // listen for touches
    // window.addEventListener('touchstart', function(e) {
    //     e.preventDefault();
    //     // the event object has an array
    //     // called touches, we just want
    //     // the first touch
    //     canvas.Input.set(e.touches[0]);
    // }, false);

    // window.addEventListener('touchmove', function (e) {
    //     // we're not interested in this
    //     // but prevent default behaviour
    //     // so the screen doesn't scroll
    //     // or zoom
    //     e.preventDefault();
    // }, false);

    // window.addEventListener('touchend', function (e) {
    //     // as above
    //     e.preventDefault();
    // }, false);

    // Listen for a resize event
    window.addEventListener('resize', canvas.resize, false);

    // we're ready to resize
    canvas.resize();

    console.log("Canvas setup complete");

    return canvas;
});