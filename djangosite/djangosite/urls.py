from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^xhr_test$','xhr_test'),

                       
    url(r'^design/$','design.views.main'),
    #url(r'^design/createLayout$','design.views.createLayout'),
    #url(r'^design/importDesign$','design.views.importDesign'),
    #url(r'^design/getLayoutFromClient$','design.views.getLayoutFromClient'),
    #url(r'^design/sendLayoutToClient$','design.views.sendLayoutToClient'),
    #url(r'^design/startNewRun$','design.views.startNewRun'),
    #url(r'^design/stopRun$','design.views.stopRun'),
    #url(r'^design/resetParameters$','design.views.resetParameters'),
    #url(r'^design/updateParameters$','design.views.updateParameters'),
   # url(r'^design/setCurrentDesign$','design.views.setCurrentDesign'),
    url(r'^design/createDesign','design.views.createDesign'),
    url(r'^design/create','design.views.createDesign'),
    url(r'^design/select','design.views.selectDesign'),
    url(r'^design/selectDesign','design.views.selectDesign'),
    url(r'^design/listDesigns','design.views.listDesigns'),
    url(r'^design/saveDesign','design.views.saveDesign'),
    url(r'^design/deleteDesign','design.views.deleteDesign'),
    url(r'^design/saveImage','design.views.saveImage'),
    #url(r'^design/mturkStudy','design.views.mturkStudy'),
    #url(r'^design/layoutStudyResults','design.views.layoutStudyResults'),
    #url(r'^design/viewLayouts','design.views.viewLayouts'),
    #url(r'^design/listLayouts','design.views.listLayouts'),
    url(r'^design/requestSaliencyImage', 'design.views.createSaliencyImage')
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)



# ... the rest of your URLconf goes here ...
urlpatterns += patterns('',
        (r'^/design/static/(?P<path>.*)$','django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    )
#urlpatterns += staticfiles_urlpatterns()
#print staticfiles_urlpatterns()
