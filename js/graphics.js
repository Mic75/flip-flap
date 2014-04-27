/**
 * 
 * @returns {undefined}
 */
define(["glmatrix"], function(glMatrix) {

    /**
     * 
     * @param {Object} spec
     * @param {Object} spec.canvas
     * @param {number} spec.fov
     * @param {number} spec.near
     * @param {number} spec.far
     * @param {type} my
     * @returns {undefined}
     */
    var graphics = function(spec, my) {

        /*
         * Private members 
         */
        var that = {}, gl, pMatrix, mvMatrix, mvMatrixStack, drawList=[], udpateList=[];
        my = my || {};

        /*
         * Intern init
         */
        try {
            //setting webgl object
            gl = spec.canvas.getContext("experimental-webgl");
            gl.width = spec.canvas.width;
            gl.height = spec.canvas.height;

            //setting perspective params
            spec.fov = spec.fov || 45;
            spec.near = spec.near || 0.1;
            spec.far = spec.far || 100;
            pMatrix = glMatrix.mat4.create();
            glMatrix.mat4.perspective(pMatrix, spec.fov, gl.width / gl.height, spec.near, spec.far);

            //setting mv matrix to identity
            mvMatrix = glMatrix.mat4.create();
            mvMatrixStack = [];
        }
        catch (e) {
            if (!gl) {
                throw e.message + "\n Could not initialise WebGL, sorry :-(";
            }
            else {
                throw e;
            }
        }

        function drawScene() {
            var i, drawsCount = drawList.length;

            gl.viewport(0, 0, gl.width, gl.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //synchronous call to avoid concurrent access on mvMatrix
            for (i = 0; i < drawsCount; i++) {
                drawList[i]();
            }
        }


        function update() {

            //updates may be called assynchronously
            udpateList.forEach(function(update) {
                update();
            });

        }

        function render() {
            requestAnimationFrame(render);
            drawScene();
            update();
        }

        /*
         * Public interface
         */
        
        var public = {
            
        };
        
        /**
         * 
         * @returns {undefined}
         */
        function run() {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
            render();
        }

        /**
         * 
         * @returns {undefined}
         */
        function mvMatrixToIdentity(){
            glMatrix.mat4.identity(mvMatrix);
        }

        /**
         * 
         * @returns {undefined}
         */
        function mvMatrixPush() {
            var copy = glMatrix.mat4.create();
            glMatrix.mat4.copy(copy, mvMatrix);
            mvMatrixStack.push(copy);
        }

        /**
         * 
         * @returns {undefined}
         */
        function mvMatrixPop() {
            if (mvMatrixStack.length === 0) {
                throw "Invalid popMatrix!";
            }
            mvMatrix = mvMatrixStack.pop();
        }
        
        /**
         * 
         * @param {type} v3
         * @returns {undefined}
         */
        function mvTranslate(v3){
            glMatrix.mat4.translate(mvMatrix,mvMatrix, v3);
        }
        
        /**
         * 
         * @param {type} v3
         * @param {type} angle
         * @returns {undefined}
         */
        function mvRotate(v3, angle){
            glMatrix.mat4.rotate(mvMatrix, mvMatrix, angle, v3);
        }
        
        /**
         * 
         * @param {type} shaderProgram
         * @returns {undefined}
         */
        function applyTransforms(shaderProgram) {
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        }

        /**
         * 
         * @param {type} drawCallBack
         * @returns {undefined}
         */
        function addDraw(drawCallBack) {
            drawList.push(drawCallBack);
        }
       
        /**
         * 
         * @param {type} updateCallback
         * @returns {undefined}
         */
        function addUpdate(updateCallback) {
            udpateList.push(updateCallback);
        }
        
        that.run = run;
        that.mvMatrixToIdentity = mvMatrixToIdentity;
        that.mvMatrixPush = mvMatrixPush;
        that.mvMatrixPop = mvMatrixPop;
        that.mvTranslate = mvTranslate;
        that.mvRotate = mvRotate;
        that.applyTransforms = applyTransforms;
        that.addDraw = addDraw;
        that.addUpdate = addUpdate;

        that.gl = gl;
        that.mvMatrix = mvMatrix;

        return that;

    };

    return graphics;
});


