/**
 * 
 */
define(["graphics"], function(graphics){
   
   /**
    * 
    * @type type
    */
    var flipFlap = {
        /**
         * 
         * @param {type} container
         * @returns {undefined}
         */
        create: function(container){
            var canvas = document.createElement("canvas");
            container.append(canvas);
            var graphics3D = graphics(canvas);
            graphics3D.run();
        }
    };
   
    return flipFlap;
   
});

