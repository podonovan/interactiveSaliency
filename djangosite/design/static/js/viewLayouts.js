//
// function toggle(log_type,show,button)
// {
//
// 	console.log(button)
// 	var parent =$(button).parent()
//
//
// 	if (show)
// 	{
// 		parent.find('.'+log_type+"Show").hide()
// 		parent.find('.'+log_type+"Hide").show()
// 		parent.find('.'+log_type+"Outer").show()
// 	}
// 	else
// 	{
// 		parent.find('.'+log_type+"Show").show()
// 		parent.find('.'+log_type+"Hide").hide()
//
// 		parent.find('.'+log_type+"Outer").hide()
//
// 	}
//
//
//
// }
//
//
//
// function setLayoutList(json)
// {
// 	var layouts=json.layouts;
//
// 	$('#canvas').data("noSuggestions",1)
//
// 	var curr_design=''
//
// 	var num_layouts=layouts.length
//
//
// 	$('#stats').data("times",[])
// 	$('#stats').data("overallTimes",[])
//
// 	setLayout(0,layouts,'')
//
// }
//
// function setLayout(idx, layouts, curr_design)
// {
// 	if (idx>=layouts.length)
// 	{
// 		var times=$('#stats').data("times")
// 		var time_sum=0;
// 		for (var i=0;i<times.length;i++)
// 			time_sum+=times[i]
//
//
// 		var mean_time=time_sum/times.length
// 		console.log("meanDesignTime:"+mean_time)
//
// 		$('#meanDesignTime').text(sprintf("%.2f",mean_time))
//
// 		times.sort(function(a,b){return b-a})
//
// 		var idx=Math.floor(times.length/2)
//
// 		//console.log(times)
// 		var median_time=times[idx]
//
// 		$('#medianDesignTime').text(sprintf("%.2f",median_time))
//
//
// 		var overall_times=$('#stats').data("overallTimes")
// 		time_sum=0;
// 		for (var i=0;i<overall_times.length;i++)
// 			time_sum+=overall_times[i]
//
// 		$('#meanOverallTime').text(sprintf("%.2f",time_sum/overall_times.length))
//
// 		return
// 	}
//
//
// 	var json = JSON.parse(layouts[idx]);
// 	if (curr_design!=json.design)
// 	{
// 		curr_design=json.design
//
// 		if (json.design==undefined)
// 		{
// 			console.log("design undefined?\njson:\n"+layouts[idx])
// 			return
// 		}
// 		loadDesignFile(json.design)
//
// 		setTimeout(function(){
// 			console.log("finished timeout");
// 			loadLayouts(idx,json),
// 			setLayout(idx+1,layouts,curr_design)
// 		},500)
// 	}
// 	else
// 	{
// 		loadLayouts(idx,json)
// 		setLayout(idx+1,layouts,curr_design)
// 	}
// }
//
//
//
// function loadLayouts(layout_idx,json)
// {
//
// 	var user_section=$("#user_layouts")
//
// 	user_section.hide()
//
// 	var new_sec=user_section.clone()
// 	new_sec.attr("id","user_layouts"+String(layout_idx))
//
// 	new_sec.show()
//
//
//
// 	new_sec.find(".interfaceComments").text(json.interface_comments);
// 	new_sec.find(".hitComments").text(json.hit_comments);
//
//
// 	new_sec.find(".workerID").text(json.workerID);
// 	new_sec.find(".workerID").attr("href","viewLayouts?workerID="+json.workerID);
//
// 	new_sec.find(".designID").text(json.design);
// 	new_sec.find(".designID").attr("href","viewLayouts?design="+json.design);
//
// 	var int_type=json.interface;
// 	if (int_type == undefined)
// 		int_type='baseline'
// 	new_sec.find(".interface").text(int_type);
// 	new_sec.find(".interface").attr("href","viewLayouts?design=all&interface="+int_type);
//
// 	if ((gup("interface")!='') && (gup("interface") != int_type))
// 		return
//
// 	var overall_time=parseFloat(json.totalTime)/60000
// 	new_sec.find(".totalTime").text(sprintf("%.2f",overall_time));
//
// 	$('#stats').data("overallTimes").push(overall_time)
//
// 	var layoutTimes=json.layoutTimes.split(",")
// 	var layoutIDs
// 	if (json.layoutIDs!=undefined)
// 		layoutIDs=json.layoutIDs.split(",")
//
// 	new_sec.find(".testNumber").text(layout_idx);
//
//
// 	var log=json.statusLog
// 	if (log !='undefined')
// 	{
//
// 		log=log.split("Save,").join("Save,\n")
// 		log=log.split("Start,").join("Start,\n")
//
// 		var log_div=new_sec.find(".statusLog")
// 		log_div.text(log);
// 		log_div.html(log_div.html().replace(/\n/g,'<br/>'))
//
// 		if (log.indexOf("Error")>-1)
// 		{
// 			new_sec.find(".error").text("Yes");
// 			new_sec.find(".error").css("background-color","#F00")
// 		}
// 	}
//
//
//
// 	//new_sec.find(".userInputLog").text(json.userInputLog);
//
// 	for (var i=0;i<3;i++)
// 	{
// 		layout=json["layout"+String(i+1)]
//
// 		console.log('layout:\n'+layout)
//
// 		setCurrentLayout(layout,false);
//
//
//
// 		var canvas=new_sec.find("#design"+String(i))[0]
//
// 		var time=parseFloat(layoutTimes[i])/60000
//
// 		$('#stats').data("times").push(time)
//
// 		new_sec.find("#time"+String(i)).text(sprintf("%.2f",time));
//
// 		console.log($('#canvas').find('canvas')[0])
// 		var destCtx = canvas.getContext('2d');
// 		destCtx.drawImage($('#canvas').find('canvas')[0], 0, 0,300,200);
//
//
// 		if (layoutIDs!=undefined)
// 		{
// 			var fname="/design/static/images/layouts/"+json.design+"-"+json.workerID +"-"+json.hitID+"-"+layoutIDs[i]+".png"
// 			console.log('fname:'+fname)
// 			new_sec.find("#img"+String(i)).attr("src",fname)
// 		}
// 		else
// 		{
// 			new_sec.find(".image_row").hide()
// 			new_sec.find(".canvas_row").show()
// 		}
//
//
// 	}
//
//
// 	user_section.parent().append(new_sec)
//
// }
