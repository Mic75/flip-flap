/**
 * 
 * @returns {undefined}
 */
define([
    "text!../shaders/fsTexture.glsl",
    "text!../shaders/vsTexture.glsl",
    "text!../shaders/fsColor.glsl",
    "text!../shaders/vsColor.glsl",
    "glmatrix"], function(fsTexture, vsTexture, fsColor, vsColor, glMatrix) {

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
        var that = {}, texShader, vsTexShader, fsTexShader, colShader, vsColShader, fsColShader,vertexPositionBuffer, 
                topUVBuffer, bottomUVBuffer, bottomInverUVBuffer, gl, lastTime, xRot, xRotPrev, PI2, halfPI, 
                completeTurn, halfTurn, wProportion, hProportion, vertices, currentFontIndex, 
                wantedFontIndex, angularSpeed, inBetweenSpace, vertexPositionBuffer2, colorFrameBuffer;

        my = my || {};

        function compileShader(shader, str) {
            gl.shaderSource(shader, str);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw gl.getShaderInfoLog(shader);
            }
        }

        function initTextureShaders() {

            vsTexShader = gl.createShader(gl.VERTEX_SHADER);
            compileShader(vsTexShader, vsTexture);
            fsTexShader = gl.createShader(gl.FRAGMENT_SHADER);
            compileShader(fsTexShader, fsTexture);
            texShader = gl.createProgram();
            gl.attachShader(texShader, vsTexShader);
            gl.attachShader(texShader, fsTexShader);
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

        function initColorShaders() {
            vsColShader = gl.createShader(gl.VERTEX_SHADER);
            compileShader(vsColShader, vsColor);
            fsColShader = gl.createShader(gl.FRAGMENT_SHADER);
            compileShader(fsColShader, fsColor);
            colShader = gl.createProgram();
            gl.attachShader(colShader, vsColShader);
            gl.attachShader(colShader, fsColShader);
            gl.linkProgram(colShader);
            if (!gl.getProgramParameter(colShader, gl.LINK_STATUS)) {
                throw "Shader linking failed, could not initialise shaders\n" + gl.getProgramInfoLog(colShader);
            }

            gl.useProgram(colShader);
            colShader.vertexPositionAttribute = gl.getAttribLocation(colShader, "aVertexPosition");
            gl.enableVertexAttribArray(colShader.vertexPositionAttribute);

            colShader.vertexColorsAttribute = gl.getAttribLocation(colShader, "aVertexColor");
            gl.enableVertexAttribArray(texShader.vertexColorsAttribute);

            colShader.pMatrixUniform = gl.getUniformLocation(colShader, "uPMatrix");
            colShader.mvMatrixUniform = gl.getUniformLocation(colShader, "uMVMatrix");
        }

        function initBuffers() {
            var uvs, rightX, topY, halfWidth, halfHeight, frameThick, colors;

            // buffer of vertex position for the page of a cell
            vertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            inBetweenSpace = spec.height * 0.01;
            rightX = spec.width * (wProportion) / 2;
            topY = (spec.height * hProportion - inBetweenSpace) / 4; //divided by 4, because a page height is half a cell height
            vertices = [
                rightX, topY, 0,
                -rightX, topY, 0,
                rightX, -topY, 0,
                -rightX, -topY, 0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            vertexPositionBuffer.itemSize = 3;
            vertexPositionBuffer.numItems = 4;

            vertexPositionBuffer2 = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer2);
            
            halfWidth = spec.width / 2;
            halfHeight = spec.height / 2;
            frameThick = spec.width/2 * (1 - wProportion);
            
            vertices = [
                -halfWidth, halfHeight, 0,
                -halfWidth + frameThick, halfHeight - frameThick, 0,
                0, halfHeight, 0,
                halfWidth - frameThick, halfHeight - frameThick, 0,
                halfWidth, halfHeight, 0,
                halfWidth - frameThick, 0, 0,
                halfWidth, -halfHeight, 0,
                halfWidth - frameThick, -halfHeight + frameThick, 0,
                -halfWidth, -halfHeight, 0,
                -halfWidth + frameThick, -halfHeight + frameThick, 0,
                -halfWidth, 0, 0,
                -halfWidth + frameThick, halfHeight - frameThick, 0,
                -halfWidth, halfHeight, 0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            vertexPositionBuffer2.itemSize = 3;
            vertexPositionBuffer2.numItems = 13;

            colorFrameBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorFrameBuffer);

            colors = [];

            for (var i = 0; i < vertexPositionBuffer2.numItems; i++) {
                colors = colors.concat([1., 0., 0., 1.]);
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            colorFrameBuffer.itemSize = 4;
            colorFrameBuffer.numItems = vertexPositionBuffer2.numItems;

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

            // buffer for the uvs coordinate of the texture applied on the moving page when at bottom
            bottomInverUVBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bottomInverUVBuffer);
            uvs.splice(0);
            uvs = [
                1.0, 0.0,
                0.0, 0.0,
                1.0, 0.5,
                0.0, 0.5
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
            bottomInverUVBuffer.itemSize = 2;
            bottomInverUVBuffer.numItems = 4;

        }

        function drawTop() {

            var fontIndex = currentFontIndex === wantedFontIndex ? currentFontIndex : (currentFontIndex + 1) % spec.fontsTexture.length;

            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([spec.pos[0], spec.pos[1] + (spec.height * hProportion + inBetweenSpace) / 4, -spec.pos[2]]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(texShader.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, topUVBuffer);
            gl.vertexAttribPointer(texShader.vertexUVsAttribute, topUVBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, spec.fontsTexture[fontIndex]);
            gl.uniform1i(texShader.samplerUniform, 0);

            spec.graphics.applyTransforms(texShader);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            spec.graphics.mvMatrixPop();
        }

        function drawMoving() {
            
            var nextFontIndex = (currentFontIndex + 1) % spec.fontsTexture.length;

            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();

            spec.graphics.mvTranslate([spec.pos[0], spec.pos[1], -spec.pos[2]]);
            spec.graphics.mvRotate([1., 0., 0.], xRot);
            spec.graphics.mvTranslate([0, (spec.height * hProportion + inBetweenSpace) / 4, 0]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(texShader.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);

            if (xRot < halfPI) {

                gl.bindTexture(gl.TEXTURE_2D, spec.fontsTexture[currentFontIndex]);
                gl.uniform1i(texShader.samplerUniform, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, topUVBuffer);
                gl.vertexAttribPointer(texShader.vertexUVsAttribute, topUVBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }
            else {

                gl.bindTexture(gl.TEXTURE_2D, spec.fontsTexture[nextFontIndex]);
                gl.uniform1i(texShader.samplerUniform, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, bottomInverUVBuffer);
                gl.vertexAttribPointer(texShader.vertexUVsAttribute, bottomInverUVBuffer.itemSize, gl.FLOAT, false, 0, 0);

            }

            spec.graphics.applyTransforms(texShader);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            spec.graphics.mvMatrixPop();
        }

        function drawBottom() {
            
            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([spec.pos[0], spec.pos[1] - (spec.height * hProportion + inBetweenSpace) / 4, -spec.pos[2]]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(texShader.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, spec.fontsTexture[currentFontIndex]);
            gl.uniform1i(texShader.samplerUniform, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, bottomUVBuffer);
            gl.vertexAttribPointer(texShader.vertexUVsAttribute, bottomUVBuffer.itemSize, gl.FLOAT, false, 0, 0);

            spec.graphics.applyTransforms(texShader);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);
            spec.graphics.mvMatrixPop();
        }

        function drawFrame() {
            gl.useProgram(colShader);
            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([spec.pos[0], spec.pos[1], -spec.pos[2]]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer2);
            gl.vertexAttribPointer(colShader.vertexPositionAttribute, vertexPositionBuffer2.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorFrameBuffer);
            gl.vertexAttribPointer(colShader.vertexColorAttribute, colorFrameBuffer.itemSize, gl.FLOAT, false, 0, 0);

            spec.graphics.applyTransforms(colShader);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer2.numItems);
            spec.graphics.mvMatrixPop();
        }

        function draw() {
            gl.useProgram(texShader);
            drawTop();
            if (currentFontIndex !== wantedFontIndex) {
                drawMoving();
            }
            drawBottom();
            
            gl.useProgram(colShader);
            drawFrame();
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
                xRot = (xRot + (angularSpeed * elapsed) / 1000.0);
                halfTurn = false;
                completeTurn = false;
                if (xRot > Math.PI) {
                    completeTurn = true;
                    xRot = 0.1;
                    xRotPrev = 0.0;
                    if (currentFontIndex === wantedFontIndex) {
                        spec.graphics.removeUpdate(spec.name);
                    }
                    else {
                        currentFontIndex = (currentFontIndex + 1) % spec.fontsTexture.length;
                    }
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
            spec.width = spec.width || spec.graphics.getFrustumDim().width * 0.25;
            spec.height = spec.height || spec.width * 2;
            spec.pos = spec.pos || [0., 0., 0.];
            wantedFontIndex = currentFontIndex = spec.currentFontIndex || 0;
            gl = spec.graphics.gl;

            // intern vars and states
            PI2 = Math.PI * 2;
            halfPI = Math.PI * 0.5;
            wProportion = 0.9;
            hProportion = 1 - (spec.width * (1 - wProportion)) / spec.height;

            //init functions
            initTextureShaders();
            initColorShaders();
            initBuffers();   //Buffers initialisation

            //render loop callbacks
            spec.graphics.addDraw(draw);

        }
        catch (e) {
            throw e;
        }

        /*
         * Public interface
         */

        /**
         * 
         * @param {type} wantedFontIdx
         * @param {type} options
         * @returns {undefined}
         */
        function animate(wantedFontIdx, options) {

            options = options || {};

            if (spec.graphics.registeredUpdate(spec.name) === false) {
                wantedFontIndex = wantedFontIdx;
                lastTime = 0;
                xRot = 0.1;
                xRotPrev = 0;
                angularSpeed = options.angularSpeed || 0.5;
                spec.graphics.addUpdate(spec.name, update);
            }
            else {
                wantedFontIndex = wantedFontIdx;
            }

        }
        that.animate = animate;

        return that;
    };
    return cell;
});





