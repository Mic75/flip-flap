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

        //CONSTS
        var PI2 = Math.PI * 2,
            HALF_PI = Math.PI / 2;


        /*
         * Private members 
         */
        var that = {}, gl, lastTime, xRot, xRotPrev, completeTurn, halfTurn, currentFontIndex, wantedFontIndex, 
                angularSpeed, numeric;

        my = my || {};

        function drawTop() {
            var maxIndexAllowed = numeric === true ? 11 : spec.fontsTexture.length,
              fontIndex = currentFontIndex === wantedFontIndex ? currentFontIndex : (currentFontIndex + 1) % maxIndexAllowed,
              vertexPositionBuffer = spec.cellPageBuf.vertexPosition,
              texShader = spec.texShader,
              topUVBuffer = spec.cellPageBuf.topUVBuffer;

            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([spec.pos[0], spec.pos[1] + spec.cellPageBuf.vTranslation, -spec.pos[2]]);

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
            var maxIndexAllowed = numeric === true ? 11 : spec.fontsTexture.length,
              nextFontIndex = (currentFontIndex + 1) % maxIndexAllowed,
              vertexPositionBuffer = spec.cellPageBuf.vertexPosition,
              texShader = spec.texShader,
              topUVBuffer = spec.cellPageBuf.topUVBuffer,
              bottomInverUVBuffer = spec.cellPageBuf.bottomInverUVBuffer;

            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();

            spec.graphics.mvTranslate([spec.pos[0], spec.pos[1], -spec.pos[2]]);
            spec.graphics.mvRotate([1., 0., 0.], xRot);
            spec.graphics.mvTranslate([0, spec.cellPageBuf.vTranslation, 0]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(texShader.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);

            if (xRot < HALF_PI) {

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
            var vertexPositionBuffer = spec.cellPageBuf.vertexPosition,
                    texShader = spec.texShader,
                    bottomUVBuffer = spec.cellPageBuf.bottomUVBuffer;

            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();
            spec.graphics.mvTranslate([spec.pos[0], spec.pos[1] - spec.cellPageBuf.vTranslation, -spec.pos[2]]);

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

        function draw() {
            gl.useProgram(spec.texShader);
            drawTop();
            if (currentFontIndex !== wantedFontIndex) {
                drawMoving();
            }
            drawBottom();

            gl.useProgram(spec.colShader);
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
                        var maxIndexAllowed = numeric === true ? 11 : spec.fontsTexture.length;
                        currentFontIndex = (currentFontIndex + 1) % maxIndexAllowed;
                    }
                }
                else if (xRot > HALF_PI && xRotPrev < HALF_PI) {
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
            spec.pos = spec.pos || [0., 0., 0.];
            wantedFontIndex = currentFontIndex = spec.currentFontIndex || 0;
            gl = spec.graphics.gl;

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
                numeric = options.numeric || false;
                spec.graphics.addUpdate(spec.name, update);
            }
            else {
                wantedFontIndex = wantedFontIdx;
            }

        }
        that.animate = animate;
        
        function setSpeed(s){
          angularSpeed = s;
        }
        that.setSpeed = setSpeed;
        
        return that;
    };
    return cell;
});





