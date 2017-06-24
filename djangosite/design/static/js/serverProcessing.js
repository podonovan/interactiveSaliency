

var runID=-1;

//
// This method Gets URL Parameters (GUP)
//
function gup( name )
{
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var tmpURL = window.location.href;
  var results = regex.exec( tmpURL );
  if( results == null )
    return "";
  else
    return results[1];
}

// //
// // This method decodes the query parameters that were URL-encoded
// //
// function decode(strToDecode)
// {
//   var encoded = strToDecode;
//   return unescape(encoded.replace(/\+/g,  " "));
// }


function updateDesignOnServer(runID,design)
{
	//console.log("setting design: "+design);
	var time = new Date().getTime();

	$('#design_out').val(design);

	console.log("run id: "+runID);
	$.ajax({
		type:'GET',
		url:'/design/setCurrentDesign',
		error: function (request, status, error) {
			console.error('Failed to send design.');
			console.error(request.responseText);
			console.error(status);
			console.error(error);
		},
		data:{
			runID:runID,
			design:design,
			userID:$('input[name=userID]').val()
			},
		cache: false
	}).done(function(returnVal){
		if (returnVal==='1'){
			console.log('changed design');
		}else{
			console.log('error in setCurrentDesign');

		}
	});

}


 function getDesignList()
 {

 	console.log("getDesignList")
    $.ajax({
        type:'GET',
        url:'/design/listDesigns',
        error: function (request, status, error) {
            console.error('Failed to receive layout.');
            console.error(request.responseText);
            console.error(status);
            console.error(error);
        },
        data:{
            }
    }).done(function(jsonString){
        console.log("jsonString")
        console.log(jsonString)
        var json = JSON.parse(jsonString);

        console.log(json)
        setDesignList(json)

    });
 }


 function saveDesignOnServer(img, design,fname)
 {
 	if (fname==undefined)
		fname=design.name

 	console.log('saveDesignOnServer')
 	console.log(img)
     $.ajax({
        type:'POST',
        url:'/design/saveDesign',
        error: function (request, status, error) {
            console.error('Failed to receive layout.');
            console.error(request.responseText);
            console.error(status);
            console.error(error);
        },
        data:{
            userID:$('input[name=userID]').val(),
            designName:fname,
            design:JSON.stringify(design, null, '\t'),
            image:img
            },
        cache: false
		}).done(function(returnVal){
			if (returnVal==='1'){
				console.log('design saved');
			}else{
				console.log('error in design');

			}
		});
 }


 function requestSaliencyImage(imgName, img, textPositions,imgdata, width, height, callback)
 {
 	console.log('requestSaliencyImage')
     $.ajax({
        type:'POST',
        url:'/design/requestSaliencyImage',
        error: function (request, status, error) {
            console.error(request.responseText);
            console.error(status);
            console.error(error);
        },
        data:{
            userID:$('input[name=userID]').val(),
            imageName:imgName,
            image:img,
            textPositions:textPositions,
            imageData:String(imgdata),
            width:width,
            height:height
            },
        cache: false
		}).done(function(jsonString){

		    console.log('requestSaliencyImage returned');
		    var json = JSON.parse(jsonString);
			if (json.source != ''){
				callback(json.source )
			}else{
				console.log('error in requestSaliencyImage');
			}
		});
 }


 function saveImageOnServer(imgName, img)
 {
 	console.log('saveImageOnServer')
 	console.log(img)
     $.ajax({
        type:'POST',
        url:'/design/saveImage',
        error: function (request, status, error) {
            console.error('Failed to receive layout.');
            console.error(request.responseText);
            console.error(status);
            console.error(error);
        },
        data:{
            userID:$('input[name=userID]').val(),
            imageName:imgName,
            image:img
            },
        cache: false
		}).done(function(returnVal){
			if (returnVal==='1'){
				console.log('image saved');
			}else{
				console.log('error in design');

			}
		});
 }

 function deleteDesignOnServer(designName)
 {
 	console.log('deleting design off server')
     $.ajax({
        type:'GET',
        url:'/design/deleteDesign',
        error: function (request, status, error) {
            console.error('Failed to receive layout.');
            console.error(request.responseText);
            console.error(status);
            console.error(error);
        },
        data:{
            userID:$('input[name=userID]').val(),
            designName:designName
            },
        cache: false
		}).done(function(returnVal){
			if (returnVal==='1'){
				console.log('design deleted');

			}else{
				console.log('error in design');

			}

		});
		window.location.replace("select")
 }


 function getURLParameter(name) {
	var regexS = "[\\?&]"+name+"=([^?&#]*)";
	var regex = new RegExp( regexS );
	var tmpURL = window.location.href;
	var results = regex.exec( tmpURL );
	if( results === null )
		return "";
	else
		return results[1];
}


