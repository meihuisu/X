
goog.provide('X.debug');

var debug=0;
var pix_rescale=1;
var myDebugWin;

function top_set_pix_rescale(sz) {
     pix_rescale=sz;
}

function top_get_pix_rescale() {
     return pix_rescale;
}

function smooth(data, limit) {

  // buffer the length
  var _datasize = data.length;

  var i = 0;
  for (i = 0; i < _datasize; i++) {

    if(!isNaN(data[i])) {

      var _value = data[i];
      data[i]=_value+limit;
    }

  }
}

function _showDebug (name) {
     var debugwin = window.open ("", name,
         "left=0, top=0, width=500, height=600, titlebar=yes,  scrollbars=yes,"
          + "status=yes, resizable=yes");
     debugwin.document.open();
     debugwin.document.write (
         "<html><head><title>" + name + "</title></head><body><pre>\n");
     return (debugwin);
}

function _printDebug (winHandle, text) {
     if (winHandle && !winHandle.closed) {
         winHandle.document.write (text + "\n");
     }
}

function printDebug(text) {
    if (!debug) return;
    if ((myDebugWin == undefined) || (myDebugWin.closed)) {
             myDebugWin = 0;
             myDebugWin = _showDebug ("myDebugWin");
    }
    _printDebug( myDebugWin, text);
}

function printArrayDebug(array,text,step,last) {
    if (!debug) return;
    if ((myDebugWin == undefined) || (myDebugWin.closed)) {
             myDebugWin = _showDebug ("myDebugWin");
    }
    var i=0;
    var j=0;
    for (i=0; i < last;) {
       var tmp=text;
       var t;
       for (j=0; j<step; j++) {
           t=i+j;
           tmp=tmp+" ["+t+"]"+array[t];
       }
       printDebug(tmp);
       i=i+step;
    }
}


function printNIIHeader(data) {
  if (!debug) return;
  // attach the given mri
  var mri=data;

  if ((myDebugWin == undefined) || (myDebugWin.closed)) {
             myDebugWin = _showDebug ("myDebugWin");
  }

//header_key substruct 
  printDebug( "mri.sizeof_hdr=>"+mri.sizeof_hdr );
  var s="";
  var t;
  for(i =0 ; i < 10; i++) { s=s+mri.data_type[i]; }
  printDebug( "mri.data_type=>"+s );
  s="";
  for(i =0 ; i < 18; i++) { s=s+mri.db_name[i]; }
  printDebug( "mri.db_name=>"+s );
  printDebug( "mri.extents=>"+mri.extents );
  printDebug( "mri.session_error=>"+mri.session_error );
  printDebug( "mri.regular=>"+mri.regular );
  printDebug( "mri.dim_info=>"+mri.dim_info );

//image_dimension substruct => 
  for(i =0 ; i < 8; i++) {
      t="mri.dim["+i+"]";
      printDebug( t+mri.dim[i] );
  }
  printDebug( "mri.intent_p1=>"+mri.intent_p1 );
  printDebug( "mri.intent_p2=>"+mri.intent_p2 );
  printDebug( "mri.intent_p3=>"+mri.intent_p3 );
  printDebug( "mri.intent_code=>"+mri.intent_code );
  s="";
  for(i =0 ; i < 80; i++) { s=s+mri.descrip[i]; }
  printDebug( "mri.descrip=>"+s );
  
  printDebug( "mri.bitpix=>"+mri.bitpix );
  printDebug( "mri.slice_start=>"+mri.slice_start );
  for(i =0 ; i < 8; i++) {
      t="mri.pixdim["+i+"]";
      printDebug( t+mri.pixdim[i] );
  }
  printDebug( "mri.vox_offset=>"+mri.vox_offset );
  printDebug( "mri.scl_slope=>"+mri.scl_slope );
  printDebug( "mri.scl_inter=>"+mri.scl_inter );
  printDebug( "mri.slice_end=>"+mri.slice_end );
  printDebug( "mri.slice_code=>"+mri.slice_code );
  printDebug( "mri.xyzt_units=>"+mri.xyzt_units );
  printDebug( "mri.cal_max=>"+mri.cal_max );
  printDebug( "mri.cal_min=>"+mri.cal_min );
  printDebug( "mri.slice_duration=>"+mri.slice_duration );
  printDebug( "mri.toffset=>"+mri.toffset );
  printDebug( "mri.glmax=>"+mri.glmax );
  printDebug( "mri.glmin=>"+mri.glmin );
  
//data_history substruct
  s="";
  for(i =0 ; i < 80; i++) { s=s+mri.descrip[i]; }
  printDebug( "mri.descrip=>"+s );
  s="";
  for(i =0 ; i < 24; i++) { s=s+mri.aux_file[i]; }
  printDebug( "mri.aux_file=>"+s );
  
  printDebug( "mri.aux_file=>"+mri.aux_file );
  printDebug( "mri.qform_code=>"+mri.qform_code );
  printDebug( "mri.sform_code=>"+mri.sform_code );
  printDebug( "mri.quatern_b=>"+mri.quatern_b );
  printDebug( "mri.quatern_c=>"+mri.quatern_c );
  printDebug( "mri.quatern_d=>"+mri.quatern_d );
  printDebug( "mri.qoffset_x=>"+mri.qoffset_x );
  printDebug( "mri.qoffset_y=>"+mri.qoffset_y );
  printDebug( "mri.qoffset_z=>"+mri.qoffset_z );
  
  for(i =0 ; i < 4; i++) {
      t="mri.srow_x["+i+"]";
      printDebug( t+mri.srow_x[i] );
  }
  for(i =0 ; i < 4; i++) {
      t="mri.srow_y["+i+"]";
      printDebug( t+mri.srow_y[i] );
  }
  for(i =0 ; i < 4; i++) {
      t="mri.srow_z["+i+"]";
      printDebug( t+mri.srow_z[i] );
  }

  s="";
  for(i =0 ; i < 16; i++) { s=s+mri.intent_name[i]; }
  printDebug( "mri.intent_name =>"+s );
  
  for(i =0 ; i < 4; i++) {
      t="mri.magic["+i+"]";
      printDebug( t+mri.magic[i] );
  }

// number of pixels in the volume
  printDebug( "volsize is=>" + (mri.dim[1] * mri.dim[2] * mri.dim[3]));

//scan the pixels regarding the data type 
  switch(mri.datatype) { 
  case 2: printDebug( "mri.data=> unsigned char");
  break;
  case 4: printDebug( "mri.data=> signed short");
  break;
  case 8: printDebug( "mri.data=> signed int");
  break;
  case 16: printDebug( "mri.data=> float");
  break;
  case 32: printDebug( "mri.data=> complex");
  break;
  case 64: printDebug( "mri.data=> double");
  break;
  case 256: printDebug( "mri.data=> signed char");
  break;
  case 512: printDebug( "mri.data=> unsigned short");
  break;
  case 768: printDebug( "mri.data=> unsigned int");
  break;
  default:
  throw new Error('Unsupported NII data type: ' + mri.datatype);
  }
//get the min and max intensities 
  printDebug( "mri.min=>"+mri.min );
  printDebug( "mri.max=>"+mri.max );
};

