String.prototype.replaceAll = function(find, replace) {
	var str = this;
	return str.replace(new RegExp(find, 'g'), replace);
};

if ( typeof (String.prototype.trim) === "undefined") {
	String.prototype.trim = function() {
		return String(this).replace(/^\s+|\s+$/g, '');
	};
}

function isiPhonePad() {
	return ((navigator.platform.indexOf("iPhone") != -1) || (navigator.platform.indexOf("iPod") != -1) || (navigator.userAgent.match(/iPad/i) != null)
	);
}

function setupCanvas() {

	var design = $('#canvas').data("design");
	var images = $('#canvas').data("images");

	$('#canvas').data("sendLayoutToServerTimes", [])

	design.region_proposals = false;

	if ($('#canvas').data("stage") != undefined)
		$('#canvas').data("stage").destroy();

	$('#canvas').data("mousePos", 0)

	$('#canvas').data("dragging", false)

	$('#canvas').data("lastDist", 1);

	$('#canvas').data("show_lock_icons", true);
	$('#canvas').data("show_fixed_opacity", false);

	$('#canvas').data("align_lines", [])

	$('#canvas').data("energy", 9999)
	$('#canvas').data("energy_list", [])
	$('#canvas').data("plot_energy_list", [])

	$('#canvas').data("layout_stack", [])
	$('#canvas').data("layout_stack_idx", -1)

	$('#canvas').data("user_input_log", [])
	$('#canvas').data("status_log", ['Setup'])

	$('#canvas').data("paused", false)
	$('#canvas').data('killed', false)
	$('#canvas').data("overlap_mode", false)
	$('#canvas').data("region_mode", false)
	$('#canvas').data("text_mode", false)

	$('#design_width').val(design.width)
	$('#design_height').val(design.height)

	for (var i = 0; i < 3; i++) {
		$('#suggestion_layout' + i).attr("width", design.width / 3)
		$('#suggestion_layout' + i).attr("height", design.height / 3)
	}

	for (var i = 0; i < 9; i++) {
		$('#saved_layout' + i).attr("width", design.width / 3)
		$('#saved_layout' + i).attr("height", design.height / 3)
		$('#gallery_layout' + i).attr("width", design.width / 3)
		$('#gallery_layout' + i).attr("height", design.height / 3)
	}

	if (!("overlap_regions" in design))
		design.overlap_regions = []

	if (!("regions" in design))
		design.regions = []

	var stage = new Kinetic.Stage({
		container : 'canvas',
		width : design.width,
		height : design.height
	});
	var layer = new Kinetic.Layer({
		id : 'layer',
	});
	stage.add(layer);

	var previewRect = new Kinetic.Rect({
		x : 0,
		y : 0,
		width : design.width,
		height : design.height,
		name : 'preview',
		fillPatternImage : images.background
	});
	layer.add(previewRect);
	previewRect.hide();
	$('#canvas').data("preview_image", previewRect);
	$('#canvas').data("preview", -1);

	var col = design.background_color

	if ((col != undefined) && (col.indexOf('#') == -1))
		col = '#' + col;


  var maxAR = 1.0

  if (images.background != undefined){
    maxAR = Math.max(design.width/images.background.width,design.height/images.background.height )
  }

	var backgroundRect = new Kinetic.Rect({
		x : 0,
		y : 0,
		width : design.width,
		height : design.height,
		fillPatternScaleX:maxAR,
		fillPatternScaleY:maxAR,
		fill : col,
		name : 'background',
		fillPatternImage : images.background
	});

	layer.add(backgroundRect);

	design.background = backgroundRect;

	console.log("background_fname: " + design.background_fname)

	back_elem = {}
	back_elem.id = '0';
	back_elem.type = "background";
	back_elem.text = '';
	back_elem.font = 'Garamond';
	back_elem.color = 'black';
	back_elem.group_id = 0;
	back_elem.importance = 0;
	back_elem.anchors = [];
	back_elem.loaded = false;
	back_elem.resizing = false;
	back_elem.selected = false;
	back_elem.bold = false;
	back_elem.italic = false;
	back_elem.align = "center"
	back_elem.x = 0
	back_elem.y = 0
	back_elem.img = backgroundRect

	design.background_elem = back_elem

	$('#canvas').data("invert", false)
	var select_color = 'black'
	var select_opacity = 0.1
	if (design.background_fname.indexOf("black") > -1) {
		$('#canvas').data("invert", true)
		$("#invert_select").prop("checked", true)
		select_color = 'white'
		select_opacity = 0.2
	}

	var select_rect = new Kinetic.Rect({
		x : 0,
		y : 0,
		width : 100,
		height : 100,
		fill : 'blue',
		stroke : select_color,
		opacity : select_opacity,
		strokeWidth : 1,
		visible : false
	});

	layer.add(select_rect);

	$('#canvas').data("select_rect", select_rect)
	$('#canvas').data("select_start", false)

	$('#canvas').data("selected", back_elem)
	setupElementCallbacks(backgroundRect, back_elem);

	var sugg_stage = new Kinetic.Stage({
		container : 'suggestion_canvas',
		width : design.width,
		height : design.height
	});

	var sugg_layer = new Kinetic.Layer({
		id : 'sugg_layer',
	});

	var backgroundRect2 = new Kinetic.Rect({
		x : 0,
		y : 0,
		width : design.width,
		height : design.height,
    fillPatternScaleX:maxAR,
    fillPatternScaleY:maxAR,
		fill : col,
		fillPatternImage : images.background
	});
	sugg_layer.add(backgroundRect2);
	design.sugg_background = backgroundRect2;

	//console.log("background color: "+design.background_color)

	sugg_stage.add(sugg_layer);

	var overlap_layer = new Kinetic.Layer();
	stage.add(overlap_layer);
	$('#canvas').data("overlap_layer", overlap_layer);

	var region_layer = new Kinetic.Layer();
	stage.add(region_layer);
	$('#canvas').data("region_layer", region_layer);

	var saliency_layer = new Kinetic.Layer();
	stage.add(saliency_layer);
	$('#canvas').data("saliency_layer", saliency_layer);
    saliency_layer.setListening(false)



	$('#canvas').data("stage", stage);
	$('#canvas').data("sugg_stage", sugg_stage);

	console.log("stage:" + stage)

	var max_group_id = 0;
	var max_id = 0;
	$.each(design.elements, function(i, elem) {
		if ("group_id" in elem)
			max_group_id = Math.max(max_group_id, elem.group_id);
		if (("id" in elem))
			max_id = Math.max(max_id, elem.id)
	});

	if (!("element_alts" in design))
		design.element_alts = {}

	$.each(design.elements, function(i, elem) {

		elem.loaded = false;
		elem.resizing = false;
		elem.fixed = false;
		elem.align_type = -1;
		elem.num_lines = 0;
		//elem.num_align=-1;
		elem.selected = false;
		elem.old_text = '';
		elem.fixed_amount = 0;
		elem.hidden_img = 0;
		elem.hidden = false;

		if (("text" in elem)) {
			elem.text = elem.text.trim()
		}

		if (!("opacity" in elem)) {
			elem.opacity = 1.0;
		}

		delete elem["img"];
		delete elem["sugg_img"];

		if (!("group_id" in elem)) {
			max_group_id = max_group_id + 1;
			elem.group_id = max_group_id;
		}

		if (!("id" in elem)) {
			max_id = max_id + 1;
			elem.id = max_id;
		}

		if (!("fix_alignment" in elem))
			elem.fix_alignment = false;

		if (!("fix_alternate" in elem))
			elem.fix_alternate = false;

		if (!("optional" in elem))
			elem.optional = false;

		if (elem.type == 'graphic')
			elem.type_id = 2;
		if (elem.type == 'text')
			elem.type_id = 1;

		if (elem.id in design.element_alts) {
			var alt_id = 0;
			$.each(design.element_alts[elem.id], function(i, e) {
				e.alternate_id = alt_id;
				alt_id += 1;
			});
		}

		//setupLockingCallbacks(elem, layer)

		if ("fname" in elem) {
			elem.alternate_id = 0;
			setupImageElement(elem, images[elem.fname], layer, sugg_layer,-1, false)

			var missing_or = true;
			$.each(design.overlap_regions, function(j, or) {
				if (or.elem_id == elem.id)
					missing_or = false;
			});
			if (missing_or) {
				overlap = {}
				overlap.elem_id = elem.id
				overlap.x_min = 0
				overlap.y_min = 0
				overlap.x_max = 1
				overlap.y_max = 1
				design.overlap_regions.push(overlap)
			}

		} else if (elem.type == 'text') {
			if (elem.color == undefined)
				elem.color = '#000'
			if (elem.color.indexOf('#') == -1)
				elem.color = '#' + elem.color;

			elem.text = elem.text.trim()
			elem.sugg_align = elem.align;
			renderTextAlts(elem, false)
		}

		elem.last_x = elem.x;
		elem.last_y = elem.y;

	});

	window.addEventListener('keydown', keyPressed);

	layer.draw();
	sugg_layer.draw();
	//$('#suggestion_canvas').data("stage",sugg_stage);

	//setTimeout(sendDesign,500);
	//sendCurrentDesign();

 var remove = []
	$.each(design.elements, function(i, elem) {

		// if (elem.img == undefined){
		// 	console.log("Error")
		// 	remove.push(i)
		// }
		var found_other = false;
		$.each(design.elements, function(j, elem2) {
			if ((i != j) && (elem.group_id == elem2.group_id))
				found_other = true;
		});
		if (!found_other)
			elem.group_id = -1;
	});

	// for (var i = remove.length; i >-1; i--) {
	// 	design.elements.splice(remove[i],1)
	// }

	setupStageCallbacks(stage);

	addLayoutToUndoStack(getCurrentLayout())

	// $('#canvas').data("runs", [])
	// if (!$('#canvas').data("noSuggestions")) {
	// 	startSuggestions()
	// 	setInterval(checkForSuggestions, 500);
	// }

	//design.elements.sort(function(e1,e2){return e1.importance-e2.importance})

	$('#canvas').data("started", false)

}

function allowUpdates() {

	$('#canvas').data("started", true)
	$('#canvas').data("energy_list", [])

	if ($('#canvas').data("layoutStartTime") == undefined)
		$('#canvas').data("layoutStartTime", new Date())

}



function updateOpacity(opacity_val){
	$('#canvas').data("opacity_val",opacity_val)
	controlsChanged()
}


function designSizeChanged() {

	var design = $('#canvas').data("design")

	var new_width = parseInt($('#design_width').val())
	var new_height = parseInt($('#design_height').val())
	if ((new_width > 0) && (new_height > 0)) {

		var scale = (new_height / design.height);
		$.each(design.elements, function(i, elem) {

			var width = elem.height * elem.aspect_ratio
			var mid_x = (elem.x + width / 2) / design.width;
			var mid_y = (elem.y + elem.height / 2) / design.height;

			elem.height = elem.height * scale
			elem.width = elem.height * elem.aspect_ratio

			elem.x = Math.max(0, mid_x * new_width - elem.width / 2);
			elem.y = Math.max(0, mid_y * new_height - elem.height / 2);

		});

		design.width = new_width
		design.height = new_height
		setupCanvas()
	}
}

