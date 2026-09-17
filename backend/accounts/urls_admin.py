from django.urls import path
from .views import (
    AdminUserListView,
    AdminUserCreateView,
    AdminUserRoleUpdateView,
    AdminUserStatusToggleView,
    AdminUserDeleteView,
    AdminStatsView
)

urlpatterns = [
    path('users/', AdminUserListView.as_view(), name='admin-users-list'),
    path('users/create/', AdminUserCreateView.as_view(), name='admin-users-create'),
    path('users/<int:pk>/role/', AdminUserRoleUpdateView.as_view(), name='admin-users-role'),
    path('users/<int:pk>/status/', AdminUserStatusToggleView.as_view(), name='admin-users-status'),
    path('users/<int:pk>/', AdminUserDeleteView.as_view(), name='admin-users-delete'),
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
]
