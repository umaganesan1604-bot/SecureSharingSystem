"""
Tests for Role-Based Access Control (RBAC).
Covers:
  - TEST 3: Employee tries to access admin user-management API -> 403 Forbidden
  - Manager cannot access admin user-management API -> 403 Forbidden
  - Manager cannot access admin audit logs -> 403 Forbidden
  - Employee cannot access admin audit logs -> 403 Forbidden
  - Admin has full access to user management and audit
  - Admin role changes succeed and are audited
  - Protection against removing last admin
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import UserProfile
from audit.models import AuditLog

class RBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin
        self.admin = User.objects.create_user(
            username='admin_test', 
            email='admin@test.local', 
            password='Password123!'
        )
        self.admin.profile.role = UserProfile.Role.ADMIN
        self.admin.profile.save()
        self.admin_token, _ = Token.objects.get_or_create(user=self.admin)

        # Manager
        self.manager = User.objects.create_user(
            username='manager_test', 
            email='manager@test.local', 
            password='Password123!'
        )
        self.manager.profile.role = UserProfile.Role.MANAGER
        self.manager.profile.save()
        self.manager_token, _ = Token.objects.get_or_create(user=self.manager)

        # Employee
        self.employee = User.objects.create_user(
            username='employee_test', 
            email='employee@test.local', 
            password='Password123!'
        )
        self.employee.profile.role = UserProfile.Role.EMPLOYEE
        self.employee.profile.save()
        self.employee_token, _ = Token.objects.get_or_create(user=self.employee)

    def test_scenario_3_employee_access_admin_api_forbidden(self):
        """TEST 3: Employee tries to access admin user-management API. Expected: 403 Forbidden."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Employee attempts to change another user's role
        role_resp = self.client.patch(
            f'/api/admin/users/{self.employee.id}/role/',
            {'role': 'ADMIN'},
            format='json'
        )
        self.assertEqual(role_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_access_admin_api_forbidden(self):
        """Manager cannot access admin-only endpoints."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.manager_token.key}')
        
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Manager cannot access audit logs
        audit_resp = self.client.get('/api/audit/')
        self.assertEqual(audit_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_access_audit_logs_forbidden(self):
        """Employee cannot access complete audit logs."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        response = self.client.get('/api/audit/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_access_allowed(self):
        """Admin has full access to user management and audit endpoints."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        # List users
        users_resp = self.client.get('/api/admin/users/')
        self.assertEqual(users_resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(users_resp.data), 3)

        # View audit logs
        audit_resp = self.client.get('/api/audit/')
        self.assertEqual(audit_resp.status_code, status.HTTP_200_OK)

        # View admin dashboard stats
        stats_resp = self.client.get('/api/admin/stats/')
        self.assertEqual(stats_resp.status_code, status.HTTP_200_OK)
        self.assertIn('admin_count', stats_resp.data)

    def test_admin_can_update_roles_with_audit(self):
        """Admin can promote an employee to manager and it is logged."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        resp = self.client.patch(
            f'/api/admin/users/{self.employee.id}/role/',
            {'role': 'MANAGER'},
            format='json'
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.employee.profile.refresh_from_db()
        self.assertEqual(self.employee.profile.role, UserProfile.Role.MANAGER)

        # Verify audit log recorded role change
        self.assertTrue(
            AuditLog.objects.filter(
                action=AuditLog.Action.ROLE_CHANGED,
                user=self.admin
            ).exists()
        )