function setupImageElement(elem, image, layer, sugg_layer, index,selected) {
	var design = $('#canvas').data("design");

	var scale = 1;
	while (Math.max(image.height * scale, image.height * scale) > Math.max(design.width, design.height) * 0.5) {
		scale = scale * 0.9;
	}

	if (gup('hideContent') != '1') {
		img = new Kinetic.Image({
			x : elem.x,
			y : elem.y,
			image : image,
			height : Math.round(image.height * scale),
			width : Math.round(image.width * scale),
			name : elem.id,
			strokeEnabled : selected,
			stroke : 'Red',
			strokeWidth : 2,
			lineJoin : 'round',
			dashArray : [7, 5],
			name : elem.id,
			draggable : true
		});



		elem.img = img;
		var aspect_ratio = image.width / image.height;

		if ((elem.fixed_aspect_ratio == undefined) || (elem.fixed_aspect_ratio == true)){
			elem.aspect_ratio = aspect_ratio
		}
		// else{
		// 	elem.aspect_ratio = undefined
		// }
		elem.img.setHeight(elem.height);
		elem.img.setWidth(elem.height * aspect_ratio);

		//console.log("setting up image with height "+elem.height)

		var img2 = img.clone();
		img2.attrs.strokeEnabled = false;

		elem.sugg_img = img2;


		if ("color" in elem){
			var recolor = function(pixels) {
				var d = pixels.data;
				for (var i = 0; i < d.length; i += 4) {

					//d[i] += alpha * d[i] + (1 - alpha) * 135;
					rgb = hexToRgb(elem.color)
					d[i] = rgb.r
					d[i+1] = rgb.g
					d[i+2] = rgb.b
				}
				return pixels;
			};

			elem.img.clearFilter()
			elem.img.setFilter(recolor)
			elem.img.applyFilter(recolor)
			elem.img.setOpacity(elem.opacity/100.0)

			elem.sugg_img.clearFilter()
			elem.sugg_img.setFilter(recolor)
			elem.sugg_img.applyFilter(recolor)
			elem.sugg_img.setOpacity(elem.opacity/100.0)
		}

		if (index<0){
			layer.add(img);
			sugg_layer.add(img2);
		}
		else{

			$.each($('#canvas').data("design").elements, function(i, e) {
				if ((i>=index) && (e.img != undefined)){
					e.img.remove()
					e.sugg_img.remove()
				}
			});

			layer.add(img);
			sugg_layer.add(img2);
			$.each($('#canvas').data("design").elements, function(i, e) {
				if ((i>=index) && (e.img != undefined)){
					layer.add(e.img)
					sugg_layer.add(e.sugg_img)
				}
			});
		}

		setupElementCallbacks(img, elem);

		elem.anchors = createAnchors(elem, layer, selected)
		moveAnchors(elem)

		elem.loaded = true;
	} else {
		var text = new Kinetic.Text({
			x : 0,
			y : 0,
			text : 'Image',
			fill : 'black',
			height : Math.round(image.height * scale),
			width : Math.round(image.width * scale),
			fontSize : 50,
			fontFamily : 'Calibri',
			align : 'center'
		});

		text.toImage({
			x : 0,
			y : 0,
			width : (text.getWidth()),
			height : (text.getHeight()),
			callback : function(text_img) {

				var add_background = function(pixels) {
					var d = pixels.data;
					for (var i = 0; i < d.length; i += 4) {

						//var alpha = (d[i + 3] / 255)

						//d[i] += alpha * d[i] + (1 - alpha) * 135;
						//d[i + 1] += alpha * d[i + 1] + (1 - alpha) * 206;
						//d[i + 2] += alpha * d[i + 2] + (1 - alpha) * 235;
						//d[i + 3] = 255;

						rgb = hexToRgb(elem.color)
						d[i] = rgb.r
						d[i+1] = rgb.g
						d[i+2] = rgb.b
					}
					return pixels;
				};

				img = new Kinetic.Image({
					x : elem.x,
					y : elem.y,
					image : text_img,
					height : Math.round(image.height * scale),
					width : Math.round(image.width * scale),
					name : elem.id,
					strokeEnabled : selected,
					stroke : 'Red',
					strokeWidth : 2,
					lineJoin : 'round',
					dashArray : [7, 5],
					name : elem.id,
					draggable : true,
					filter : add_background
				});

				layer.add(img);

				elem.img = img;
				var aspect_ratio = image.width / image.height;
				elem.aspect_ratio = aspect_ratio

				elem.img.setHeight(elem.height);
				elem.img.setWidth(elem.height * aspect_ratio);

				//console.log("setting up image with height "+elem.height)

				var img2 = img.clone();
				img2.attrs.strokeEnabled = false;
				sugg_layer.add(img2);
				elem.sugg_img = img2;

				setupElementCallbacks(img, elem);

				elem.anchors = createAnchors(elem, layer, selected)
				moveAnchors(elem)

				elem.loaded = true;

			}
		});
	}

}

function createAnchors(elem, layer, visible) {
	var anchors = {}
	anchors["topLeft"] = createScaleAnchor(0, 0, "topLeft", layer, elem, visible)
	anchors["topRight"] = createScaleAnchor(0, 0, "topRight", layer, elem, visible)
	anchors["bottomLeft"] = createScaleAnchor(0, 0, "bottomLeft", layer, elem, visible)
	anchors["bottomRight"] = createScaleAnchor(0, 0, "bottomRight", layer, elem, visible)

	//
	if ((elem.type == 'text') && ((elem.text.indexOf(" ") > -1) || (elem.text.indexOf("\n") > -1))) {
		anchors["midRight"] = createAspectRatioAnchor(0, 0, "midRight", layer, elem, visible)
		anchors["midLeft"] = createAspectRatioAnchor(0, 0, "midLeft", layer, elem, visible)
	}
	return anchors;

}

function createAspectRatioAnchor(x, y, name, layer, elem, selected) {

	var anchor = new Kinetic.Rect({
		x : x,
		y : y,
		width : 8,
		height : 8,
		fill : 'red',
		opacity : 1,
		name : name,
		draggable : true,
		visible : selected
	});
	anchor.rotate(150)
	layer.add(anchor);

	anchor.on('dragstart', function() {
    //resetSaliencyLayer()
		$.each($('#canvas').data("align_lines"), function(i, al) {
			al[0].hide()
		});

		console.log("drag start")
		elem.anchor_pos = layer.getStage().getPointerPosition()
		$('#canvas').data("user_input_log").push("AR")
		$('#canvas').data("status_log").push("AR")
	});
	anchor.on('dragmove', function() {

		$('#canvas').data("select_start", false)

		if ((elem.anchor_pos == 0) || (elem.fix_alternate))
			return;

		//resetSaliencyLayer()


		elem.resizing = true;
		//anchorImageUpdate(this,element);
		//console.log("layer "+anchor.getLayer())

		var alts = $('#canvas').data("design").element_alts[elem.id];

		console.log("drag move")
		var next_pos = layer.getStage().getPointerPosition()

		var flip = 1;
		if (name == 'midLeft')
			flip = -1;
		if (flip * (elem.anchor_pos.x - next_pos.x) > 5) {

			if ((elem.num_lines + 1) in alts) {
				selectAlternateElement(elem, elem.num_lines + 1)
				elem.anchor_pos = 0;
			}

			moveAnchors(elem)
			layer.draw();
		} else if (flip * (next_pos.x - elem.anchor_pos.x) > 5) {

			if ((elem.num_lines - 1) in alts) {
				selectAlternateElement(elem, elem.num_lines - 1)
				elem.anchor_pos = 0;
			}

			moveAnchors(elem)
			layer.draw();
		}

		// if (modified)
		// 	sendCurrentLayout();

	});

	anchor.on('dragend', function() {
		removeAlignmentLines()
		elem.resizing = false
		moveAnchors(elem)
		layer.draw();
	});

	return anchor;
}

function createScaleAnchor(x, y, name, layer, element, selected) {

	var anchor = new Kinetic.Circle({
		x : x,
		y : y,
		fill : 'red',
		opacity : 1,
		radius : 6,
		name : name,
		draggable : true,
		visible : selected
	});
	layer.add(anchor);

	anchor.on('dragstart', function() {
    //resetSaliencyLayer()
		$('#canvas').data("user_input_log").push("S")
		$('#canvas').data("status_log").push("S")
	});

	anchor.on('dragmove', function() {

		console.log("dragmove scale")
		$('#canvas').data("select_start", false)

		element.resizing = true;
		allowUpdates()

		anchorImageUpdate(this, element);

		drawAlignmentLines(element, name)

		// if ($("#infer_locking_select").prop("checked") && (element.fixed_amount == 0))
		// 	setElementState(element.id, 'tweakable')

		//
		layer.draw();

	});

	anchor.on('dragend', function() {

		removeAlignmentLines();
		// $.each($('#canvas').data("design").elements, function(i, e) {
		// 	if ((e != element)) {
		// 		if ($("#infer_locking_select").prop("checked")) {
		// 			var overlap = getOverlap(e.img, element.img)
		// 			if ((overlap > 0.1) && (e.fixed_amount != 1)) {
		// 				setElementState(e.id, 'unlocked')
        //
		// 				/*
		// 				 if (e.fix_alignment)
		// 				 {
		// 				 e.fix_alignment=false
		// 				 sendCurrentDesign()
		// 				 }
		// 				 */
		// 			}
		// 		}
		// 	}
		// });

		element.resizing = false
		//sendCurrentLayout()
	});

	return anchor;

}

function anchorImageAspectRatioUpdate(anchor, elem) {
	var anchor_pos = anchor.getAbsolutePosition()
	//console.log("element "+ elem.id+" anchor "+ anchor.attrs.name+" has position: "+anchor_pos.x + " "+ anchor_pos.y )

	var new_height = 1;
	var new_width = 1;
	if (anchor.attrs.name == "topLeft") {
		new_height = elem.anchors["topLeft"].getAbsolutePosition().y - elem.anchors["bottomLeft"].getAbsolutePosition().y
		new_width = elem.anchors["topRight"].getAbsolutePosition().x - elem.anchors["topLeft"].getAbsolutePosition().x
	}
	if (anchor.attrs.name == "bottomLeft") {
		new_height = elem.anchors["topLeft"].getAbsolutePosition().y - elem.anchors["bottomLeft"].getAbsolutePosition().y
		new_width = elem.anchors["bottomRight"].getAbsolutePosition().x - elem.anchors["bottomLeft"].getAbsolutePosition().x
	}
	if (anchor.attrs.name == "bottomRight") {
		new_height = elem.anchors["topRight"].getAbsolutePosition().y - elem.anchors["bottomRight"].getAbsolutePosition().y
		new_width = elem.anchors["bottomRight"].getAbsolutePosition().x - elem.anchors["bottomLeft"].getAbsolutePosition().x
	}
	if (anchor.attrs.name == "topRight") {
		new_height = elem.anchors["topRight"].getAbsolutePosition().y - elem.anchors["bottomRight"].getAbsolutePosition().y
		new_width = elem.anchors["topRight"].getAbsolutePosition().x - elem.anchors["topLeft"].getAbsolutePosition().x
	}

	var aspect_ratio = new_width / new_height;

	var nearest_elem = elem;
	var min_dist = 999;
	$.each($('#canvas').data("design").element_alts[elem.id], function(i, e) {
		var dist = Math.abs(aspect_ratio - e.aspect_ratio)
		if (dist < min_dist) {
			nearest_elem = e
			min_dist = dist
		}
	});

	if (elem != nearest_elem) {
		setAlternate(elem, nearest_elem);

		if (anchor.attrs.name.indexOf("Left") > -1) {
			nearest_elem.img.setX(anchor_pos.x)
		}

		return true
	}
	/*
	new_height=Math.max(new_height,10);
	elem.img.setHeight(new_height)
	elem.height=new_height

	if ("aspect_ratio" in elem)
	elem.img.setWidth(new_height*elem.aspect_ratio)
	else
	{
	new_width=Math.max(new_width,10)
	elem.img.setWidth(new_width)
	elem.width=new_width
	}

	if ((anchor.attrs.name=="topLeft") ||  (anchor.attrs.name=="bottomLeft") )
	{
	var right_pos=elem.anchors["bottomRight"].getAbsolutePosition().x;
	elem.img.setX(right_pos-elem.img.getWidth())
	}
	*/

	//moveAnchors(elem)
}

function setAlternate(elem, alt_elem) {
	console.log("setAlternate for element " + elem.id)

	var layer = $('#canvas').data("stage").get('#layer')[0];

	var design = $('#canvas').data("design")

	var scale = alt_elem.num_lines / elem.num_lines
	console.log("setting alternate text :" + alt_elem.text)

	console.log("orig element selected? " + elem.selected)

	console.log("alternate id :" + alt_elem.alternate_id)

	alt_elem.x = elem.x
	alt_elem.y = elem.y
	alt_elem.height = elem.height * scale
	alt_elem.align_type = elem.align_type
	alt_elem.align = elem.align
	alt_elem.group_id = elem.group_id
	alt_elem.importance = elem.importance
	alt_elem.selected = elem.selected
	alt_elem.fix_alignment = elem.fix_alignment
	alt_elem.fixed_amount = elem.fixed_amount

	// alt_elem.state_img = elem.state_img
	// alt_elem.state_img.setPosition(alt_elem.x + alt_elem.width, alt_elem.y)

	//alt_elem.unlock_img=elem.unlock_img
	//alt_elem.tweakable_img=elem.tweakable_img
	//alt_elem.lock_img=elem.lock_img

	alt_elem.optional = elem.optional

	elem.img.remove()
	elem.sugg_img.remove();

	$.each(design.element_alts[elem.id], function(i, e) {
		e.img.remove()
		$.each(e.alignment_imgs, function(j, ai) {
			ai.remove()
		});
		$.each(e.anchors, function(i, a) {
			a.hide()
		});
	});

	if (alt_elem.num_lines > 1) {
		if (alt_elem.img != alt_elem.alignment_imgs[alt_elem.align]) {
			alt_elem.img = alt_elem.alignment_imgs[alt_elem.align];
		}
	}

	alt_elem.img.setPosition(elem.img.attrs.x, elem.img.attrs.y)
	alt_elem.img.attrs.strokeEnabled = elem.selected
	alt_elem.img.setHeight(elem.img.getHeight() * scale)
	alt_elem.img.setWidth(alt_elem.img.getHeight() * alt_elem.aspect_ratio)
	alt_elem.img.setOpacity(elem.opacity)

	layer.add(alt_elem.img)
	alt_elem.img.show()

	//setHidden(alt_elem, elem.hidden)

	$.each(alt_elem.anchors, function(i, a) {
		//layer.add(a)
		a.moveToTop()
		a.show();
	});

	moveAnchors(alt_elem)

	layer.draw()

	var idx = design.elements.indexOf(elem);

	design.elements[idx] = alt_elem;

	if ($('#canvas').data("selected") == elem) {
		console.log("element was selected already")
		$("#num_lines_select").val(alt_elem.num_lines).attr('selected', true);
		$("#user_text").val(alt_elem.text);

		$('#canvas').data("selected", alt_elem)
	}

	// if (alt_elem.fixed_amount == 0)
	// 	setElementState(alt_elem.id, 'unlocked')
	// else if (alt_elem.fixed_amount == 0.5)
	// 	setElementState(alt_elem.id, 'tweakable')
	// else if (alt_elem.fixed_amount == 1)
	// 	setElementState(alt_elem.id, 'locked')

}

