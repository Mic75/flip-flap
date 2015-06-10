/**
 * 
 * @param {type} cell
 * @returns {undefined}
 */
define(["text!../shaders/fsTexture.glsl",
        "text!../shaders/vsTexture.glsl",
        "text!../shaders/fsColor.glsl",
        "text!../shaders/vsColor.glsl", 
        "cell"], function(fsTexture, vsTexture, fsColor, vsColor, cell) {

    var manager = function(spec, my) {
        /*
         * Private Members
         */
        var that, cells, fontsTexture, gl, texShader, colShader, cellPageBuffers, frustDimensions, cellWidth, 
            cellHeight, wProportion, hProportion, speed;
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
            var i;
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

        function compileShader(shader, str) {
            gl.shaderSource(shader, str);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw gl.getShaderInfoLog(shader);
            }
        }

        function initTextureShaders() {
            var vsShader, fsShader;

            vsShader = gl.createShader(gl.VERTEX_SHADER);
            compileShader(vsShader, vsTexture);

            fsShader = gl.createShader(gl.FRAGMENT_SHADER);
            compileShader(fsShader, fsTexture);

            texShader = gl.createProgram();
            gl.attachShader(texShader, vsShader);
            gl.attachShader(texShader, fsShader);
            gl.linkProgram(texShader);
            if (!gl.getProgramParameter(texShader, gl.LINK_STATUS)) {

                throw "Shader linking failed, could not initialise shaders\n" + gl.getProgramInfoLog(texShader);
            }

            gl.useProgram(texShader);
            texShader.vertexPositionAttribute = gl.getAttribLocation(texShader, "aVertexPosition");
            gl.enableVertexAttribArray(texShader.vertexPositionAttribute);

            texShader.vertexUVsAttribute = gl.getAttribLocation(texShader, "aUV");
            gl.enableVertexAttribArray(texShader.vertexUVsAttribute);

            texShader.samplerUniform = gl.getUniformLocation(texShader, "uSampler");
            texShader.pMatrixUniform = gl.getUniformLocation(texShader, "uPMatrix");
            texShader.mvMatrixUniform = gl.getUniformLocation(texShader, "uMVMatrix");
        }
        
        function initCellPageBuffers() {
            var rightX, topY, uvs, vertices;
            
            cellPageBuffers = {};
            cellPageBuffers.vertexPosition = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cellPageBuffers.vertexPosition);
            cellPageBuffers.inBetweenSpace = cellHeight * 0.01;
                    
            rightX = cellWidth * (wProportion) / 2;
            //divided by 4, because a page height is half a cell height
            topY = (cellHeight * hProportion - cellPageBuffers.inBetweenSpace) / 4; 
            //used in cell to place the geom at the good place
            cellPageBuffers.vTranslation = (cellHeight * hProportion + cellPageBuffers.inBetweenSpace) / 4;
                    
            vertices = [
                rightX, topY, 0,
                -rightX, topY, 0,
                rightX, -topY, 0,
                -rightX, -topY, 0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            cellPageBuffers.vertexPosition.itemSize = 3;
            cellPageBuffers.vertexPosition.numItems = 4;
            
            // buffer for the uvs coordinate of the texture applied on the top page of a cell
            cellPageBuffers.topUVBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cellPageBuffers.topUVBuffer);
            uvs = [
                1.0, 1.0,
                0.0, 1.0,
                1.0, 0.5,
                0.0, 0.5
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            cellPageBuffers.topUVBuffer.itemSize = 2;
            cellPageBuffers.topUVBuffer.numItems = 4;

            // buffer for the uvs coordinate of the texture applied on the bottom page of a cell
            cellPageBuffers.bottomUVBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cellPageBuffers.bottomUVBuffer);
            uvs.splice(0);
            uvs = [
                1.0, 0.5,
                0.0, 0.5,
                1.0, 0.0,
                0.0, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            cellPageBuffers.bottomUVBuffer.itemSize = 2;
            cellPageBuffers.bottomUVBuffer.numItems = 4;

            // buffer for the uvs coordinate of the texture applied on the moving page when at bottom
            cellPageBuffers.bottomInverUVBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cellPageBuffers.bottomInverUVBuffer);
            uvs.splice(0);
            uvs = [
                1.0, 0.0,
                0.0, 0.0,
                1.0, 0.5,
                0.0, 0.5
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            cellPageBuffers.bottomInverUVBuffer.itemSize = 2;
            cellPageBuffers.bottomInverUVBuffer.numItems = 4;
        }
        
        function displayCells() {
            var cellsBB, i, j;
            
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
            for (i = spec.rowCount - 1; i >= 0; i--) {
                for (j = 0; j < spec.colCount; j++) {
                    cells.push(cell({
                        texShader : texShader,
                        colShader : colShader,
                        cellPageBuf: cellPageBuffers,
                        pos: [
                            j * cellWidth + cellsBB.x.min + cellWidth / 2,
                            i * cellHeight + cellsBB.y.min + cellHeight / 2,
                            frustDimensions.depth / 2
                        ],
                        fontsTexture: fontsTexture,
                        graphics: spec.graphics,
                        currentFontIndex: 0,
                        name: "Cell" + (spec.rowCount - i - 1) + "," + j
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
            speed = spec.speed || 0.5;
            frustDimensions = spec.graphics.getFrustumDimension();
            
            //cell dimensions
            cellWidth = frustDimensions.width * 0.25;
            
            if (cellWidth * spec.colCount > frustDimensions.width) {
                cellWidth = frustDimensions.width / spec.colCount;
            }

            if ((cellWidth * 2 * spec.rowCount) > frustDimensions.height) {
                cellWidth = frustDimensions.height / (2 * spec.rowCount);
            }
            
            cellHeight = cellWidth * 2;
            wProportion = 0.9;
            hProportion = 1 - (cellWidth * (1 - wProportion)) / cellHeight;
            
            initFontsTexture();
            initCellPageBuffers();
            initTextureShaders();
            displayCells();
        }
        catch (e) {
            throw e;
        }

        /*
         * Public interface
         */
        
        function updateCell(r, c, ch, options) {
            var i = r * spec.colCount + c, charCode = ch.toUpperCase().charCodeAt(0),
                options = options || {};
                options.angularSpeed = speed;
            
          if (i < cells.length) {
                if (charCode > 47 && charCode < 58) {// 0 to 10
                    cells[i].animate(charCode - 47, options);
                }
                else if (charCode > 64 && charCode < 91) {
                    cells[i].animate(charCode - 54, options);
                }
            }
            else {
                console.warn("No cell at row " + r + " and column " + c);
            }
        }
        that.updateCell = updateCell;
        
        function setSpeed(s){
          var i = null, count = cells.length;
          speed = s;
          for (i=0; i < count ; i++){
            cells[i].setSpeed(s);
          }
        }
        that.setSpeed = setSpeed;
        
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


