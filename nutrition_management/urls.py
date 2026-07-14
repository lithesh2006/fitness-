from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Prefix all REST API routes with 'api/' to match requirements
    path('api/', include('authentication.urls')),
    path('api/', include('nutrition.urls')),
    path('api/', include('workout.urls')),
    path('api/', include('dashboard.urls')),
    path('api/', include('reports.urls')),
]