function anchorImageUpdate(anchor, elem) {
	var anchor_pos = anchor.getAbsolutePosition()
	//console.log("element "+ elem.id+" anchor "+ anchor.attrs.name+" has position: "+anchor_pos.x + " "+ anchor_pos.y )

	var new_height = 1;
	var new_width = 1;
	if (anchor.attrs.name == "topLeft") {
		new_height = elem.anchors["topLeft"].getAbsolutePosition().y - elem.anchors["bottomLeft"].getAbsolutePosition().y
		new_width = elem.anchors["topRight"].getAbsolutePosition().x - elem.anchors["topLeft"].getAbsolutePosition().x
	}
	if (anchor.attrs.name == "bottomLeft") {
		new_height = elem.anchors["topLeft"].getAbsolutePosition().y - elem.anchors["bottomLeft"].getAbsolutePosition().y
		new_width = elem.anchors["bottomRight"].getAbsolutePosition().x - elem.anchors["bottomLeft"].getAbsolutePosition().x
		elem.img.setY(anchor_pos.y)
	}
	if (anchor.attrs.name == "bottomRight") {
		new_height = elem.anchors["topRight"].getAbsolutePosition().y - elem.anchors["bottomRight"].getAbsolutePosition().y
		new_width = elem.anchors["bottomRight"].getAbsolutePosition().x - elem.anchors["bottomLeft"].getAbsolutePosition().x
		elem.img.setY(anchor_pos.y)
	}
	if (anchor.attrs.name == "topRight") {
		new_height = elem.anchors["topRight"].getAbsolutePosition().y - elem.anchors["bottomRight"].getAbsolutePosition().y
		new_width = elem.anchors["topRight"].getAbsolutePosition().x - elem.anchors["topLeft"].getAbsolutePosition().x
	}

	new_height = Math.max(new_height, 10);
	elem.img.setHeight(new_height)
	elem.height = new_height

	if ("aspect_ratio" in elem)
		elem.img.setWidth(new_height * elem.aspect_ratio)
	else {
		new_width = Math.max(new_width, 10)
		elem.img.setWidth(new_width)
		elem.width = new_width
	}

	if ((anchor.attrs.name == "topLeft") || (anchor.attrs.name == "bottomLeft")) {
		var right_pos = elem.anchors["bottomRight"].getAbsolutePosition().x;
		elem.img.setX(right_pos - elem.img.getWidth())
	}
	elem.x = elem.img.attrs.x
	elem.y = elem.img.attrs.y
	elem.width = elem.img.getWidth()
	elem.height = elem.img.getHeight()

	//elem.state_img.setPosition(elem.x + elem.width, elem.y)

	moveAnchors(elem)
}

function keyPressed(evt) {
	console.log("Key pressed: " + evt.keyCode)

	var input_focused = $("*:focus").length > 0;

	if (input_focused)
		return;

	// if (evt.keyCode == 49)
	// 	saveCurrentLayout()

	// if (evt.keyCode == 67) {
	// 	if ($('#canvas').data("overlap_mode")) {
	// 		$('#canvas').data("design").overlap_regions = [];
	// 		toggleOverlapMode();
	// 		toggleOverlapMode();
	// 		sendCurrentDesign();
    //
	// 	}
	// }

	// if (evt.keyCode == 65 && evt.shiftKey)
	// 	selectAllElements()

	if (evt.keyCode == 189 && evt.shiftKey)
		scaleCurrentElement(0.9)
	if (evt.keyCode == 187 && evt.shiftKey)
		scaleCurrentElement(1.1)

	if ((evt.keyCode == 68) || (evt.keyCode == 46))
		deleteCurrentElement()

	// if (evt.keyCode == 80)
	// 	toggleOverlapMode()

	// if (evt.keyCode == 82)
	// 	toggleRegionMode()
    //
	// if (evt.keyCode == 32) {
	// 	switchPauseState();
	// 	evt.preventDefault();
	// }

	/*
	 if (evt.keyCode==70)
	 {
	 $.each($('#canvas').data("design").elements, function(i, elem){

	 if (elem.selected)
	 {
	 if (elem.fixed_amount<1)
	 elem.fixed_amount=1
	 else
	 elem.fixed_amount=0.25

	 //setStroke(elem.img,true, 1.5,elem.fixed_amount );
	 //elem.img.attrs.opacity=elem.fixed_amount
	 }

	 });
	 $('#canvas').data("design").elements[0].img.getLayer().draw();
	 sendCurrentLayout();

	 }
	 */
}



function deleteCurrentElement() {

	//$('#element_controls').hide()
	document.body.style.cursor = "default";
	$('#canvas').data("text_mode", false)

	$('#canvas').data("user_input_log").push("Remove")
	$('#canvas').data("status_log").push("Remove")

	var elements;

	if ($('#canvas').data("region_mode"))
		elements = $('#canvas').data("design").regions
	else
		elements = $('#canvas').data("design").elements

	if ($('#canvas').data("selected").type == 'background')
		return;

	var rem = elements.indexOf($('#canvas').data("selected"));

	console.log("removing element " + rem)
	elements[rem].img.hide();
	if ("sugg_img" in elements[rem]) {
		elements[rem].sugg_img.hide();
	}
	console.log(elements)

	$.each(elements[rem].anchors, function(i, a) {
		a.destroy();
	});
	elements[rem].lock_img.destroy()
	elements[rem].unlock_img.destroy()
	elements[rem].tweakable_img.destroy()

	$.each($('#canvas').data("align_lines"), function(i, al) {
		al[0].destroy()
	});
	$('#canvas').data("align_lines", [])

	elements.splice(rem, 1);


	elements[0].img.getLayer().draw()
	elements[0].sugg_img.getLayer().draw()

	$('#canvas').data("design").elements = elements

	//sendCurrentDesign();
	//sendCurrentLayout();
	$('#canvas').data("selected", $('#canvas').data("design").back_elem)

}

function scaleCurrentElement(scale_factor) {
	var elem = $('#canvas').data("selected");

	if ((elem != undefined) && (elem.type != "background")) {

		var curr_height = elem.img.getHeight()
		var new_height = Math.max(curr_height * scale_factor, 5);
		elem.height = new_height;
		elem.img.setHeight(new_height)

		if (elem.type == 'region') {
			elem.img.setWidth(elem.img.getWidth() * scale_factor)
			elem.width = elem.img.getWidth();
		} else
			elem.img.setWidth(new_height * elem.aspect_ratio)

		elem.width = elem.img.getWidth();

		moveAnchors(elem)
		elem.img.getLayer().draw()
	}
}


function saveDesign() {
	var stage = $('#canvas').data("stage");
	var design = $('#canvas').data("design");

	$.each(design.elements, function(i, e) {

		if (e.img == undefined){
			console.log(e)
		}
		else{
				e.img.attrs.strokeEnabled = false;
				//e.state_img.hide()
				$.each(e.anchors, function(i, a) {
					a.hide();
				});
		}


	});

	$.each($('#canvas').data("align_lines"), function(i, al) {
		al[0].hide()
	});

	console.log("height " + design.elements[0].height)

	stage.toDataURL({
		callback : function(dataUrl) {

			saveDesignOnServer(dataUrl, design)

			$.each(design.elements, function(i, e) {
				if ((e.selected) && (e.img != undefined)){
					e.img.attrs.strokeEnabled = true;
					//e.state_img.show()
					$.each(e.anchors, function(i, a) {
						a.show();
					});
				}
			});
			$.each($('#canvas').data("align_lines"), function(i, al) {
				al[0].show()
			});

		}
	});
}

function updateSaliencyMix(saliency_val){
	$('#canvas').data("saliency_mix",saliency_val)
	$('#canvas').data("saliency_layout",'')

}

function toggleSaliency() {

	console.log("toggleSaliency")

	$('#canvas').data("saliency_layout",'')

	var stage = $('#canvas').data("stage");
	var design = $('#canvas').data("design");
	var saliency_layer = $('#canvas').data("saliency_layer");


	var layer = stage.get('#layer')[0];


	$('#canvas').data("dragging", false) //shouldn't need to do this. just being cautious since the saliency visualization uses this check

	if (!$("#show_importance_select").prop("checked")) {
		//layer.show();
		console.log("disabling saliency mode")
		saliency_layer.removeChildren();
		saliency_layer.draw()

		$( "#saliency_slider" ).hide()
		$("#saliencyButton").html('Show Saliency');

		if ($('#canvas').data("saliency_timer")) {
        clearTimeout($('#canvas').data("saliency_timer"))
				clearTimeout($('#canvas').data("saliency_reset_timer"))
		}

	} else {
		console.log("enabling saliency")

		$( "#saliency_slider" ).show()

		deselectAll(design.background_elem)
		design.background_elem.img.getLayer().draw();

        //resetSaliencyLayer()

        $('#canvas').data("requesting_saliency",false)
		setSaliencyImage()

		saliency_layer.draw()

		var timer = setInterval(setSaliencyImage,40)
		$('#canvas').data("saliency_timer",timer);

		var timer2 = setInterval(resetSaliencyTimer,2000)
		$('#canvas').data("saliency_reset_timer",timer2);
	}

}


function resetSaliencyTimer(){
	if ($('#canvas').data("requesting_saliency")) {
			$('#canvas').data("requesting_saliency",false);
	}
}


function colorStop(){
	console.log("colorStop")
		$('#canvas').data("color_block",true);

		$('#canvas').data("selected").img.attrs.strokeEnabled = false
		$.each($('#canvas').data("selected").anchors, function(i, a) {
			a.hide();
		});
}

function colorStart(){
	console.log("colorStart")
	$('#canvas').data("color_block",false);


	$('#canvas').data("selected").img.attrs.strokeEnabled = true
	$.each($('#canvas').data("selected").anchors, function(i, a) {
		a.show();
	});

	$('#canvas').data("selected").img.getLayer().draw()

}


