"""
SecureShare URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI / Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Application APIs
    path('api/auth/', include('accounts.urls_auth')),
    path('api/profile/', include('accounts.urls_profile')),
    path('api/admin/', include('accounts.urls_admin')),
    path('api/files/', include('fileshare.urls')),
    path('api/audit/', include('audit.urls')),
]
