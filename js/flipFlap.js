/**
 * 
 */
define(["graphics", "cellManager"], function(graphics, cellManager) {

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
                    col = options.col || 1,
                    row = options.row || 1,
                    graphics3D = null,
                    canvas = document.createElement("canvas"),
                    cell;
            
            canvas.width = width;
            canvas.height = height;
            container.appendChild(canvas);
            graphics3D = graphics({canvas: canvas});
            cellManager({rowCount: row, colCount: col, graphics: graphics3D});
            graphics3D.run();
        }
    };

    return flipFlap;

});

