
import numpy as np
from datetime import datetime
import matplotlib
import StringIO
from io import BytesIO

matplotlib.use('Agg')
import matplotlib.pyplot as plt

import sys
sys.path.append('/Users/odonovan/dev/caffe/python')

import caffe

from PIL import Image

saliencyCnt = 0.0
saliencySum = 0.0


class Saliency(object):

    def __init__(self,protoFile, modelFile):
        self.net = caffe.Net(protoFile, modelFile, caffe.TEST)
        #self.net = 0

    def preprocess_image(self,im):
        # preprocess image same way as for network
        # load image, switch to BGR, subtract mean, and make dims C x H x W for Caffe


        mean = np.array((104.00699, 116.66877, 122.67892))

        in_ = np.array(im, dtype=np.float32)

        print(in_.shape)

        if len(in_.shape) < 3:
            w, h = in_.shape
            ret = np.empty((w, h, 3), dtype=np.float32)
            ret[:, :, :] = in_[:, :, np.newaxis]
            in_ = ret

        # get rid of alpha dimension
        if in_.shape[2] == 4:
            background = Image.new("RGB", im.size, (255, 255, 255))
            background.paste(im, mask=im.split()[3])  # 3 is the alpha channel
            in_ = np.array(background, dtype=np.float32)

        in_ = in_[:, :, ::-1]
        in_ -= mean
        in_ = in_.transpose((2, 0, 1))
        return in_

    def calc_pred_importance(self,im, net):

        startTime = datetime.now()
        in_ = self.preprocess_image(im)
        net.blobs['data'].reshape(1, *in_.shape)
        net.blobs['data'].data[...] = in_
        net.forward()
        data = net.blobs['loss'].data[0]
        endTime = datetime.now()

        print("calc pred importance "+str(((endTime-startTime).total_seconds()*1000.0)))
        return data


    def save_image(self, data, fn):

        sizes = np.shape(data)
        height = float(sizes[0])
        width = float(sizes[1])

        fig = plt.figure()
        fig.set_size_inches(width / height, 1, forward=False)
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)

        ax.imshow(data)
        plt.savefig(fn, dpi=height/2)
        plt.close()

    def detectSaliency(self,img,imgWidth,imgHeight,data,textPositions, saliencyLocation):

        startTime = datetime.now()

        matplotlib.use('Agg')
        GPU_ID = 0
        caffe.set_mode_gpu()
        caffe.set_device(GPU_ID)
        try:
            #d = np.fromstring(data, dtype=np.uint8, sep=',')
            #d2 = d.reshape((imgHeight,imgWidth,4))

            im = Image.open(BytesIO(img)).convert("RGB")
            im.verify()


            #im = Image.fromarray(d2,"RGBA")

            #pixels = list(im1.getdata())
            #pixels2 = list(im.getdata())
            #print pixels[0:10]
            #print pixels2[0:10]
            #print data[0:100]
            #print d[0:100]

        except Exception, e:
            # The image is not valid
            print("error reading image")
            print (str(e))

        w = float(im.size[0])
        h = float(im.size[1])

        loadImageTime = datetime.now()
        print("loadImageTime "+str((loadImageTime-startTime).total_seconds()*1000.0))


        maxDim = 600.0
        scale = 1.0
        if (w > maxDim) or (h > maxDim):
            if (w > h):
                scale = w/maxDim
                im = im.resize((int(maxDim), int((h / w) * maxDim)), Image.ANTIALIAS)
            else:
                scale = h/maxDim
                im = im.resize(( int((w / h) * maxDim), int(maxDim)), Image.ANTIALIAS)

        pred_imp = self.calc_pred_importance(im, self.net)
        pred_imp_show = pred_imp[0, ...]
        pred_imp_show = (pred_imp_show - np.min(pred_imp_show)) / float(np.max(pred_imp_show) - np.min(pred_imp_show))

        predictionTime = datetime.now()
        print("predictionTime "+str((predictionTime-startTime).total_seconds()*1000.0))


        positions = textPositions.split("\n")
        for textPosition in positions:
            pos = textPosition.split(",")
            if len(pos)==4:
                x = int(float(pos[0])*scale)
                y = int(float(pos[1])*scale)
                w = int(float(pos[2])*scale)
                h = int(float(pos[3])*scale)

                x2 = int(x + (float(w)*0.2))
                y2 = int(y + (float(h)*0.2))
                w2 = int((float(w)*0.6))
                h2 = int((float(h)*0.6))
                print x,y,w,h
                pred_imp_show[y:y+h,x:x+w] = pred_imp_show[y2:y2+h2,x2:x2+w2].mean()
        print pred_imp_show.shape


        #fig = plt.figure()
        #plt.imshow(pred_imp_show)

        self.save_image(pred_imp_show,saliencyLocation)

        Image.open(saliencyLocation).save(saliencyLocation,'JPEG',quality=60)

        saveImageTime = datetime.now()

        print("saveImageTime "+str((saveImageTime-predictionTime).total_seconds()*1000.0))
        #fig.savefig(saliencyLocation, transparent=True, bbox_inches='tight',pad_inches=0)

        return pred_imp_show
