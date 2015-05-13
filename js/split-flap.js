/**
 * 
 */
define(["graphics", "cellManager"], function(graphics, cellManager) {

    var manager;
    
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
        create: function(container, options) {
            try {
                options = options || {};
                var width = options.width || 500,
                        height = options.height || 500,
                        speed = options.speed || 10,
                        col = options.col || 1,
                        row = options.row || 1,
                        graphics3D = null,
                        canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;
                container.appendChild(canvas);
                graphics3D = graphics({canvas: canvas});
                manager = cellManager({rowCount: row, colCount: col, graphics: graphics3D, speed: speed});
                graphics3D.run();
            }
            catch(e){
                console.error(e.message);
            }
        },
        /**
         * 
         * @param {type} r
         * @param {type} c
         * @param {type} ch
         * @param {type} options
         * @returns {undefined}
         */
        set: function(r,c,ch,options){
            manager.updateCell(r,c,ch,options);
        },
        setSpeed: function(speed){
          manager.setSpeed(speed);
        }
    };

    return flipFlap;

});

