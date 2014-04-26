/**
 * 
 * @returns {undefined}
 */
define(["text!../shaders/fsFlipflap.glsl", "text!../shaders/vsFlipflap.glsl", "glMatrix"], function(fs, vs, glMatrix) {

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
        var that = {}, shaderProgram, vsShader, fsShader, vertexPositionBuffer, vertexColorBuffer, gl;
        my = my || {};

        function compileShader(shader, str, shaderType) {
            shader = gl.createShader(shaderType);
            gl.shaderSource(str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw gl.getShaderInfoLog(shader);
            }
        }

        function initShaders() {

            gl = spec.graphics.gl;

            compileShader(vsShader, vs, gl.VERTEX_SHADER);
            compileShader(fsShader, fs, gl.FRAGMENT_SHADER);
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
            var vertices, colors, i;
            vertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            vertices = [
                1.0, 1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, -1.0, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            vertexPositionBuffer.itemSize = 3;
            vertexPositionBuffer.numItems = 4;

            vertexColorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
            vertices = [
                1.0, 1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, -1.0, 0.0
            ];

            colors = [];
            for (i = 0; i < vertexPositionBuffer.numItems; i++) {
                colors = colors.concat([1.0, 0.0, 0.0, 1.0]);
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            vertexColorBuffer.itemSize = 4;
            vertexColorBuffer.numItems = 4;
        }

        function draw() {
            spec.graphics.mvMatrixPush();
            spec.graphics.mvMatrixToIdentity();

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            spec.graphics.applyTransforms();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.itemSize);
            
            spec.graphics.mvMatrixPop();

        }

        function update() {
            
        }

        /*
         * Intern init
         */
        try {

            gl = spec.graphics.gl;
            initShaders(); //Shaders intialisation
            initBuffers(); //Buffers initialisation
            spec.graphics.addDraw(draw);
            spec.graphics.addUpdate(update);

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





