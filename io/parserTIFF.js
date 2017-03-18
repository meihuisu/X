/*
 * 
 *                  xxxxxxx      xxxxxxx
 *                   x:::::x    x:::::x 
 *                    x:::::x  x:::::x  
 *                     x:::::xx:::::x   
 *                      x::::::::::x    
 *                       x::::::::x     
 *                       x::::::::x     
 *                      x::::::::::x    
 *                     x:::::xx:::::x   
 *                    x:::::x  x:::::x  
 *                   x:::::x    x:::::x 
 *              THE xxxxxxx      xxxxxxx TOOLKIT
 *                    
 *                  http://www.goXTK.com
 *                   
 * Copyright (c) 2012 The X Toolkit Developers <dev@goXTK.com>
 *                   
 *    The X Toolkit (XTK) is licensed under the MIT License:
 *      http://www.opensource.org/licenses/mit-license.php
 * 
 *      'Free software' is a matter of liberty, not price.
 *      'Free' as in 'free speech', not as in 'free beer'.
 *                                         - Richard M. Stallman
 * 
 *
 */

// provides
goog.provide('X.parserTIFF');

// requires
goog.require('X.event');
goog.require('X.object');
goog.require('X.parser');
goog.require('X.triplets');
goog.require('goog.vec.Mat3');
goog.require('goog.vec.Mat4');
goog.require('Zlib.Gunzip');


// track the TIFF IMAGE DATA CACHE
var CACHE=[];

/**
 * Create a parser for a subset of .tiff files.
 * 
 * @constructor
 * @extends X.parser
 */
X.parserTIFF = function() {

  //
  // call the standard constructor of X.parser
  goog.base(this);
  
  //
  // class attributes
  
  /**
   * @inheritDoc
   * @const
   */
  this._classname = 'parserTIFF';
  
};
// inherit from X.parser
goog.inherits(X.parserTIFF, X.parser);


/**
 * @inheritDoc
 */
X.parserTIFF.prototype.parse = function(container, object, data, flag) {
  
  var _data = data;

  // parse the byte stream
  var MRI = this.parseStream(_data);

  var fname=this.cacheTag(object);
  CACHE.push({ parser:this, nm:fname, mri:MRI });

  this.setupObject(MRI, object);

  // create the object
  object.create_(MRI);
  
  // re-slice the data according each direction.
  object._image = this.reslice(object);

  // the object should be set up here, so let's fire a modified event
  var modifiedEvent = new X.event.ModifiedEvent();
  modifiedEvent._object = object;
  modifiedEvent._container = container;
  this.dispatchEvent(modifiedEvent);
}


