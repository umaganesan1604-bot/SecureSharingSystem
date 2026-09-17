"""
Django management command to populate demo users, files, and initial audit logs.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from accounts.models import UserProfile
from fileshare.models import SecureFile, FileShare
from encryption.services import encrypt_and_save_to_disk
from encryption.validators import generate_secure_storage_path
from audit.services import log_audit_event
from audit.models import AuditLog

class Command(BaseCommand):
    help = 'Seeds demo users and initial encrypted files for SecureShare'

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo users...")

        # 1. Admin
        admin_user, created = User.objects.get_or_create(
            username='admin_user',
            defaults={
                'email': 'admin@secureshare.local',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('AdminPass123!')
        admin_user.save()
        profile, _ = UserProfile.objects.get_or_create(user=admin_user)
        profile.role = UserProfile.Role.ADMIN
        profile.phone = '+1-555-0100'
        profile.save()

        # 2. Manager
        mgr_user, created = User.objects.get_or_create(
            username='manager_user',
            defaults={'email': 'manager@secureshare.local'}
        )
        mgr_user.set_password('ManagerPass123!')
        mgr_user.save()
        profile, _ = UserProfile.objects.get_or_create(user=mgr_user)
        profile.role = UserProfile.Role.MANAGER
        profile.phone = '+1-555-0101'
        profile.save()

        # 3. Employee
        emp_user, created = User.objects.get_or_create(
            username='employee_user',
            defaults={'email': 'employee@secureshare.local'}
        )
        emp_user.set_password('EmployeePass123!')
        emp_user.save()
        profile, _ = UserProfile.objects.get_or_create(user=emp_user)
        profile.role = UserProfile.Role.EMPLOYEE
        profile.phone = '+1-555-0102'
        profile.save()

        self.stdout.write(self.style.SUCCESS("Demo users created/updated successfully:"))
        self.stdout.write("  - Admin:    admin_user    / AdminPass123!    (Role: ADMIN)")
        self.stdout.write("  - Manager:  manager_user  / ManagerPass123!  (Role: MANAGER)")
        self.stdout.write("  - Employee: employee_user / EmployeePass123! (Role: EMPLOYEE)")

        # Create demo encrypted files if none exist
        if not SecureFile.objects.exists():
            self.stdout.write("Creating initial AES-256-GCM encrypted demo files...")
            
            # File 1: Manager uploads a Quarterly Security Report
            content1 = b"=== CONFIDENTIAL QUARTERLY SECURITY AUDIT REPORT ===\nAll systems evaluated for AES-256-GCM encryption standards.\nRBAC integrity checks passed with zero unauthorized access vulnerabilities."
            storage_path1 = generate_secure_storage_path()
            cf1 = ContentFile(content1, name="Quarterly_Security_Report.txt")
            meta1 = encrypt_and_save_to_disk(cf1, storage_path1)
            file1 = SecureFile.objects.create(
                owner=mgr_user,
                original_filename="Quarterly_Security_Report.txt",
                storage_path=storage_path1,
                file_size=len(content1),
                content_type="text/plain",
                encryption_version=meta1['encryption_version'],
                file_nonce=meta1['file_nonce'],
                encrypted_dek=meta1['encrypted_dek'],
                dek_nonce=meta1['dek_nonce']
            )

            # Share File 1 with employee_user
            FileShare.objects.create(
                file=file1,
                shared_by=mgr_user,
                shared_with=emp_user,
                permission=FileShare.Permission.DOWNLOAD
            )

            # File 2: Employee uploads onboarding notes
            content2 = b"=== EMPLOYEE COMPLIANCE CERTIFICATION ===\nConfirmed acknowledgment of organization privacy policies and data protection guidelines."
            storage_path2 = generate_secure_storage_path()
            cf2 = ContentFile(content2, name="Compliance_Acknowledgment.txt")
            meta2 = encrypt_and_save_to_disk(cf2, storage_path2)
            SecureFile.objects.create(
                owner=emp_user,
                original_filename="Compliance_Acknowledgment.txt",
                storage_path=storage_path2,
                file_size=len(content2),
                content_type="text/plain",
                encryption_version=meta2['encryption_version'],
                file_nonce=meta2['file_nonce'],
                encrypted_dek=meta2['encrypted_dek'],
                dek_nonce=meta2['dek_nonce']
            )

            # Log audit events for seed data
            log_audit_event(
                action=AuditLog.Action.FILE_UPLOAD,
                user=mgr_user,
                file_id=str(file1.id),
                file_name=file1.original_filename,
                description="Demo upload: Quarterly Security Report encrypted with AES-256-GCM."
            )
            log_audit_event(
                action=AuditLog.Action.FILE_SHARE,
                user=mgr_user,
                file_id=str(file1.id),
                file_name=file1.original_filename,
                description=f"Manager '{mgr_user.username}' shared '{file1.original_filename}' with '{emp_user.username}' (DOWNLOAD)."
            )

            self.stdout.write(self.style.SUCCESS("Encrypted demo files and audit logs populated."))
