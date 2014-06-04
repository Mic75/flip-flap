/**
 * 
 * @returns {undefined}
 */
define(["glmatrix"], function(glMatrix) {

    /**
     * 
     * @param {Object} spec
     * @param {Object} spec.canvas
     * @param {number} spec.width
     * @param {number} spec.height
     * @param {number} spec.depth
     * @param {type} my
     * @returns {undefined}
     */
    var graphics = function(spec, my) {

        /*
         * Private members 
         */
        var that = {}, gl, pMatrix, mvMatrix, mvMatrixStack, drawList=[], updateList={}, aspectRatio;
        my = my || {};

        /*
         * Intern init
         */
        try {
            //setting webgl object
            gl = spec.canvas.getContext("experimental-webgl");
            gl.viewportW = spec.canvas.width;
            gl.viewportH = spec.canvas.height;
            aspectRatio = gl.viewportW / gl.viewportH;
            that.gl = gl;
            
            //setting perspective params
            spec.width = spec.width || 200;
            spec.height = spec.height || 200;
            spec.depth = spec.depth || 200;
            pMatrix = glMatrix.mat4.create();
            glMatrix.mat4.ortho(pMatrix, -aspectRatio*spec.width/2, aspectRatio*spec.width/2, -spec.height/2, spec.height/2, 0, spec.depth );
            
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

            gl.viewport(0, 0, gl.viewportW, gl.viewportH);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //synchronous call to avoid concurrent access on mvMatrix
            for (i = 0; i < drawsCount; i++) {
                drawList[i]();
            }
        }

        
        function update() {

            for(var id in updateList){
                if (updateList.hasOwnProperty(id)){
                    updateList[id]();
                }
            }
        }

        function render() {
            requestAnimationFrame(render);
            drawScene();
            update();
        }

        /*
         * Public interface
         */
        
        /**
         * 
         * @returns {undefined}
         */
        function run() {
            gl.clearColor(.35, .35, .35, 1.0);
            gl.enable(gl.DEPTH_TEST);
            render();
        }
        that.run = run;
        
        /**
         * 
         * @returns {undefined}
         */
        function mvMatrixToIdentity(){
            glMatrix.mat4.identity(mvMatrix);
        }
        that.mvMatrixToIdentity = mvMatrixToIdentity;
        
        /**
         * 
         * @returns {undefined}
         */
        function mvMatrixPush() {
            var copy = glMatrix.mat4.create();
            glMatrix.mat4.copy(copy, mvMatrix);
            mvMatrixStack.push(copy);
        }
        that.mvMatrixPush = mvMatrixPush;
        
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
        that.mvMatrixPop = mvMatrixPop;
        
        /**
         * 
         * @param {type} v3
         * @returns {undefined}
         */
        function mvTranslate(v3){
            glMatrix.mat4.translate(mvMatrix,mvMatrix, v3);
        }
        that.mvTranslate = mvTranslate;
        
        /**
         * 
         * @param {type} v3
         * @param {type} angle
         * @returns {undefined}
         */
        function mvRotate(v3, angle){
            glMatrix.mat4.rotate(mvMatrix, mvMatrix, angle, v3);
        }
        that.mvRotate = mvRotate;
        
        /**
         * 
         * @param {type} shader
         * @returns {undefined}
         */
        function applyTransforms(shader) {
            gl.uniformMatrix4fv(shader.pMatrixUniform, false, pMatrix);
            gl.uniformMatrix4fv(shader.mvMatrixUniform, false, mvMatrix);
        }
        that.applyTransforms = applyTransforms;
        
        /**
         * 
         * @param {type} drawCallBack
         * @returns {undefined}
         */
        function addDraw(drawCallBack) {
            drawList.push(drawCallBack);
        }
        that.addDraw = addDraw;

        /**
         * 
         * @param {type} id
         * @param {type} updateCallback
         * @returns {undefined}
         */
        function addUpdate(id, updateCallback) {
            updateList[id] = updateCallback;
        }
        that.addUpdate = addUpdate;
        
        function removeUpdate(id){
            delete updateList[id];
        }
        that.removeUpdate = removeUpdate;
        
        /**
         * 
         * @returns {_L5.graphics.getFrustumDimension.Anonym$1}
         */
        function getFrustumDimension(){
            return {
                width: spec.width,
                height: spec.height,
                depth: spec.depth
            };
        }
        that.getFrustumDimension = getFrustumDimension;
        
        /**
         * 
         * @param {type} name
         * @returns {Boolean}
         */
        function registeredUpdate(name){
            return typeof updateList[name] !== "undefined";
        }
        that.registeredUpdate = registeredUpdate;
        
        return that;

    };

    return graphics;
});