function setSaliencyImage(){

    var design = $('#canvas').data("design")

	console.log("set saliency image "+String($("#show_importance_select").prop("checked"))+" "+$('#canvas').data("requesting_saliency"))

    if ($('#canvas').data("requesting_saliency")) {
        return;
    }

	if ($('#canvas').data("color_block")) {
		return;
	}

    if ($("#show_importance_select").prop("checked")) {


		var d1 = new Date();

        var saliency_layer = $('#canvas').data("saliency_layer");
        var init_layout = getCurrentLayout()


		if ($('#canvas').data("dragging")){
        	return
		}

        if ($('#canvas').data("saliency_layout")){

          var layoutDiff = getLayoutDiff( $('#canvas').data("saliency_layout"), init_layout)
            if (layoutDiff == 0){
              return
            }
        }
        $('#canvas').data("requesting_saliency",true);



				var textPositions = "" //getTextPositions()
				console.log("avg ? ")
				console.log($('#canvas').data("orig_importance_select"))
				console.log(textPositions)

				if ($('#canvas').data("orig_importance_select")) {
					console.log("use orig imp")
					textPositions = ""
				}


				//var sugg_layer = $('#canvas').data("sugg_stage").get('#sugg_layer')[0];
				//sugg_layer.draw()
				var canvas = $('#suggestion_canvas')[0].children[0].children[0]
				//var context = canvas.getContext("2d");
			//	var imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
			//	console.log(imageData);
			imageData = 0

			setStageLayout(init_layout)



        $('#canvas').data("sugg_stage").toDataURL({
							mimeType: "image/jpeg",
 							quality: 0.6,
                callback : function(dataUrl) {

                    var img = new Image();

                    img.onload = function() {

												if ($('#canvas').data("saliency_user_id") == undefined){
													$('#canvas').data("saliency_user_id",Math.round(Math.random() * 100000))
												}

												var saliency_user_id = $('#canvas').data("saliency_user_id")
												console.log("pre request")
												console.log((new Date())-d1)
                        var hitId = gup('hitId')
                        var fname = 'layouts/' + $('#canvas').data("design").name + '-' + String(saliency_user_id) + '.jpeg'
                        requestSaliencyImage(fname, dataUrl,textPositions,imageData,canvas.width, canvas.height,function(saliencyURL) {
                            console.log("saliency url:"+saliencyURL)
														console.log("returned url")
														console.log((new Date())-d1)

                            var saliencyImage = new Image();
                            saliencyImage.onload = function() {


																	console.log("image load time")
																	console.log((new Date())-d1)

                                if ($("#show_importance_select").prop("checked")) {


																		var mix = $('#canvas').data("saliency_mix")/100.0


                                    var layoutDiff = getLayoutDiff( getCurrentLayout(), init_layout)
                                    console.log("layoutDiff "+layoutDiff)
                                    if (layoutDiff==0){
																				resetSaliencyLayer()

                                        var simg = new Kinetic.Image({
                                            x : 0,
                                            y : 0,
                                            image : saliencyImage,
                                            height : design.height,
                                            width : design.width,
                                            name : saliency_user_id,
                                            opacity : mix,
                                            draggable : false
                                        });

                                        saliency_layer.add(simg);
                                    }
                                    saliency_layer.draw()


									console.log("final time delta")
									delta = (new Date())-d1
									console.log(delta)

									$('#saliency_time').html(delta)

                                    $('#canvas').data("requesting_saliency",false);
                                    $('#canvas').data("saliency_layout",init_layout)

                                }


                            };

														var r = Math.round(Math.random() * 100000)
                            saliencyImage.src = "/design/static/"+saliencyURL+"?"+String(r);

                         })

                    }
                    img.src = dataUrl;

                }
            });
    }
}


function resetSaliencyLayer()
{
    if ($("#show_importance_select").prop("checked")) {
        var design = $('#canvas').data("design")
        var saliency_layer = $('#canvas').data("saliency_layer");
        saliency_layer.removeChildren();

        saliency_layer.draw()
    }
}




function setStageLayout(new_layout) {
	var design = $('#canvas').data("design");


    var alignments = ["left", "center", "right"];

    var elements = new_layout.split("\n");
    var elem_cnt = parseInt(elements[2])


    var sugg_layer = $('#canvas').data("sugg_stage").get('#sugg_layer')[0];

    for (var i = 3; i < design.elements.length + 3; i++) {

        var elem = design.elements[i - 3];

				console.log("element type "+elem.type+" index: "+String(i-3))

        var elem_split = elements[i].split(',');

        var alt_id = parseInt(elem_split[7]);

        var alt_elem = elem;
        alt_elem.sugg_img.remove();

        if ((!elem.fix_alternate) && (elem.id in design.element_alts)) {
            $.each(design.element_alts[elem.id], function(num_lines, ae) {
                if (alt_id == ae.alternate_id) {
                    alt_elem = ae;
                    //console.log("found "+(i)+" num_lines "+num_lines+ " alt id "+ae.alternate_id)
                }

                ae.sugg_img.remove();
            });
        }

        if (alt_elem.num_lines > 1) {
            var a = parseInt(elem_split[4])

            var align;
            if (a > -1)
                align = alignments[a]
            else
                align = elem.align

            alt_elem.sugg_align = align;
            alt_elem.sugg_img = alt_elem.alignment_sugg_imgs[align];
        }

        if (alt_id < 0) {
            continue;
        }

        //console.log("added "+(i))
        sugg_layer.add(alt_elem.sugg_img);

        var height = parseInt(elem_split[2]);
        var width = parseInt(elem_split[3]);

        alt_elem.sugg_img.setX(parseInt(elem_split[0]));
        alt_elem.sugg_img.setY(parseInt(elem_split[1]));
        alt_elem.sugg_img.setHeight(height);
        alt_elem.sugg_img.setWidth(width);

        //if (alt_id!=-1)
        alt_elem.sugg_img.show()
        //else
        //	alt_elem.sugg_img.hide()

        //console.log("setting "+i+ " "+parseInt(elem_split[0])*4.0+ " "+ parseInt(elem_split[1])*4.0+" "+height+" "+width+" "+elem.aspect_ratio);
    }

    sugg_layer.draw();



}




function viewLayout(layout_type, layout_num) {

	console.log("view " + layout_type + " layout " + layout_num)

	if ((layout_num < 0) && $('#canvas').data("preview") > -1) {
		$('#canvas').data("preview", -1)
		$('#canvas').data("preview_image").hide()
		$('#canvas').data("preview_image").getLayer().draw()
		$('#canvas').data("overlap_layer").show()

		$('.selectedPreview').removeClass("selectedPreview")

	} else if ($('#' + layout_type + '_layout' + layout_num).data("layout") != undefined) {

		$('#' + layout_type + '_layout' + layout_num).addClass("selectedPreview")

		$('#canvas').data("overlap_layer").hide()
		$('#canvas').data("preview", layout_num)
		$('#canvas').data("preview_image").show()
		$('#canvas').data("preview_image").attrs.fillPatternImage = $('#' + layout_type + '_layout' + layout_num).data("preview_image")
		$('#canvas').data("preview_image").moveToTop()
		$('#canvas').data("preview_image").getLayer().draw()
	}

}



function updateTextElement(elem) {

	var old_text_chars = elem.old_text.replaceAll('\n', '').replaceAll(',', '').replaceAll(' ', '');
	var new_text_chars = elem.text.replaceAll('\n', '').replaceAll(',', '').replaceAll(' ', '');

	var old_num_lines = elem.old_text.split("\n").length;
	var new_num_lines = elem.text.split("\n").length;

	//var old_text_lines = elem.old_text.replaceAll(',', '').replaceAll(' ', '');
	//var new_text_lines = elem.text.replaceAll(',', '').replaceAll(' ', '');

	console.log("old_text: " + old_text_chars)
	console.log("new_text: " + new_text_chars)

	/*
	Cases:
	1) The new text is identical to the old text
	- re-render alternates, but use the current texts
	2) The new text is significantly different than the old text (new words, etc)
	- get text alternates and re-render everything from scratch
	3) The new text differs from the old text by the number of lines
	- render the new text, set that as a new alternate, and update the selection
	4) The new text only differs from the old text by commas or spaces (tweaking the current)
	- re-render only this element
	*/

	// Case 1
	if (elem.old_text == elem.text) {
		console.log("updateTextElement: Re-rendering existing alternates")
		renderTextAlts(elem, false)

	}
	//Case 2
	else if (old_text_chars != new_text_chars) {
		console.log("updateTextElement: Completely re-rendering & finding new alternates")
		renderTextAlts(elem, true)
	}
	//Case 3
	else if ((old_num_lines != new_num_lines)) {
		console.log("updateTextElement: Setting a new alternate with different #s of lines")

		var alts = $('#canvas').data("design").element_alts[elem.id];

		if ( new_num_lines in alts) {

			//selectAlternateElement(new_num_lines)
			//renderTextElement(elem,true)

			alts[new_num_lines].text = elem.text
			elem.text = elem.old_text;
			renderTextElement(alts[new_num_lines], false)

			setTimeout(function() {
				setAlternate(elem, alts[new_num_lines])
			}, 100)

			$("#num_lines_select").val(new_num_lines).attr('selected', true);

		} else {

			var new_elem = jQuery.extend(true, {}, elem)
			new_elem.text = elem.text
			new_elem.num_lines = new_num_lines
			new_elem.fixed_amount = 1
			elem.text = elem.old_text

			elem.img.remove()
			new_elem.loaded = false
			delete new_elem["img"]
			renderTextElement(new_elem, true)

			var max_cnt = 0;
			$.each(alts, function(i, alt) {
				max_cnt = Math.max(max_cnt, alt.alternate_id);
			});
			new_elem.alternate_id = max_cnt + 1

			alts[new_num_lines] = new_elem

			//selectElement(new_elem)
			$("#num_lines_select").val(new_num_lines).attr('selected', true);
			//return;

		}

	}
	//Case 4: tweaking
	else {
		console.log("updateTextElement: Tweaking current")
		renderTextElement(elem, true)
	}

	selectElement(elem)

}


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function renderTextAlts(elem, createAlternates) {
	console.log("rendering text alts for element text: " + elem.text)
	elem.orig_text = elem.text.trim()

	var idx = $('#canvas').data("design").elements.indexOf(elem);

	var text_alts = {};

	if (elem.id in $('#canvas').data("design").element_alts) {
		var elem_alts = $('#canvas').data("design").element_alts[elem.id];
		$.each(elem_alts, function(i, alt) {
			var num_lines = alt.text.split("\n").length
			text_alts[num_lines] = alt.text

			if ((alt.img != undefined) && ( typeof (alt.img) != 'string')) {
				console.log("typeof(alt.img) " + typeof (alt.img))

				alt.img.remove()
				alt.sugg_img.remove()

				$.each(alt.anchors, function(i, a) {
					a.destroy();
				});
			}
		})
	}

	if ((!(elem.id in $('#canvas').data("design").element_alts)) || (createAlternates))
		text_alts = findTextAlternates(elem.text)

	var alts = {}
	var cnt = 0;
	$.each(text_alts, function(i, text) {

		//console.log("rendering text with num_lines "+elem.num_lines+" \n"+)

		var new_elem;
		if (text == elem.orig_text) {
			console.log("matching orig")
			new_elem = elem
			$('#canvas').data("design").elements[idx] = new_elem
		} else {
			new_elem = jQuery.extend(true, {}, elem)
			new_elem.text = text
			new_elem.num_lines = text.split("\n").length
		}
		new_elem.text = new_elem.text.trim()
		//new_elem.state_img = elem.state_img;
		//new_elem.unlock_img = elem.unlock_img;
		//new_elem.tweakable_img = elem.tweakable_img;
		//new_elem.lock_img = elem.lock_img;
		if (new_elem.img){
			new_elem.img.remove()
			delete new_elem["img"];
		}
		if (new_elem.sugg_img){
			new_elem.sugg_img.remove()
			delete new_elem["sugg_img"];
		}



		renderTextElement(new_elem, false)

		alts[new_elem.num_lines] = new_elem
		new_elem.alternate_id = cnt
		cnt = cnt + 1

	});

	$('#canvas').data("design").element_alts[elem.id] = alts;

}

function selectAlternateElement(elem, num_lines) {

	console.log("setting element " + elem.id + " with num lines " + num_lines)

	var alts = $('#canvas').data("design").element_alts[elem.id]

	if ( num_lines in alts) {
		setAlternate(elem, alts[num_lines])
	}

	//design.elements[idx].style=elem.style

}

