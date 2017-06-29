

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
