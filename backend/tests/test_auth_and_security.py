"""
Tests for Authentication, Registration, and Password Security.
Covers:
  - TEST 1: Register normal employee -> role is EMPLOYEE
  - TEST 2: Attempt client role injection -> still EMPLOYEE
  - Password is not plaintext (Django PBKDF2 verification)
  - Duplicate username rejection
  - Missing fields handling
  - Login success & failure handling
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.auth.hashers import identify_hasher
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import UserProfile
from audit.models import AuditLog

class AuthAndSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_scenario_1_register_normal_employee(self):
        """TEST 1: Register a normal employee. Expected: EMPLOYEE role."""
        payload = {
            "username": "alice_employee",
            "email": "alice@secureshare.local",
            "password": "ValidPassword123!",
            "phone": "+1-555-0199"
        }
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], UserProfile.Role.EMPLOYEE)

        user = User.objects.get(username='alice_employee')
        self.assertEqual(user.profile.role, UserProfile.Role.EMPLOYEE)

        # Verify audit log
        self.assertTrue(
            AuditLog.objects.filter(
                action=AuditLog.Action.REGISTER, 
                user=user
            ).exists()
        )

    def test_scenario_2_role_injection_attack_prevented(self):
        """
        TEST 2: Attempt client role injection:
        {"username": "attacker", "password": "password", "role": "ADMIN"}
        Expected: Account must still be EMPLOYEE.
        """
        payload = {
            "username": "attacker_user",
            "email": "attacker@secureshare.local",
            "password": "Password456!",
            "phone": "+1-555-0666",
            "role": "ADMIN"  # Malicious injection attempt
        }
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], UserProfile.Role.EMPLOYEE)

        user = User.objects.get(username='attacker_user')
        self.assertEqual(user.profile.role, UserProfile.Role.EMPLOYEE)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)

    def test_password_security_pbkdf2_hashing(self):
        """Verify password is never stored as plaintext and uses Django's PBKDF2 hasher."""
        raw_password = "SecretPassword789!"
        payload = {
            "username": "bob_secure",
            "email": "bob@secureshare.local",
            "password": raw_password,
        }
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username='bob_secure')
        # Plaintext check
        self.assertNotEqual(user.password, raw_password)
        self.assertNotIn(raw_password, user.password)
        
        # Verify hasher is PBKDF2
        hasher = identify_hasher(user.password)
        self.assertTrue(hasher.algorithm.startswith('pbkdf2'))
        
        # Verify password check works
        self.assertTrue(user.check_password(raw_password))
        self.assertFalse(user.check_password("WrongPassword123!"))

    def test_duplicate_username_rejected(self):
        """Verify duplicate username returns bad request."""
        payload = {
            "username": "charlie_test",
            "email": "charlie1@secureshare.local",
            "password": "Password123!",
        }
        response1 = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        payload['email'] = 'charlie2@secureshare.local'
        response2 = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', str(response2.data))

    def test_login_success_and_token_generation(self):
        """Verify successful login returns valid token and role."""
        raw_password = "SecurePassword123!"
        User.objects.create_user(username='diana', email='diana@secureshare.local', password=raw_password)

        response = self.client.post('/api/auth/login/', {
            'username': 'diana',
            'password': raw_password
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'diana')
        self.assertEqual(response.data['user']['role'], UserProfile.Role.EMPLOYEE)

        # Verify login success is logged in audit
        self.assertTrue(
            AuditLog.objects.filter(
                action=AuditLog.Action.LOGIN_SUCCESS,
                username_snapshot='diana'
            ).exists()
        )

    def test_login_failure_wrong_password(self):
        """Verify wrong password returns 401 and logs failure."""
        User.objects.create_user(username='eric', email='eric@secureshare.local', password='Password123!')

        response = self.client.post('/api/auth/login/', {
            'username': 'eric',
            'password': 'WrongPassword999!'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['error'], 'Invalid username or password.')

        # Verify login failure is logged in audit
        self.assertTrue(
            AuditLog.objects.filter(
                action=AuditLog.Action.LOGIN_FAILED,
                username_snapshot='eric'
            ).exists()
        )