function renderTextElement(elem, is_visible) {

	var layer = $('#canvas').data("stage").get('#layer')[0];
	var sugg_layer = $('#canvas').data("sugg_stage").get('#sugg_layer')[0];

	//var layer=elem.img.getLayer();
	//var sugg_layer=elem.sugg_img.getLayer();

	console.log("rendering text for element " + elem.text)

	fontStyle = ''
	if (elem.bold)
		fontStyle = fontStyle + " bold";
	if (elem.italic)
		fontStyle = fontStyle + " italic";

	var sugg_x = elem.x;
	var sugg_y = elem.y;
	var sugg_height = elem.height;

	if ("img" in elem) {
		console.log("removing img from element")

		sugg_x = elem.sugg_img.getAbsolutePosition().x
		sugg_y = elem.sugg_img.getAbsolutePosition().y
		sugg_height = elem.sugg_img.getHeight()

		elem.x = elem.img.getAbsolutePosition().x
		elem.y = elem.img.getAbsolutePosition().y
		elem.height = elem.img.getHeight()
		elem.width = elem.img.getWidth()
		elem.img.destroy()
		elem.sugg_img.destroy()

		$.each(elem.alignment_imgs, function(i, ai) {
			ai.destroy()
		});

		$.each(elem.anchors, function(i, a) {
			a.destroy()
		});
	}

	var alignments;

	elem.num_lines = elem.text.split("\n").length;

	// wierd...look into this fixed_alignment
	if ((elem.num_lines > 1) && ((!("fixed_alignment" in elem)) || (elem.fixed_alignment == false)))
		alignments = ["left", "center", "right"];
	else
		alignments = [elem.align]

	console.log("alignments: " + (alignments))

	elem.max_line_length = 0;
	$.each(elem.text.split("\n"), function(i, t) {
		elem.max_line_length = Math.max(elem.max_line_length, t.length)
	});
	console.log("max line length: " + elem.max_line_length)


	if (elem.text == 'THE PRO MAGAZINE '){
			console.log("Check")
	}
	elem.text = elem.text.trim()
	//elem.num_align=alignments.length

	elem.alignment_imgs = {}
	elem.alignment_sugg_imgs = {}

	console.log("font: " + elem.font)
	console.log("fontStyle: " + fontStyle)

	$.each(alignments, function(index, curr_alignment) {

		var text = new Kinetic.Text({
			x : 0,
			y : 0,
			text : elem.text,
			fill : elem.color,
			fontSize : (100 / elem.num_lines + 10),
			fontStyle : fontStyle,
			fontFamily : elem.font,
			align : curr_alignment
		});

		if (gup('hideContent') == '1')
			text = new Kinetic.Text({
				x : 0,
				y : 0,
				text : 'Text',
				fill : 'black',
				height : text.getHeight(),
				width : text.getWidth(),
				fontSize : 30,
				fontFamily : 'Calibri',
				align : 'center'
			});

		elem.anchors = createAnchors(elem, layer, false)

		elem.aspect_ratio = text.getWidth() / text.getHeight()

		//elem.aspect_ratio=img.width/img.height
		console.log("text: " + elem.text + " \n aspect ratio " + elem.aspect_ratio)

		text.toImage({
			x : 0,
			y : 0,
			width : (text.getWidth()),
			height : (text.getHeight()),
			callback : function(img) {



				var add_background = ''
				//if (gup('hideContent') == '1') {
					add_background = function(pixels) {
						var d = pixels.data;
						for (var i = 0; i < d.length; i += 4) {



							rgb = hexToRgb(elem.color)
							d[i] = rgb.r
							d[i+1] = rgb.g
							d[i+2] = rgb.b

						}
						return pixels;
					};
				//}

				var text_img = new Kinetic.Image({
					image : img,
					x : elem.x,
					y : elem.y,
					width : img.width, //max_x-min_x,
					height : img.height, //max_y-min_y,
					strokeEnabled : is_visible,
					stroke : 'Red',
					strokeWidth : 2,
					lineJoin : 'round',
					dashArray : [7, 5],
					name : String(elem.id),
					draggable : true,
					visible : false,
					filter : add_background
					//crop: {
					//x: min_x,
					//y: min_y,
					//width: max_x-min_x,
					// height: max_y-min_y
					//}
				});

				if (elem.text == 'THE PRO MAGAZINE '){
						console.log("Check")
				}

				var scale = 1.0;
				if (elem.old_text.length > 0) {
					var old_num_lines = elem.old_text.split("\n").length;
					scale = elem.num_lines / old_num_lines;
				}

				elem.alignment_imgs[curr_alignment] = text_img

				text_img.setHeight(elem.height * scale);
				text_img.setWidth(elem.height * scale * elem.aspect_ratio);

				var sugg_text_img = text_img.clone();
				sugg_text_img.setX(sugg_x);
				sugg_text_img.setY(sugg_y);
				sugg_text_img.setHeight(sugg_height)
				sugg_text_img.setWidth(sugg_height * elem.aspect_ratio)
				sugg_text_img.attrs.strokeEnabled = false;

				elem.alignment_imgs[curr_alignment] = text_img
				elem.alignment_sugg_imgs[curr_alignment] = sugg_text_img

				console.log("create text with num_lines " + elem.num_lines + " with alignment:" + curr_alignment + " " + elem.align)
				if ((elem.num_lines == 1) || (elem.align == curr_alignment)) {

					if (elem.img){
						elem.img.remove()
					}
					elem.img = text_img;
					layer.add(text_img);

					if ((is_visible) || (elem.text.trim() == elem.orig_text.trim())) {

						console.log('matched elem text: ' + elem.orig_text)
						//$.each(elem.anchors, function(i,a){
						//	layer.add(a)
						//a.moveToTop()
						//});
						//moveAnchors(elem)

						elem.img.show()

						layer.draw()
					}
				}

				if ((elem.num_lines == 1) || (elem.sugg_align == curr_alignment)) {
					elem.sugg_img = sugg_text_img;
					sugg_layer.add(sugg_text_img);

					if ((is_visible) || (elem.text == elem.orig_text)) {
						sugg_layer.draw()
						elem.sugg_img.show()
					}
				}

				setupElementCallbacks(text_img, elem);

				elem.loaded = true;

			}
		});
	});

}

function findTextAlternates(text) {
	var alts = {};

	var one_line = text.split("\n").join(" ");
	var num_words = one_line.split(" ").length;

	alts[1] = one_line;

	var init_num_lines = text.split("\n").length;

	console.log("one line: " + one_line);
	console.log("num words:" + num_words);

	//console.log("init_num_lines "+init_num_lines)

	for (var n = 2; n <= Math.min(num_words, 8); n++) {

		var line_size = one_line.length / n;
		console.log('line size' + line_size)

		var new_text = ''
		var curr_idx = 0;
		var check_idx = curr_idx + line_size;
		for (var i = 0; i < n - 1; i++) {
			var idx1 = one_line.indexOf(' ', check_idx);

			var idx2 = one_line.substring(0, check_idx).lastIndexOf(' ');

			if ((idx1 == -1) && (idx2 == -1)) {
				console.log("index ==-1 ")
				continue

			}

			var idx = 0
			if ((((idx1 - check_idx) < (check_idx - idx2)) || (idx2 >= one_line.length - 1) || (idx2 == -1)) && (idx1 != -1))
				idx = idx1;
			else
				idx = idx2;

			console.log('n' + n + ' i ' + i + " curr idx " + curr_idx + " idx " + idx)
			console.log(" idx1 " + idx1 + " " + " idx2 " + idx2)
			new_text += one_line.substring(curr_idx, idx + 1) + "\n"
			curr_idx = idx;
			check_idx += line_size;

		}
		new_text += one_line.substring(curr_idx, one_line.length)

		console.log('new_text: ' + new_text)
		var lines = new_text.split("\n")
		var text2 = ''
		var max_len = 0;
		for (var j = 0; j < lines.length; j++) {
			if (lines[j].length > 0) {
				var trimmed = lines[j].trim()
				text2 += trimmed + "\n"
				max_len = Math.max(max_len, trimmed.length)
			}
		}

		text2 = text2.substring(0, text2.length - 1)

		var num_lines = text2.split("\n").length;

		var ratio = (max_len) / (num_lines)
		console.log('Creating text alt ' + n + ' with num_lines ' + num_lines + ", ratio: " + ratio + "\n" + text2)

		//if ((num_lines>2) && (ratio<5))
		//	continue;

		alts[num_lines] = text2.trim();
	}

	alts[init_num_lines] = text.trim();

	return alts;

}

function deselectAll(elem) {
	var other;

	$('#background_controls').hide()
	//$('#element_controls').hide()

	if ((elem != undefined) && (elem.type == 'region'))
		other = $('#canvas').data("design").regions
	else
		other = $('#canvas').data("design").elements

	$('#canvas').data("selected", elem);

	$.each($('#canvas').data("align_lines"), function(i, al) {
		al[0].destroy()
	});
	$('#canvas').data("align_lines", [])

	$.each(other, function(i, e) {
		if ((e != elem)) {

			//e.state_img.hide()

			if (e.selected) {
				e.img.attrs.strokeEnabled = false;

				$.each(e.anchors, function(i, a) {
					a.hide();
				});
				e.selected = false;
				e.img.getLayer().draw();
			}

		}
	});
}

function selectMultipleElements(p1, p2) {

	console.log('p1:' + p1.x + ' ' + p1.y)
	console.log('p2: ' + p2.x + ' ' + p2.y)
	var x = Math.min(p1.x, p2.x)
	var y = Math.min(p1.y, p2.y)
	var width = Math.max(p1.x, p2.x) - x
	var height = Math.max(p1.y, p2.y) - y

	var selected = []
	$.each($('#canvas').data("design").elements, function(i, e) {

		if (!((x + width < e.x) || (e.x + e.width < x) || (y + height < e.y) || (e.y + e.height < y)))
			selected.push(e)

	});
	if (selected.length > 0) {
		deselectAll()
		$.each(selected, function(i, e) {
			console.log('e:' + e.x + ' ' + e.y + " w/h: " + e.width + ' ' + e.height)
			console.log("selected element " + e.id)
			selectElement(e, true)
		});

	}

}

function selectElement(elem, multiple) {

	multiple = typeof multiple !== 'undefined' ? multiple : false;

	console.log("setting selected to " + elem.id + " with type " + elem.type + " and multiple " + multiple)

	//if (elem.selected)
	//	return;

	if (elem.img == undefined) {
		console.log("no image. try again in 200 ms")
		setTimeout(function() {
			selectElement(elem, multiple);
		}, 100)
		return

	}

	if (!multiple) {
		deselectAll(elem)

		//if ($('#canvas').data("selected")!=elem)
		setControls(elem)

		//if (elem.type != 'background')
		//	drawAlignmentLines(elem, 'dragging')

	} else {

		setControls(elem)



		if (elem.selected) {
			elem.selected = false;
			elem.img.attrs.strokeEnabled = false;
			elem.img.getLayer().draw();
			return;

		}

		$.each($('#canvas').data("selected").anchors, function(i, a) {
			a.hide();
		});
	}

	if ($('#canvas').data("region_mode"))
		elem.img.moveToTop();

	var layer = elem.img.getLayer()

	if (!multiple) {
		console.log("setting anchors")
		$.each(elem.anchors, function(i, a) {

			//if ($('#canvas').data("region_mode"))
			a.moveToTop()
			//layer.add(a)

			if ($('#canvas').data("color_block")) {
				a.hide()
				return
			}
			a.show()
		});
		moveAnchors(elem);
	}


	$('#canvas').data("selected", elem);
	//elem.curr_pos=elem.img.getStage().getPointerPosition()
	elem.last_x = elem.img.getPosition().x;
	elem_last_y = elem.img.getPosition().y;

	elem.selected = true;

	var block = $('#canvas').data("color_block")

	elem.img.attrs.strokeEnabled = ((block == undefined) || (block == false));

	$("#canvas").data("last_selected", $('#canvas').data("selected"))
	$('#canvas').data("selected", elem);

	console.log("finished selecting")



	layer.draw();

}

function getDistance(p1, p2) {
	return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
}

function setupStageCallbacks(stage) {
	stage.getContent().addEventListener('touchmove', function(evt) {
		var touch1 = evt.touches[0];
		var touch2 = evt.touches[1];

		if (touch1 && touch2) {
			var dist = getDistance({
				x : touch1.clientX,
				y : touch1.clientY
			}, {
				x : touch2.clientX,
				y : touch2.clientY
			});

			var lastDist = $('#canvas').data("lastDist");
			var lastScale = $('#canvas').data("lastScale");
			$('#canvas').data("lastDist", dist);

			var scale = ((dist + 50 ) / (lastDist + 50));
			scale = Math.min(Math.max(scale, 0.95), 1.05)

			if ((lastScale != undefined) && (((lastScale > 1) && (scale > 1)) || ((lastScale < 1) && (scale < 1))))
				scale = scale * 0.25 + lastScale * 0.75;
			$('#canvas').data("lastScale", scale);

			scaleCurrentElement(scale)
		}
	}, false);

	stage.getContent().addEventListener('touchend', function() {
		$('#canvas').data("lastDist", 0);
	}, false);

}

