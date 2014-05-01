/* Copyright (c) 2014 meMorizE. See the file LICENSE for copying permission.                                     */
/* copied and modified from Module 'ILI9341' which is                                                            */
/* Copyright (c) 2013 Juergen Marsch and Gordon Williams, Pur3 Ltd. See the file LICENSE for copying permission. */
/* 
Module for the ST7735 LCD controller

Just for example:
```
SPI1.setup({sck:A5, mosi:A7, baud:1000000 });
var g = require("ST7735").connect(SPI1, A3, B10, B11, function() {
  g.clear();
  g.drawString("Hello",0,0);
  g.setFontVector(20);
  g.setColor(0,0.5,1);
  g.drawString("Espruino",0,10);
});
```

*/
var LCD_WIDTH = 128;
var LCD_HEIGHT = 160;

exports.connect = function(spi, dc, ce, rst, callback) {
  function writeCMD(d){
    dc.write(0);
    ce.write(0);
    spi.send(d);
    dc.write(1);
  }  
  function writeCD(c,d){
    dc.write(0);
    ce.write(0);
    spi.send(c);
    dc.write(1);
    spi.send(d);
    ce.write(1);
  }

  var LCD = Graphics.createCallback(LCD_WIDTH, LCD_HEIGHT, 16, {
    setPixel:function(x,y,c){
      writeCD(0x2A,[0,x,0,x+1]);
      writeCD(0x2B,[0,y,0,y+1]);
      writeCD(0x2C,[c>>8,c]);
   },
   fillRect:function(x1,y1,x2,y2,c){
      var cnt = (x2 - x1 + 1) * (y2 - y1 + 1);
      writeCD(0x2A,[0,x1,0,x2]);
      writeCD(0x2B,[0,y1,0,y2]);
      writeCMD(0x2C);
      c = String.fromCharCode(c>>8)+String.fromCharCode(c);
      var cl = c+c+c+c;
      cl = cl+cl;
      var cn = cnt>>3;
      while (cn--)spi.send(cl);
      cl = [c>>8,c,c>>8];
      cn = cnt&7;
      while (cn--)spi.send(c);
      ce.write(1);
    }
  });

  ce.write(1);
  dc.write(1);
  rst.write(0);
  setTimeout(function(){ // reset hold
    rst.write(1);
    setTimeout(function(){ // reset post-release wait
      // ce.write(0); // chip select
      // writeCMD(0x01); // Software reset
      // setTimeout(function(){ // wait 120ms

        ce.write(0); // chip select
        writeCMD(0x28);ce.write(1); // DISPLAY OFF
        // ?CF POWER CONTROL B
        // ED POWER ON SEQUENCE CONTROL
        // E8 DRIVER TIMING CONTROL A
        // CB POWER CONTROL A
        // F7 PUMP RATIO CONTROL
        // EA DRIVER TIMING CONTROL B
        writeCD(0xC0,[0x02,0x70]); // POWER CONTROL 1 U_GVDD I_AVDD
        writeCD(0xC1,0x05); // POWER CONTROL 2 VGH VGL
        // C5 VCOM CONTROL 1
        // C7 VCOM CONTROL 2
        writeCD(0x36,0xC0); // MADCTL MEMORY ACCESS CONTROL
        writeCD(0x3A,0x05); // COLMOD PIXEL FORMAT SET
        // B1 FRAME RATE CONTROL
        // F2 ENABLE 3G
        // 26 GAMMA SET
        // E0 POSITIVE GAMMA CORRECTION
        // E1 NEGATIVE GAMMA CORRECTION
        // B7 ENTRY MODE SET
        // B6 DISPLAY FUNCTION CONTROL
        writeCMD(0x11);ce.write(1);   // SLPOUT Sleep out & booster on
        setTimeout(function(){
          writeCMD(0x29);ce.write(1); // DISPON Display on
          setTimeout(function(){
            if (callback!==undefined) callback();
          },120);           // wait after DISPON
        },120);         // wait after sleep out & booster on
      //},120);     // wait after software reset
    },120);     // reset post-release wait    
  },1);    // reset hold


  return LCD;
};