//
//
// function stopSuggestions()
// {
// 	console.log("Stopping Suggestions")
//
// 	$.each(runs=$('#canvas').data("runs"), function(i, run) {
// 		if (run.id>-1)
// 			stopRun(run.id, run.type)
// 	});
// }
//
//
// function stopRun(run_id, run_type)
// {
//
// 	debugMode=getURLParameter("debugMode")
// 	console.log("debug mode "+debugMode)
//
// 	if (debugMode.length < 1)
// 		debugMode='1'
//
// 	$.ajax({
// 		type:'GET',
// 		url:'/design/stopRun',
// 		error: function (request, status, error) {
// 			console.error('Failed to send layout.');
// 			console.error(request.responseText);
// 			console.error(status);
// 			console.error(error);
// 		},
// 		data:{
// 			//runID:$('#suggLayout').data('runID'),
// 			runID:run_id,
// 			runType:run_type,
// 			userID:$('input[name=userID]').val(),
// 			debugMode:debugMode
// 			},
// 		cache: false
// 	}).done(function(returnVal){
// 		if (returnVal==='1'){
//
// 			//setInactive()
// 			//$('#canvas').data('killed',true)
//
// 			console.log('submitted layout')
// 		}else{
// 			console.log('error in stopRun')
//
// 		}
// 	});
//
// }

//
//
// function setInactive(error_str)
// {
// 	console.log("setInactive")
//
//
// 	var inactive_str="Suggestions Inactive- Please Restart"
//
// 	if ($('#suggestion_status').text()==inactive_str)
// 		return
//
//
// 	$('#pauseButton').hide()
// 	$('#startButton').show()
//
//
// 	$('#checkingImage').hide()
//
// 	$('#canvas').data("status_log").push("Error-"+error_str)
//
//
// 	if (gup('hitId')=='')
// 	{
// 		$('#restartButton').show()
// 		$('#suggestion_status').text(inactive_str)
// 		$('#suggestion_status').css("background-color","#F00")
// 	}
// 	else
// 		startSuggestions();
//
// 	logInactiveState()
//
//
//
// }
//
//
// function logInactiveState()
// {
//
// 	console.log("logInactiveState")
//
// 	var design=$('#canvas').data("design")
//
//
// 	if ($('#canvas').data("error_log")==undefined)
// 		$('#canvas').data("error_log",[])
//
// 	design.user_input_log=$('#canvas').data("user_input_log")
// 	design.status_log=$('#canvas').data("status_log")
//
// 	$('#canvas').data("stage").toDataURL({
//       callback: function(dataUrl) {
//
//       	var hitId=gup('hitId')
// 		var fname='error/'+$('#canvas').data("design").name+'-'+gup('workerId')+"-"+hitId+"-"+String($('#canvas').data("error_log").length)
// 		saveDesignOnServer(dataUrl,design,fname)
//
// 		$('#canvas').data("error_log").push(fname)
//
//       }
//     });
//
//
// }
//
//
//
// function resetParameters()
// {
//
// 	if ($('#suggLayout').data('runID')>=0)
// 	{
// 		$.ajax({
// 			type:'GET',
// 			url:'/design/resetParameters',
// 			error: function (request, status, error) {
// 				console.error('Failed to send layout.');
// 				console.error(request.responseText);
// 				console.error(status);
// 				console.error(error);
// 			},
// 			data:{
// 				runID:$('#suggLayout').data('runID'),
// 				userID:$('input[name=userID]').val()
// 				},
// 			cache: false
// 		}).done(function(returnVal){
// 			if (returnVal==='1'){
// 				console.log('submitted layout');
// 			}else{
// 				console.log('error in resetParameters');
//
// 			}
// 		});
// 	}
//
// }