function setupElementCallbacks(elem_img, elem) {

	var stage = elem_img.getStage();

	elem_img.on('dragstart', function(evt) {

		$('#canvas').data("dragging", true)
		console.log("dragstart")
		evt.preventDefault();

		if (elem.type != 'background')
			$('#canvas').data("select_start", false)


		$.each($('#canvas').data("design").elements, function(i, e) {
			e.last_x=e.x;
			e.last_y=e.y;
		});

		if (!elem.selected)
			selectElement(elem, evt.shiftKey == 1)

			console.log("setup element callbacks")
		elem.curr_pos = elem_img.getStage().getPointerPosition();

		$('#canvas').data("user_input_log").push("M")
		$('#canvas').data("status_log").push("M")
	});

	elem_img.on('mouseover', function(evt) {
		if ($("#mouseover_alignment_select").prop("checked"))
			drawAlignmentLines(elem, 'mouseover')

	});

	elem_img.on('dragmove', function(evt) {


		console.log("dragmove")

		evt.preventDefault();

		if ((elem.resizing))
			return;


		$('#canvas').data("select_start", false)
		allowUpdates()

		var stage = elem_img.getStage()

		//console.log("stage:"+stage)
		if (stage == undefined) {
			console.log("layer:")
			console.log(elem_img.getLayer())
			$('#suggestion_status').text("stage undefined");
			return;

		}

		moveAnchors(elem)

		elem.x = elem_img.getPosition().x
		elem.y = elem_img.getPosition().y

		//elem.state_img.setPosition(elem.x + elem.width, elem.y)

		drawAlignmentLines(elem, 'dragging')


		var diff_x = elem.x - elem.last_x;
		var diff_y = elem.y - elem.last_y;

		elem.last_x = elem.x
		elem.last_y = elem.y

		var num_other_selected = 0

		$.each($('#canvas').data("design").elements, function(i, e) {
			if ((e != elem) && (e.selected)) {

				if (e.img.attrs.strokeEnabled == false) {
					$('#error_message').text("Element selected by mistake")
					e.selected = false
					return

				}

				e.curr_pos += diff_x
				e.curr_pos += diff_y

				e.x += diff_x
				e.y += diff_y

				e.img.setPosition(e.x, e.y)
				//e.state_img.setPosition(e.x + e.width, e.y)

				e.fixed_amount = elem.fixed_amount
				num_other_selected += 1
			}
		});


		this.getLayer().draw();
	});

	elem_img.on('dragend', function(evt) {

		removeAlignmentLines()
		evt.preventDefault();

		this.getLayer().draw();
		$('#canvas').data("dragging", false)

	});

	elem_img.on('dblclick dbltap', function(evt) {
		console.log("double click");

		if (elem.type != 'background'){
			if (elem.selected){
				showElementControls();
			}
		}
		else
			showBackgroundControls();
	});

	elem_img.on('click tap', function(evt) {

		$('#canvas').data("select_start",false)

		if ($('#canvas').data("dragging"))
			return;

		console.log("click, text mode " + $('#canvas').data("text_mode"))
		if ($('#canvas').data("text_mode")) {

			createNewElement('text')
			document.body.style.cursor = "default";
			$('#canvas').data("text_mode", false)
			return
		}

		if (elem.selected){
			deselectAll()
			return;
		}

		selectElement(elem, evt.shiftKey == 1)

		if (elem.type == 'background') {

			//$('#element_controls').hide()

			var last_selected = $("#canvas").data("last_selected")

			if ($('#background_controls').is(":visible"))
				$('#background_controls').hide()
			else if ((last_selected != undefined) && (last_selected.type == "background") && (!$('#canvas').data("noModifications")))
				$('#background_controls').show()

		} else {
			$('#background_controls').hide()

			//sendCurrentLayout()
		}

	});

	if (elem.type == 'background') {
		elem_img.on("mousedown", function(evt) {

			console.log("mouse down: " + $('#canvas').data("select_start"))
			console.log("bg mouse down")
			$('#canvas').data("select_start", stage.getPointerPosition())
			$('#canvas').data("select_rect").setPosition($('#canvas').data("select_start"));
		});

		$(stage.getContent()).on("mousemove", function(evt) {

			var start_pos = $('#canvas').data("select_start")
			//
			//evt.preventDefault();
			if (start_pos != false) {
				console.log("mouse move")

				var select_rect = $('#canvas').data("select_rect")

				var curr_pos = stage.getPointerPosition()
				var dist = getDistance(start_pos, curr_pos)

				if (dist > 10) {
					selectMultipleElements($('#canvas').data("select_start"), stage.getPointerPosition())

					select_rect.setWidth(curr_pos.x - start_pos.x)
					select_rect.setHeight(curr_pos.y - start_pos.y)
					select_rect.show()
					select_rect.getLayer().draw()
				}
			}
		});

		$(stage.getContent()).on("mouseup", function(evt) {

			//evt.preventDefault();
			$('#canvas').data("select_rect").hide()
			$('#canvas').data("select_rect").getLayer().draw()

			console.log("mouse up: " + $('#canvas').data("select_start"))

			if ($('#canvas').data("select_start") != false) {
				console.log("mouse up")
				var curr_pos = stage.getPointerPosition()
				var dist = getDistance($('#canvas').data("select_start"), curr_pos)

				if (dist > 10) {

					selectMultipleElements($('#canvas').data("select_start"), stage.getPointerPosition())
				}
			}
			$('#canvas').data("select_start", false)

		});

	}

}

function removeAlignmentLines(){
	$.each($('#canvas').data("align_lines"), function(i, al) {
		al[0].destroy()
	});
	$('#canvas').data("align_lines", [])
}

function drawAlignmentLines(elem, call_type) {

	console.log("drawAlignmentLines")

	removeAlignmentLines();

	if (elem.type == 'background') {
		elem.img.getLayer().draw()
		return;
	}

	elem.width = elem.img.getWidth()
	elem.height = elem.img.getHeight()
	//console.log("drawAlignmentLines")

	elem.mid_x = elem.x + elem.width / 2.0
	elem.mid_y = elem.y + elem.height / 2.0

	var min_x_amount = 9999
	var min_y_amount = 9999
	var x_line = [min_x_amount, 0, 0, 0, 0, 0, -99, []]
	var y_line = [0, min_y_amount, 0, 0, 0, 0, -99, []]

	var align_thresh = 10

	var design_x_center = $('#canvas').data("design").width / 2.0
	var design_y_center = $('#canvas').data("design").height / 2.0
	var align_x_center = Math.abs(elem.mid_x - design_x_center)
	var align_y_center = Math.abs(elem.mid_y - design_y_center)

	//var global_x_align=false;
	if (align_x_center < align_thresh) {
		//global_x_align=true;
		min_x_amount = align_x_center
		x_line = ([design_x_center - elem.mid_x, 0, design_x_center, 0, design_x_center, design_y_center * 2, 10, []])
	}

	//var global_y_align=false;
	if (align_y_center < align_thresh) {
		//global_y_align=true;
		min_y_amount = align_y_center
		y_line = ([0, design_y_center - elem.mid_y, 0, design_y_center, design_x_center * 2, design_y_center, 11, []])
	}

	$.each($('#canvas').data("design").elements, function(i, e) {

		if ((e != elem) && (!(e.selected))) {
			if (e.img == undefined){
				console.log("error")
				return
			}
			e.width = e.img.getWidth()
			e.height = e.img.getHeight()

			var mid_x = e.x + e.width / 2.0;
			var mid_y = e.y + e.height / 2.0;

			var align_left = Math.abs(elem.x - e.x)
			var align_right = Math.abs(elem.x + elem.width - (e.x + e.width))
			var align_x_center = Math.abs(elem.mid_x - mid_x)
			var align_x_min = Math.min(align_left, Math.min(align_x_center, align_right))

			var align_bottom = Math.abs(elem.y - e.y)
			var align_top = Math.abs(elem.y + elem.height - (e.y + e.height))
			var align_y_center = Math.abs(elem.mid_y - mid_y)
			var align_y_min = Math.min(align_top, Math.min(align_y_center, align_bottom))

			if (call_type.indexOf('Left') > -1) {
				align_x_center = align_thresh + 1
				align_right = align_thresh + 1
			}
			if (call_type.indexOf('Right') > -1) {
				align_x_center = align_thresh + 1
				align_left = align_thresh + 1
			}
			if (call_type.indexOf('top') > -1) {
				align_y_center = align_thresh + 1
				align_bottom = align_thresh + 1
			}
			if (call_type.indexOf('bottom') > -1) {
				align_y_center = align_thresh + 1
				align_top = align_thresh + 1
			}

			var y_start = Math.min(e.y, elem.y)
			var y_end = Math.max(e.y + e.height, elem.y + elem.height)

			var x_start = Math.min(e.x, elem.x)
			var x_end = Math.max(e.x + e.width, elem.x + elem.width)
			//&& (y_end-y_start >x_line[5]-x_line[3])
			if ((align_x_min < align_thresh)) {

				var prev_line = x_line;

				//global_x_align=false;

				var new_x_line = -1;
				if ((align_left < align_thresh) && (align_left == align_x_min)) {
					x_line = ([e.x - elem.x, 0, e.x, y_start, e.x, y_end, 0, [e.id]])
				} else if ((align_x_center < align_thresh) && (align_x_center == align_x_min)) {
					x_line = ([mid_x - elem.mid_x, 0, mid_x, y_start, mid_x, y_end, 1, [e.id]])
				} else if ((align_right < align_thresh) && (align_right == align_x_min)) {
					x_line = ([(e.x + e.width) - (elem.x + elem.width), 0, e.x + e.width, y_start, e.x + e.width, y_end, 2, [e.id]])
				}

				//if they are the same type, then concatente the other elements
				if (prev_line[6] == x_line[6]) {
					//console.log("same type")
					if (align_x_min > min_x_amount) {

						//var prev_align=prev_line[7]
						var temp = jQuery.extend(true, {}, prev_line);
						prev_line = x_line
						x_line = temp
						//x_line[7]=prev_align
						//console.log("prev_line:"+prev_line)
						//console.log("x_line:"+x_line)
					}

					x_line[3] = Math.min(x_line[3], prev_line[3])
					x_line[5] = Math.max(x_line[5], prev_line[5])
					x_line[7] = x_line[7].concat(prev_line[7])
				} else {
					if (align_x_min > min_x_amount)
						x_line = prev_line
				}
				min_x_amount = Math.min(align_x_min, min_x_amount);

			}

			//(x_end-x_start >x_line[4]-x_line[2]) &&
			if ((align_y_min < align_thresh)) {

				//console.log("matched element: "+e.id)
				var prev_line = y_line;
				//console.log("prev_line"+prev_line)

				//global_y_align=false;

				if ((align_bottom < align_thresh) && (align_bottom == align_y_min)) {
					y_line = ([0, e.y - elem.y, x_start, e.y, x_end, e.y, 3, [e.id]])
				} else if ((align_y_center < align_thresh) && (align_y_center == align_y_min)) {
					y_line = ([0, mid_y - elem.mid_y, x_start, mid_y, x_end, mid_y, 4, [e.id]])
				} else if ((align_top < align_thresh) && (align_top == align_y_min)) {
					y_line = ([0, (e.y + e.height) - (elem.y + elem.height), x_start, e.y + e.height, x_end, e.y + e.height, 5, [e.id]])
				}

				//if they are the same type, then concatente the other elements
				if (prev_line[6] == y_line[6]) {
					//console.log("same type")
					if (align_y_min > min_y_amount) {
						//var prev_align=prev_line[7]
						var temp = jQuery.extend(true, {}, prev_line);
						prev_line = y_line
						y_line = temp
						//y_line[7]=prev_align
						//console.log("prev_line:"+prev_line)
						//console.log("y_line:"+y_line)
					}

					y_line[7] = y_line[7].concat(prev_line[7])
					y_line[2] = Math.min(y_line[2], prev_line[2])
					y_line[4] = Math.max(y_line[4], prev_line[4])
				} else {
					if (align_y_min > min_y_amount)
						y_line = prev_line
				}
				min_y_amount = Math.min(align_y_min, min_y_amount);

			}

		}

	});
	//}

	var lines = [];
	if (x_line[0] < 9999)
		lines.push(x_line)
	if (y_line[1] < 9999)
		lines.push(y_line)

	if ((lines.length > 0)) {
		$.each(lines, function(i, line) {

			var stroke_color = 'black'
			var stroke_opacity = 0.35
			if ($('#canvas').data("invert")) {
				stroke_color = 'white'
				stroke_opacity = 0.5
			}

			//console.log("creating line "+line)
			var draw_line = new Kinetic.Line({
				points : [line[2], line[3], line[4], line[5]],
				stroke : stroke_color,
				strokeWidth : 1,
				lineJoin : 'round',
				dashArray : [3, 2],
				opacity : stroke_opacity
			});

			//var global_align= Number(((line[2]==line[4]) && global_x_align) || ((line[2]!=line[4]) && global_y_align))

			$('#canvas').data("align_lines").push([draw_line, elem.id, line[6], line[7]])
			elem.img.getLayer().add(draw_line)

			if ((line[0] != 0) || (line[1] != 0)) {

				/*
				 $.each($('#canvas').data("design").elements, function(i, e) {
				 if (e.selected)
				 {

				 if (call_type=='dragging')
				 {
				 e.x+=line[0];
				 e.y+=line[1];
				 }

				 e.img.setPosition(e.x,e.y)
				 //elem.img.setWidth(elem.width,elem.height)
				 e.state_img.setPosition(e.x+e.width,e.y)
				 moveAnchors(e)

				 }
				 });
				 */

				if ((call_type == 'dragging')) {
					elem.x += line[0];
					elem.y += line[1];
				} else if (call_type == 'topLeft') {
					elem.x += line[0];
					elem.y += line[1];

					elem.height += Math.max(line[1], line[0] / elem.aspect_ratio)
					elem.width += Math.max(line[0], line[1] * elem.aspect_ratio)
				}

				elem.img.setPosition(elem.x, elem.y)
				//elem.img.setWidth(elem.width,elem.height)
				//elem.state_img.setPosition(elem.x + elem.width, elem.y)
				moveAnchors(elem)

			}

		});

		elem.img.getLayer().draw()

	}

}


