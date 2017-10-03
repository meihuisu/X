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
 *      "Free software" is a matter of liberty, not price.
 *      "Free" as in "free speech", not as in "free beer".
 *                                         - Richard M. Stallman
 * 
 * 
 */

// provides
goog.provide('X.parserOBJ');

// requires
goog.require('X.event');
goog.require('X.object');
goog.require('X.parser');
goog.require('X.triplets');

/**
 * Create a parser for the .OBJ format. ASCII or binary format is supported.
 * 
 * @constructor
 * @extends X.parser
 */
X.parserOBJ = function() {

  //
  // call the standard constructor of X.base
  goog.base(this);
  
  //
  // class attributes
  
  /**
   * @inheritDoc
   * @const
   */
  this._classname = 'parserOBJ';
  
};
// inherit from X.parser
goog.inherits(X.parserOBJ, X.parser);


/**
 * @inheritDoc
 */
X.parserOBJ.prototype.parse = function(container, object, data, flag) {

  var _data=data;

  X.TIMER(this._classname + '.parse');

// attempt to uncompress it
  try {
     var inflate = new Zlib.Gunzip(new Uint8Array(_data));
     _data = inflate.decompress().buffer;
  } catch (e) {
        // it must be uncompressed OBJ
  }

  this._data = _data;
  var _length = _data.byteLength;
  var byteData = this.scan('uchar', _length);

  // allocate memory using a good guess
  var _pts = [];
  object._points = new X.triplets(_length);
  object._normals = new X.triplets(_length);
  var p = object._points;
  var n = object._normals;
  
  // store the beginning of the byte range
  var _rangeStart = 0;
 
  var i;

// track the usage count of each index
  var indexCounter= new Uint32Array(_length/9);
// track the index sets of each triangle (1,2,3,1,2,3...)
  var indList=[];
// normal used per triangle, pre allocated size is best guess
  var normals = new Array(_length);

  for (i = 0; i < _length; ++i) {
     
     if (byteData[i] == 10) { // line break

       var _substring = this.parseChars(byteData, _rangeStart, i);
       
       var _d = _substring.replace(/\s{2,}/g, ' ').split(' ');

       if (_d[0] == "v") {

         // grab the x, y, z coordinates
         var x = parseFloat(_d[1]);
         var y = parseFloat(_d[2]);
         var z = parseFloat(_d[3]);
         _pts.push([x,y,z]);

       } else if (_d[0] == "f") {

         // assumes all points have been read
         var ind1 = parseInt(_d[1], 10)-1;
         var ind2 = parseInt(_d[2], 10)-1;
         var ind3 = parseInt(_d[3], 10)-1;

         var p1 = _pts[ind1];
         var p2 = _pts[ind2];
         var p3 = _pts[ind3];
     
         indList.push(ind1);
         indList.push(ind2);
         indList.push(ind3);

         indexCounter[ind1] +=1;
         indexCounter[ind2] +=1;
         indexCounter[ind3] +=1;

         p.add(p1[0], p1[1], p1[2]);
         p.add(p2[0], p2[1], p2[2]);
         p.add(p3[0], p3[1], p3[2]);
     
         // calculate normal
         var v1 = new goog.math.Vec3(p1[0], p1[1], p1[2]);
         var v2 = new goog.math.Vec3(p2[0], p2[1], p2[2]);
         var v3 = new goog.math.Vec3(p3[0], p3[1], p3[2]);
         var norm = goog.math.Vec3.cross(v2.subtract(v1),v3.subtract(v1));
         norm.normalize();

         if(normals[ind1]) {
           var t=normals[ind1];
           var nx=t.x+norm.x;
           var ny=t.y+norm.y;
           var nz=t.z+norm.z;
           normals[ind1]= { x:nx, y:ny, z:nz };
           } else {
             normals[ind1]= { x:norm.x, y:norm.y, z:norm.z };
         }

         if(normals[ind2]) {
           var t=normals[ind2];
           var nx=t.x+norm.x;
           var ny=t.y+norm.y;
           var nz=t.z+norm.z;
           normals[ind2]= { x:nx, y:ny, z:nz };
           } else {
             normals[ind2]= { x:norm.x, y:norm.y, z:norm.z };
         }

         if(normals[ind3]) {
           var t=normals[ind3];
           var nx=t.x+norm.x;
           var ny=t.y+norm.y;
           var nz=t.z+norm.z;
           normals[ind3]= { x:nx, y:ny, z:nz };
           } else {
             normals[ind3]= { x:norm.x, y:norm.y, z:norm.z };
         }

//         n.add(norm.x, norm.y, norm.z);
//         n.add(norm.x, norm.y, norm.z);
//         n.add(norm.x, norm.y, norm.z);
       }

       _rangeStart = i+1; // skip the newline character

     }
  
  }

// try out some normalization solution..
  var numberOfTriangles=p.length/9;
  for(i=0; i< numberOfTriangles; i++ ) {

    var t=i*3;

    // grab the three indices which define a triangle
    var _ind1=indList[t];
    var _ind2=indList[t+1];
    var _ind3=indList[t+2];

    var c1=indexCounter[_ind1];
    var c2=indexCounter[_ind2];
    var c3=indexCounter[_ind3];

    var n1=normals[_ind1];
    var n1x = n1.x;
    var n1y = n1.y;
    var n1z = n1.z;

    var n2 = normals[_ind2];
    var n2x = n2.x;
    var n2y = n2.y;
    var n2z = n2.z;

    var n3 = normals[_ind3];
    var n3x = n3.x;
    var n3y = n3.y;
    var n3z = n3.z;

    // convert the normals to vectors
    var n1v = new goog.math.Vec3(n1x, n1y, n1z);
    var n2v = new goog.math.Vec3(n2x, n2y, n2z);
    var n3v = new goog.math.Vec3(n3x, n3y, n3z);

    // transform triangle normals to vertex normals
    var normal1 = n1v.scale(1 / indexCounter[_ind1]).normalize();
    var normal2 = n2v.scale(1 / indexCounter[_ind2]).normalize();
    var normal3 = n3v.scale(1 / indexCounter[_ind3]).normalize();

    n.add(normal1.x, normal1.y, normal1.z);
    n.add(normal2.x, normal2.y, normal2.z);
    n.add(normal3.x, normal3.y, normal3.z);
}

  X.TIMERSTOP(this._classname + '.parse');
  
  // the object should be set up here, so let's fire a modified event
  var modifiedEvent = new X.event.ModifiedEvent();
  modifiedEvent._object = object;
  modifiedEvent._container = container;
  this.dispatchEvent(modifiedEvent);
  
};

// export symbols (required for advanced compilation)
goog.exportSymbol('X.parserOBJ', X.parserOBJ);
goog.exportSymbol('X.parserOBJ.prototype.parse', X.parserOBJ.prototype.parse);