X.parserTIFF.prototype.setupObject = function(MRI, object) {
  // grab the min, max intensities
  var min = MRI.min;
  var max = MRI.max;

  // attach the scalar range to the volume
  object._min = object._windowLow = min;
  object._max = object._windowHigh = max;
  // .. and set the default threshold
  // only if the threshold was not already set
  if (object._lowerThreshold == -Infinity) {
    object._lowerThreshold = min;
  }
  if (object._upperThreshold == Infinity) {
    object._upperThreshold = max;
  }
  
  // Create IJKtoXYZ matrix
  var IJKToRAS = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.setRowValues(IJKToRAS,
      3,
      0,
      0,
      0,
      1);

  // NO RESLICING, only use the spacing
  if(object['reslicing'] == 'false' || object['reslicing'] == false){

    var xd = 1.0, yd = 1.0, zd = 1.0;

    // scaling factors
    if(MRI.pixdim[1] > 0.0) {
      xd = MRI.pixdim[1];
    }
    
    if(MRI.pixdim[2] > 0.0) {
      yd = MRI.pixdim[2];
    }
    
    if(MRI.pixdim[2] > 0.0) {
      zd = MRI.pixdim[3];
    }
    
    // qfac left handed
    if(MRI.pixdim[0] < 0.0) {
      zd = -zd;
    }

    goog.vec.Mat4.setRowValues(IJKToRAS,
        0,
        xd,
        0,
        0,
        0
        );
    goog.vec.Mat4.setRowValues(IJKToRAS,
        1,
        0,
        yd,
        0,
        0
        );
    goog.vec.Mat4.setRowValues(IJKToRAS,
        2,
        0,
        0,
        zd,
        0
        );
  } else { 

    // fill IJKToRAS
    goog.vec.Mat4.setRowValues(IJKToRAS, 0, MRI.pixdim[1], 0, 0, 0);
    goog.vec.Mat4.setRowValues(IJKToRAS, 1, 0, MRI.pixdim[2], 0, 0);
    goog.vec.Mat4.setRowValues(IJKToRAS, 2, 0, 0, MRI.pixdim[3], 0);

  }
  
  // IJK to RAS and invert
  MRI.IJKToRAS = IJKToRAS;
  MRI.RASToIJK = goog.vec.Mat4.createFloat32();
  goog.vec.Mat4.invert(MRI.IJKToRAS, MRI.RASToIJK);
  
  // get bounding box
  // Transform ijk (0, 0, 0) to RAS
  var tar = goog.vec.Vec4.createFloat32FromValues(0, 0, 0, 1);
  var res = goog.vec.Vec4.createFloat32();
  goog.vec.Mat4.multVec4(IJKToRAS, tar, res);
  // Transform ijk (spacingX, spacinY, spacingZ) to RAS
  var tar2 = goog.vec.Vec4.createFloat32FromValues(1, 1, 1, 1);
  var res2 = goog.vec.Vec4.createFloat32();
  goog.vec.Mat4.multVec4(IJKToRAS, tar2, res2);
  
  // get location of 8 corners and update BBox
  //
  var _dims = [MRI.dim[1], MRI.dim[2], MRI.dim[3]];
  var _rasBB = X.parser.computeRASBBox(IJKToRAS, _dims);

  // grab the RAS Dimensions
  MRI.RASSpacing = [res2[0] - res[0], res2[1] - res[1], res2[2] - res[2]];
  
  // grab the RAS Dimensions
  MRI.RASDimensions = [_rasBB[1] - _rasBB[0] + 1, _rasBB[3] - _rasBB[2] + 1, _rasBB[5] - _rasBB[4] + 1];
  
  // grab the RAS Origin
  MRI.RASOrigin = [_rasBB[0], _rasBB[2], _rasBB[4]];
  
  // grab the  IJK dimensions
  object._dimensions = _dims;
};

// our extended tags
// tags
X.parserTIFF._TIFF_TAGS = {
    'NEW_SUBFILE_TYPE': 254,
    'IMAGE_WIDTH': 256,
    'IMAGE_LENGTH': 257,
    'BITS_PER_SAMPLE': 258,
    'COMPRESSION': 259,
    'PHOTO_INTERP': 262,
    'FILL_ORDER': 266,
    'IMAGE_DESCRIPTION': 270,
    'STRIP_OFFSETS': 273,
    'ORIENTATION': 274,
    'SAMPLES_PER_PIXEL': 277,
    'ROWS_PER_STRIP': 278,
    'STRIP_BYTE_COUNT': 279,
    'X_RESOLUTION': 282,
    'Y_RESOLUTION': 283,
    'PLANAR_CONFIGURATION': 284,
    'RESOLUTION_UNIT': 296,
    'SOFTWARE': 305,
    'DATE_TIME': 306,
    'ARTEST': 315,
    'HOST_COMPUTER': 316,
    'PREDICTOR': 317,
    'COLOR_MAP': 320,
    'TILE_WIDTH': 322,
    'SAMPLE_FORMAT': 339,
    'JPEG_TABLES': 347,
    'YCBCR_SUBSAMPLING': 530,
    'YCBCR_POSITIONING': 531,
    'METAMORPH1': 33628,
    'METAMORPH2': 33629,
    'IPLAB': 34122,
    'NIH_IMAGE_HDR': 43314,
    // private tag registered with Adobe
    'META_DATA_BYTE_COUNTS': 50838,
    // private tag registered with Adobe
    'META_DATA': 50839
};

X.parserTIFF._IFD = function() {
  this._offset = -1;
  this._count = -1;
  this._data=null;
};
  //
  // the header fields +  image fields
