/**
 * 
 * @param {type} cell
 * @returns {undefined}
 */
define(["cell"], function(cell) {

    var manager = function(spec, my) {
        /*
         * Private Members
         */
        var that, cells, fonts;

        my = my || {};

        function measureCharHeight(fontStyle, width, height, ch) {
            
            // create a temp canvas
            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.font = fontStyle;
            ctx.clearRect(0, 0, width, height);
            ctx.fillText(ch, 0, height);

            // Get the pixel data from the canvas
            var data = ctx.getImageData(0, 0, width, height).data,
                    first = false,
                    last = false,
                    r = height,
                    c = 0;

            // Find the last line with a non-transparent pixel
            while (!last && r) {
                r--;
                for (c = 0; c < width; c++) {
                    if (data[r * width * 4 + c * 4 + 3]) {
                        last = r;
                        break;
                    }
                }
            }

            // Find the first line with a non-transparent pixel
            while (r) {
                r--;
                for (c = 0; c < width; c++) {
                    if (data[r * width * 4 + c * 4 + 3]) {
                        first = r;
                        break;
                    }
                }

                // If we've got it then return the height
                if (first !== r)
                    return last - first;
            }

            // error condition if we get here
            return 0;
        }

        function createEmptyCanvas(w, h) {
            var canvas, context;

            canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;

            context = canvas.getContext("2d");
            context.fillStyle = "black";
            context.fillRect(0, 0, w, h);
            return canvas;
        }

        function getCanvas(ch) {
            var canvas, context, metrics, fontSize, fontHeight, fontFamily;

            canvas = createEmptyCanvas(128, 256);
            context = canvas.getContext("2d");
            
            context.fillStyle = "yellow";
            fontSize = 190;
            fontFamily = "Arial";
            context.font = fontSize + "pt " + fontFamily;
            context.textAlign = "center";
            fontHeight = measureCharHeight(context.font, 2 * fontSize, 2 * fontSize, ch);
            context.fillText(ch, canvas.width / 2, (canvas.height*0.9 + fontHeight + 1) / 2, fontHeight / 2);
            
            return canvas;
            
        }

        function initFontCanvas() {
            var currentFont, i, emptyCanvas;

            fonts = [];
            fonts.push(createEmptyCanvas());

            //loop from '0' to '9'
            for (i = 48; i < 58; i++) {
                fonts.push(getCanvas(String.fromCharCode(i)));
            }

            //loop from 'A' to 'Z'
            for (i = 65; i < 91; i++) {
                fonts.push(getCanvas(String.fromCharCode(i)));
            }
        }

        function displayCells() {

        }

        /*
         * Intern init
         */
        try {
            that = {};
            initFontCanvas();
            displayCells();
        }
        catch (e) {
            throw e;
        }

        /*
         * Public interface
         */

        function updateCell(c, r, ch) {

        }
        that.updateCell = updateCell;

        /*
         * Test interface
         */
        that.testInitFontCanvas = function () {
            fonts.forEach(function(canvas) {
                canvas.style.marginRight = "1px";   
                document.body.appendChild(canvas);
            });
        };
        
        return that;

    };

    return manager;

});


