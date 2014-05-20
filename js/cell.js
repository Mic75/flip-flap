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
                gl, lastTime, xRot, xRotPrev, PI2, halfPI, pages, completeTurn, halfTurn, currentCharIndex,
                characters, currentCharTex, nextCharTex, vertices, currentFontIndex, wantedFontIndex;
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

        function initBuffers() {
            var uvs, rightX, leftX, topY, bottomY;
            
            // buffer of vertex position for the page of a cell
            vertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            rightX = spec.pos[0] + spec.width/2;
            leftX = spec.pos[0] - spec.width/2;
            topY = spec.pos[1] + spec.height/4; //divided by 4, because a page height is half a cell height
            bottomY = spec.pos[1] - spec.height/4;
            vertices = [
                rightX, topY , -spec.pos[2],
               leftX, topY , -spec.pos[2],
                rightX, bottomY, -spec.pos[2],
               leftX, bottomY, -spec.pos[2]
            ];
            console.log(vertices);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            vertexPositionBuffer.itemSize = 3;
            vertexPositionBuffer.numItems = 4;
            
            // buffer for the uvs coordinate of the texture applied on the top page of a cell
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
            
            // buffer for the uvs coordinate of the texture applied on the bottom page of a cell
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
            context.fillStyle = "#000000";
            context.fillRect(0, 0, 256, 256);
            context.font = "128pt Arial";
            context.textAlign = "right";
//            context.textBaseline = "middle";
            context.fillStyle = "yellow";
            context.fillText(character, 0, 256);
            return canvas;
        }

        function drawTop() {
            
            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([0., spec.height/4, 0.]);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, topUVBuffer);            
            gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, topUVBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.activeTexture(gl.TEXTURE0);            
            gl.bindTexture(gl.TEXTURE_2D, spec.fontsTexture[currentFontIndex]);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            
            spec.graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            spec.graphics.mvMatrixPop();
        }

        function drawMoving() {
            var colorBuffer = pages.moving.buffer, vCol;
            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([0., 0., -graphics.getFrustumDim().depth/2]);
            spec.graphics.mvRotate([1., 0., 0.], xRot);
            spec.graphics.mvTranslate([0., graphics.getFrustumDim().height*0.125, graphics.getFrustumDim().depth/2]);
//            graphics.mvTranslate([0., graphics.getFrustumDim().width*0.125, 0.]);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);
//            if (xRot < halfPI) {
            gl.bindTexture(gl.TEXTURE_2D, currentCharTex);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, topUVBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, topUVBuffer.itemSize, gl.FLOAT, false, 0, 0);
//            }
//            else {
//                gl.bindTexture(gl.TEXTURE_2D, nextCharTex);
//                gl.uniform1i(shaderProgram.samplerUniform, 0);
//                gl.bindBuffer(gl.ARRAY_BUFFER, bottomUVBuffer);
//                gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, bottomUVBuffer.itemSize, gl.FLOAT, false, 0, 0);
//                graphics.mvRotate([1., 0., 0.], Math.PI);
//            }

            spec.graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            spec.graphics.mvMatrixPop();
        }

        function drawBottom() {
            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([0., -spec.height/4, 0.]);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, spec.fontsTexture[currentFontIndex]);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, bottomUVBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexUVsAttribute, bottomUVBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            spec.graphics.applyTransforms(shaderProgram);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            spec.graphics.mvMatrixPop();
        }

        function draw() {
            gl.useProgram(shaderProgram);
            drawTop();
//            drawMoving();
            drawBottom();
        }

        function updateTex() {
            currentCharTex.image = getCharTex(characters[currentCharIndex]);
            gl.bindTexture(gl.TEXTURE_2D, currentCharTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, currentCharTex.image);
            nextCharTex.image = getCharTex(characters[currentCharIndex + 1]);
            gl.bindTexture(gl.TEXTURE_2D, nextCharTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nextCharTex.image);
        }

        function updateDebug() {
            var timeNow = new Date().getTime();
            if (lastTime !== 0) {
                var elapsed = timeNow - lastTime;
                xRot = (xRot + (1.8 * elapsed) / 1000.0) % PI2;
            }
            lastTime = timeNow;
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
            
            // specs
            spec.width = spec.width || spec.graphics.getFrustumDim().width*0.25;
            spec.height = spec.height || spec.width * 2;
            spec.pos = spec.pos || [0., 0., spec.graphics.getFrustumDim().depth/2];
            wantedFontIndex = currentFontIndex = spec.currentFontIndex || 0;
            gl = spec.graphics.gl;
            
            // intern vars and states
            lastTime = 0;
            xRot = 0.1;
            xRotPrev = 0;
            PI2 = Math.PI * 2;
            halfPI = Math.PI * 0.5;
            currentCharIndex = 0;
            pages = {
                top: {},
                moving: {},
                bottom: {}
            };
            
            //init functions
            initShaders(); //Shaders intialisation
            initBuffers();   //Buffers initialisation
            
            //render loop callbacks
            spec.graphics.addDraw(draw);
            spec.graphics.addUpdate(updateDebug);
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





