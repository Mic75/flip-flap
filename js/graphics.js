/**
 * 
 * @returns {undefined}
 */
define(function() {

    /**
     * 
     * @param {type} spec
     * @param {type} my
     * @returns {undefined}
     */
    var graphics = function(spec, my) {
        
        /*
         * Private interface 
         */
        var that = {}, gl;
        my = my || {};
        
        /*
         * Intern init
         */
        try{
            gl = canvas.getContext("experimental-weblg");
        }
        catch(e){
            if (!gl){
                throw Exception("Could not initialise WebGL, sorry :-(");
            }
        }


        /*
         * Public interface
         */
        function run() {

        }

        that.run = run;

        return that;

    };

    return graphics;
});


