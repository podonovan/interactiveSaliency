from django.conf.urls import patterns, url

from design import views

urlpatterns = patterns('',
    url(r'^$',views.main),
    url(r'^create',views.createDesign),
    url(r'^saveImage',views.saveImage),
    url(r'^saveDesign',views.saveDesign),
    url(r'^requestSaliencyImage', views.createSaliencyImage)
)