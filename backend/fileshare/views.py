"""
File Sharing and AES-256-GCM Management Views for SecureShare.
Guarantees:
  - Encryption before persistent storage
  - Authorization check strictly before decryption
  - Prevention of path traversal and unauthorized data leakage
  - Complete audit tracking
"""
import os
import mimetypes
from django.http import HttpResponse
from django.db.models import Q
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from encryption.validators import sanitize_filename, validate_uploaded_file, generate_secure_storage_path
from encryption.services import (
    encrypt_and_save_to_disk,
    read_and_decrypt_from_disk,
    DecryptionAuthError,
    EncryptionError
)
from audit.services import log_audit_event
from audit.models import AuditLog
from accounts.models import UserProfile
from .models import SecureFile, FileShare
from .serializers import SecureFileSerializer, FileShareSerializer, FileShareCreateSerializer

def is_system_admin(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or getattr(user.profile, 'role', None) == UserProfile.Role.ADMIN

class FileUploadView(views.APIView):
    """
    Upload a file, validate it, encrypt it with AES-256-GCM, and store ciphertext only.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file was provided in the upload request."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Validate file constraints (size, dangerous extensions)
        try:
            validate_uploaded_file(uploaded_file)
        except Exception as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)

        original_filename = sanitize_filename(uploaded_file.name)
        storage_path = generate_secure_storage_path()
        content_type = uploaded_file.content_type or mimetypes.guess_type(original_filename)[0] or 'application/octet-stream'

        try:
            # 2. Encrypt in-flight and store ONLY encrypted ciphertext on disk
            enc_metadata = encrypt_and_save_to_disk(uploaded_file, storage_path)

            # 3. Create database record with encryption metadata
            secure_file = SecureFile.objects.create(
                owner=request.user,
                original_filename=original_filename,
                storage_path=storage_path,
                file_size=uploaded_file.size,
                content_type=content_type,
                encryption_version=enc_metadata['encryption_version'],
                file_nonce=enc_metadata['file_nonce'],
                encrypted_dek=enc_metadata['encrypted_dek'],
                dek_nonce=enc_metadata['dek_nonce'],
                status=SecureFile.Status.ACTIVE
            )

            # 4. Audit log
            log_audit_event(
                action=AuditLog.Action.FILE_UPLOAD,
                user=request.user,
                request=request,
                file_id=str(secure_file.id),
                file_name=original_filename,
                description=f"Uploaded and encrypted '{original_filename}' ({uploaded_file.size} bytes) via AES-256-GCM."
            )

            serializer = SecureFileSerializer(secure_file, context={'request': request})
            return Response(
                {
                    "message": "File encrypted with AES-256-GCM and stored securely.",
                    "file": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            # Clean up on failure
            if os.path.exists(storage_path):
                try:
                    os.remove(storage_path)
                except OSError:
                    pass
            log_audit_event(
                action=AuditLog.Action.FILE_UPLOAD,
                user=request.user,
                request=request,
                file_name=original_filename,
                description=f"File upload encryption failure: {str(e)}",
                status=AuditLog.Status.FAILED
            )
            return Response(
                {"error": "Failed to encrypt and store file. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FileListView(views.APIView):
    """
    List files authorized for the authenticated user.
    Enforces RBAC:
      - ADMIN: can view all organization files
      - MANAGER / EMPLOYEE: can view owned files and explicitly shared files
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        scope = request.query_params.get('scope', 'all')
        search = request.query_params.get('search', '').strip()

        base_qs = SecureFile.objects.filter(status=SecureFile.Status.ACTIVE)

        if is_system_admin(user):
            # Admin sees all, or can filter
            if scope == 'my_files':
                qs = base_qs.filter(owner=user)
            elif scope == 'shared_with_me':
                qs = base_qs.filter(shares__shared_with=user, shares__status=FileShare.Status.ACTIVE)
            else:
                qs = base_qs
        else:
            # Manager & Employee RBAC
            if scope == 'my_files':
                qs = base_qs.filter(owner=user)
            elif scope == 'shared_with_me':
                qs = base_qs.filter(shares__shared_with=user, shares__status=FileShare.Status.ACTIVE)
            else:
                # Default: owned OR actively shared with user
                qs = base_qs.filter(
                    Q(owner=user) | 
                    Q(shares__shared_with=user, shares__status=FileShare.Status.ACTIVE)
                ).distinct()

        if search:
            qs = qs.filter(original_filename__icontains=search)

        serializer = SecureFileSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class FileDetailView(views.APIView):
    """
    Retrieve metadata for a specific file. Requires ownership, active share, or admin role.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            file_obj = SecureFile.objects.get(pk=pk, status=SecureFile.Status.ACTIVE)
        except (SecureFile.DoesNotExist, ValueError):
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_owner = file_obj.owner_id == user.id
        is_admin = is_system_admin(user)
        has_share = file_obj.shares.filter(shared_with=user, status=FileShare.Status.ACTIVE).exists()

        if not (is_owner or is_admin or has_share):
            log_audit_event(
                action=AuditLog.Action.FILE_ACCESS_DENIED,
                user=user,
                request=request,
                file_id=str(file_obj.id),
                file_name=file_obj.original_filename,
                description=f"Unauthorized access attempt to file metadata '{file_obj.original_filename}'.",
                status=AuditLog.Status.DENIED
            )
            return Response({"error": "You do not have permission to access this file."}, status=status.HTTP_403_FORBIDDEN)

        serializer = SecureFileSerializer(file_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            file_obj = SecureFile.objects.get(pk=pk)
        except (SecureFile.DoesNotExist, ValueError):
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (file_obj.owner_id == user.id or is_system_admin(user)):
            return Response({"error": "You do not have permission to delete this file."}, status=status.HTTP_403_FORBIDDEN)

        filename = file_obj.original_filename
        storage_path = file_obj.storage_path

        # Remove physical encrypted file safely
        if os.path.exists(storage_path):
            try:
                os.remove(storage_path)
            except OSError:
                pass

        file_obj.delete()

        log_audit_event(
            action=AuditLog.Action.FILE_DELETE,
            user=user,
            request=request,
            file_name=filename,
            description=f"User '{user.username}' deleted file '{filename}'."
        )

        return Response({"message": f"File '{filename}' deleted successfully."}, status=status.HTTP_200_OK)



class FileDownloadView(views.APIView):
    """
    MANDATORY SECURITY RULE:
    1. Authenticate user.
    2. Check RBAC and file ownership/share permissions.
    3. ONLY IF AUTHORIZED -> Retrieve encrypted file from disk.
    4. Decrypt using AES-256-GCM and verify authentication tag.
    5. Return decrypted file.
    Never decrypt before authorization.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            file_obj = SecureFile.objects.get(pk=pk, status=SecureFile.Status.ACTIVE)
        except (SecureFile.DoesNotExist, ValueError):
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_owner = file_obj.owner_id == user.id
        is_admin = is_system_admin(user)
        
        # Check active share with download or view permission
        has_share = file_obj.shares.filter(
            shared_with=user, 
            status=FileShare.Status.ACTIVE
        ).exists()

        # Step 2: STRICT AUTHORIZATION CHECK BEFORE DECRYPTION
        if not (is_owner or is_admin or has_share):
            log_audit_event(
                action=AuditLog.Action.FILE_ACCESS_DENIED,
                user=user,
                request=request,
                file_id=str(file_obj.id),
                file_name=file_obj.original_filename,
                description=f"Blocked unauthorized file download attempt for '{file_obj.original_filename}'.",
                status=AuditLog.Status.DENIED
            )
            return Response(
                {"error": "You do not have permission to access this file."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Step 3 & 4: ONLY IF AUTHORIZED -> Read encrypted bytes & Decrypt AES-256-GCM
        try:
            plaintext_bytes = read_and_decrypt_from_disk(
                file_obj.storage_path, 
                file_obj.encryption_metadata
            )
        except DecryptionAuthError as dae:
            log_audit_event(
                action=AuditLog.Action.FILE_DOWNLOAD,
                user=user,
                request=request,
                file_id=str(file_obj.id),
                file_name=file_obj.original_filename,
                description=f"Decryption integrity failure: {str(dae)}",
                status=AuditLog.Status.FAILED
            )
            return Response(
                {"error": "File decryption failed due to integrity verification error. Stored data may have been altered."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": "An error occurred while retrieving the file."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Step 5: Log success & Return plaintext file stream
        log_audit_event(
            action=AuditLog.Action.FILE_DOWNLOAD,
            user=user,
            request=request,
            file_id=str(file_obj.id),
            file_name=file_obj.original_filename,
            description=f"Decrypted and downloaded '{file_obj.original_filename}'."
        )

        response = HttpResponse(plaintext_bytes, content_type=file_obj.content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_obj.original_filename}"'
        response['Content-Length'] = len(plaintext_bytes)
        return response


class FileShareView(views.APIView):
    """
    Share a file with an organizational user.
    Only file owner or admin can share.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            file_obj = SecureFile.objects.get(pk=pk, status=SecureFile.Status.ACTIVE)
        except (SecureFile.DoesNotExist, ValueError):
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_owner = file_obj.owner_id == user.id
        is_admin = is_system_admin(user)

        if not (is_owner or is_admin):
            return Response(
                {"error": "You do not have permission to share this file."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = FileShareCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        recipient_user = serializer.validated_data['recipient']
        permission_val = serializer.validated_data['permission']

        if recipient_user == user:
            return Response({"error": "You cannot share a file with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        share_obj, created = FileShare.objects.update_or_create(
            file=file_obj,
            shared_with=recipient_user,
            defaults={
                'shared_by': user,
                'permission': permission_val,
                'status': FileShare.Status.ACTIVE
            }
        )

        action_desc = "shared" if created else "updated share permissions for"
        log_audit_event(
            action=AuditLog.Action.FILE_SHARE,
            user=user,
            request=request,
            file_id=str(file_obj.id),
            file_name=file_obj.original_filename,
            description=f"User '{user.username}' {action_desc} file '{file_obj.original_filename}' with '{recipient_user.username}' ({permission_val})."
        )

        return Response(
            {
                "message": f"File successfully shared with {recipient_user.username}.",
                "share": FileShareSerializer(share_obj).data
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class RevokeShareView(views.APIView):
    """
    Revoke a previously granted file share.
    Only file owner or admin can revoke.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            file_obj = SecureFile.objects.get(pk=pk, status=SecureFile.Status.ACTIVE)
        except (SecureFile.DoesNotExist, ValueError):
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (file_obj.owner_id == user.id or is_system_admin(user)):
            return Response({"error": "You do not have permission to revoke shares for this file."}, status=status.HTTP_403_FORBIDDEN)

        share_id = request.data.get('share_id')
        recipient_username = request.data.get('username')

        share_qs = file_obj.shares.filter(status=FileShare.Status.ACTIVE)
        if share_id:
            share_obj = share_qs.filter(id=share_id).first()
        elif recipient_username:
            share_obj = share_qs.filter(shared_with__username=recipient_username).first()
        else:
            return Response({"error": "Please specify 'share_id' or 'username' to revoke."}, status=status.HTTP_400_BAD_REQUEST)

        if not share_obj:
            return Response({"error": "Active share record not found."}, status=status.HTTP_404_NOT_FOUND)

        revoked_user = share_obj.shared_with.username
        share_obj.status = FileShare.Status.REVOKED
        share_obj.save()

        log_audit_event(
            action=AuditLog.Action.SHARE_REVOKED,
            user=user,
            request=request,
            file_id=str(file_obj.id),
            file_name=file_obj.original_filename,
            description=f"User '{user.username}' revoked share on '{file_obj.original_filename}' for '{revoked_user}'."
        )

        return Response({"message": f"Share access revoked for {revoked_user}."}, status=status.HTTP_200_OK)


class FileDeleteView(views.APIView):
    """
    Permanently delete a file. Removes physical encrypted file and all share records.
    Only file owner or admin can delete.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            file_obj = SecureFile.objects.get(pk=pk)
        except (SecureFile.DoesNotExist, ValueError):
            return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (file_obj.owner_id == user.id or is_system_admin(user)):
            return Response({"error": "You do not have permission to delete this file."}, status=status.HTTP_403_FORBIDDEN)

        filename = file_obj.original_filename
        storage_path = file_obj.storage_path

        # Remove physical encrypted file safely
        if os.path.exists(storage_path):
            try:
                os.remove(storage_path)
            except OSError:
                pass

        file_obj.delete()

        log_audit_event(
            action=AuditLog.Action.FILE_DELETE,
            user=user,
            request=request,
            file_name=filename,
            description=f"User '{user.username}' deleted file '{filename}'."
        )

        return Response({"message": f"File '{filename}' deleted successfully."}, status=status.HTTP_200_OK)
