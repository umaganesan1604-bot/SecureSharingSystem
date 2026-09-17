from django.urls import path
from .views import (
    FileUploadView,
    FileListView,
    FileDetailView,
    FileDownloadView,
    FileShareView,
    RevokeShareView,
    FileDeleteView
)

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('', FileListView.as_view(), name='file-list'),
    path('<uuid:pk>/', FileDetailView.as_view(), name='file-detail'),
    path('<uuid:pk>/download/', FileDownloadView.as_view(), name='file-download'),
    path('<uuid:pk>/share/', FileShareView.as_view(), name='file-share'),
    path('<uuid:pk>/revoke-share/', RevokeShareView.as_view(), name='file-revoke-share'),
    path('<uuid:pk>/delete/', FileDeleteView.as_view(), name='file-delete-action'),
]
