/*
 * KiWeViz - Kicad Web Visualizer
 *
 * Author: Saint-Genest Gwenael <gwen@agilack.fr>
 * Copyright (c) 2016 Agilack
 */
window.kiwevizlib = (function () {
	function KiwevizLib (els) {
		this.target = els;
		this.comps  = [];
		if (typeof els.id != 'undefined')
			this.id = els.id;
		else
			this.id = "KiwevizLib_id";
		// Create the root SVG
		var svgItem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgItem.setAttribute("version", "1.1");
		svgItem.setAttribute("id", this.id + "_draw");
		var attrNS     = document.createAttribute("xmlns");   attrNS.value  = "http://www.w3.org/2000/svg";
		var attrHeight = document.createAttribute("height");  attrHeight.value = "200";
		var attrWidth  = document.createAttribute("width");   attrWidth.value  = "200";
		svgItem.setAttributeNode(attrNS);
		svgItem.setAttributeNode(attrHeight);
		svgItem.setAttributeNode(attrWidth);
		els.appendChild(svgItem);
	}

	KiwevizLib.prototype.count = function() {
		return this.comps.length;
	}

	KiwevizLib.prototype.at = function(pos) {
		return this.comps[pos];
	}

	KiwevizLib.prototype.getByName = function(name) {
		for (var i = 0; i < this.comps.length; i++) {
			var component = this.comps[i];
			if (component.name == name)
				return component;
		}
	}

	KiwevizLib.prototype.getByRef = function(ref) {
		for (var i = 0; i < this.comps.length; i++) {
			var component = this.comps[i];
			if (component.id == ref)
				return component;
		}
	}

	KiwevizLib.prototype.load = function(dt) {
		console.log("KiwevizLib::load()");
		if ( typeof dt !== "string")
			return false;
		var stateM = 0;
		var newComp = {};

		var lines = dt.split("\n");
		for (var i = 0; i < lines.length; i++) {
			// Ignore comment lines
			if (lines[i].startsWith("#"))
				continue;
			// Ignore NULL lines
			if (lines[i].length == 0)
				continue;

			if (stateM == 0) {
				if ( ! lines[i].startsWith("EESchema-LIBRARY")) {
					console.log("KiwevizLib::load ERROR: Bad Library signature");
					return false;
				}
				// ToDo: add a check on library version
				stateM = 1;
				continue;
			}
			// Wait for a new DEF
			if (stateM == 1) {
				if ( lines[i].startsWith("DEF") ) {
					var items = lines[i].split(" ");
					newComp = {};
					newComp.id = items[1];
					newComp.name  = ""; // Name of the component
					newComp.ref   = ""; // Reference of the nomponent
					newComp.parts = [];
					// Flag for pin inside/outside
					if (items[4] == "0")
						newComp.showNameInside = false;
					else
						newComp.showNameInside = true;
					// Flag to show / hide pin numbers
					if (items[5] == "N")
						newComp.showPinNumber = false;
					else
						newComp.showPinNumber = true;
					// Flag to show / hide pin names
					if (items[6] == "N")
						newComp.showPinName = false;
					else
						newComp.showPinName = true;
					for (var j = 0; j < parseInt(items[7], 10); j++) {
						var newPart = {}
						newPart.pins = []; // Array of pins
						newPart.draw = []; // Other drawing parts
						newPart.minX = 0;
						newPart.maxX = 0;
						newPart.minY = 0;
						newPart.maxY = 0;
						newComp.parts.push(newPart);
					}
					stateM = 2;
					continue;
				}
				console.log("KiwevizLib::load WARN: Unexpected tag " + lines[i]);
				continue;
			}

			// Wait for the next DEF content
			if (stateM == 2) {
				var items = lines[i].split(" ");
				if ( items[0] == "F0" ) {
					newComp.ref = items[1].split('"').join('');
					var posX = parseInt(items[2], 10) / 10;
					var posY = 0 - parseInt(items[3], 10) / 10;
					newComp.refLabel = {};
					newComp.refLabel.posX = posX;
					newComp.refLabel.posY = posY; 
					newComp.refLabel.orient = items[5];
					newComp.refLabel.show   = items[6];
					for (var j = 0; j < newComp.parts.length; j++) {
						this.loadUpdateBB(newComp.parts[j], posX, posY, 0, 0);
					}
					continue;
				}
				if ( items[0] == "F1" ) {
					newComp.name = items[1].split('"').join('');
					var posX = parseInt(items[2], 10) / 10;
					var posY = 0 - parseInt(items[3], 10) / 10;
					newComp.nameLabel = {};
					newComp.nameLabel.posX = posX;
					newComp.nameLabel.posY = posY; 
					newComp.nameLabel.orient = items[5];
					newComp.nameLabel.show   = items[6];
					for (var j = 0; j < newComp.parts.length; j++) {
						this.loadUpdateBB(newComp.parts[j], posX, posY, 0, 0);
					}
					continue;
				}
				if ( lines[i].startsWith("DRAW") ) {
					stateM = 3;
					continue;
				}
				if ( lines[i].startsWith("ENDDEF") ) {
					newComp.countUnits = function() {
						return this.parts.length;
					};
					this.comps.push(newComp);
					stateM = 1;
					continue;
				}
				continue;
			}
			// Wait for the next DRAW content
			if (stateM == 3) {
				var items = lines[i].split(" ");
				// Pin
				if ( lines[i][0] == 'X' ) {
					var newPin = {};
					newPin.name   = items[1];
					newPin.number = items[2];
					newPin.posX   = parseInt(items[3], 10) / 10;
					newPin.posY   = 0 - (parseInt(items[4], 10) / 10);
					newPin.size   = parseInt(items[5], 10) / 10;
					newPin.orient = items[6];
					newPin.szNum  = parseInt(items[7], 10);
					newPin.szName = parseInt(items[8], 10);
					newPin.part   = parseInt(items[9], 10);
					newPin.style  = items[10]; // Flag common body style "DeMorgan"
					newPin.etype  = items[11]; // In / out / bidi
					newPin.showNameInside = newComp.showNameInside;
					if (newComp.showPinNumber == false)
						newPin.showNumber = false;
					else
						newPin.showNumber = true;
					if (newComp.showPinName == false)
						newPin.showName = false;
					else
						newPin.showName = true;
					// Update part bounding box
					var vX = 0; var vY = 0;
					if (newPin.posX < 0) vX = newPin.posX - newPin.size - 5;
					else                 vX = newPin.posX + newPin.size + 5;
					if (newPin.posY < 0) vY = newPin.posY - newPin.size - 5;
					else                 vY = newPin.posY + newPin.size + 5;

					if (newPin.part == 0) {
						for (var j = 0; j < newComp.parts.length; j++) {
							newComp.parts[j].pins.push(newPin);
							if (vX < newComp.parts[j].minX) newComp.parts[j].minX = vX;
							if (vX > newComp.parts[j].maxX) newComp.parts[j].maxX = vX;
							if (vY < newComp.parts[j].minY) newComp.parts[j].minY = vY;
							if (vY > newComp.parts[j].maxY) newComp.parts[j].maxY = vY;
						}
					} else {
						var index = newPin.part - 1;
						newComp.parts[index].pins.push(newPin);
						if (vX < newComp.parts[index].minX) newComp.parts[index].minX = vX;
						if (vX > newComp.parts[index].maxX) newComp.parts[index].maxX = vX;
						if (vY < newComp.parts[index].minY) newComp.parts[index].minY = vY;
						if (vY > newComp.parts[index].maxY) newComp.parts[index].maxY = vY;
					}
				}
				// Shape
				if ( lines[i][0] == 'S' ) {
					var newDraw = {};
					newDraw.type = "rect";
					var posX1 = parseInt(items[1], 10) / 10;
					var posY1 = 0 - parseInt(items[2], 10) / 10; 
					var posX2 = (parseInt(items[3], 10) / 10);
					var posY2 = 0 - (parseInt(items[4], 10) / 10);
					if (posX2 > posX1) {
						newDraw.posX  = posX1;
						newDraw.width = posX2 - posX1;
					} else {
						newDraw.posX  = posX2;
						newDraw.width = posX1 - posX2;
					}
					if (posY2 > posY1) {
						newDraw.posY   = posY1;
						newDraw.height = posY2 - posY1;
					} else {
						newDraw.posY   = posY2;
						newDraw.height = posY1 - posY2;
					}
					var part = parseInt(items[5], 10);

					if (part == 0) {
						for (var j = 0; j < newComp.parts.length; j++) {
							newComp.parts[j].draw.push(newDraw);
							this.loadUpdateBB(newComp.parts[j], newDraw.posX, newDraw.posY, 0, 0);
						}
					} else {
						var index = part - 1;
						newComp.parts[index].draw.push(newDraw);
						this.loadUpdateBB(newComp.parts[index], newDraw.posX, newDraw.posY, 0, 0);
					}
				}
				// Polyline
				if ( lines[i][0] == 'P' ) {
					var newDraw = {};
					newDraw.type = "poly";
					newDraw.dots = [];
					var nbDot = parseInt(items[1], 10);
					newDraw.posX = parseInt(items[6], 10) / 10;
					newDraw.posY = 0 - parseInt(items[7], 10) / 10;
					var unit = parseInt(items[2], 10);
					for (var j = 1; j < nbDot; j++) {
						var index = (j * 3) + 6;
						var newDot = {}
						newDot.posX = parseInt(items[index], 10) / 10;
						newDot.posY = 0 - parseInt(items[index + 1], 10) / 10;
						newDraw.dots.push(newDot);
						if (unit == 0) {
							for (var k = 0; k < newComp.parts.length; k++)
								this.loadUpdateBB(newComp.parts[k], newDot.posX, newDot.posY, 0, 0);
						} else {
							this.loadUpdateBB(newComp.parts[unit-1], newDot.posX, newDot.posY, 0, 0);
						}
					}
					
					if (unit == 0) {
						for (var j = 0; j < newComp.parts.length; j++) {
							newComp.parts[j].draw.push(newDraw);
							this.loadUpdateBB(newComp.parts[j], newDraw.posX, newDraw.posY, 0, 0);
						}
					} else {
						var index = unit - 1;
						newComp.parts[unit].draw.push(newDraw);
						this.loadUpdateBB(newComp.parts[indec], newDraw.posX, newDraw.posY, 0, 0);
					}
				}
				if ( lines[i].startsWith("ENDDRAW") ) {
					stateM = 2;
					continue;
				}
			}
		}
	};

	KiwevizLib.prototype.loadUpdateBB = function(part, x, y, h, w) {

		// Add horizontal margin
		if (x < 0)
			x -= 5;
		else
			x += 5;
		// Add vertical margin
		if (y < 0)
			y -= 5;
		else
			y += 5;

		if (x < part.minX)
			part.minX = x;
		if (x > part.maxX)
			part.maxX = x;
		if (y < part.minY)
			part.minY = y;
		if (y > part.maxY)
			part.maxY = y;
	}

	KiwevizLib.prototype.drawSymbol = function(doc, component, unit) {
		var symbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
		var symId = "sym_" + component.id;
		if (component.parts.length > 1)
			symId += "-unit_" + unit;
		symbol.setAttribute("id", symId);

		var part = component.parts[unit];

		var partWidth  = (part.maxX - part.minX);
		var partHeight = (part.maxY - part.minY);
		var viewbox = part.minX+' '+part.minY + ' '+partWidth+' '+partHeight;
		symbol.setAttribute("viewBox", viewbox);
		doc.appendChild(symbol);

		// Insert the component name
		if (component.nameLabel.show == "V") {
			var compRef = document.createElementNS("http://www.w3.org/2000/svg", "text");
			var posX = component.nameLabel.posX;
			var posY = component.nameLabel.posY;
			if (component.nameLabel.orient == "V") {
				compRef.setAttribute("transform", "rotate(-90, "+posX+","+posY+")");
			}
			posX -= (component.name.length * 2); // x4 pixel per char /2
			compRef.setAttribute("x", posX);
			compRef.setAttribute("y", posY);
			compRef.setAttribute("font-size", "7");
			compRef.setAttribute("style", "fill: #0080ff");
			var compRefText = document.createTextNode( component.name );
			compRef.appendChild(compRefText);
			symbol.appendChild(compRef);
		}
		// Insert the component reference
		if (component.refLabel.show == "V") {
			var compRef = document.createElementNS("http://www.w3.org/2000/svg", "text");
			var posX = component.refLabel.posX;
			var posY = component.refLabel.posY;
			if (component.refLabel.orient == "V") {
				compRef.setAttribute("transform", "rotate(-90, "+posX+","+posY+")");
			}
			posX -= (component.ref.length * 2);
			compRef.setAttribute("x", posX);
			compRef.setAttribute("y", posY);
			compRef.setAttribute("font-size", "7");
			compRef.setAttribute("style", "fill: #0080ff");
			var compRefText = document.createTextNode( component.ref );
			compRef.appendChild(compRefText);
			symbol.appendChild(compRef);
		}

		for (var i = 0; i < part.pins.length; i++) {
			var pinItem = part.pins[i];
			this.drawPin(symbol, pinItem);
		}
		for (var i = 0; i < part.draw.length; i++) {
			var shapeItem = part.draw[i];
			if (shapeItem.type == "rect")
				this.drawShapeRect(symbol, shapeItem);
			if (shapeItem.type == "poly")
				this.drawShapePoly(symbol, shapeItem);
		}
		return (symId);
	}
	KiwevizLib.prototype.drawPin = function(doc, pin) {
		var pinDrawEndX = pin.posX;
		var pinDrawEndY = pin.posY;
		if (pin.orient == 'L') {
			pinDrawEndX = pin.posX - pin.size;
		} else if (pin.orient == 'D') {
			pinDrawEndY = pin.posY + pin.size;
		} else if (pin.orient == 'R') {
			pinDrawEndX = pin.posX + pin.size;
		} else if (pin.orient == 'U') {
			pinDrawEndY = pin.posY - pin.size;
		}

		// Draw the pin line
		var pinLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
		pinLine.setAttribute('x1', pin.posX);
		pinLine.setAttribute('y1', pin.posY);
		pinLine.setAttribute('x2', pinDrawEndX);
		pinLine.setAttribute('y2', pinDrawEndY);
		pinLine.setAttribute('stroke', 'red');
		doc.appendChild(pinLine);

		// Draw a circle at the end of the line
		var pinDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		pinDot.setAttribute("cx", pin.posX);
		pinDot.setAttribute("cy", pin.posY);
		pinDot.setAttribute("r",    "1.5");
		pinDot.setAttribute("fill", "white");
		pinDot.setAttribute("stroke", "red");
		doc.appendChild(pinDot);

		// Insert the pin Number
		if (pin.showNumber == true) {
			var pinNumber = document.createElementNS("http://www.w3.org/2000/svg", "text");

			var txtX = pin.posX;
			var txtY = pin.posY;
			var sz   = (pin.szNum / 10);
			var txtSize = (pin.number.length * sz);
			if (pin.orient =='L') {
				txtX += ((pinDrawEndX - pin.posX) / 2) - (txtSize / 2);
				txtY -= 2;
			}
			if (pin.orient =='D') {
				pinNumber.setAttribute("transform", "rotate(-90, "+txtX+","+txtY+")");
				txtX -= ( ((pinDrawEndY - pin.posY) / 2) + (txtSize / 2) );
				txtY -= 2;
			}
			if (pin.orient =='R') {
				txtX += ( ((pinDrawEndX - pin.posX) / 2) - (txtSize / 2) );
				txtY -= 2;
			}
			if (pin.orient =='U') {
				pinNumber.setAttribute("transform", "rotate(-90, "+txtX+","+txtY+")");
				txtX -= ( ((pinDrawEndY - pin.posY) / 2) + (txtSize / 2) );
				txtY -= 2;
			}
			pinNumber.setAttribute("x", txtX);
			pinNumber.setAttribute("y", txtY);
			pinNumber.setAttribute("font-size", sz + 2);
			var pinNumberText = document.createTextNode( pin.number );
			pinNumber.appendChild(pinNumberText);
			doc.appendChild(pinNumber);
		}

		// Insert the pin Name
		if ((pin.name != "~") && (pin.showName == true) ) {
			var pinName = document.createElementNS("http://www.w3.org/2000/svg", "text");
			var txtX = pin.posX;
			var txtY = pin.posY;
			if ( pin.showNameInside ) {
				if (pin.orient =='L') {
					txtX -= (pin.size + (pin.name.length * 4.5) + 4);
					txtY += 2;
				}
				if (pin.orient =='D') {
					pinName.setAttribute("transform", "rotate(-90, "+txtX+","+txtY+")");
					txtX -= (pin.size + (pin.name.length * 4.5) + 4);
					txtY += 3;
				}
				if (pin.orient =='R') {
					txtX += pin.size + 3;
					txtY += 2;
				}
				if (pin.orient =='U') {
					pinName.setAttribute("transform", "rotate(-90, "+txtX+","+txtY+")");
					txtX += pin.size + 3;
					txtY += 3;
				}
			} else {
				txtY += 8;
				console.log("KiwevizLib::drawPin WARN: pin name outside not fully supported");
				return;
			}
			pinName.setAttribute("x", txtX);
			pinName.setAttribute("y", txtY);
			pinName.setAttribute("font-size", "7");
			pinName.setAttribute("style", "fill: #0080ff");
			var pinNameText = document.createTextNode( pin.name );
			pinName.appendChild(pinNameText);
			doc.appendChild(pinName);
		}
	}

	KiwevizLib.prototype.drawShapePoly = function(doc, shape) {
		var newPoly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		var dots = shape.posX + ',' + shape.posY + ' ';
		for (var i = 0; i < shape.dots.length; i++) {
			var item = shape.dots[i];
			dots += item.posX + ',' + item.posY + ' ';
		}
		newPoly.setAttribute("points", dots);
		newPoly.setAttribute("style", "fill: none; stroke: #ff0000");
		doc.appendChild(newPoly);
	}

	KiwevizLib.prototype.drawShapeRect = function(doc, shape) {
		var newRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		newRect.setAttribute("x", shape.posX);
		newRect.setAttribute("y", shape.posY);
		newRect.setAttribute("height", shape.height);
		newRect.setAttribute("width",  shape.width);
		newRect.setAttribute("style", "fill: none; stroke: #ff0000");
		doc.appendChild(newRect);
	}

	KiwevizLib.prototype.show = function(selector, unit) {
		if (typeof unit === "undefined")
			unit = 0;

		// Select by object
		if (typeof selector === "object") {
			var part = selector.parts[unit];
			var partHeight = (part.maxY - part.minY);
			var partWidth  = (part.maxX - part.minX);
			var viewHeight = (partHeight * 2);
			var viewWidth  = (partWidth  * 2);
			var target = document.getElementById(this.id + "_draw");
			target.setAttribute('width',  viewWidth);
			target.setAttribute('height', viewHeight);
			target.innerHTML ="";

			var symId = this.drawSymbol(target, selector, unit);

			var drawPart = document.createElementNS("http://www.w3.org/2000/svg", "use");
			drawPart.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#'+symId);
			drawPart.setAttribute('x', 0);
			drawPart.setAttribute('y', 0);
			target.appendChild(drawPart);
		}
		// Select by item index
		if (typeof selector === "number") {
			console.log("KiwevizLib::show WARN: Selection by index not implemented");
		}
		// Select by item reference
		if (typeof selector === "string") {
			console.log("KiwevizLib::show WARN: Selection by reference not implemented");
		}
	}

	var kiwevizlib = {
		init: function (selector) {
			var node;
			
			if (typeof selector !== "string")
				return false;

			node = document.querySelectorAll(selector);
			if (node.length == 0)
				return false;

			return new KiwevizLib(node[0]);
	        }   
	};
     
	return kiwevizlib;
}());
