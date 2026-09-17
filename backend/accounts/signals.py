from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        # If created by createsuperuser, give ADMIN role, otherwise EMPLOYEE
        initial_role = UserProfile.Role.ADMIN if instance.is_superuser else UserProfile.Role.EMPLOYEE
        UserProfile.objects.get_or_create(user=instance, defaults={'role': initial_role})
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
