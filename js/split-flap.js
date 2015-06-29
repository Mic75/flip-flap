/**
 * 
 */
define(["graphics", "cellManager"], function(graphics, cellManager) {

    var manager, graphics3D;
    
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
                    canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;
                container.appendChild(canvas);
                graphics3D = graphics({canvas: canvas});
                manager = cellManager({rowCount: row, colCount: col, graphics: graphics3D, speed: speed});
                
            }
            catch(e){
                console.error(e.message);
            }
        },
        display: function(type){
          type = type || "array";
          
          if (type === "array"){
            manager.displayCells();
          }
          else if( type === "clock"){
            manager.displayClock();
          }
          graphics3D.run();
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

