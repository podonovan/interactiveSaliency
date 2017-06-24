//
//
//
//
//
//
//
//
//
// function sendResultsToServer()
// {
//
// 	var features = {};    // Create empty javascript object
//
// 	features['workerID'] = gup('workerId');
// 	features['hitID'] = gup('hitId');
// 	features['design'] = $('#canvas').data("design").name
//
//
//
// 	$("form input").each(function() {           // Iterate over inputs
// 		var ans;
// 		if ($(this).attr('type')=='radio'){
// 			if (this.checked){
// 				features[$(this).attr('name')] = $(this).val();
// 			}
// 		}
// 		else{
// 			features[$(this).attr('name')] = $(this).val();  // Add each to features object
// 		}
//
// 	});
//
// 	$("form textarea").each(function() {           // Iterate over inputs
// 		var ans;
// 		features[$(this).attr('name')] = $(this).val();  // Add each to features object
//
//
// 	});
//
// 	var serializedForm = JSON.stringify(features);
// 	console.log(serializedForm);
//
//
// 	console.log('submitting to server');
// 	var loadURL = '/design/layoutStudyResults';
// 	$.ajax(
// 		{
// 			type:'POST',
// 			url:loadURL,
// 			data:{'json':serializedForm},
// 			error: function (request, status, error) {
// 				console.error('study not found');
// 				console.error('Submission failed.');
// 				console.error(request.responseText);
// 				console.error(status);
// 				console.error(error);
// 				$('#mturk_form').submit();
// 			},
// 			cache: false,
// 			success: function(data){
// 				console.log(data);
// 				console.log('submitting form');
// 				if (getURLParameter('hitId') === ''){
// 					//$('#confirmWrapper').show();
// 					//$('#confirmationText').text(data);
// 					//$('#confirmWrapper')[0].scrollIntoView(true)
// 					alert("no hitId")
//
// 				}
// 				else{
// 					$('#mturk_form').submit();
// 				}
//
// 			}
// 		}
// 	);
//
// }
//
//
// function validateFormResults()
// {
//
//
// 	try
// 	{
//
//
// 		var start_time= $('#startDateTime').data("date")
// 		var end_time=new Date()
// 		var start_layout_time= $('#canvas').data("layoutStartTime")
//
// 		if (start_layout_time == undefined)
// 			start_layout_time=start_time
//
// 		$('#totalTime').val(end_time-start_time)
// 		$('#layoutStartTime').val(start_layout_time-start_time)
//
// 		var last_time=start_layout_time
//
// 		var num_saved=$('#saved_table').find('canvas').length -1;
// 		console.log("num_saved: "+num_saved)
// 		console.log('max saved: '+gup("maxSaved"))
//
//
//
//
// 		var times=''
// 		var ids=''
//
// 		$.each($('#saved_table').find('canvas'), function(i, e){
// 			$("#layout"+i).val($(e).data("layout"))
//
// 			var layout_time=$(e).data("time")
//
// 			if (layout_time != undefined)
// 			{
// 				times+=String(layout_time-last_time)+","
// 				last_time=layout_time
// 			}
//
// 			var sugg_id=$(e).data("sugg_id")
//
// 			if (sugg_id != undefined)
// 				ids+=sugg_id+","
//
//
// 		});
//
// 		$('#layoutTimes').val(times)
//
// 		$('#layoutIDs').val(ids)
// 		//alert(times)
//
// 		$('#userInputLog').val(String($('#canvas').data("user_input_log")))
// 		$('#statusLog').val(String($('#canvas').data("status_log")))
// 		$('#errorLog').val(String($('#canvas').data("error_log")))
//
// 		if (gup("noSuggestions")== '1')
// 			$('#interface').val('baseline')
// 		else
// 			$('#interface').val('suggestions')
//
// 		//alert($('#userInputHistory').val())
//
// 		//alert($('#statusLog').val())
//
//
//
//
//
// 		if (gup("maxSaved")== '')
// 			return false
//
// 		var max_saved=parseInt(gup("maxSaved"))
//
// 		if (num_saved!=max_saved)
// 		{
// 			alert("You must save "+max_saved+" layouts for each design")
// 			return false;
// 		}
//
// 		sendResultsToServer()
//
// 	}
// 	catch(err)
// 	{
// 		console.log("Error:"+err.message)
// 	}
// 	return false
//
//
// }