function showBackgroundControls() {
	if (!$('#canvas').data("noModifications")) {
		$('#background_controls').show()
		$('#element_controls').hide()
	}

}

function showElementControls() {
	if (!$('#canvas').data("noModifications")) {
		$('#background_controls').hide()
		$('#element_controls').show()
	}
}

function moveAnchors(elem) {

	$.each(elem.anchors, function(i, a) {
		if (a.attrs.name == 'bottomLeft') {
			a.setX(elem.img.getAbsolutePosition().x)
			a.setY(elem.img.getAbsolutePosition().y)
		}
		if (a.attrs.name == 'bottomRight') {
			a.setX(elem.img.getAbsolutePosition().x + elem.img.getWidth())
			a.setY(elem.img.getAbsolutePosition().y)
		}
		if (a.attrs.name == 'topLeft') {
			a.setX(elem.img.getAbsolutePosition().x)
			a.setY(elem.img.getAbsolutePosition().y + elem.img.getHeight())
		}
		if (a.attrs.name == 'topRight') {
			a.setX(elem.img.getAbsolutePosition().x + elem.img.getWidth())
			a.setY(elem.img.getAbsolutePosition().y + elem.img.getHeight())
		}

		if (a.attrs.name == 'midRight') {
			a.setX(elem.img.getAbsolutePosition().x + elem.img.getWidth() - 6)
			a.setY(elem.img.getAbsolutePosition().y + elem.img.getHeight() / 2)
		}
		if (a.attrs.name == 'midLeft') {
			a.setX(elem.img.getAbsolutePosition().x - 6)
			a.setY(elem.img.getAbsolutePosition().y + elem.img.getHeight() / 2)
		}

	});

}

function createNewElement(type, img, fname,fixed_aspect_ratio) {

	if ((type == 'text') && $('#user_text').val() == '') {
		alert("Please enter the text before clicking to position")
		return
	}

	console.log("Creating new element")

	var mousePos = $('#canvas').data("stage").getPointerPosition()

	var elem = {}

	elem.loaded = false
	elem.resizing = false
	elem.fixed = false
	elem.align_type = -1
	elem.num_lines = 0
	//elem.num_align=-1
	elem.selected = true
	elem.old_text = ''
	elem.type = type
	elem.id = -1
	elem.fixed_amount = 0.5
	elem.alternate_id = 0
	elem.optional = false
	elem.fixed_aspect_ratio = fixed_aspect_ratio

	if (mousePos == undefined) {
		elem.x = 0
		elem.y = 0
	} else {
		elem.x = mousePos.x
		elem.y = mousePos.y
	}

	if (fname != undefined)
		elem.fname = fname

	elem.group_id = $("#group_select").val()
	elem.importance = $("#importance_select").val()

	var max_id = 0;
	var insert_index = 0;
	$.each($('#canvas').data("design").elements, function(i, e) {
		console.log("element type "+e.type+" index: "+String(i))
		if (e.type != 'text'){
			insert_index = i+1
		}

		max_id = Math.max(max_id, parseInt(e.id))
	});
	elem.id = max_id + 1

	if (elem.type == 'graphic'){
		$('#canvas').data("design").elements.splice(insert_index, 0, elem);
	}
	else{
		$('#canvas').data("design").elements.push(elem)
	}
	//insert_index = -1
	//$('#canvas').data("design").elements.push(elem)

	//design.elements.sort(function(e1,e2){return e1.importance-e2.importance})
	//var max_id=-1;
	//$.each($('#canvas').data("design").elements, function(i,e){
	//	max_id
	//});

	var layer = $('#canvas').data("stage").get('#layer')[0];
	var sugg_layer = $('#canvas').data("sugg_stage").get('#sugg_layer')[0];

	//setupLockingCallbacks(elem, layer)

	if (elem.type == 'graphic') {

		$('#canvas').data("user_input_log").push("Add Graphic")
		$('#canvas').data("status_log").push("Add Graphic")

		elem.type_id = 2;
		elem.height = 100;
		setupImageElement(elem, img, layer, sugg_layer, insert_index,false);

		overlap = {}
		overlap.elem_id = elem.id
		overlap.x_min = 0
		overlap.y_min = 0
		overlap.x_max = 1
		overlap.y_max = 1

		$('#canvas').data("design").overlap_regions.push(overlap)

		//sendCurrentDesign();

	}
	if (elem.type == 'text') {
		$('#canvas').data("user_input_log").push("Add Text")
		$('#canvas').data("status_log").push("Add Text")

		elem.type_id = 1;
		elem.font = $('#font_select').data("font");
		elem.bold = $("#bold_select").attr("checked") == 'checked';
		elem.italic = $("#italic_select").attr("checked") == 'checked';
		elem.fix_alignment = $("#fix_select").attr("checked") == 'checked';
		elem.fix_alternate = $("#num_lines_fix_select").attr("checked") == 'checked';
		elem.color = $('#color_select').val();
		elem.text = $('#user_text').val().trim();

		if (elem.text == '')
			return;

		elem.align = ""

		$(".align_select.active").each(function() {
			console.log(this);
			elem.align = this.value
		});

		elem.sugg_align = elem.align;

		console.log("Creating with alignment: " + elem.align)

		elem.num_lines = elem.text.split("\n").length;
		console.log('num_lines ' + elem.num_lines)
		elem.height = 25 * (elem.num_lines);

		//renderTextElement(elem,true,true);
		renderTextAlts(elem, true)

		// setTimeout(function() {
		// 	sendCurrentDesign();
		// 	resumeSuggestions();
		// }, 500)

	}

	console.log("setting element id to " + elem.id)

	//deselectAll(elem)
	//$('#canvas').data("selected",elem)

	layer.draw();
	sugg_layer.draw();

	//$('#canvas').data("selected",elem);
	//elem.img.attrs.strokeEnabled=true;
	selectElement(elem, false);

}

function setControls(elem) {

	showElementControls()

	if (elem.type=="graphic"){

		$('#opacity_slider_controls').show()

		$('#color_select').val(elem.color);
		$(".text_controls").hide()
		$('#canvas').data("opacity_val",elem.opacity)
		return;
	}

	$(".text_controls").show()

	$('#opacity_slider_controls').hide()


	$('#canvas').data("settingControls", true);


	console.log("Setting controls for element: " + elem.id + " with type " + elem.type);

	//$("#font_select").val(elem.font);
	$("#font_select").data("font", elem.font)

	$("#font_select").find('span').html(elem.font);
	$("#font_select").css('font-family', elem.font);

	console.log("setting font:" + elem.font)

	$("#group_select").val(elem.group_id).attr('selected', true);
	$("#importance_select").val(elem.importance).attr('selected', true);
	$("#bold_select").prop("checked", elem.bold)
	$("#italic_select").prop("checked", elem.italic)
	$("#fix_select").prop("checked", elem.fix_alignment)
	$("#num_lines_fix_select").prop("checked", elem.fix_alternate)
	$('#color_select').val(elem.color);
	$("#optional_select").prop("checked", elem.optional)
	$("#hidden_select").prop("checked", elem.hidden)
	$('#user_text').val(elem.text);

	/*
	 if (elem.type=='graphic')
	 $('#user_text').hide()
	 else
	 $('#user_text').show()
	 */

	$("#num_lines_select").val(elem.num_lines).attr('selected', true);

	$(".align_select").each(function() {
		//console.log(this);
		if (this.value == elem.align)
			this.click()
	});

	console.log("Finished setting controls for element: " + elem.id);

	$('#canvas').data("settingControls", false);
}


function numLinesChanged() {
	selectAlternateElement($('#canvas').data("selected"), $("#num_lines_select").val())

}

function fontSelected(font) {

	var splt = font.split(",")
	var fontName = splt[0]
	fontName = fontName.split("'").join('');
	console.log("clicked: " + fontName)
	$('#font_select').data("font", fontName)
	controlsChanged()

}

function controlsChanged(new_val) {

	console.log("controls changed")


	if ($('#canvas').data("settingControls"))
		return;

	resetSaliencyLayer()
	$('#canvas').data("saliency_layout",'')

	var selected_elem = $('#canvas').data("selected")

	if ((selected_elem == undefined) || (selected_elem.type == "background"))
		return;

	if (new_val != undefined) {
		$('#canvas').data("user_input_log").push("Align-" + new_val)
		$('#canvas').data("status_log").push("Align-" + new_val)
	}

	console.log("selected " + selected_elem.id)

	var changed_design = false;
	var changed_text = false;
	var changed_alignment = false;
	var alignments = ["left", "center", "right"];

	$.each($('#canvas').data("design").elements, function(i, elem) {
		if (!elem.selected){
			return
		}
		elem.old_text = elem.text;

		if (elem.fname) {

			var opacity = $('#canvas').data("opacity_val")


			if (($("#color_select").val() != elem.color) || (elem.opacity != opacity)){

							elem.opacity = opacity
							console.log("color changed from " + elem.color + " to " + $("#color_select").val())
							elem.color = $("#color_select").val();


							var recolor = function(pixels) {
								var d = pixels.data;
								for (var i = 0; i < d.length; i += 4) {

									//d[i] += alpha * d[i] + (1 - alpha) * 135;
									rgb = hexToRgb(elem.color)
									d[i] = rgb.r
									d[i+1] = rgb.g
									d[i+2] = rgb.b
								}
								return pixels;
							};

							elem.img.clearFilter()
							elem.img.setFilter(recolor)
							elem.img.applyFilter(recolor)
							elem.img.setOpacity(elem.opacity/100.0)

							elem.sugg_img.clearFilter()
							elem.sugg_img.setFilter(recolor)
							elem.sugg_img.applyFilter(recolor)
							elem.sugg_img.setOpacity(elem.opacity/100.0)
						}

				elem.img.getLayer().draw()
		}
		if (elem.type == 'text') {
			var bold = $("#bold_select").attr("checked") == 'checked'
			var italic = $("#italic_select").attr("checked") == 'checked'
			var fix_alignment = $("#fix_select").attr("checked") == 'checked'
			var fix_alternate = $("#num_lines_fix_select").attr("checked") == 'checked'
			var optional = $("#optional_select").attr("checked") == 'checked'
			var hidden = $("#hidden_select").attr("checked") == 'checked'

			var opacity = $('#canvas').data("opacity_val")

			// if (elem.opacity != opacity){
			// 	elem.opacity = opacity
			// 	changed_text = true;
			// }

			if (bold != elem.bold) {
				console.log("bold changed from " + elem.bold + " to " + bold)

				elem.bold = bold;
				changed_text = true;
				changed_design = true;
			}

			if (italic != elem.italic) {
				console.log("italic changed from " + elem.italic + " to " + italic)
				elem.italic = italic;
				changed_text = true;
				changed_design = true;

			}

			if (fix_alternate != elem.fix_alternate) {
				console.log("fix_alternate changed from " + elem.fix_alternate + " to " + fix_alternate)
				elem.fix_alternate = fix_alternate;
				changed_design = true;
			}
			if (optional != elem.optional) {
				console.log("optional changed from " + elem.optional + " to " + optional)
				elem.optional = optional;
				changed_design = true;
			}
			if (hidden != elem.hidden) {
				console.log("hidden changed from " + elem.hidden + " to " + hidden)
				elem.hidden = hidden;
				//changed_design=true;

				if (elem.hidden) {

					elem.hidden_img = elem.img.getImage()
					elem.img.setImage(0)
					//elem.img.setFillEnabled(false)
					//elem.img.hide()
				} else {
					//console.log(elem.hidden_img)
					elem.img.setImage(elem.hidden_img)
					elem.hidden_img = 0
					//elem.img.show()
					//elem.img.setFillEnabled(true)

				}

				elem.img.getLayer().draw();
				changed_design = true;
			}

			if ($("#color_select").val() != elem.color) {
				console.log("color changed from " + elem.color + " to " + $("#color_select").val())
				elem.color = $("#color_select").val();
				changed_text = true;
			}

			if ($('#font_select').data("font") != elem.font) {
				console.log("font changed from " + elem.font + " to " + $('#font_select').data("font"))
				elem.font = $('#font_select').data("font");
				changed_text = true;
			}

			if ($("#user_text").val() != elem.text) {
				console.log("text changed from " + elem.text + " to " + $("#user_text").val())

				elem.text = $("#user_text").val();
				changed_text = true;
			}

			if (fix_alignment != elem.fix_alignment) {
				console.log("fix_alignment changed from " + elem.fix_alignment + " to " + fix_alignment)
				elem.fix_alignment = fix_alignment;

				$(".align_select.active").each(function() {
					//console.log(this);
					elem.align_type = alignments.indexOf(this.value)
					//console.log("setting alternate to "+elem.alternate)
				});

				changed_design = true;
			}

			if ((elem.num_lines > 1) && (new_val != undefined) && (new_val != elem.align)) {
				elem.align = new_val
				console.log("Setting new alignment: " + elem.align);

				var layer = elem.img.getLayer();
				var orig_img = elem.img;
				elem.img.remove();
				elem.img = elem.alignment_imgs[new_val];
				elem.img.show();
				//elem.alternate=alignments.indexOf(new_val)

				elem.align_type = alignments.indexOf(new_val)

				elem.img.setX(orig_img.getAbsolutePosition().x)
				elem.img.setY(orig_img.getAbsolutePosition().y)
				elem.img.setHeight(orig_img.getHeight())
				elem.img.setWidth(orig_img.getWidth())
				elem.img.attrs.strokeEnabled = orig_img.attrs.strokeEnabled

				layer.add(elem.img);



				$.each(elem.anchors, function(i, a) {
					a.moveToTop();
				});

				layer.draw();

				//changed_text=true;
				changed_alignment = true;

				elem.fix_alignment = true;

				changed_design = true;

				$("#fix_select").prop("checked", true)

			}

			if (changed_text) {
				updateTextElement(elem)


			}

			elem.img.opacity = elem.opacity/100.0
			elem.sugg_img.opacity = elem.opacity/100.0
		}
	})


}



