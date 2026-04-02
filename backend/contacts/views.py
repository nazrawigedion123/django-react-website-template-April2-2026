from rest_framework import mixins, permissions, viewsets
from rest_framework.throttling import SimpleRateThrottle

from .models import Contact, Subscriber
from .permissions import CanManageContacts, CanManageSubscribers
from .serializers import ContactSerializer, SubscriberSerializer


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


class BaseIpScopeThrottle(SimpleRateThrottle):
    scope = ""

    def get_cache_key(self, request, view):
        ident = get_client_ip(request)
        if not ident:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}


class ContactCreateThrottle(BaseIpScopeThrottle):
    scope = "contacts_create"


class ContactListThrottle(BaseIpScopeThrottle):
    scope = "contacts_list"


class SubscriberCreateThrottle(BaseIpScopeThrottle):
    scope = "subscribers_create"


class SubscriberListThrottle(BaseIpScopeThrottle):
    scope = "subscribers_list"


class ContactViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Contact.objects.all().order_by("-created_at")
    serializer_class = ContactSerializer

    def get_permissions(self):
        if self.action == "list":
            return [permissions.IsAuthenticated(), CanManageContacts()]
        return [permissions.AllowAny()]

    def get_throttles(self):
        if self.action == "list":
            return [ContactListThrottle()]
        return [ContactCreateThrottle()]

    def perform_create(self, serializer):
        serializer.save(ip_address=get_client_ip(self.request))


class SubscriberViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Subscriber.objects.all().order_by("-created_at")
    serializer_class = SubscriberSerializer

    def get_permissions(self):
        if self.action == "list":
            return [permissions.IsAuthenticated(), CanManageSubscribers()]
        return [permissions.AllowAny()]

    def get_throttles(self):
        if self.action == "list":
            return [SubscriberListThrottle()]
        return [SubscriberCreateThrottle()]
