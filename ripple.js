/**
 * JavaScript Ripple
 */
var Ripple = function() {
  this.ACCURACY = 256;
  this.WEIGHT = 4;
  this.SIZE = 2;
  this.canvas = null;
  this.table = null;
  this.palette = null;
  this.baseImagePixels = null;
  this.pixels = null;
};

Ripple.prototype = {
  initialize: function(canvas) {
    this.canvas = canvas;
    var context = canvas.getContext('2d');
    this.baseImagePixels = new Array(canvas.width * canvas.height);
    
    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < canvas.height; i++) {
      for (var j = 0; j < canvas.width; j++) {
        var p = ((i * 4) * canvas.width) + (j * 4);
        this.baseImagePixels[(i * canvas.width) + j] = 
          (image.data[p + 0] << 16) +
          (image.data[p + 1] <<  8) +
          (image.data[p + 2] <<  0);
      }
    }
    this.initTable_();
    this.initPalette_(0, 20, 40, 0, 180, 200);
  },
  getUpdater: function() {
    var imagePixels = this.baseImagePixels.concat();
    for (var i = 0; i < imagePixels.length; i++) {
      var k = imagePixels[i];
      imagePixels[i] = (
        ((k & 0x00ff0000) >> 16) + 
        ((k & 0x0000ff00) >>  8) + 
        ((k & 0x000000ff) >>  0)
      ) / 3;
    }
    var tmpPixels = this.baseImagePixels.concat();
    
    this.pixels = new Array(this.canvas.width * this.canvas.height);
    for(i = 0; i < this.pixels.length; i++)
      this.pixels[i] = 0;
    var pixelsBefore = this.pixels.concat();
    var pixelsMain = this.pixels.concat();
    
    var wait = 0;
    var that = this;
    return function() {
      if (--wait < 0) {
        wait = Math.floor(Math.random()*50)+10;
        that.makeWave(
          Math.floor(Math.random() * (that.canvas.width-5) + 2),
          Math.floor(Math.random() * (that.canvas.height-5) + 2),
          (Math.floor(Math.random() * 600) + 500) * that.ACCURACY
        );
      }
      // 波紋処理
      for(var y = 1; y < that.canvas.height - 1; y++) {
        var py = that.canvas.width * y;
        for(var x = 1; x < that.canvas.width - 1; x++) {
          var j = py + x;
          var f = pixelsMain[j] + (
            pixelsBefore[j - that.canvas.width] + // top
            that.pixels[j + that.canvas.width] +  // bottom
            that.pixels[j + 1] +                  // right
            pixelsBefore[j - 1]                   // left
          ) / that.WEIGHT;
          f -= Math.floor(f / 64);
          pixelsMain[j] = f - (pixelsBefore[j] = that.pixels[j]);
          that.pixels[j] = f;
          var k = Math.floor(imagePixels[j] + that.pixels[j] / that.ACCURACY);
          tmpPixels[j] = that.palette[(k > 255) ? 255 : ((k < 0) ? 0 : k)];
        }
      }
      that.arrayToImage_(tmpPixels, that.canvas);
    };
  },
  makeWave: function(px, py, size) {
    if (typeof size === 'undefined')
      size = -300 * this.ACCURACY;
    var off = function(x, y) {
      if(x < 0 || x >= this.canvas.width)
        x = 0;
      if(y < 0 || y >= this.canvas.height)
        y = 0;
      return y * this.canvas.width + x;
    };
    for(var i = -this.SIZE; i < this.SIZE; i++) {
      for(var j = -this.SIZE; j < this.SIZE; j++) {
        var r = this.table[i + this.SIZE][j + this.SIZE];
        if(r <= this.SIZE) {
          this.pixels[off(i + px, j + py)] = size >> r;
        }
      }
    }
  },
  makeTransverseWave: function(y) {
    var hh = y * this.canvas.width;
    if(y < this.canvas.height) {
      for(var i = 1; i < this.canvas.width - 1; i++) {
        this.pixels[hh + i] = 
          this.pixels[hh + this.canvas.width + i] = 
          this.pixels[hh + this.canvas.width + this.canvas.width + i] = -128 * this.ACCURACY;
      }
    }
  },
  initTable_: function() {
    var size = this.SIZE * 2;
    this.table = new Array(size);
    for (var i = 0; i < size; i++) {
      this.table[i] = new Array(size);
      for (var j = 0; j < size; j++) {
        this.table[i][j] = Math.round(
          Math.sqrt((i - this.SIZE) * (i - this.SIZE) + (j - this.SIZE) * (j - this.SIZE))
        );
      }
    }
  },
  initPalette_: function(sr, sg, sb, er, eg, eb) {
    this.palette = new Array(256);
    for(var i = 0; i < this.palette.length; i++) {
      var d = i / (this.palette.length - 1);
      var r = Math.floor((er-sr) * d + sr);
      var g = Math.floor((eg-sg) * d + sg);
      var b = Math.floor((eb-sb) * d + sb);
      this.palette[i] = 0 + (r << 16) + (g << 8) + (b << 0);
    }
  },
  arrayToImage_: function(pixelArray, canvas) {
    var context = canvas.getContext('2d');
    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < canvas.height; i++) {
      for (var j = 0; j < canvas.width; j++) {
        var p = ((i * 4) * canvas.width) + (j * 4);
        image.data[p + 0] = ((pixelArray[i * canvas.width + j] & 0xff0000) >> 16);
        image.data[p + 1] = ((pixelArray[i * canvas.width + j] & 0x00ff00) >>  8);
        image.data[p + 2] = ((pixelArray[i * canvas.width + j] & 0x0000ff) >>  0);
      }
    }
    context.putImageData(image, 0, 0);
  }
};
