#!/usr/bin/python
# -*- coding: utf8 -*-
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from datetime import datetime
from webSettings import Settings
from design.models import User
from design.requestUtils import RequestUtils
from design.webUtils import WebUtils
from design.saliency import Saliency
import os
import time
import shutil
import urllib
import json
import sys

saliencyDetector = Saliency(Settings.djangoPath+"saliency_model/deploy.prototxt",Settings.djangoPath+"saliency_model/_iter_95000.caffemodel")


from PIL import Image

#@csrf_protect
def main(request):
	viewType='main'
	return render_to_response('pages/main.html',locals(),
							context_instance=RequestContext(request,processors=[myContext]))


def createDesign(request):
	viewType='createDesign'
	return render_to_response('pages/createDesign.html',locals(),
                              context_instance=RequestContext(request,processors=[myContext]))

def selectDesign(request):
	viewType='selectDesign'
	return render_to_response('pages/selectDesign.html',locals(),
                              context_instance=RequestContext(request,processors=[myContext]))


'''
def viewLayouts(request):
	viewType='viewLayouts'
	return render_to_response('pages/viewLayouts.html',locals(),
                              context_instance=RequestContext(request,processors=[myContext]))



def createLayout(request):
	viewType='createLayout'

	return render_to_response('pages/createLayout.html',locals(),
                              context_instance=RequestContext(request,processors=[myContext]))

def importDesign(request):
	viewType='importDesign'
	return render_to_response('pages/importDesign.html',locals(),
                              context_instance=RequestContext(request,processors=[myContext]))


def mturkStudy(request):
	viewType='mturkStudy'

	print request.GET.get('noSuggestions')
	suggestions = 1-int(request.GET.get('noSuggestions','0'))
	print 'suggestions:'+str(suggestions)
	return render_to_response('pages/mturkStudy.html',locals(),
                              context_instance=RequestContext(request,processors=[myContext]))



def setCurrentDesign(request):
	requestSource = request.GET
	runID = getRunID(request)
	design = requestSource.get('design')


	#try:
	#	shutil.copy(os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_design.data'), os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_last_design.data'))
	#except IOError:
	#	print("No original design")

	print("Received design from client:"+design)
	try:
		fname=os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_design.data')
		f=open(fname,'w')
		f.write(design)
		f.close();

		print("Finished writing design")
		return HttpResponse('1')
	except  IOError  as e:
		return HttpResponse(e.strerror)




def getLayoutFromClient(request):
	requestSource = request.GET
	runID = getRunID(request)
	layout = requestSource.get('layout')

	print ("run id:"+str(runID))
	print ("run id:" + str(runID))


	#try:
	#	shutil.copy(os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_check_layout.data'), os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_last_check_layout.data'))
	#except IOError:
	#	print("No original layout")

	fname=os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_check_layout.data')

	try:
		f=open(fname,'w')
		f.write(layout)
		f.close()
		print("Finished writing layout:"+layout)

		return HttpResponse('1')
	except IOError  as e:
		print "I/O error({0}): {1}, {2}".format(e.errno, e.strerror,fname)
		return HttpResponse(e.strerror)


def updateParameters(request):
	requestSource = request.GET
	runID = getRunID(request)
	parameterType = requestSource.get('parameterType')
	parameterValue = requestSource.get('parameterValue')
	print("Updating model parameters");



	fname=os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_parameter_change.data')
	try:

		f=open(fname,'w')
		f.write(parameterType+"\n"+parameterValue)
		f.close();
		return HttpResponse('1')
	except IOError  as e:
		print "I/O error({0}): {1}, {2}".format(e.errno, e.strerror,fname)
		return HttpResponse(e.strerror)


def stopRun(request):
	requestSource = request.GET
	runID = getRunID(request)
	runType = requestSource.get('runType')
	debugMode = requestSource.get('debugMode')
	print("Stopping run ");


	fname=os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_check_layout.data')
	f=open(fname,'w')
	f.write('quit')
	f.close()

	sleep(0.25)

	#if ((runID is None) or (runID<0)):
	#	command= "killall optLayout"
	#else:
	command= 'pkill -f "'+Settings.optimizerPath+'optLayout -i -r '+str(runID)+' -t '+runType+' -b '+debugMode+'"'

	#command= "python "+Settings.optimizerPath+"kill.py"
	print('command: '+command)
	sendCommand(command)




	return HttpResponse('1')





def sendCommand(filename,dir=''):
	command=dir+filename
	#command="ssh donovan@apollo.dgp.toronto.edu '"+dir+filename+"' &"
	print command
	os.system(command)


def sendLayoutToClient(request):

	requestSource = request.GET
	runID = getRunID(request)

	retObj={};
	retObj['runID']=runID


	retObj['optimizationActive']=False;

	check_layout=''
	layout=''
	layoutFeatures=''
	userLayoutFeatures=''

	fname='r'+str(runID)+'_opt_layout.data'

	try:


		mod_time=os.path.getmtime(os.path.join(Settings.layoutDirPath,fname))

		curr_time=time.time()
		diff=curr_time-mod_time
		#print os.path.join(Settings.layoutDirPath,fname)
		#print 'mod_time: '+str(mod_time)+" curr time"+str(curr_time)+" diff:"+str(diff)

		if (diff<7.0):
			retObj['optimizationActive']=True;


		f=open(os.path.join(Settings.layoutDirPath,fname),'r')
		layout=f.read()
		f.close()


		fname=os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_check_layout.data')
		f=open(fname,'r')
		check_layout=f.read()
		f.close()


		fname='r'+str(runID)+'_opt_layout_features.txt'
		f=open(os.path.join(Settings.layoutDirPath,fname),'r')
		layoutFeatures=f.read()
		f.close()

		fname='r'+str(runID)+'_user_layout_features.txt'
		f=open(os.path.join(Settings.layoutDirPath,fname),'r')
		userLayoutFeatures=f.read()
		f.close()

	except IOError  as e:
		print "I/O error({0}): {1}, {2}".format(e.errno, e.strerror,fname)
		#return HttpResponse(e.strerror)

	retObj['layout']=layout;
	retObj['layoutFeatures']=layoutFeatures;
	retObj['userLayoutFeatures']=userLayoutFeatures;
	retObj['userLayout']=check_layout;

	retJSON = json.dumps(retObj,default=default_action)
	return HttpResponse(retJSON)



def getRunID(request):
	runID=int(request.GET.get('runID'))
	if runID<10:

		user = RequestUtils.setOrGetUser(request)
		#userID = user.userID
		#runID= RequestUtils.registerOptimizationRequest(request,user)

		return runID+user.id*10;
	else:
		return runID


def startNewRun(request):



	requestSource = request.GET

	runID = getRunID(request)
	runType = requestSource.get('runType')
	design = requestSource.get('design')

	debugMode = requestSource.get('debugMode')

	userID = RequestUtils.setOrGetUser(request).userID

	command=''
	print 'runID:'+str(runID)


	retObj={}
	print("starting new run for userID: "+userID)
	try:
		#removeFile('r'+str(runID)+'_check_layout.data')

		fname=os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_check_layout.data')
		f=open(fname,'w')
		f.write('quit')
		f.close()
		time.sleep(0.1)
		#os.remove(os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_check_layout.data'))
	except Exception, e:
	    print 'Failed to write: '+ str(e)

	try:

		if ('Users' in Settings.layoutDirPath):
			command="killall optLayout"
			sendCommand(command)
			time.sleep(0.1)
			#else:
			#	command= 'pkill -f "'+Settings.optimizerPath+'optLayout -i -r '+str(runID)+' -t '+runType+' -b '+debugMode+'"'
				#command= "killall optLayout"
			#	print('command: '+command)
			#	sendCommand(command)



		#retObj['testCommand']=os.system('ls -al')




		fname=os.path.join(Settings.layoutDirPath,'r'+str(runID)+'_design.data')
		f=open(fname,'w')
		f.write(design)
		f.close();



		command= Settings.optimizerPath+"optLayout -i -r "+str(runID)+" -t "+runType+" -b "+debugMode+" &"
		print('command: '+command)
		#os.system(Settings.optimizerPath+command)
		sendCommand(command)

		if ('Users' in Settings.layoutDirPath):
			time.sleep(0.1)
			sendCommand('cpulimit -p `pgrep optLayout` -l 50 &')
	except IOError as e:
		return HttpResponse("Error({0}): {1}}".format(e.errno, e.strerror))


	print("Trying to start new run. id "+str(runID))




	retObj['runID']=runID
	retObj['commandOutput']=command
	retObj['userID']=userID
	print 'command output: '+command

	retJSON = json.dumps(retObj,default=default_action)
	return HttpResponse(retJSON)

'''