X.parserTIFF.MRI = {
    little_endian: true,
    magic_number: 0, // expect to be 42
    dim: null, // *!< Data array dimensions.*/ /* short dim[8]; */
    datatype: 0, // *!< Defines data type! */ /* short datatype; */
    pixdim: null, // *!< Grid spacings. */ /* float pixdim[8]; */
    channel_size: 1, // *!< Channels */ /* short channel_size; */
    rgb: false, // *!< rgb */ /* boolean rgb; */
    z: -1, // *!< Z from image_description */ /* short z; */
    data: [], // original raw data -- one set
    datas: [], // whole set of channel datas
    ifd : [],
    min: Infinity,
    max: -Infinity
};

/**
 * Parse the data stream according to the .tiff file format and return an
 * MRI structure which holds all parsed information.
 * 
 * @param {!ArrayBuffer} data The data stream.
 * @return {Object} The MRI structure which holds all parsed information.
 */
X.parserTIFF.prototype.parseStream = function(data) {

  // attach the given data
  this._data = data;
  var TIFF_TAGS = X.parserTIFF._TIFF_TAGS;
  var IFD = X.parserTIFF._IFD;
  var MRI = X.parserTIFF.MRI;

  // default 
  MRI.pixdim=[0 ,1.0 ,1.0 ,1.0, 0.0, 0.0, 0.0, 0.0];

  var byteorder = this.scan('ushort');
  MRI.little_endian = this._littleEndian = (byteorder == 0x4949);
  MRI.magic_number  = this.scan('ushort');
  if (MRI.magic_number != '42') {
      throw new Error('Invalid TIFF file. Magicnumber: '+ MRI.magic_number);
  }

  // the first ifd_offset
  var _ifd_offset = this.scan('uint');
  this.jumpTo(_ifd_offset);

//local function,
// http://stackoverflow.com/questions/12710001/
//           how-to-convert-uint8-array-to-base64-encoded-string
  function _Uint8ToString(u8a) {
    var CHUNK_SZ = 0x8000;
    var c = [];
    var len = u8a.length;
    for (var i=0; i < len; i+=CHUNK_SZ) {
      if(i+CHUNK_SZ > len) {
          c.push(String.fromCharCode.apply(null, u8a.subarray(i, len-1)));
          } else {
              c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
      }
    }
    return c.join("");
  }
  // string could also be -> "[object Uint16Array]"
  function _isArray(o) {
      var s = Object.prototype.toString.call(o);
      if (s.match(/[object .*Array]/) != -1) {
          return o.length;
      } else {
          return 0;
      }
  }

  function _arrayType(bits) {
      switch (bits) {
        case 8: // default case
            return Uint8Array;
            break;
        case 16:
            return Uint16Array;
            break;
        case 32:
            return Uint32Array;
            break;
      }
      // default
      return Uint8Array;
  }

  function _imageDescription(v) {
      if(v.search(/^ImageJ=/) != -1) {
/*
ImageJ=1.48v
images=688
slices=688
unit=mm
cf=0
c0=-0.04223389
c1=0.062625
vunit=mg HA/cm3
spacing=0.035
loop=false
min=30019.0
max=56810.0*/
          var tmp=v.match(/spacing=\d[.]\d*/);
          if(tmp==null) { // use the default
            return;
          }
          tmp=tmp[0];
          tmp=tmp.match(/\d[.]\d*/);
          var _pixdim= parseFloat(tmp[0]);
          MRI.pixdim=[0 ,_pixdim ,_pixdim ,_pixdim, 0.0, 0.0, 0.0, 0.0];
          return;
      }
// it is a XML structure, would be looking for sizeC, for channel
// and other info under pixels node
      if(v.search(/xml /) != -1) {
          var xmlDoc;
          if (window.DOMParser) {
              var parser=new DOMParser();
              xmlDoc=parser.parseFromString(v,"text/xml");
              } else {
                  xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
                  xmlDoc.async=false;
                  xmlDoc.loadXML(v);
          } 
          var _x = xmlDoc.getElementsByTagName("Pixels")[0];
          var _y = _x.getAttributeNode("PhysicalSizeX");
          var _pdimX = (Number(_y.nodeValue)==NaN)? 1: Number(_y.nodeValue);
          _y=_x.getAttributeNode("PhysicalSizeY");
          var _pdimY = (Number(_y.nodeValue)==NaN)? 1: Number(_y.nodeValue);
          _y=_x.getAttributeNode("PhysicalSizeZ");
          var _pdimZ = (Number(_y.nodeValue)==NaN)? 1: Number(_y.nodeValue);
          _y=_x.getAttributeNode("SizeC");
          var _cCnt = (Number(_y.nodeValue)==NaN)? 1: Number(_y.nodeValue);
          _y=_x.getAttributeNode("SizeZ");
          var _zSz = (Number(_y.nodeValue)==NaN)? -1: Number(_y.nodeValue);

          MRI.channel_size = _cCnt;
          MRI.z=_zSz;
          MRI.pixdim=[0 ,_pdimX ,_pdimY ,_pdimZ, 0.0, 0.0, 0.0, 0.0];
          return;
      }
    }

  while(1) { // repeat until no more ifd
      var current_ifd = new IFD();

      current_ifd._count=this.scan('ushort'); // how many tags for this ifd
      var ifd_pointer = this.tell();
      for ( var i = 0; i < current_ifd._count; i+=1) {
          var _identifier = this.scan('ushort');
          var _field = this.scan('ushort');
          var _count = this.scan('uint');
          var _value_type = 'uint';
          var _byte_size = -1;
          var _value = null;
      
          switch (_field) {
              case 1:
              case 2:
                _value_type = 'uchar';
                _byte_size = 1;
                break;
              case 3:
                _value_type = 'ushort';
                _byte_size = 2;
                break;
              case 4:
                _value_type = 'uint';
                _byte_size = 4;
                break;
        // MEI, rational number.. (float,float) or (int int)
              case 5:
                _value_type = 'uint';
                _byte_size = 4;
                _count=2;
                break;
              default:
              }
        
              if (_count * _byte_size > 4) {
              // returning address of somewhere..
                  var _addr = this.scan('uint');
                  // jump to it and then scan.. a blob
                  var save_pointer = this.tell();
                  this.jumpTo(_addr);
                  _value = this.scan(_value_type,_count);
                  this.jumpTo(save_pointer);
                  } else {
                      _value = this.scan(_value_type, _count);
                      /* special case -- on strip_offsets and strip_byte_count,
                                                     when there is just 1 item*/
                      if(_identifier == 273 || _identifier == 279) {
                         var _arr = [];
                         _arr.push(_value);
                         _value = _arr;
                      }
              }
              this.jumpTo(ifd_pointer+(i * 12 + 12));
        
              var tag;
              for (tag in TIFF_TAGS) {
                if (TIFF_TAGS[tag] == _identifier) {
                  // add it to the dictionary
                  current_ifd[tag] = _value;
                  break;
                }
              }
      } /* for loop */

      // extract the image for this ifd
      var _offsets = current_ifd['STRIP_OFFSETS'];
      var _bytecnt = current_ifd['STRIP_BYTE_COUNT'];
      var _bits = current_ifd['BITS_PER_SAMPLE'];
      // this could be an array, RGB
      if (_isArray(_bits)) { 
          _bits=_bits[0];
      };

      var _blob = this.loadImageData(_offsets, _bytecnt, _bits);
      current_ifd._data = _blob;

      // push the current ifd to our tiff file
      MRI.ifd.push(current_ifd);
   
      this.jumpTo(ifd_pointer + (current_ifd._count * 12));
      var _next_ifd = this.scan('uint');

      if(_next_ifd == 0) {   //no more ifd..
// always assume the first ifd has most complete initial
// setting. It seems some of the tiff file, only the first
// ifd's IMAGE_DESCRIPTION is filled

          var _first_ifd=MRI.ifd[0];
          var _x = _first_ifd['IMAGE_WIDTH'];
          var _y = _first_ifd['IMAGE_LENGTH'];
          var _des = _first_ifd['IMAGE_DESCRIPTION'];
          if(_des) {
              _des = _Uint8ToString(_des);
              _imageDescription(_des);
              } else {
              window.console.log("BAD BAD BAD.. IMAGE_DESCRIPTION");
          }
          var _z = (MRI.z != -1)? MRI.z:MRI.ifd.length;
          var _bits = _first_ifd['BITS_PER_SAMPLE'];

          /* it is rgb if photometric is 2 */
          var _rgb = MRI.rgb = (_first_ifd['PHOTO_INTERP'] == 2)? true: false;

          MRI.dim = [4, _x, _y, _z, 1, 1, 0, 0];
          
          if(_rgb && _isArray(_bits)) { 
             MRI.datatype=_bits[0];
             } else {
                 MRI.datatype=_bits;
          }

          /* grab the image data */
          var image_data = [];
          var image_size = _x * _y * _z;
          var slice_size = _x * _y;
          var array_type = _arrayType(MRI.datatype);
          var _ridx=0, _gidx=0, _bidx=0, _tidx=0;
          var _step=0, idx;

          while(1) {
              if(_rgb) { 
                  _ridx=image_data.push(new array_type(image_size))-1;
                  _gidx=image_data.push(new array_type(image_size))-1;
                  _bidx=image_data.push(new array_type(image_size))-1;
                  } else {
                      _tidx=image_data.push(new array_type(image_size))-1;
              }
              for(var i=0; i<_z; i++) {
                  idx=_step+i;

                  var _blob=MRI.ifd[idx]._data;
                  if(_rgb) {
                      var _blob0 = new array_type(slice_size);
                      var _blob1 = new array_type(slice_size);
                      var _blob2 = new array_type(slice_size);
                      /* split into 3 image data blobs */
                      for(var j=0; j<slice_size; j+=1) {
                          _blob0[j]=_blob[j];
                          _blob1[j]=_blob[j+slice_size];
                          _blob2[j]=_blob[j+(2*slice_size)];
                      }
                      image_data[_ridx].set(_blob0, i * slice_size);
                      image_data[_gidx].set(_blob1, i * slice_size);
                      image_data[_bidx].set(_blob2, i * slice_size);
                      } else {
                          image_data[_tidx].set(_blob, i * slice_size);
                  }
              }
              _step += _z;
              if(_step >= MRI.ifd.length) {
                  break;
              }
          }

          MRI.datas=image_data;
          MRI.data = image_data[0]; 
          var minmax = this.arrayMinMax(MRI.data);

          MRI.max = minmax[1];
          MRI.min = minmax[0];
          break;
          } else {
              this.jumpTo(_next_ifd);
      }
  }
  return MRI;
  
};

