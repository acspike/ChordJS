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

if (!window.console) console = {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};

// ChordJS is a more unique namespace. keeping 'chords' for backwards-compatibility.
var ChordJS,chords;
ChordJS = chords = (function(){
    
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
    
    var ChordBoxImage = function(name, chord, fingers, size) {
	var _stringCount= chord.length;
	var _fretCount= FRET_COUNT;
	if(_stringCount==4) {
		//Ukelele etc
		_fretCount=4;
	}
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
            _boxWidth = (_stringCount-1) * _fretWidth + (_stringCount) * _lineWidth;
            _boxHeight = _fretCount * (_fretWidth + _lineWidth) + _lineWidth;

            //Find out font sizes
            //TODO: calculate perc via CSS
            //FontFamily family = new FontFamily(FONT_NAME);
            //perc = family.GetCellAscent(FontStyle.Regular) / family.GetLineSpacing(FontStyle.Regular);
            var perc = 0.8;
            _fretFontSize = _fretWidth / perc;
            _fingerFontSize = _fretWidth * 0.8;
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
            if (chord == null || typeof chord == 'undefined' 
			|| (!chord.match(/[\dxX]{6}|((1|2)?[\dxX]-){5}(1|2)?[\dxX]/)
			&& !chord.match(/[\dxX]{4}|((1|2)?[\dxX]-){3}(1|2)?[\dxX]/))
			) {
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
                for (var i = 0; i < _stringCount; i++) {
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
        
        
        var CreateImage = function(ctx, style) {
	    // introducing a parameter object, for styling. Introduce defaults, keeping backwards compatibility in mind.
	    style = typeof style !== 'undefined' ? style : { 'background-color' : _backgroundBrush };
	    style['color'] = style['color'] ? style['color'] : _foregroundBrush;
	    style['font-family'] = style['font-family'] ? style['font-family'] : FONT_NAME;

            _ctx = ctx;
            //use top-level backgroundBrush unless specified
	    if ( style['background-color'] ) {
            	_graphics.FillRectangle(style['background-color'], 0, 0, _imageWidth, _imageHeight);
	    }
            if (_error) {
                //Draw red x
                var errorPen = Pen('red', 3);
                _graphics.DrawLine(errorPen, 0, 0, _imageWidth, _imageHeight);
                _graphics.DrawLine(errorPen, 0, _imageHeight, _imageWidth, 0);
            } else {
                DrawChordBox(style);
                DrawChordPositions(style);
                DrawChordName(style);
                DrawFingers(style);
                DrawBars(style);
            }
        };
        
        var DrawChordBox = function(style) {
            var pen = Pen(style.color, _lineWidth);
            var totalFretWidth = _fretWidth + _lineWidth;

            for (var i = 0; i <= _fretCount; i++) {
                var y = _ystart + i * totalFretWidth;
                _graphics.DrawLine(pen, _xstart, y, _xstart + _boxWidth - _lineWidth, y);
            }

            for (i = 0; i < _stringCount; i++) {
                var x = _xstart + (i * totalFretWidth);
                _graphics.DrawLine(pen, x, _ystart, x, _ystart + _boxHeight - _lineWidth);
            }

            if (_baseFret == 1) {
                //Need to draw the nut
                var nutHeight = _fretWidth / 2;
                _graphics.FillRectangle(style.color, _xstart - _lineWidth / 2, _ystart - nutHeight, _boxWidth, nutHeight);
            }
        };
        
        var DrawBars = function(style) {
            var bars = {};
            var bar;
            for (var i = 0; i < (_stringCount-1); i++) {
                if (_chordPositions[i] != MUTED && _chordPositions[i] != OPEN && _fingers[i] != NO_FINGER && !bars.hasOwnProperty(_fingers[i])) {
                    bar = { 'Str':i, 'Pos':_chordPositions[i], 'Length':0, 'Finger':_fingers[i] };
                    for (var j = i + 1; j < _stringCount; j++) {
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
            var pen = Pen(style.color, _lineWidth * 3);
            var totalFretWidth = _fretWidth + _lineWidth;
            for (var b in bars) {
                if (bars.hasOwnProperty(b)){
                    bar = bars[b];
                    var xstart = _xstart + bar['Str'] * totalFretWidth;
                    var xend = xstart + bar['Length'] * totalFretWidth;
                    var y = _ystart + (bar['Pos'] - _baseFret + 1) * totalFretWidth - (totalFretWidth / 2);
                    pen = Pen(style.color, _dotWidth / 2);
                    _graphics.DrawLine(pen, xstart, y, xend, y);
                }
            }
        };

        var DrawChordPositions = function(style) {
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
                    _graphics.FillCircle(style.color, xpos, ypos, _dotWidth);
                } else if (absolutePos == OPEN) {
                    var pen = Pen(style.color, _lineWidth);
                    var ypos = _ystart - _fretWidth;
                    var markerXpos = xpos + ((_dotWidth - _markerWidth) / 2);
                    if (_baseFret == 1) {
                        ypos -= _nutHeight;
                    }
                    _graphics.DrawCircle(pen, markerXpos, ypos, _markerWidth);
                } else if (absolutePos == MUTED) {
                    var pen = Pen(style.color, _lineWidth * 1.5);
                    var ypos = _ystart - _fretWidth;
                    var markerXpos = xpos + ((_dotWidth - _markerWidth) / 2);
                    if (_baseFret == 1) {
                        ypos -= _nutHeight;
                    }
                    _graphics.DrawLine(pen, markerXpos, ypos, markerXpos + _markerWidth, ypos + _markerWidth);
                    _graphics.DrawLine(pen, markerXpos, ypos + _markerWidth, markerXpos + _markerWidth, ypos);
                }
            }
        }

        var DrawFingers = function(style) {
            var xpos = _xstart + (0.5 * _lineWidth);
            var ypos = _ystart + _boxHeight;
            var font = Font(style['font-family'], _fingerFontSize);
            for (var f=0; f<_fingers.length; f++) {
                var finger = _fingers[f];
                if (finger != NO_FINGER) {
                    var charSize = _graphics.MeasureString(finger.toString(), font);
                    _graphics.DrawString(finger.toString(), font, style.color, xpos - (0.5 * charSize.Width), ypos);
                }
                xpos += (_fretWidth + _lineWidth);
            }
        }

        var DrawChordName = function(style) {

            var nameFont = Font(style['font-family'], _nameFontSize);
            var superFont = Font(style['font-family'], _superScriptFontSize);
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
            _graphics.DrawString(name, nameFont, style.color, xTextStart, 0.2 * _superScriptFontSize);
            if (supers != "") {
                _graphics.DrawString(supers, superFont, style.color, xTextStart + 0.8 * stringSize.Width, 0);
            }

            if (_baseFret > 1) {
                var fretFont = Font(style['font-family'], _fretFontSize);
                var offset = (_fretFontSize - _fretWidth) / 2;
                _graphics.DrawString(_baseFret + "fr", fretFont, style.color, _xstart + _boxWidth + 0.4 * _fretWidth, _ystart - offset);
            }
        }
        
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
    var RenderElements = function(elements) {
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		var chordPos = el.getAttribute('data-positions');
		if(chordPos != undefined) {
			var chordFingers = el.getAttribute('data-fingers');
			var chordSize = el.getAttribute('data-size');
			var chordName = el.hasAttribute('data-name') ? el.getAttribute('data-name') : el.firstChild.nodeValue;
			var style= el.style;
			//important for re-jiggery
			if(!el.getAttribute('data-name')) { el.setAttribute('data-name', chordName); };
            		var chord = ChordBoxImage(chordName, chordPos, chordFingers, chordSize);
            		var canvas = document.createElement('canvas');
			canvas.setAttribute('width',chord.getWidth());
			canvas.setAttribute('height',chord.getHeight());
			var ctx= canvas.getContext('2d');
			chord.Draw(ctx, style);
			// remove existing child nodes
			var children= el.childNodes;
	  		for (var j = children.length-1; j >= 0; j--) {
				el.removeChild(children[j]);
			}
          		el.appendChild(canvas);
		}
	}
	};
     //example: <chord name="A" positions="X02220" fingers="--222-" size="7" ></chord>
     var ReplaceChordElements = function() {
	  var elements= document.getElementsByTagName('chord');
	  for (var i = elements.length-1; i >= 0; i--) {
		var el = elements[i];
		var name = el.getAttribute('name');
		var positions = el.getAttribute('positions');
		var fingers = el.getAttribute('fingers');
		var size = el.getAttribute('size');
                var chord = ChordBoxImage(name, positions, fingers, size);
	        var canvas = document.createElement('canvas');
		canvas.setAttribute('width',chord.getWidth());
		canvas.setAttribute('height',chord.getHeight());
		var ctx= canvas.getContext('2d');
                chord.Draw(ctx);
          	el.parentNode.replaceChild(canvas, el);
	  }
    };
        //RenderElements uses friendlier markup 
	//(keeping ReplaceChordElements for backward-compatibility)
    var ReplaceDefault= function() {
	RenderElements(document.getElementsByTagName('span'));
	ReplaceChordElements();
    }; 
    return {
        chord: ChordBoxImage,
        replace: ReplaceDefault,
    };

})();