def saveDesign(request):

	requestSource = request.POST
	userID = requestSource.get('userID')
	designString = requestSource.get('design')
	designName= requestSource.get('designName')


	image = requestSource.get('image')

	design = json.loads(designString)
	fname=Settings.djangoPath+"designs/"+designName+".json"

	try:

		f = open(fname,"w")
		f.write(designString)
		f.close()

		image_fname=Settings.djangoPath+"designs/"+designName+".png"

		im = urllib.urlopen(image)
		output = open(image_fname,"wb")
		output.write(im.read())
		output.close()
	except IOError  as e:
		print "I/O error({0}): {1}, {2}".format(e.errno, e.strerror,fname)
		return HttpResponse(e.strerror)

	return HttpResponse('1')


def createSaliencyImage(request):

	print "createSaliencyImage"

	startTime = datetime.now()

	requestSource = request.POST
	imgName= requestSource.get('imageName')
	#image = requestSource.get('image')


	img = urllib.urlopen(requestSource.get('image')).read()



	readImageTime = datetime.now()
	print("readImageTime "+str(((readImageTime-startTime).total_seconds()*1000.0)))

	width = int(requestSource.get('width'))
	height = int(requestSource.get('height'))
	textPositions = requestSource.get('textPositions')


	imageFname=Settings.djangoPath+"images/"+imgName

	imgFile = open(imageFname,"wb")
	imgFile.write(img)
	imgFile.close()

	imageData = requestSource.get('imageData')
	#data = map(int, imageData.split(','))
	#print (imgList[0:100])
	print("array time "+str(((datetime.now()-readImageTime).total_seconds()*1000.0)))

	saliencyFname = "images/saliency/" + imgName.replace("layouts/", "");
	sImg = 255.0*saliencyDetector.detectSaliency(img,width,height,imageData,textPositions,Settings.djangoPath+saliencyFname)

	if sImg.std()< 1:
		HttpResponse('Error in saliency image')

	print("std: "+str(sImg.std()))
	saliencyImage = (Image.fromarray(sImg).convert('RGB'))

	saliencyImgTime = datetime.now()
	print("saliencyImgTime "+str(((saliencyImgTime-readImageTime).total_seconds()*1000.0)))



	print saliencyFname
	#saliencyImage.save(Settings.djangoPath+saliencyFname,'png')
	retObj = {}
	retObj['source'] = saliencyFname
	retJSON = json.dumps(retObj, default=default_action)
	return HttpResponse(retJSON)


