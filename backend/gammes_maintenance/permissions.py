from rest_framework.permissions import BasePermission, SAFE_METHODS


def role_of(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'admin'
    profile = getattr(user, 'profile', None)
    return getattr(profile, 'role', None)

class RoleBasedModelPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = role_of(request.user)
        if request.method in SAFE_METHODS:
            return role in {'admin','redacteur','valideur','technicien'}
        return role in {'admin','redacteur','valideur'}

class CanValidate(BasePermission):
    def has_permission(self, request, view):
        return role_of(request.user) in {'admin','valideur'}
