
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
  _printDebug( myDebugWin, "mri.sizeof_hdr=>"+mri.sizeof_hdr );
  var s="";
  var t;
  for(i =0 ; i < 10; i++) { s=s+mri.data_type[i]; }
  _printDebug( myDebugWin, "mri.data_type=>"+s );
  s="";
  for(i =0 ; i < 18; i++) { s=s+mri.db_name[i]; }
  _printDebug( myDebugWin, "mri.db_name=>"+s );
  _printDebug( myDebugWin, "mri.extents=>"+mri.extents );
  _printDebug( myDebugWin, "mri.session_error=>"+mri.session_error );
  _printDebug( myDebugWin, "mri.regular=>"+mri.regular );
  _printDebug( myDebugWin, "mri.dim_info=>"+mri.dim_info );

//image_dimension substruct => 
  for(i =0 ; i < 8; i++) {
      t="mri.dim["+i+"]";
      _printDebug( myDebugWin, t+mri.dim[i] );
  }
  _printDebug( myDebugWin, "mri.intent_p1=>"+mri.intent_p1 );
  _printDebug( myDebugWin, "mri.intent_p2=>"+mri.intent_p2 );
  _printDebug( myDebugWin, "mri.intent_p3=>"+mri.intent_p3 );
  _printDebug( myDebugWin, "mri.intent_code=>"+mri.intent_code );
  s="";
  for(i =0 ; i < 80; i++) { s=s+mri.descrip[i]; }
  _printDebug( myDebugWin, "mri.descrip=>"+s );
  
  _printDebug( myDebugWin, "mri.bitpix=>"+mri.bitpix );
  _printDebug( myDebugWin, "mri.slice_start=>"+mri.slice_start );
  for(i =0 ; i < 8; i++) {
      t="mri.pixdim["+i+"]";
      _printDebug( myDebugWin, t+mri.pixdim[i] );
  }
  _printDebug( myDebugWin, "mri.vox_offset=>"+mri.vox_offset );
  _printDebug( myDebugWin, "mri.scl_slope=>"+mri.scl_slope );
  _printDebug( myDebugWin, "mri.scl_inter=>"+mri.scl_inter );
  _printDebug( myDebugWin, "mri.slice_end=>"+mri.slice_end );
  _printDebug( myDebugWin, "mri.slice_code=>"+mri.slice_code );
  _printDebug( myDebugWin, "mri.xyzt_units=>"+mri.xyzt_units );
  _printDebug( myDebugWin, "mri.cal_max=>"+mri.cal_max );
  _printDebug( myDebugWin, "mri.cal_min=>"+mri.cal_min );
  _printDebug( myDebugWin, "mri.slice_duration=>"+mri.slice_duration );
  _printDebug( myDebugWin, "mri.toffset=>"+mri.toffset );
  _printDebug( myDebugWin, "mri.glmax=>"+mri.glmax );
  _printDebug( myDebugWin, "mri.glmin=>"+mri.glmin );
  
//data_history substruct
  s="";
  for(i =0 ; i < 80; i++) { s=s+mri.descrip[i]; }
  _printDebug( myDebugWin, "mri.descrip=>"+s );
  s="";
  for(i =0 ; i < 24; i++) { s=s+mri.aux_file[i]; }
  _printDebug( myDebugWin, "mri.aux_file=>"+s );
  
  _printDebug( myDebugWin, "mri.aux_file=>"+mri.aux_file );
  _printDebug( myDebugWin, "mri.qform_code=>"+mri.qform_code );
  _printDebug( myDebugWin, "mri.sform_code=>"+mri.sform_code );
  _printDebug( myDebugWin, "mri.quatern_b=>"+mri.quatern_b );
  _printDebug( myDebugWin, "mri.quatern_c=>"+mri.quatern_c );
  _printDebug( myDebugWin, "mri.quatern_d=>"+mri.quatern_d );
  _printDebug( myDebugWin, "mri.qoffset_x=>"+mri.qoffset_x );
  _printDebug( myDebugWin, "mri.qoffset_y=>"+mri.qoffset_y );
  _printDebug( myDebugWin, "mri.qoffset_z=>"+mri.qoffset_z );
  
  for(i =0 ; i < 4; i++) {
      t="mri.srow_x["+i+"]";
      _printDebug( myDebugWin, t+mri.srow_x[i] );
  }
  for(i =0 ; i < 4; i++) {
      t="mri.srow_y["+i+"]";
      _printDebug( myDebugWin, t+mri.srow_y[i] );
  }
  for(i =0 ; i < 4; i++) {
      t="mri.srow_z["+i+"]";
      _printDebug( myDebugWin, t+mri.srow_z[i] );
  }

  s="";
  for(i =0 ; i < 16; i++) { s=s+mri.intent_name[i]; }
  _printDebug( myDebugWin, "mri.intent_name =>"+s );
  
  for(i =0 ; i < 4; i++) {
      t="mri.magic["+i+"]";
      _printDebug( myDebugWin, t+mri.magic[i] );
  }

// number of pixels in the volume
  _printDebug( myDebugWin, "volsize is=>" + (mri.dim[1] * mri.dim[2] * mri.dim[3]));

//scan the pixels regarding the data type 
  switch(mri.datatype) { 
  case 2: _printDebug( myDebugWin, "mri.data=> unsigned char");
  break;
  case 4: _printDebug( myDebugWin, "mri.data=> signed short");
  break;
  case 8: _printDebug( myDebugWin, "mri.data=> signed int");
  break;
  case 16: _printDebug( myDebugWin, "mri.data=> float");
  break;
  case 32: _printDebug( myDebugWin, "mri.data=> complex");
  break;
  case 64: _printDebug( myDebugWin, "mri.data=> double");
  break;
  case 256: _printDebug( myDebugWin, "mri.data=> signed char");
  break;
  case 512: _printDebug( myDebugWin, "mri.data=> unsigned short");
  break;
  case 768: _printDebug( myDebugWin, "mri.data=> unsigned int");
  break;
  default:
  throw new Error('Unsupported NII data type: ' + mri.datatype);
  }
//get the min and max intensities 
  _printDebug( myDebugWin, "mri.min=>"+mri.min );
  _printDebug( myDebugWin, "mri.max=>"+mri.max );
};

