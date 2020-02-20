/*
 * chord.js
 *
 * Copyright (C) 2012 Aaron Spike [aaron@ekips.org]
 *
 * Based On:
 * Chord Image Generator
 * http://einaregilsson.com/2009/07/23/chord-image-generator/
 *
 * Copyright (C) 2009-2012 Einar Egilsson [einar@einaregilsson.com]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var ChordJS = (function(){
    
    //Constants
    var NO_FINGER = '-';
    var THUMB = 'T';
    var INDEX_FINGER = '1';
    var MIDDLE_FINGER = '2';
    var RING_FINGER = '3';
    var LITTLE_FINGER = '4';
    var OPEN = 0;
    var MUTED = -1;
    var FRET_COUNT = 5;
    var FONT_NAME = "Arial";
    
    var ChordBoxImage = function(name, chord, fingers, size, stringNames) {

        //Fields
        var _ctx;
        var Pen = function(color, size) {
            return function(){
                _ctx.strokeStyle = color;
                _ctx.lineWidth = size;
                _ctx.lineCap = 'round';
            };
        };
        var Font = function(fname, size) {
            return function(){
                _ctx.font = size+"px "+fname;
                _ctx.textBaseline = 'top';
            };
        };
        var _graphics = (function(){
            var DrawLine = function(pen, x1, y1, x2, y2) {
                _ctx.beginPath();
                pen();
                _ctx.moveTo(x1, y1);
                _ctx.lineTo(x2, y2);
                _ctx.stroke();
            };
            var FillRectangle = function(color, x1, y1, x2, y2){
                _ctx.beginPath();
                _ctx.fillStyle = color;
                _ctx.rect(x1, y1, x2, y2);
                _ctx.fill();
            };
            var DrawCircle = function(pen, x1, y1, diameter) {
                var radius = diameter/2;
                _ctx.beginPath();
                pen();
                _ctx.arc(x1+radius, y1+radius, radius, 0, 2 * Math.PI, false);
                _ctx.stroke();
            };
            var FillCircle = function(color, x1, y1, diameter) {
                var radius = diameter/2;
                _ctx.beginPath();
                _ctx.fillStyle = color;
                _ctx.arc(x1+radius, y1+radius, radius, 0, 2 * Math.PI, false);
                _ctx.fill();
            };
            var MeasureString = function(text, font) {
                font();
                var metrics = _ctx.measureText(text);
                metrics.Width = metrics.width;
                metrics.Height = _ctx.measureText('M').width; // calculating the with of the letter 'M' a good approximation of the line height
                return metrics;
            };
            var DrawString = function(text, font, color, x, y) {
                font();
                _ctx.fillStyle = color;
                _ctx.fillText(text, x, y);
            };
            return {
                DrawLine: DrawLine,
                FillRectangle: FillRectangle,
                DrawCircle: DrawCircle,
                FillCircle: FillCircle,
                MeasureString: MeasureString,
                DrawString: DrawString,
            };
        })();

        var _size;
        var _chordPositions = [];
        var _fingers = [NO_FINGER, NO_FINGER, NO_FINGER,
                                                 NO_FINGER, NO_FINGER, NO_FINGER];
        
        var _stringNames = stringNames || 'EADGBe';
        var _chordName;
        var _error;

        var _fretWidth;
        var _lineWidth;
        var _boxWidth;
        var _boxHeight;

        var _imageWidth;
        var _imageHeight;
        var _xstart; //upper corner of the chordbox
        var _ystart;
        var _nutHeight;

        var _dotWidth;
        var _signWidth;
        var _signRadius;

            //Different font sizes
        var _fretFontSize;
        var _fingerFontSize;
        var _nameFontSize;
        var _superScriptFontSize;
        var _markerWidth;

        var _foregroundBrush = '#000';
        var _backgroundBrush = '#FFF';

        var _baseFret;
        
        var InitializeSizes = function() {
            _fretWidth = 4 * _size;
            _nutHeight = _fretWidth / 2;
            _lineWidth = Math.ceil(_size * 0.31);
            _dotWidth = Math.ceil(0.9 * _fretWidth);
            _markerWidth = 0.7 * _fretWidth;
            _boxWidth = 5 * _fretWidth + 6 * _lineWidth;
            _boxHeight = FRET_COUNT * (_fretWidth + _lineWidth) + _lineWidth;

            //Find out font sizes
            //TODO: calculate perc via CSS
            //FontFamily family = new FontFamily(FONT_NAME);
            //perc = family.GetCellAscent(FontStyle.Regular) / family.GetLineSpacing(FontStyle.Regular);
            var perc = 0.8;
            _fretFontSize = _fretWidth / perc;
            _fingerFontSize = _fretWidth * 0.8;
            _guitarStringFontSize = 'bold ' + (_fretWidth * 0.8);
            _nameFontSize = _fretWidth * 2 / perc;
            _superScriptFontSize = 0.7 * _nameFontSize;
            if (_size == 1) {
                _nameFontSize += 2;
                _fingerFontSize += 2;
                _fretFontSize += 2;
                _superScriptFontSize += 2;
            }

            _xstart = _fretWidth;
            _ystart = Math.round(0.2 * _superScriptFontSize + _nameFontSize + _nutHeight + 1.7 * _markerWidth);

            _imageWidth = (_boxWidth + 5 * _fretWidth);
            _imageHeight = (_boxHeight + _ystart + _fretWidth + _fretWidth);

            _signWidth = (_fretWidth * 0.75);
            _signRadius = _signWidth / 2;
        };
        
        var getWidth = function(){return _imageWidth;};
        var getHeight = function(){return _imageHeight;};

        var ParseSize = function(size) {
            _size = parseFloat(size);
            if (isNaN(_size)) {
                _size = 1;
            }
        };

        var ParseFingers = function(fingers) {
            fingers = String(fingers).toUpperCase()+'------';
            fingers = fingers.replace(/[^\-T1234]/g,'');
            _fingers = fingers.substr(0,6).split('');
        };

        var ParseChord = function(chord) {
            if (chord == null || typeof chord == 'undefined' || !chord.match(/[\dxX]{6}|((1|2)?[\dxX]-){5}(1|2)?[\dxX]/)) {
                _error = true;
            } else {
                var parts;
                if (chord.length > 6) {
                    parts = chord.split('-');
                } else {
                    parts = chord.split('');
                }
                var maxFret = 0;
                var minFret = Number.MAX_VALUE;
                for (var i = 0; i < 6; i++) {
                    if (parts[i].toUpperCase() == "X") {
                        _chordPositions[i] = MUTED;
                    } else {
                        _chordPositions[i] = parseInt(parts[i]);
                        maxFret = Math.max(maxFret, _chordPositions[i]);
                        if (_chordPositions[i] != 0) {
                            minFret = Math.min(minFret, _chordPositions[i]);
                        }
                    }
                }
                if (maxFret <= 5) {
                    _baseFret = 1;
                } else {
                    _baseFret = minFret;
                }
            }
        };
        
        
        var CreateImage = function(ctx,layout) {
            _ctx = ctx;
            _graphics.FillRectangle(_backgroundBrush, 0, 0, _imageWidth, _imageHeight);
            if (_error) {
                //Draw red x
                var errorPen = Pen('red', 3);
                _graphics.DrawLine(errorPen, 0, 0, _imageWidth, _imageHeight);
                _graphics.DrawLine(errorPen, 0, _imageHeight, _imageWidth, 0);
            } else {
                if (typeof layout === 'undefined' || layout === '1') {
                    DrawChordBox();
                    DrawBars();
                    DrawChordPositionsAndFingers();
                    DrawChordName();
                    DrawStringNames();
                } else if (layout === '2') {
                    DrawChordBox();
                    DrawChordPositions();
                    DrawBars();
                    DrawChordName();
                    DrawFingers();
                }
            }
        };
        
        var DrawChordBox = function() {
            var pen = Pen(_foregroundBrush, _lineWidth);
            var totalFretWidth = _fretWidth + _lineWidth;

            for (var i = 0; i <= FRET_COUNT; i++) {
                var y = _ystart + i * totalFretWidth;
                _graphics.DrawLine(pen, _xstart, y, _xstart + _boxWidth - _lineWidth, y);
            }

            for (i = 0; i < 6; i++) {
                var x = _xstart + (i * totalFretWidth);
                _graphics.DrawLine(pen, x, _ystart, x, _ystart + _boxHeight - _lineWidth);
            }

            if (_baseFret == 1) {
                //Need to draw the nut
                var nutHeight = _fretWidth / 2;
                _graphics.FillRectangle(_foregroundBrush, _xstart - _lineWidth / 2, _ystart - nutHeight, _boxWidth, nutHeight);
            }
        };
        
        var DrawBars = function() {
            var bars = {};
            var bar;
            for (var i = 0; i < 5; i++) {
                if (_chordPositions[i] != MUTED && _chordPositions[i] != OPEN && _fingers[i] != NO_FINGER && !bars.hasOwnProperty(_fingers[i])) {
                    bar = { 'Str':i, 'Pos':_chordPositions[i], 'Length':0, 'Finger':_fingers[i] };
                    for (var j = i + 1; j < 6; j++) {
                        if (_fingers[j] == bar['Finger'] && _chordPositions[j] == _chordPositions[i]) {
                            bar['Length'] = j - i;
                        }
                    }
                    if (bar['Length'] > 0) {
                        bars[bar['Finger']] = bar;
                    }
                }
            }

            //TODO: figure out why there are two pens here
            var pen = Pen(_foregroundBrush, _lineWidth * 3);
            var totalFretWidth = _fretWidth + _lineWidth;
            for (var b in bars) {
                if (bars.hasOwnProperty(b)){
                    bar = bars[b];
                    var xstart = _xstart + bar['Str'] * totalFretWidth;
                    var xend = xstart + bar['Length'] * totalFretWidth;
                    var y = _ystart + (bar['Pos'] - _baseFret + 1) * totalFretWidth - (totalFretWidth / 2);
                    pen = Pen(_foregroundBrush, _dotWidth / 2);
                    _graphics.DrawLine(pen, xstart, y, xend, y);
                }
            }
        };

        
        var DrawChordPositions = function() {
            var yoffset = _ystart - _fretWidth;
            var xoffset = _lineWidth / 2;
            var totalFretWidth = _fretWidth + _lineWidth;
            var xfirstString = _xstart + 0.5 * _lineWidth;
            for (var i = 0; i < _chordPositions.length; i++) {
                var absolutePos = _chordPositions[i];
                var relativePos = absolutePos - _baseFret + 1;

                var xpos = _xstart - (0.5 * _fretWidth) + (0.5 * _lineWidth) + (i * totalFretWidth);
                if (relativePos > 0) {
                    var ypos = relativePos * totalFretWidth + yoffset;
                    _graphics.FillCircle(_foregroundBrush, xpos, ypos, _dotWidth);
                } else if (absolutePos == OPEN) {
                    var pen = Pen(_foregroundBrush, _lineWidth);
                    var ypos = _ystart - _fretWidth;
                    var markerXpos = xpos + ((_dotWidth - _markerWidth) / 2);
                    if (_baseFret == 1) {
                        ypos -= _nutHeight;
                    }
                    _graphics.DrawCircle(pen, markerXpos, ypos, _markerWidth);
                } else if (absolutePos == MUTED) {
                    var pen = Pen(_foregroundBrush, _lineWidth * 1.5);
                    var ypos = _ystart - _fretWidth;
                    var markerXpos = xpos + ((_dotWidth - _markerWidth) / 2);
                    if (_baseFret == 1) {
                        ypos -= _nutHeight;
                    }
                    _graphics.DrawLine(pen, markerXpos, ypos, markerXpos + _markerWidth, ypos + _markerWidth);
                    _graphics.DrawLine(pen, markerXpos, ypos + _markerWidth, markerXpos + _markerWidth, ypos);
                }
            }
        };
        
        
        var DrawChordPositionsAndFingers = function() {
            var yoffset = _ystart - _fretWidth;
            var xoffset = _lineWidth / 2;
            var totalFretWidth = _fretWidth + _lineWidth;
            var xfirstString = _xstart + 0.5 * _lineWidth;
            var font = Font(FONT_NAME, _fingerFontSize);
            for (var i = 0; i < _chordPositions.length; i++) {
                var absolutePos = _chordPositions[i];
                var relativePos = absolutePos - _baseFret + 1;

                var xpos = _xstart - (0.5 * _fretWidth) + (0.5 * _lineWidth) + (i * totalFretWidth);
                if (relativePos > 0) {
                    var ypos = relativePos * totalFretWidth + yoffset;
                    _graphics.FillCircle(_foregroundBrush, xpos, ypos, _dotWidth);
                    var finger = _fingers[i];
                    if (finger != NO_FINGER) {
                        var charSize = _graphics.MeasureString(finger.toString(), font);
                        _graphics.DrawString(finger.toString(), font, _backgroundBrush, xpos - (0.5 * charSize.Width) + _dotWidth/2, ypos - (0.5 * charSize.Height) + _dotWidth/2);
                    }
                } else if (absolutePos == OPEN) {
                    var pen = Pen(_foregroundBrush, _lineWidth);
                    var ypos = _ystart - _fretWidth;
                    var markerXpos = xpos + ((_dotWidth - _markerWidth) / 2);
                    if (_baseFret == 1) {
                        ypos -= _nutHeight;
                    }
                    _graphics.DrawCircle(pen, markerXpos, ypos, _markerWidth);
                    var finger = _fingers[i];
                    if (finger != NO_FINGER) {
                        var charSize = _graphics.MeasureString(finger.toString(), font);
                        _graphics.DrawString(finger.toString(), font, _backgroundBrush, xpos - (0.5 * charSize.Width) + _dotWidth/2, ypos - (0.5 * charSize.Height) + _dotWidth/2);
                    }
                } else if (absolutePos == MUTED) {
                    var pen = Pen(_foregroundBrush, _lineWidth * 1.5);
                    var ypos = _ystart - _fretWidth;
                    var markerXpos = xpos + ((_dotWidth - _markerWidth) / 2);
                    if (_baseFret == 1) {
                        ypos -= _nutHeight;
                    }
                    _graphics.DrawLine(pen, markerXpos, ypos, markerXpos + _markerWidth, ypos + _markerWidth);
                    _graphics.DrawLine(pen, markerXpos, ypos + _markerWidth, markerXpos + _markerWidth, ypos);
                    var finger = _fingers[i];
                    if (finger != NO_FINGER) {
                        var charSize = _graphics.MeasureString(finger.toString(), font);
                        _graphics.DrawString(finger.toString(), font, _backgroundBrush, xpos - (0.5 * charSize.Width) + _dotWidth/2, ypos - (0.5 * charSize.Height) + _dotWidth/2);
                    }
                }
            }
        };
        
        
        var DrawFingers = function() {
            var xpos = _xstart + (0.5 * _lineWidth);
            var ypos = _ystart + _boxHeight;
            var font = Font(FONT_NAME, _fingerFontSize);
            for (var f=0; f<_fingers.length; f++) {
                var finger = _fingers[f];
                if (finger != NO_FINGER) {
                    var charSize = _graphics.MeasureString(finger.toString(), font);
                    _graphics.DrawString(finger.toString(), font, _foregroundBrush, xpos - (0.5 * charSize.Width), ypos - (0.5 * charSize.Height) + _dotWidth/2);
                }
                xpos += (_fretWidth + _lineWidth);
            }
        }
        
        
        var DrawStringNames = function() {
            var xpos = _xstart + (0.5 * _lineWidth);
            var ypos = _ystart + _boxHeight;
            var font = Font(FONT_NAME, _guitarStringFontSize);
            for (var s=0; s<6; s++) {
                var guitarString = _stringNames[s];
                var charSize = _graphics.MeasureString(guitarString, font);
                _graphics.DrawString(guitarString, font, _foregroundBrush, xpos - (0.5 * charSize.Width), ypos);
                xpos += (_fretWidth + _lineWidth);
            }
        };

        var DrawChordName = function() {

            var nameFont = Font(FONT_NAME, _nameFontSize);
            var superFont = Font(FONT_NAME, _superScriptFontSize);
            var name;
            var supers;
            if (_chordName.indexOf('_') == -1) {
                name = _chordName;
                supers = "";
            } else {
                var parts = _chordName.split('_');
                name = parts[0];
                supers = parts[1];
            }
            var stringSize = _graphics.MeasureString(name, nameFont);

            var xTextStart = _xstart;
            if (stringSize.Width < _boxWidth) {
                xTextStart = _xstart + ((_boxWidth - stringSize.Width) / 2);
            }
            _graphics.DrawString(name, nameFont, _foregroundBrush, xTextStart, 0.2 * _superScriptFontSize);
            if (supers != "") {
                _graphics.DrawString(supers, superFont, _foregroundBrush, xTextStart + 0.8 * stringSize.Width, 0);
            }

            if (_baseFret > 1) {
                var fretFont = Font(FONT_NAME, _fretFontSize);
                var offset = (_fretFontSize - _fretWidth) / 2;
                _graphics.DrawString(_baseFret + "fr", fretFont, _foregroundBrush, _xstart + _boxWidth + 0.4 * _fretWidth, _ystart - offset);
            }
        };
        
        //MAIN
        if (name == null || typeof name == 'undefined') {
            _chordName = "";
        } else {
            _chordName = name.replace(" ", "");
        }
        ParseChord(chord);
        ParseFingers(fingers);
        ParseSize(size);
        InitializeSizes();
        
        return {
            getWidth: getWidth,
            getHeight: getHeight,
            Draw: CreateImage
        };

    };  
    
    function GenerateChordHtml(name, positions, fingering, size, layout, stringNames) {
        if (positions.length != 6 || fingering.length != 6) {
            console.error('ChordJS cannot generate a chord diagram from invalid chord input! (Too many positions or fingers.');
            console.log('ChordJS will render an empty chord instead!');
            positions = 'xxxxxx';
            fingering = '------';
        }
        var chordObj = ChordBoxImage(name, positions, fingering, size, stringNames);
        var canvas = document.createElement('canvas');
        canvas.setAttribute('class', 'rendered-chord');
        canvas.setAttribute('width', chordObj.getWidth());
        canvas.setAttribute('height', chordObj.getHeight());
        var ctx = canvas.getContext('2d');
        chordObj.Draw(ctx,layout);
        return canvas;
    }
    
    //requires jQuery
    //example: <chord name="A" positions="X02220" fingers="--222-" size="7" ></chord>
    var ReplaceChordElements = function(baseEl) {
          baseEl = baseEl || 'body';

          var renderedChords = document.querySelector(baseEl).getElementsByClassName('rendered-chord')
          for(var i=0, l=renderedChords.length; i<l; ++i) {
              var elt = renderedChords[0];
              elt.remove();
          }
          var chords = document.getElementsByTagName('chord');
          for(var i=0; i<chords.length; ++i) {
            var elt = chords[i]
            var name = elt.getAttribute('name');
            var positions = elt.getAttribute('positions');
            var fingers = elt.getAttribute('fingers');
            var size = elt.getAttribute('size');
            if (elt.getAttribute('layout') === null) {
				var layout = elt.setAttribute('layout', '1');
			} else {
				var layout = elt.getAttribute('layout');
			}
            var stringNames = elt.getAttribute('strings');
            var canvas = GenerateChordHtml(name, positions, fingers, size, layout, stringNames);
            elt.parentNode.insertBefore(canvas, elt);
        };
    };
      
    return {
        chord: ChordBoxImage,
        replace: ReplaceChordElements,
        generate: GenerateChordHtml
    };

})();

var chords = ChordJS;
