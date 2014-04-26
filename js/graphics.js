/**
 * 
 * @returns {undefined}
 */
define(["glMatrix"], function(glMatrix) {

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
        var that = {}, gl, pMatrix, mvMatrix, drawList, udpateList;
        my = my || {};
        
        /*
         * Intern init
         */
        try{
            //setting webgl object
            gl = spec.canvas.getContext("experimental-weblg");
            gl.width = spec.canvas.width;
            gl.height = spec.canvas.height;
            
            //setting perspective params
            spec.fov = spec.fov || 45;
            spec.near = spec.near || 0.1;
            spec.far = spec.far || 100;
            pMatrix = glMatrix.mat4.create();
            glMatrix.mat4.perspective(pMatrix, spec.fov, gl.width / gl.height, spec.near, spec.far );
            
            //setting mv matrix to identity
            mvMatrix = glMatrix.mat4.create();
        }
        catch(e){
            if (!gl){
                throw Exception("Could not initialise WebGL, sorry :-(");
            }
            else {
                throw e;
            }
        }

        function drawScene(){
            
        }

        function update(){
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        function render(){
            requestAnimFram(render);
            drawScene();
            update();
        }

        /*
         * Public interface
         */
        function run() {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
        }
                      
        that.run = run;
        that.addShader = addShader;

        return that;

    };

    return graphics;
});


