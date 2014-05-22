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
            options = options || {};
            var width = options.width || 500,
                    height = options.height || 500,
                    speed = options.speed || 10,
                    col = options.col || 1,
                    row = options.row || 1,
                    graphics3D = null,
                    canvas = document.createElement("canvas"),
                    cell;
            
            canvas.width = width;
            canvas.height = height;
            container.appendChild(canvas);
            graphics3D = graphics({canvas: canvas});
            manager = cellManager({rowCount: row, colCount: col, graphics: graphics3D, speed: speed});
            graphics3D.run();
        },
        /**
         * 
         * @param {type} r
         * @param {type} c
         * @param {type} ch
         * @returns {undefined}
         */
        set: function(r,c,ch){
            manager.updateCell(r,c,ch);
        }
    };

    return flipFlap;

});

