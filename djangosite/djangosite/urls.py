from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings


urlpatterns = patterns('',
    url(r'^design/', include('design.urls')),
)

# ... the rest of your URLconf goes here ...
urlpatterns += patterns('',
        (r'^/design/static/(?P<path>.*)$','django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    )
