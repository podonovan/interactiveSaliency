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
import os
import time
import shutil
import urllib
import json
import sys

import numpy as np
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
	sImg = 	255.0*np.ones((height,width))

	if sImg.std()< 1:
		HttpResponse('Error in saliency image')

	print("std: "+str(sImg.std()))
	saliencyImage = (Image.fromarray(sImg).convert('RGB'))

	saliencyImgTime = datetime.now()
	print("saliencyImgTime "+str(((saliencyImgTime-readImageTime).total_seconds()*1000.0)))


	print saliencyFname
	saliencyImage.save(Settings.djangoPath+saliencyFname,'png')
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
			designs.append(filename)
	print "designs:"
	print designs
	retObj={}
	retObj['designs']=designs
	retJSON = json.dumps(retObj,default=default_action)
	return HttpResponse(retJSON)



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
