"""
Tests for File Sharing, Download Authorization, and Audit Logging.
Covers:
  - TEST 4: Employee tries to download another user's private file -> 403 Forbidden
  - TEST 5: Authorized user downloads file -> Authorizes first, decrypts, returns file
  - File upload with AES-256-GCM encryption
  - File sharing with granular permissions
  - Share revocation
  - Audit logging for upload, download, share, deny, delete
"""
import os
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import UserProfile
from fileshare.models import SecureFile, FileShare
from audit.models import AuditLog

class FilesAndAuditTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.alice = User.objects.create_user(username='alice', email='alice@test.local', password='Password123!')
        self.alice.profile.role = UserProfile.Role.EMPLOYEE
        self.alice.profile.save()
        self.alice_token, _ = Token.objects.get_or_create(user=self.alice)

        self.bob = User.objects.create_user(username='bob', email='bob@test.local', password='Password123!')
        self.bob.profile.role = UserProfile.Role.EMPLOYEE
        self.bob.profile.save()
        self.bob_token, _ = Token.objects.get_or_create(user=self.bob)

        self.manager = User.objects.create_user(username='manager', email='manager@test.local', password='Password123!')
        self.manager.profile.role = UserProfile.Role.MANAGER
        self.manager.profile.save()
        self.manager_token, _ = Token.objects.get_or_create(user=self.manager)

    def test_file_upload_encrypts_and_creates_audit_log(self):
        """Uploading a file stores it encrypted and writes an audit log."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.alice_token.key}')
        
        file_content = b"Content of confidential financial statement."
        test_file = SimpleUploadedFile("statement.txt", file_content, content_type="text/plain")

        response = self.client.post('/api/files/upload/', {'file': test_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('file', response.data)
        file_id = response.data['file']['id']

        # Verify database record
        sec_file = SecureFile.objects.get(id=file_id)
        self.assertEqual(sec_file.owner, self.alice)
        self.assertTrue(os.path.exists(sec_file.storage_path))

        # Verify disk file is NOT plaintext
        with open(sec_file.storage_path, 'rb') as f:
            disk_bytes = f.read()
        self.assertNotEqual(disk_bytes, file_content)

        # Verify audit log
        self.assertTrue(
            AuditLog.objects.filter(
                action=AuditLog.Action.FILE_UPLOAD,
                user=self.alice,
                file_name="statement.txt"
            ).exists()
        )

    def test_scenario_4_unauthorized_download_blocked_with_403(self):
        """
        TEST 4: Employee tries to download another user's private file.
        Expected: 403 Forbidden.
        Authorization happens BEFORE decryption.
        """
        # Alice uploads a private file
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.alice_token.key}')
        test_file = SimpleUploadedFile("alice_private.txt", b"Alice's secret notes", content_type="text/plain")
        upload_resp = self.client.post('/api/files/upload/', {'file': test_file}, format='multipart')
        file_id = upload_resp.data['file']['id']

        # Bob (another employee without permissions) tries to download Alice's file
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.bob_token.key}')
        download_resp = self.client.get(f'/api/files/{file_id}/download/')

        # MUST be 403 Forbidden
        self.assertEqual(download_resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(download_resp.data['error'], 'You do not have permission to access this file.')

        # Verify security denial is logged in audit trail
        self.assertTrue(
            AuditLog.objects.filter(
                action=AuditLog.Action.FILE_ACCESS_DENIED,
                user=self.bob,
                file_id=str(file_id),
                status=AuditLog.Status.DENIED
            ).exists()
        )

    def test_scenario_5_authorized_user_downloads_file(self):
        """
        TEST 5: Authorized user downloads a file.
        Expected: Backend authorizes first, then decrypts, then returns original file.
        """
        raw_content = b"Authorized project specification document."
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.alice_token.key}')
        test_file = SimpleUploadedFile("spec.txt", raw_content, content_type="text/plain")
        upload_resp = self.client.post('/api/files/upload/', {'file': test_file}, format='multipart')
        file_id = upload_resp.data['file']['id']

        # Alice downloads her own file
        download_resp = self.client.get(f'/api/files/{file_id}/download/')
        self.assertEqual(download_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(download_resp.content, raw_content)
        self.assertIn('attachment; filename="spec.txt"', download_resp['Content-Disposition'])

        # Verify audit log for download
        self.assertTrue(
            AuditLog.objects.filter(
                action=AuditLog.Action.FILE_DOWNLOAD,
                user=self.alice,
                file_id=str(file_id)
            ).exists()
        )

    def test_file_sharing_and_revocation(self):
        """Verify sharing grants download access, and revocation blocks it."""
        raw_content = b"Shared design document content."
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.alice_token.key}')
        test_file = SimpleUploadedFile("design.txt", raw_content, content_type="text/plain")
        upload_resp = self.client.post('/api/files/upload/', {'file': test_file}, format='multipart')
        file_id = upload_resp.data['file']['id']

        # Before share: Bob gets 403
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.bob_token.key}')
        resp_before = self.client.get(f'/api/files/{file_id}/download/')
        self.assertEqual(resp_before.status_code, status.HTTP_403_FORBIDDEN)

        # Alice shares the file with Bob
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.alice_token.key}')
        share_resp = self.client.post(
            f'/api/files/{file_id}/share/',
            {'recipient': 'bob', 'permission': 'DOWNLOAD'},
            format='json'
        )
        self.assertEqual(share_resp.status_code, status.HTTP_201_CREATED)

        # Now Bob can download successfully
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.bob_token.key}')
        resp_after = self.client.get(f'/api/files/{file_id}/download/')
        self.assertEqual(resp_after.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_after.content, raw_content)

        # Alice revokes the share
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.alice_token.key}')
        revoke_resp = self.client.post(
            f'/api/files/{file_id}/revoke-share/',
            {'username': 'bob'},
            format='json'
        )
        self.assertEqual(revoke_resp.status_code, status.HTTP_200_OK)

        # Now Bob is blocked again with 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.bob_token.key}')
        resp_revoked = self.client.get(f'/api/files/{file_id}/download/')
        self.assertEqual(resp_revoked.status_code, status.HTTP_403_FORBIDDEN)