def saveImage(request):

	print "saveImage"

	requestSource = request.POST
	imgName= requestSource.get('imageName')
	image = requestSource.get('image')

	image_fname=Settings.djangoPath+"images/"+imgName

	im = urllib.urlopen(image)
	output = open(image_fname,"wb")
	output.write(im.read())
	output.close()

	return HttpResponse('1')



def deleteDesign(request):

	requestSource = request.GET
	designName= requestSource.get('designName')
	print("Trying to delete "+designName)

	try:
		shutil.move(Settings.djangoPath+"designs/"+designName+".json", Settings.djangoPath+"designs/"+"deleted/"+designName+".json")
		shutil.move(Settings.djangoPath+"designs/"+designName+".png", Settings.djangoPath+"designs/"+"deleted/img/"+designName+".png")
	except IOError  as e:
		print "I/O error({0}): {1}".format(e.errno, e.strerror)
		return HttpResponse(e.strerror)

	return HttpResponse('1')



def listDesigns(request):

	print "listDesigns"
	requestSource = request.GET
	userID = requestSource.get('userID')

	designs=[]

	for filename in os.listdir(Settings.djangoPath+"designs/"):
	    print  filename
	    if '.json' in filename:
			#f=open(os.path.join(Settings.djangoPath+"designs/",filename),'r')
			designs.append(filename)
	print "designs:"
	print designs
	retObj={}
	retObj['designs']=designs
	retJSON = json.dumps(retObj,default=default_action)
	return HttpResponse(retJSON)


'''
def listLayouts(request):

	requestSource = request.GET
	userID = requestSource.get('userID')

	interface= str(requestSource.get('interface'))
	print 'interface:'+(interface)

	workerID= str(requestSource.get('workerID'))
	print 'workerID:'+(workerID)

	design= str(requestSource.get('design'))
	print 'design:'+(design)


	if ((design =='') and (workerID=='')):
		return HttpResponse('Please specify a design')

	if ((design =='') and (workerID!='')):
		design='all'

	layouts=[]

	for filename in os.listdir(Settings.djangoPath+"json/"):
	    print  filename
	    if '.json' in filename:

	    	if 'layoutStudyResults' in filename:
	    		continue

	    	if ((design != 'all') and (design not in filename)):
	    		print 'design:'+design
	    		continue
	    	if ((workerID != '') and (workerID not in filename)):
	    		print 'workerID does match:'+(workerID)
	    		continue



	    	f=open(os.path.join(Settings.djangoPath+"json/",filename),'r')
	    	print  'added :'+filename
	    	#designs.append(filename)
	    	layout=f.read()

	    	json=json.loads(layout)
	    	if (("interface" in json) and (interface!= '') and (json['interface']!=interface)):
	    		continue

	    	layouts.append(layout)
	    	f.close()

	retObj={}
	retObj['layouts']=layouts
	retJSON = json.dumps(retObj,default=default_action)
	return HttpResponse(retJSON)

'''

def myContext(request):
	'A context processor that provides userID'
	user = RequestUtils.setOrGetUser(request)
	userID = user.userID
	RequestUtils.registerRequest(request,user)
	return {'userID' : userID}

def default_action(obj):
	# this function returns a dictionary for any object that is not JSON-serializable.
	return obj.to_dict()



def layoutStudyResults(request):
	import json
	data = request.POST['json']
	data = json.loads(data)
	timestamp = time.time()
	filename = '%s-%s-%s.json'%(data['design'],data['workerID'],timestamp)
	with open(os.path.join(Settings.djangoPath+"json/",filename),'w') as f:
		json.dump(data,f,indent=4)
	return HttpResponse(filename)
