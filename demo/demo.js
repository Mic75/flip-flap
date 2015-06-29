require.config( {
  baseUrl: "../js",
  paths: {
    jquery: "libs/jquery",
    text: "libs/text"
  }
} );

require( [ "split-flap", "jquery", "libs/jquery-ui" ], function( split_flap, $ ){
  var $split_flap = $( "#split-flap" ),
          row = 1, col = 8, speed = 20;

  function reset_split_flap(){

    $split_flap.empty();
    var $field = null;
    if ( clock_animation !== null ){
      cancelAnimationFrame( clock_animation );
      clock_animation = null;
      $( '#inputs' ).empty();
      $field = $( '<input type="text" data-row="0" maxlength="' + col + '">' );
      $( '#inputs' ).append( $field );
      bindAction( $field );
    }
    split_flap.create( $split_flap.get( 0 ), { col: col, row: row, speed: speed, width: 500 } );
    split_flap.display();
  }

  function update_rows(){
    $( '#inputs' ).empty();
    var $field = null;
    for ( var i = 0; i < row; i++ )
    {
      $field = $( '<input type="text" data-row="' + i + '" maxlength="' + col + '">' );
      $( "#inputs" ).append( $field );
      bindAction( $field );
    }
  }

  function update_inputs_length(){
    $( "#inputs" ).find( "input" ).val( "" );
    $( "#inputs" ).find( "input" ).attr( "maxlength", col );
  }

  function bindAction( $field ){
    $field.change( function( e ){
      for ( var j = 0; j < col; j++ ){
        split_flap.set( parseInt( $( this ).attr( "data-row" ) ), j, e.target.value.charAt( j ) );
      }
    } );
  }

  var sliders = {
    row: {
      min: 1,
      max: 5,
      value: row,
      slide: function( event, ui ){
        row = ui.value;
        reset_split_flap();
        $( "#row" ).val( row );
        update_rows();
      }
    },
    column: {
      min: 1,
      max: 10,
      value: col,
      slide: function( event, ui ){
        col = ui.value;
        reset_split_flap();
        $( "#column" ).val( col );
        update_inputs_length();
      }
    },
    speed: {
      min: 1,
      max: 20,
      value: speed,
      slide: function( event, ui ){
        speed = ui.value;
        split_flap.setSpeed( speed );
        $( "#speed" ).val( ui.value );
      }
    }
  };

  for ( var id in sliders ){
    if ( sliders.hasOwnProperty( id ) ){
      $( "#slider-" + id ).slider( {
        range: "max",
        min: sliders[id].min,
        max: sliders[id].max,
        value: sliders[id].value,
        slide: sliders[id].slide
      } );
    }
    $( "#" + id ).val( sliders[id].value );
  }

  split_flap.create( $split_flap.get( 0 ), {
    col: col,
    row: row,
    speed: speed,
    width: 500 } );
    split_flap.display("clock");
    
  var started = true,
      clock_animation = null,
      elapsed = 0;
  
  function update_clocks(){
    var time_text = /(\d\d:?){3}/.exec( new Date( Date.now() ).toUTCString() )[0],
            i = null;

    for ( i = 0; i < time_text.length; i++ ){
      if ( time_text[i] !== ':' ){
        split_flap.set( 0, i, time_text[i], { numeric: true } );
      }
    }
    $( "#clock" ).text( time_text );
  }

  function tick(){
    if ( Date.now() - elapsed > 1000 ){
      update_clocks();
      elapsed = Date.now();
    }

    if ( started ){
      clock_animation = requestAnimationFrame( tick );
    }
  }
  clock_animation = requestAnimationFrame( tick );


} );