/**
 * Load the raw image data for a slice
 *
 * @param {!ArrayBuffer} array of offests (stripes)
 * @param {!ArrayBuffer} array of byte counts per strip
 * @param {!number} bits per sample
 * @return {!ArrayBuffer} array contain the raw image data
 */
X.parserTIFF.prototype.loadImageData = function(offsets, bytecnt, bits) {

  var _datatype = 'uchar';
  var _chunkSize = 1;
  var arraytype = Uint8Array;
  switch (bits) {
    case 8: // default case
      break;
    case 16:
      _datatype = 'ushort';
      _chunkSize = 2;
      arraytype = Uint16Array;
      break;
    case 32:
      _datatype = 'float';
      _chunkSize = 4;
      arraytype = Uint32Array;
      break;
  }

// array buffers..
  var _data=null;

  // just 1 strip
  if (offsets.length == 1) {
      this.jumpTo(offsets[0]);
      _data=this.scan(_datatype,(bytecnt[0]/_chunkSize));
      return _data;
  }

  // total slice size
  var _data_size = 0;
  for (var i=0; i < bytecnt.length; i+=1) {
      _data_size += bytecnt[i];
  }
  _data_size = _data_size/_chunkSize;

  _data = new arraytype(_data_size);
  for (var i=0; i < offsets.length; i+=1) {
      this.jumpTo(offsets[i]);
      var _tmp = this.scan(_datatype,(bytecnt[i]/_chunkSize));
      _data.set(_tmp, i * (bytecnt[i]/_chunkSize));
 
  }
  return _data;
}

