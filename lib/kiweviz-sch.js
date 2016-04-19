/*
 * KiWeViz - Kicad Web Visualizer
 *
 * Author: Saint-Genest Gwenael <gwen@agilack.fr>
 * Copyright (c) 2016 Agilack
 */
window.kiwevizsch = (function () {
	function KiwevizSch (els) {
		this.target = els;
		this.comps  = [];
		if (typeof els.id != 'undefined')
			this.id = els.id;
		else
			this.id = "KiwevizSch_id";
		// Create the root SVG
		var svgItem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgItem.setAttribute("version", "1.1");
		svgItem.setAttribute("id", this.id + "_draw");
		svgItem.setAttribute("viewBox", "0 0 2970 2100");
		var attrNS     = document.createAttribute("xmlns");   attrNS.value  = "http://www.w3.org/2000/svg";
		var attrHeight = document.createAttribute("height");  attrHeight.value = "210mm";
		var attrWidth  = document.createAttribute("width");   attrWidth.value  = "297mm";
		svgItem.setAttributeNode(attrNS);
		svgItem.setAttributeNode(attrHeight);
		svgItem.setAttributeNode(attrWidth);
		els.appendChild(svgItem);
		// Add the basic page items
		this.drawGrid(svgItem, true);
		this.drawPage(svgItem);
	}

	KiwevizSch.prototype.drawPage = function(doc) {
		var infRoot = document.createElementNS("http://www.w3.org/2000/svg", "g");
		infRoot.setAttribute("id", "pg_infos");
		infRoot.setAttribute("fill",  "none");
		infRoot.setAttribute("style", "stroke-width:2; stroke:red");
		doc.appendChild(infRoot);

		// Double line for external border
		var pgBorder1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		var pgBorder2 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		pgBorder1.setAttribute("points", "100,100 2870,100 2870,2000 100,2000 100,100");
		pgBorder2.setAttribute("points", "120,120 2850,120 2850,1980 120,1980 120,120");
		infRoot.appendChild(pgBorder1);
		infRoot.appendChild(pgBorder2);

		// Border rule
		var pgRule = document.createElementNS("http://www.w3.org/2000/svg", "path");
		var items = "";
		// Top-line rule
		items += "M600 100 L600 120"     + "M1100 100 L1100 120"   + "M1600 100 L1600 120";
		items += "M2100 100 L2100 120"   + "M2600 100 L2600 120";
		// Bottom-line rule
		items += "M600 1980 L600 2000"   + "M1100 1980 L1100 2000" + "M1600 1980 L1600 2000";
		items += "M2100 1980 L2100 2000" + "M2600 1980 L2600 2000";
		// Left-line rule
		items += "M100 600 L120 600"     + "M100 1100 L120 1100"   + "M100 1600 L120 1600";
		// Right-line rule
		items += "M2850 600 L2870 600"   + "M2850 1100 L2870 1100" + "M2850 1600 L2870 1600";
		pgRule.setAttribute("d", items);
		infRoot.appendChild(pgRule);

		// Text block
		var infTBlock = document.createElementNS("http://www.w3.org/2000/svg", "g");
		infTBlock.setAttribute("id", "pg_infos_textblock");
		infRoot.appendChild(infTBlock);
		var pgTextBlockBorder = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		pgTextBlockBorder.setAttribute("points", "1770,1980, 1770,1660 2850,1660");
		infTBlock.appendChild(pgTextBlockBorder);
	}

	KiwevizSch.prototype.drawGrid = function(doc, show) {
		var defs = doc.querySelector("defs");
		if (defs === null) {
			defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
			doc.appendChild(defs);
		}
		// Create the pattern entry
		var pat = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
		pat.setAttribute("id", "patternGrid");
		pat.setAttribute("patternUnits", "userSpaceOnUse");
		pat.setAttribute("x", "0");      pat.setAttribute("y", "0");
		pat.setAttribute("width", "20"); pat.setAttribute("height", "20");
		defs.appendChild(pat);
		// Add small grey "dot" into the pattern
		var dot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		dot.setAttribute("x", "10");    dot.setAttribute("y", "10");
		dot.setAttribute("width", "2"); dot.setAttribute("height", "2");
		dot.setAttribute("stroke", "none");
		dot.setAttribute("fill",   "#aaaaaa");
		pat.appendChild(dot);
		// Add a background to doc and insert grid pattern
		var back = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		back.setAttribute("x", "0");         back.setAttribute("y", "0");
		back.setAttribute("height", "100%"); back.setAttribute("width", "100%");
		back.setAttribute("fill", "url(#patternGrid)");
		back.setAttribute("stroke", "#aaaaaa");
		doc.appendChild(back);
	}

	var kiwevizsch = {
		init: function (selector) {
			var node;
			
			if (typeof selector !== "string")
				return false;

			node = document.querySelectorAll(selector);
			if (node.length == 0)
				return false;

			return new KiwevizSch(node[0]);
	        }   
	};
     
	return kiwevizsch;
}());
