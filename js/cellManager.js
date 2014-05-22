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
        var that, cells, fontsTexture, gl;
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
            context.strokeStyle = "yellow";
            context.strokeRect(0, 0, w, h);
            return canvas;
        }

        function getFontTexture(ch, flipped) {
            var canvas, context, metrics, fontSize, fontHeight, fontFamily, texture;
            canvas = createEmptyCanvas(128, 256);
            context = canvas.getContext("2d");
            if (typeof ch !== "undefined") {
                context.fillStyle = "yellow";
                fontSize = 190;
                fontFamily = "Arial";
                context.font = fontSize + "pt " + fontFamily;
                context.textAlign = "center";
                fontHeight = measureCharHeight(context.font, 2 * fontSize, 2 * fontSize, ch);
                context.fillText(ch, canvas.width / 2, (canvas.height * 0.9 + fontHeight + 1) / 2, fontHeight / 2);
            }

            texture = gl.createTexture();
            texture.image = canvas;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            return texture;
        }

        function initFontsTexture() {
            var currentFont, i, emptyCanvas;
            fontsTexture = [];
            fontsTexture.push(getFontTexture());
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            //loop from '0' to '9'
            for (i = 48; i < 58; i++) {
                fontsTexture.push(getFontTexture(String.fromCharCode(i), true));
            }

            //loop from 'A' to 'Z'
            for (i = 65; i < 91; i++) {
                fontsTexture.push(getFontTexture(String.fromCharCode(i), true));
            }
            
        }

        function displayCells() {
            var frustDimensions, cellWidth, cellHeight, cellsBB, i, j;
            frustDimensions = spec.graphics.getFrustumDimension();
            cellWidth = frustDimensions.width * 0.25;
            if (cellWidth * spec.colCount > frustDimensions.width) {
                cellWidth = frustDimensions.width / spec.colCount;
            }

            if ((cellWidth * 2 * spec.rowCount) > frustDimensions.height) {
                cellWidth = frustDimensions.height / (2 * spec.rowCount);
            }

            cellHeight = cellWidth * 2;
            cellsBB = {
                width: spec.colCount * cellWidth,
                height: spec.rowCount * cellHeight,
                x: {
                    min: -spec.colCount * cellWidth / 2,
                    max: spec.colCount * cellWidth / 2
                },
                y: {
                    min: -spec.rowCount * cellHeight / 2,
                    max: spec.rowCount * cellHeight / 2
                }
            };
            for (i = spec.rowCount-1; i >= 0; i--) {
                for (j = 0; j < spec.colCount; j++) {
                    cells.push(cell({
                        width: cellWidth,
                        height: cellHeight,
                        pos: [
                            j * cellWidth + cellsBB.x.min + cellWidth / 2,
                            i * cellHeight + cellsBB.y.min + cellHeight / 2,
                            frustDimensions.depth / 2
                        ],
                        fontsTexture: fontsTexture,
                        graphics: spec.graphics,
                        currentFontIndex: 0
                    }));
                }
            }

        }

        /*
         * Intern init
         */
        try {
            that = {};
            cells = [];
            gl = spec.graphics.gl;
            initFontsTexture();
            displayCells();
        }
        catch (e) {
            throw e;
        }

        /*
         * Public interface
         */

        function updateCell(r,c, ch) {
            var i = r * spec.colCount + c, charCode = ch.toUpperCase().charCodeAt(0);
            if (i < cells.length) {
                if (charCode > 47 && charCode < 58) {// 0 to 10
                    cells[i].animate(charCode - 47, {angularSpeed: spec.speed}); 
                }
                else if (charCode > 64 && charCode < 91) {
                    cells[i].animate(charCode - 54, {angularSpeed: spec.speed});
                }
            }
            else {
                console.warn("No cell at row " + r + " and column " + c);
            }
        }
        that.updateCell = updateCell;
        /*
         * Test interface
         */
        that.testInitFontsTexture = function() {
            fontsTexture.forEach(function(texture) {
                texture.image.style.marginRight = "1px";
                document.body.appendChild(texture.image);
            });
        };
        return that;
    };
    return manager;
});