X.parserTIFF.prototype.isRGB = function(MRI) {
    return MRI.rgb;
}

X.parserTIFF.prototype.resetMRI = function(MRI, channel) {

    var len=MRI.channel_size;

    if( channel < len) {
//       window.console.log("okay..");
    } else {
       throw new Error('Invalid channel, value out of bound, max is '+len);
    }

    MRI.data = MRI.datas[channel];
    var minmax = this.arrayMinMax(MRI.data);
    MRI.max = minmax[1];
    MRI.min = minmax[0];
    return MRI;
}


/**
 * Reset the channel
 *
 */
X.parserTIFF.prototype.resetChannel = function(object, channel) {
   /* in here */
   var _object=object;
   var _nm=X.parserTIFF.prototype.cacheTag(_object);

   var _MRI = null;
   var _this = null;
   for ( var i = 0; i < CACHE.length; i+=1) {
      var t=CACHE[i];
      if(t.nm == _nm) {
         _MRI=t.mri;
         _this=t.parser;
         break;
      }
   }
   if(_MRI == null) {
      throw new Error('Invalid TIFF cache entry');
   }

   _MRI=_this.resetMRI(_MRI, channel);

   /* reprocess object.. */
   _this.setupObject(_MRI, _object);

  _object._RASOrigin = _MRI.RASOrigin;
  _object._RASSpacing = _MRI.RASSpacing;
  _object._RASDimensions = _MRI.RASDimensions;
  _object._IJKToRAS = _MRI.IJKToRAS;
  _object._RASToIJK = _MRI.RASToIJK;
  _object._max = _MRI.max;
  _object._data = _MRI.data;
  _object._dirty = true;

  /* remove the existing visible slices */
   var _child = _object._children[0];
   _child['visible'] = false;
   _child = _object._children[1];
   _child['visible'] = false;
   _child = _object._children[2];
   _child['visible'] = false;

   _object._image = _this.reslice(_object);
}

