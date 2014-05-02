/**
 * 
 * @returns {undefined}
 */
define(["text!../shaders/fsFlipflap.glsl", "text!../shaders/vsFlipflap.glsl", "glmatrix"], function(fs, vs, glMatrix) {

    /**
     * 
     * @param {Object} spec
     * @param {type} my
     * @returns {undefined}
     */
    var cell = function(spec, my) {

        /*
         * Private members 
         */
        var that = {}, shaderProgram, vsShader, fsShader, vertexPositionBuffer, gl, lastTime, xRot, xRotPrev,
                graphics, PI2, halfPI, pages, completeTurn, halfTurn;



        my = my || {};

        function compileShader(shader, str) {
            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw gl.getShaderInfoLog(shader);
            }
        }

        function initShaders() {

            vsShader = gl.createShader(gl.VERTEX_SHADER);
            compileShader(vsShader, vs);
            fsShader = gl.createShader(gl.FRAGMENT_SHADER);
            compileShader(fsShader, fs);
            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vsShader);
            gl.attachShader(shaderProgram, fsShader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                throw "Shader linking failed, could not initialise shaders";
            }

            gl.useProgram(shaderProgram);
            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

            shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
            gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

        }

        function initBuffers() {
            var vertices, i, j;
            vertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            vertices = [
                1.0, 1.3, 0.0,
                -1.0, 1.3, 0.0,
                1.0, -1.0, 0.0,
                -1.0, -1.0, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            vertexPositionBuffer.itemSize = 3;
            vertexPositionBuffer.numItems = 4;

            j = 0;
            for (var pos in pages) {
                if (pages.hasOwnProperty(pos)) {
                    pages[pos].buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, pages[pos].buffer);
                    pages[pos].colors = [];
                    for (i = 0; i < vertexPositionBuffer.numItems; i++) {
                        pages[pos].colors = pages[pos].colors.concat([0., 0., 0., 1.0]);
                        pages[pos].colors[i * 4 + j] = 1.0;
                    }
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pages[pos].colors), gl.STATIC_DRAW);
                    pages[pos].buffer.itemSize = 4;
                    pages[pos].buffer.numItems = 4;
                    j++;
                }
            }
        }

        function drawTop() {
            var colorBuffer = pages.top.buffer, vCol;

            graphics.mvMatrixPush();
            graphics.mvMatrixToIdentity();
            graphics.mvTranslate([0., 1., -7.]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            if (completeTurn) {
                pages.top.previousCol = pages.top.colors.slice(0);
                pages.top.colors.splice(0);
                vCol = [Math.random(), Math.random(), Math.random(), 1.0];
                for (var i = 0; i < colorBuffer.numItems; i++) {
                    pages.top.colors = pages.top.colors.concat(vCol);
                }
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pages.top.colors), gl.STATIC_DRAW);
            }
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            graphics.mvMatrixPop();
        }

        function drawMoving() {
            var colorBuffer = pages.moving.buffer, vCol;
            graphics.mvMatrixPush();
            graphics.mvMatrixToIdentity();
            graphics.mvTranslate([0., 0., -7.]);
            graphics.mvRotate([1., 0., 0.], xRot);
            graphics.mvTranslate([0., 1., 0.]);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

            if (completeTurn) {
                pages.moving.previousCol = pages.moving.colors.slice(0);
                pages.moving.colors = pages.top.previousCol;
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pages.moving.colors), gl.STATIC_DRAW);
            }

            if (halfTurn) {
                pages.moving.previousCol = pages.moving.colors.slice(0);
                pages.moving.colors.splice(0);
                var vCol = [Math.random(), Math.random(), Math.random(), 1.0];
                for (var i = 0; i < colorBuffer.numItems; i++) {
                    pages.moving.colors = pages.moving.colors.concat(vCol);
                }
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pages.moving.colors), gl.STATIC_DRAW);
            }

            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);

            graphics.mvMatrixPop();
        }

        function drawBottom() {
            var colorBuffer = pages.bottom.buffer;
            graphics.mvMatrixPush();
            graphics.mvMatrixToIdentity();
            graphics.mvTranslate([0., -1.3, -7.]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

            if (completeTurn) {
                pages.bottom.colors = pages.moving.previousCol;
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pages.bottom.colors), gl.STATIC_DRAW);
            }

            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            graphics.mvMatrixPop();
        }

        function draw() {
            drawTop();
            drawMoving();
            drawBottom();
        }

        function update() {
            var timeNow = new Date().getTime();
            if (lastTime !== 0) {
                var elapsed = timeNow - lastTime;
                xRot = (xRot + (1.3 * elapsed) / 1000.0);
                halfTurn = false;
                completeTurn = false;
                if (xRot > Math.PI) {
                    completeTurn = true;
                    xRot = 0.1;
                    xRotPrev = 0.0;
                }
                else if (xRot > halfPI && xRotPrev < halfPI) {
                    halfTurn = true;
                    xRotPrev = xRot;
                }
            }
            lastTime = timeNow;
        }

        /*
         * Intern init
         */
        try {
            graphics = spec.graphics;
            gl = graphics.gl;
            lastTime = 0;
            xRot = 0;
            xRotPrev = 0;
            PI2 = Math.PI * 2;
            halfPI = Math.PI * 0.5;

            pages = {top: {},
                moving: {},
                bottom: {}
            };

            initShaders(); //Shaders intialisation
            initBuffers(); //Buffers initialisation
            graphics.addDraw(draw);
            graphics.addUpdate(update);

        }
        catch (e) {
            throw e;
        }

        /*
         * Public interface
         */

        return that;

    };

    return cell;
});





