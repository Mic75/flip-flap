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
        var that = {}, shaderProgram, vsShader, fsShader, vertexPositionBuffer, topUVBuffer, bottomUVBuffer,
                gl, lastTime, xRot, xRotPrev, graphics, PI2, halfPI, pages, completeTurn, halfTurn, currentCharIndex,
                characters, currentCharTex, nextCharTex, vertices;



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

            shaderProgram.vertexUVsAttribute = gl.getAttribLocation(shaderProgram, "aUV");
            gl.enableVertexAttribArray(shaderProgram.vertexUVsAttribute);


            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        }

        function initTexture() {

            //A to Z
            characters = "";
            for (var i = 65; i < 91; i++) {
                characters += String.fromCharCode(i);
            }

            currentCharTex = gl.createTexture();
            currentCharTex.image = getCharTex(characters[currentCharIndex]);
            gl.bindTexture(gl.TEXTURE_2D, currentCharTex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, currentCharTex.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            nextCharTex = gl.createTexture();
            nextCharTex.image = getCharTex(characters[currentCharIndex + 1]);
            gl.bindTexture(gl.TEXTURE_2D, nextCharTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nextCharTex.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        function initBuffers() {
            var uvs, sceneDimensions, rightX, topY, halfDepth;
            vertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            sceneDimensions = graphics.getFrustumDim();
            rightX = sceneDimensions.width*0.25/2;
            topY = sceneDimensions.height*0.25/2;
            halfDepth = sceneDimensions.depth/2;
            vertices = [
                rightX, topY , -halfDepth,
               -rightX, topY , -halfDepth,
                rightX, -topY, -halfDepth,
               -rightX, -topY, -halfDepth
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            vertexPositionBuffer.itemSize = 3;
            vertexPositionBuffer.numItems = 4;

            topUVBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, topUVBuffer);
            uvs = [
                1.0, 1.0,
                0.0, 1.0,
                1.0, 0.5,
                0.0, 0.5
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            topUVBuffer.itemSize = 2;
            topUVBuffer.numItems = 4;

            bottomUVBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bottomUVBuffer);
            uvs.splice(0);
            uvs = [
                1.0, 0.5,
                0.0, 0.5,
                1.0, 0.0,
                0.0, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            bottomUVBuffer.itemSize = 2;
            bottomUVBuffer.numItems = 4;

        }

        function getCharTex(character) {
            var canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            var context = canvas.getContext("2d");
            context.fillStyle = "#555555";
            context.fillRect(0, 0, 256, 256);
            context.font = "256pt Arial";
//            context.textAlign = "right";
//            context.textBaseline = "middle";
            context.fillStyle = "rgba(256,256,256,1)";
            context.fillText(character, 0, 256);
            return canvas;
        }

        function drawTop() {
            var colorBuffer = pages.top.buffer, vCol;

            graphics.mvMatrixPush();
            graphics.mvMatrixToIdentity();
            graphics.mvTranslate([0., graphics.getFrustumDim().width*0.125, 0.]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, topUVBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, topUVBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, nextCharTex);
            gl.uniform1i(shaderProgram.samplerUniform, 0);

            graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            graphics.mvMatrixPop();
        }

        function drawMoving() {
            var colorBuffer = pages.moving.buffer, vCol;
            graphics.mvMatrixPush();
            graphics.mvMatrixToIdentity();
//            graphics.mvTranslate([0., 0., -.02]);
            graphics.mvRotate([1., 0., 0.], xRot);
//            graphics.mvTranslate([0., graphics.getFrustumDim().width*0.125, 0.]);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);


            gl.activeTexture(gl.TEXTURE0);
            if (xRot < halfPI) {
                gl.bindTexture(gl.TEXTURE_2D, currentCharTex);
                gl.uniform1i(shaderProgram.samplerUniform, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, topUVBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, topUVBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, nextCharTex);
                gl.uniform1i(shaderProgram.samplerUniform, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, bottomUVBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, bottomUVBuffer.itemSize, gl.FLOAT, false, 0, 0);
                graphics.mvRotate([1., 0., 0.], Math.PI);
            }

            graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);

            graphics.mvMatrixPop();
        }

        function drawBottom() {
            var colorBuffer = pages.bottom.buffer;
            graphics.mvMatrixPush();
            graphics.mvMatrixToIdentity();
            graphics.mvTranslate([0., -graphics.getFrustumDim().width*0.125, 0.]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currentCharTex);
            gl.uniform1i(shaderProgram.samplerUniform, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bottomUVBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, bottomUVBuffer.itemSize, gl.FLOAT, false, 0, 0);

            graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            graphics.mvMatrixPop();
        }

        function draw() {
//            drawTop();
            drawMoving();
//            drawBottom();
        }

        function updateTex() {
            currentCharTex.image = getCharTex(characters[currentCharIndex]);
            gl.bindTexture(gl.TEXTURE_2D, currentCharTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, currentCharTex.image);

            nextCharTex.image = getCharTex(characters[currentCharIndex + 1]);
            gl.bindTexture(gl.TEXTURE_2D, nextCharTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nextCharTex.image);
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
                    currentCharIndex = (currentCharIndex + 1) % (characters.length - 1);
                    updateTex();
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
            xRot = 0.1;
            xRotPrev = 0;
            PI2 = Math.PI * 2;
            halfPI = Math.PI * 0.5;
            currentCharIndex = 0;
            pages = {top: {},
                moving: {},
                bottom: {}
            };

            initShaders(); //Shaders intialisation
            initBuffers(); //Buffers initialisation
            initTexture();
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