X.parserTIFF.prototype.cacheTag = function(object) {
  var filepath = object._file._path;
  var fname = filepath.split('/').pop();
  var n = fname.replace(/\./g,'_');
  return n;
}


/**
 * Check if it is an rgb tiff volume
 *
 */
X.parserTIFF.prototype.isTiffRGB = function(object) {
   /* in here */
   var _object=object;
   var _nm=X.parserTIFF.prototype.cacheTag(_object);

   var _MRI = null;
   var _this = null;
   for ( var i = 0; i < CACHE.length; i+=1) {
      var t=CACHE[i];
      if(t.nm == _nm) {
         _MRI=t.mri;
         _this=t.parser;
         break;
      }
   }
   if(_MRI == null) {
      throw new Error('Invalid TIFF cache entry');
      return false;
   }

   var _rgb=_MRI.rgb;
   return _rgb;
}

X.parserTIFF.prototype.isTiffMultiChannel = function(object) {
   /* in here */
   var _object=object;
   var _nm=X.parserTIFF.prototype.cacheTag(_object);

   var _MRI = null;
   var _this = null;
   for ( var i = 0; i < CACHE.length; i+=1) {
      var t=CACHE[i];
      if(t.nm == _nm) {
         _MRI=t.mri;
         _this=t.parser;
         break;
      }
   }
   if(_MRI == null) {
      throw new Error('Invalid TIFF cache entry');
      return 0;
   }

   return _MRI.channel_size;
}


// export symbols (required for advanced compilation)
goog.exportSymbol('X.parserTIFF', X.parserTIFF);
goog.exportSymbol('X.parserTIFF.prototype.parse', X.parserTIFF.prototype.parse);
goog.exportSymbol('X.parserTIFF.prototype.resetChannel', X.parserTIFF.prototype.resetChannel);
goog.exportSymbol('X.parserTIFF.prototype.isTiffRGB', X.parserTIFF.prototype.isTiffRGB);
goog.exportSymbol('X.parserTIFF.prototype.isTiffMultiChannel', X.parserTIFF.prototype.isTiffMultiChannel);