//
// function updateParameters(parameter_type, value)
// {
//
// 	if ($('#suggLayout').data('runID')>=0)
// 	{
// 		$.ajax({
// 			type:'GET',
// 			url:'/design/updateParameters',
// 			error: function (request, status, error) {
// 				console.error('Failed to send layout.');
// 				console.error(request.responseText);
// 				console.error(status);
// 				console.error(error);
// 			},
// 			data:{
// 				runID:$('#suggLayout').data('runID'),
// 				userID:$('input[name=userID]').val(),
// 				parameterType:parameter_type,
// 				parameterValue:value,
// 				},
// 			cache: false
// 		}).done(function(returnVal){
// 			if (returnVal==='1'){
// 				console.log('submitted parameter change');
// 			}else{
// 				console.log('error in updateParameters');
//
// 			}
// 		});
// 	}
//
// }
//
//
//
//
// function startNewRun(run_id, run_type,design_string)
//  {
//
//  	//$('#userLayout').data('runID',-1)
// 	//var designName= gup('design');
// 	console.log("startNewRun with id "+ run_id+ " and type "+run_type)
//
// 	debugMode=getURLParameter("debugMode")
// 	console.log("debug mode "+debugMode)
//
// 	if (debugMode.length < 1)
// 		debugMode='1'
//
// 	$.ajax({
// 		type:'GET',
// 		url:'/design/startNewRun',
// 		error: function (request, status, error) {
// 			console.error('Failed to start new run.');
// 			console.error(request.responseText);
// 			console.error(status);
// 			console.error(error);
// 		},
// 		data:{
// 			runID:run_id,
// 			runType:run_type,
// 			design:design_string,
// 			debugMode:debugMode,
// 			userID:$('input[name=userID]').val()
// 			},
// 		cache: false
// 	}).done(function(jsonString){
//
//
// 		var json = JSON.parse(jsonString);
// 		//$('#suggLayout').data('runID',(json.runID))
// 		console.log("started new run "+json.runID)
//
// 		$('#canvas').data('killed',false)
//
//
// 		$.each($('#canvas').data("runs"), function(i, run) {
// 			if (run.id==run_id)
// 				run.id=json.runID
// 		});
//
// 		//$('#suggestionButtonText').text("Stop Suggestions")
// 		//$('#suggestionButton').unbind()
// 		//$('#suggestionButton').on('click',stopSuggestions)
// 		//$('#user_id').text(json.userID)
//
// 	});
//
//
//  }
//
//
//
//  function sendLayoutToServer(runID,layout){
//  	$('#userLayout').val(layout)
//
//
//  	var d = new Date()
//  	var t = d.getTime()
//
//  	console.log("Sending layout to server at "+t)
//  	$('#canvas').data("sendLayoutTime",t)
//
//     $.ajax({
//         type:'GET',
//         url:'/design/getLayoutFromClient',
//         error: function (request, status, error) {
//             console.error('Failed to send layout.');
//             console.error(request.responseText);
//             console.error(status);
//             console.error(error);
//         },
//         data:{
//         	runID:runID,
//             layout:layout,
//             userID:$('input[name=userID]').val()
//             },
//         cache: false
//     }).done(function(returnVal){
//         if (returnVal=='1'){
//         	//var d2 = new Date()
//         	//var t2=d2.getTime()
//             //console.log('finished sendLayoutToServer in '+(t2-t));
//             // $('#canvas').data("sendLayoutToServerTimes").push(t2-t)
//         }else{
//
//         	//$('#suggestion_status').text("Inactive");
//         	//$('#suggestion_status').css("background-color","#F00");
//             console.log('error in sendLayoutToServer');
//             console.log(returnVal);
//             return -1;
//         }
//     });
// }
//
//
//
//  function getLayoutFromServer(runID,runType){
//
//  	if ($('#canvas').data("noSuggestions"))
//  		return;
//
//     $.ajax({
//         type:'GET',
//         url:'/design/sendLayoutToClient',
//         error: function (request, status, error) {
//             console.error('Failed to receive layout.');
//             console.error(request.responseText);
//             console.error(status);
//             console.error(error);
//         },
//         data:{
//         	runID:runID,
//             userID:$('input[name=userID]').val()
//             },
//         cache: false
//     }).done(function(jsonString){
//
//          // if (runType!='gallery')
//         //{
//
//
// 	 	var t = new Date().getTime()
// 	 	if ($('#canvas').data("sendLayoutTime") != undefined)
// 	 	{
// 	 		var diff=t-$('#canvas').data("sendLayoutTime")
// 			//console.log("time since last layout was sent "+(diff/1000))
// 	      }
//
//         var json = JSON.parse(jsonString);
//
//         var splt=json.layoutFeatures.split("\n")
//         var energy=parseFloat(splt[0].split(" ")[2])
//
//         var user_layout=json.userLayout;
//
//         if (user_layout.length==0)
//         {
//         	sendCurrentLayout()
//         	return
//         }
//
//
//         var ignore_layout = $('#canvas').data("ignore_layout")
//         if ((ignore_layout != undefined))
//         {
//         	console.log("checking ignore layout:")
//         	console.log("check_layout:"+json.userLayout)
//         	var layout_diff= getLayoutDiff(ignore_layout,json.layout)
//         	var layout_diff2= getLayoutDiff(ignore_layout,json.userLayout)
//         	console.log("layout_diff:"+layout_diff)
//         	console.log("layout_diff2:"+layout_diff2)
//         	if (layout_diff<15)
//         		console.log("near ignored layout")
//         	//return
//         }
//
//
//
//         var splt2=json.userLayoutFeatures.split("\n")
//         var user_energy=parseFloat(splt2[0].split(" ")[2])
//
//
//     	var energy_list=$('#canvas').data("energy_list")
//
//
//     	if ($('#canvas').data("energy")==9999)
//     	{
//     		if($('#userLayout').val()==user_layout)
//         	{
//   	    		console.log("canvas energy: "+$('#canvas').data("energy")+", user energy:"+user_energy)
// 	    		$('#canvas').data("energy",user_energy)
//
// 	    		if ($('#error_message').text()=="unknown energy")
// 	    			$('#error_message').text("")
//     		}
//     		else
//     		{
//     			$('#error_message').text("unknown energy")
//     		}
//
//     	}
//
//
//
// 		if (isNaN(energy))
// 		{
// 			console.log("energy:"+energy)
// 			return;
// 		}
//
// 		plotEnergy(energy,$('#canvas').data("energy"))
//
//
//         setSuggestionLayout(runID, json.layout,energy);
//
//         var energy_diff=Math.abs($('#canvas').data("energy")-energy)
//         if (isNaN(energy_diff))
//         	energy_diff=100
//
//
//         var layout_splt=json.layout.split("\n")
//
//         layout_name= json.layout.split("\n")[0]
//
//
//         var move_diff=getLayoutDiff($('#canvas').data("layout"),json.layout);
//
//
//        // console.log(sprintf("received layout %s. energy: \t %.2f, \t current energy %.3f (diff: %.2f),\t move_diff: %f",layout_name,energy,$('#canvas').data("energy"),energy_diff,move_diff))
//
//
//         if (!$('#canvas').data("started"))
//         {
//         	//console.log("not started, skipping")
//         	return;
//         }
//
//
//         energy_list.push(energy)
//
//
//         if ((energy_list.length>=3) && ($('#canvas').data("dragging")==false))
// 			doubleCheckSelectedPosition(json.layout)
//
//
//         if (energy_list.length>=2)
//         {
//
//
//         	var last_energy=energy_list[energy_list.length-2]
//
//         	var last_diff=Math.abs(energy-last_energy);
//         	//console.log("last_diff:"+last_diff)
//         	if (last_diff>10)
//     		{
//     			console.log("skipped while working")
// 		        return;
//     		}
//
//         }
//
//        $('#checkingImage').show()
//
//
//         if ((energy_diff<5)&& (energy_list.length>6))
//         {
//         	var last_energy=energy_list[energy_list.length-5]
//         	//console.log("last energy:"+last_energy)
//         	//console.log("energy:"+energy)
//         	if (Math.abs(energy-last_energy)<1)
//     		{
//     			console.log("stop layout")
//     			$('#canvas').data("energy_list",[])
//  		        $('#checkingImage').hide()
// 		        $('#canvas').data("started",false)
// 		        //setCurrentLayout(json.layout,true)
// 		        return;
//     		}
//         }
//
//
//
//
//         var num_server_suggestions=$('#canvas').data("num_server_suggestions")
//         if (num_server_suggestions == undefined)
//         	num_server_suggestions=1;
//
//         $('#canvas').data("num_server_suggestions",num_server_suggestions+1)
//
//         console.log("num_server_suggestions: "+num_server_suggestions)
//
//         if (num_server_suggestions<=3)
//         	return;
//
//
//  		if ($('#canvas').data("design").name!=layout_name)
//         {
//         	var error_str="Mismatch:"+$('#canvas').data("design").name+" vs "+layout_name
//         	console.log(error_str)
//
// 			//$('#suggestion_status').text("optimsizer mismatch")
// 			console.log(error_str)
// 			setInactive(error_str)
// 			//resumeSuggestions()
// 			return;
//         }
//
//         //console.log("energy: "+energy)
//
//
//         $('#suggLayout').val(json.layout);
//         $('#suggLayoutFeatures').val(json.layoutFeatures);
//         $('#userLayoutFeatures').val(json.userLayoutFeatures);
//
//         if (json.optimizationActive)
//         {
//         	if ($('#canvas').data("paused")==false)
// 			{
// 				$('#pauseButton').show()
// 				$('#startButton').hide()
// 			}
// 	        //$('#suggestion_status').text("Active");
// 	        //$('#suggestion_status').css("background-color","#0F0");
//
// 	        $('#suggestion_status').text("")
// 	        $('#restartButton').hide()
//         }
//         else
//         {
//         	console.log("!optimizationActive")
// 			setInactive("optimization timed out")
// 			return;
//         }
//       //  }
//
//
//
//
//         if ((energy<9999)&& (energy_diff>5) && (!$('#canvas').data("paused")))
//         {
//         	setCurrentLayout(json.layout,true)
//         	$('#canvas').data("energy",energy)
//         }
//
//
//
//
//
//
//     });
// }
//
//
// function doubleCheckSelectedPosition(new_layout)
// {
//
// 	//console.log("doubleCheckSelectedPosition")
// 	var elements=new_layout.split("\n");
// 	var layout = $('#canvas').data("layout");
// 	var design = $('#canvas').data("design");
// 	var cnt = $('#canvas').data("inconsistent_count");
// 	if (cnt == undefined)
// 		cnt=0;
//
// 	for (var i=3;i < design.elements.length+3;i++)
// 	{
// 		var elem=design.elements[i-3];
//
// 		if ((elem.selected) && (design.elements.length==elements.length-4))
// 		{
//
// 			var elem_split=elements[i].split(',');
// 			var layout_x=parseInt(elem_split[0])
// 			var layout_y=parseInt(elem_split[1])
// 			if ((Math.abs(elem.x-layout_x)>2) ||(Math.abs(elem.y-layout_y)>2))
// 			{
// 				console.log("Inconsistent element "+elem.id)
// 				console.log("elem.x:"+elem.x +" vs "+layout_x)
// 				console.log("elem.y:"+elem.y +" vs "+layout_y)
//
// 				$('#canvas').data("inconsistent_count",cnt+1)
//
// 				if (cnt>3)
// 					$('#error_message').text("Selected Element Inconsistent")
// 				sendCurrentLayout()
// 				return
// 			}
// 		}
// 	}
//
// 	$('#canvas').data("inconsistent_count",0);
// 	if ($('#error_message').text()!='')
// 		$('#error_message').text('');
// }


 //
 // function getLayoutList()
 // {
 //
 //
 //    $.ajax({
 //        type:'GET',
 //        url:'/design/listLayouts',
 //        error: function (request, status, error) {
 //            console.error('Failed to receive layout.');
 //            console.error(request.responseText);
 //            console.error(status);
 //            console.error(error);
 //        },
 //        data:{
 //            userID:$('input[name=userID]').val(),
 //      	  	workerID:gup('workerID'),
 //        	design:gup('design'),
 //        	interface:gup('interface')
 //            },
 //        cache: false
 //    }).done(function(jsonString){
 //
 //        var json = JSON.parse(jsonString);
 //
 //        console.log(json)
 //        setLayoutList(json)
 //
 //    });
 // }
 //
 //
 // function toggleShowInfo()
 // {
 // 	console.log("toggling")
 //
 // 	if ($('#layoutInfo').is(':visible'))
 // 	{
 // 		$('#layoutInfo').hide();
 // 		$('#showInfoButtonText').text('Show Info')
 // 	}
	// else
	// {
	// 	$('#layoutInfo').show();
	// 	$('#showInfoButtonText').text('Hide Info')
 // 	}
 //
 //
 // }