function getCurrentLayout() {
	var design = $('#canvas').data("design")

	var scale = 1.0;
	var layout = design.name + "\n" + Math.round(design.width / scale) + "," + Math.round(design.height / scale) + "\n";

	layout += (design.elements.length) + "\n"

	for (var i = 0; i < design.elements.length; i++) {
		var elem = design.elements[i];

		//var fixed=(elem.fixed);
		//var fixed=(elem.fixed || elem.selected);
		if (elem.alternate_id == -1)
			elem.alternate_id = 0

		var fix_amount = (Math.round((elem.fixed_amount) * 100) / 100)
		if (elem.hidden)
			fix_amount = -1;

		if (elem.selected)
			fix_amount = 1;

		layout += Math.round(elem.x / scale) + "," + Math.round(elem.y / scale) + "," + Math.round(elem.height / scale) + "," + Math.round(elem.width / scale) + ","+ elem.align_type + "," + fix_amount + ",-1," + (elem.hidden ? -1 : elem.alternate_id) + "\n"
	}

	var lines = $('#canvas').data("align_lines");

	if (lines.length > 1) {
		var selected_element = false;
		for (var i = 0; i < design.elements.length; i++) {
			if ((design.elements[i].id == lines[0][1]) && (design.elements[i].selected))
				;
			selected_element = true;
		}

		if (selected_element) {
			layout += lines.length + ' lines\n'

			$.each(lines, function(i, al) {
				var aligned_elem = al[3];
				//console.log("al:"+al)
				layout += al[1] + "," + al[2] + "," + aligned_elem.length + ","
				for (var i = 0; i < aligned_elem.length; i++)
					layout += aligned_elem[i] + ","
				layout = layout.slice(0, -1) + "\n"
			});
		} else
			layout += '0 lines\n'
	} else
		layout += '0 lines\n'

	if ($('#canvas').data("region_mode")) {
		layout += design.regions.length + ' regions\n'
		$.each(design.regions, function(i, reg) {
			layout += (reg.allow_text ? 1 : 2) + "," + reg.x + "," + reg.y + "," + reg.width + "," + reg.height + "\n"
		});
	} else if (!design.region_proposals)
		layout += '-1 regions\n'
	else
		layout += '0 regions\n'

	return layout
	//console.log("layout:\n"+layout);

}


function getCurrentDesign() {
	//console.log('getCurrentDesign')

	var design = $('#canvas').data("design")

	var scale = 1.0;
	var dstring = design.name + "\n" + Math.round(design.width / scale) + "," + Math.round(design.height / scale) + "\n";

	dstring = dstring + design.elements.length + "\n";

	dstring = dstring + "0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,background\n";

	for (var i = 0; i < design.elements.length; i++) {

		var elem = design.elements[i];

		if (elem.alternate_id == -1)
			elem.alternate_id = 0

		var fix_amount = (Math.round((elem.fixed_amount) * 100) / 100)
		if (elem.hidden)
			fix_amount = -1;

		if ((elem.anchors["topLeft"].attrs != undefined) && (elem.anchors["topLeft"].attrs.visible))
			fix_amount = 1;

		dstring = dstring + (elem.id) + ",";
		dstring = dstring + elem.type_id + ",";
		dstring = dstring + elem.importance + ",";
		dstring = dstring + elem.num_lines + ",";
		dstring = dstring + elem.group_id + ",";
		dstring = dstring + (Math.round((1 / elem.aspect_ratio) * 1000) / 1000) + ',';
		dstring = dstring + Math.round(elem.x / scale) + ',';
		dstring = dstring + Math.round(elem.y / scale) + ',';
		dstring = dstring + Math.round(elem.height / scale) + ',';
		dstring = dstring + elem.align_type + ",";
		dstring = dstring + fix_amount + ",";
		dstring = dstring + (elem.fix_alternate ? 0 : elem.alternate_id ) + ",";
		dstring = dstring + (elem.fix_alignment ? 1 : 0 ) + ",";
		dstring = dstring + (elem.optional ? 1 : 0 ) + ",";
		dstring = dstring + "0,1,0,1," + elem.fname + "\n";

		//console.log("aspect ratio "+(Math.round((1/elem.aspect_ratio)*1000)/1000))

		//if (elem.img)
		//	console.log('element +'+i+' x: '+elem.img.getPosition().x+ ' y: '+elem.img.getPosition().y)
	}

	var overlap = '';

	for (var i = 0; i < design.overlap_regions.length; i++) {
		var or = design.overlap_regions[i];

		overlap = overlap + or.elem_id + "," + Math.round(or.x_min * 1000) / 1000 + "," + Math.round(or.x_max * 1000) / 1000 + "," + Math.round(or.y_min * 1000) / 1000 + "," + Math.round(or.y_max * 1000) / 1000 + "\n"

	}

	dstring += (overlap.split("\n").length - 1) + " overlap regions\n" + overlap;

	var num_alts = 0;
	var alt_string = ''
	$.each(design.element_alts, function(id, alts) {

		var alt_str = id + "," + Object.keys(alts).length + ","

		$.each(design.elements, function(i, elem) {
			if ((id == elem.id) && (!elem.fix_alternate)) {
				num_alts++
				$.each(alts, function(num_lines, alt_elem) {
					alt_str += alt_elem.num_lines + "," + (Math.round((1 / alt_elem.aspect_ratio) * 1000) / 1000) + "," + alt_elem.max_line_length + ","
				});
				alt_string += alt_str + "\n"
			}
		});

	});

	dstring += num_alts + " alternates\n"
	dstring += alt_string;

	//console.log("sending current design:\n "+dstring);

	return dstring

}



function getLayoutDiff(layout1, layout2) {
	if ((layout1 == undefined) || (layout2 == undefined) || (layout1 == '') || (layout2 == ''))
		return 10000;
	var elements1 = layout1.split("\n");
	var elements2 = layout2.split("\n");

	var num_elements = parseInt(elements1[2])

	if (num_elements != parseInt(elements2[2]))
		return 10000;
	//console.log("layout1:"+layout1)
	//console.log("layout2:"+layout2)

	var diff_sum = 0;

	for (var i = 3; i < num_elements + 3; i++) {
		var elem1_split = elements1[i].split(',');
		var elem2_split = elements2[i].split(',');


		for (var j = 0; j < 3; j++)
			diff_sum += Math.abs(elem1_split[j] - elem2_split[j])

	}

	return diff_sum;

}

function addLayoutToUndoStack(new_layout) {

	var idx = $('#canvas').data("layout_stack_idx");
	var stack = $('#canvas').data("layout_stack");
	if (idx != stack.length - 1)
		stack = stack.slice(0, idx);

	stack.push([new_layout, getCurrentDesign()])
	$('#canvas').data("layout_stack_idx", stack.length - 1)
	$('#canvas').data("layout_stack", stack)

	if ((!$('#canvas').data("noSuggestions")) && (stack.length > 1))
		$('#undoButton').fadeTo(0, 1)

}

function loadImages(sources, callback) {
	var images = {};
	var loadedImages = 0;
	var numImages = 0;
	for (var src in sources) {
		numImages++;
	}

	for (var src in sources) {
		console.log("loading image " + sources[src])

		images[src] = new Image();
		images[src].onload = function() {

			if (++loadedImages >= numImages) {

				$('#canvas').data("images", images);
				callback();
			}
		};
		images[src].src = sources[src];
	}
}

function loadDesignFile(designName) {

	console.log("loading design " + designName)
	var jsonLoad = $.getJSON(sprintf('/design/static/designs/%s.json', designName), function(design) {
		console.log('design.json obtained');

		if (designName == "new") {
			design.name = "design_" + String(new Date().getTime());
			console.log("Created design " + design.name)
		}

		design.elements.sort(function(e1, e2) {
			return e2.importance - e1.importance
		})

		$('#canvas').data("design", design);

		sources = {};

		sources['unlocked'] = '/design/static/icons/unlocked.png'
		sources['tweakable'] = '/design/static/icons/tweakable.png'
		sources['locked'] = '/design/static/icons/locked.png'

		if (design.background_fname.length > 1)
			sources['background'] = sprintf('/design/static/images/%s', design.background_fname);

		$.each(design.elements, function(i, elem) {
			if ("fname" in elem) {
				console.log("elem.fname " + elem.fname)
				sources[elem.fname] = sprintf('/design/static/images/%s', elem.fname);
			}
		});
		loadImages(sources, setupCanvas);

	}).done(function() {
		console.log('success');
	}).fail(function() {
		console.error('JSON load failure.');
	});
}

function selectImage(type) {

	$('#canvas').data('inputType', type)
	$('#fileInput').click();
}

function handleFiles(files) {
	var file = files[0];
	var reader = new FileReader();
	reader.onload = onFileReadComplete;
	reader.readAsDataURL(file);
	console.log("handling file " + file);
	$("#canvas").data("load_filename", file.name)
}

function onFileReadComplete(event) {
	console.log(event.target.result)

	var img = new Image();

	var fname = "graphic_" + String(new Date().getTime()) + ".png";
	var fname = $("#canvas").data("load_filename");

	img.onload = function() {

		if ($('#canvas').data('inputType') == 'graphic')
			createNewElement('graphic', img, fname,true)
		else if ($('#canvas').data('inputType') == 'shape')
				createNewElement('graphic', img, fname,false)
		else {

			var aspectRatio = img.width/img.height

			var design = $('#canvas').data("design");

			if (aspectRatio){
				 $('#design_width').val(design.width)
				 $('#design_height').val(design.width/aspectRatio)
			}
			else{
				$('#design_height').val(design.height)
				$('#design_width').val(design.width*aspectRatio)
			}



			var background = $('#canvas').data('design').background;
			background.attrs.fillPatternImage = img
			background.attrs.fill = undefined
			$("#canvas").data("design").background_fname = fname;
			background.getLayer().draw()

			background = $('#canvas').data('design').sugg_background;
			background.attrs.fillPatternImage = img
			background.attrs.fill = undefined
			background.getLayer().draw()

			$('#canvas').data("images").background = img

			designSizeChanged()


		}
	};
	img.src = event.target.result

	saveImageOnServer(fname, event.target.result)

}

function backgroundColorChanged() {

	var background = $('#canvas').data('design').background;
	background.attrs.fillPatternImage = ''
	background.attrs.fill = "#"+$('#background_color_select').val();
	$("#canvas").data("design").background_fname = '';
	$('#canvas').data('design').background_color = $('#background_color_select').val();
	background.getLayer().draw()

	background = $('#canvas').data('design').sugg_background;
	background.attrs.fillPatternImage = ''
	background.attrs.fill = "#"+$('#background_color_select').val();
	background.getLayer().draw()

}


function createNewDesign() {
	window.location.replace("create&design=new")
}

function openExistingDesign() {
	window.location.replace("select")
}

function duplicateDesign() {
	$('#canvas').data("design").name = "design_" + String(new Date().getTime());
	saveDesign()
	alert("Design duplicated")
}

function deleteDesign() {

	if (confirm("Warning! This will permanentely delete this design and send you back to the selection menu. Are you sure you want to delete this design?")) {
		deleteDesignOnServer($('#canvas').data("design").name)

	}
}

function startText() {
	$(".text_controls").show()
	deselectAll()
	if ($('#canvas').data("text_mode") == false) {

		$('#user_text').val("");

		document.body.style.cursor = "url('/design/static/img/text_cursor.png'), auto"
		$('#canvas').data("text_mode", true)
		showElementControls()
	} else {
		document.body.style.cursor = "default";
		$('#canvas').data("text_mode", false)
	}
}
