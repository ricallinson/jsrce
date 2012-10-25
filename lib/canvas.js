/*globals define, window, document, navigator*/

"use strict";

define(function () {

    console.log("Starting canvas setup");

    function Canvas(id, width, height) {

        this.width = width || this.width;
        this.height = height || this.height;

        // the proportion of width to height
        this.RATIO = this.width / this.height;
        // these will change when the screen is resize
        this.currentWidth = this.width;
        this.currentHeight = this.height;
        // this is our canvas element
        this.element = document.getElementById(id);
        // it's important to set this
        // otherwise the browser will
        // default to 320x200
        this.element.width = this.width;
        this.element.height = this.height;
        // the canvas context allows us to 
        // interact with the canvas api
        this.ctx = this.element.getContext('2d');
        // we need to sniff out android & ios
        // so we can hide the address bar in
        // our resize function
        this.ua = navigator.userAgent.toLowerCase();
        this.android = this.ua.indexOf('android') > -1 ? true : false;
        this.ios = (this.ua.indexOf('iphone') > -1 || this.ua.indexOf('ipad') > -1) ? true : false;

        // We're ready to resize so listen for a resize event
        // window.addEventListener('resize', this.resize, false);
        // this.resize();

        console.log("Canvas setup complete");
    }

    Canvas.prototype = {
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
        ios: null,

        resize: function () {

            this.currentHeight = window.innerHeight;
            // resize the width in proportion
            // to the new height
            this.currentWidth = this.currentHeight * this.RATIO;

            // this will create some extra space on the
            // page, allowing us to scroll pass
            // the address bar, and thus hide it.
            if (this.android || this.ios) {
                document.body.style.height = (window.innerHeight + 50) + 'px';
            }

            // set the new canvas style width & height
            // note: our canvas is still 320x480 but
            // we're essentially scaling it with CSS
            this.element.style.width = this.currentWidth + 'px';
            this.element.style.height = this.currentHeight + 'px';

            // the amount by which the css resized canvas
            // is different to the actual (480x320) size.
            this.scale = this.currentWidth / this.width;
            // position of canvas in relation to
            // the screen
            this.offset.top = this.element.offsetTop;
            this.offset.left = this.element.offsetLeft;

            // we use a timeout here as some mobile
            // browsers won't scroll if there is not
            // a small delay
            window.setTimeout(function () {
                window.scrollTo(0, 1);
            }, 1);
        }
    };

    return Canvas;
});