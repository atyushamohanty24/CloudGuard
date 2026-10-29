from abc import ABC, abstractmethod
from typing import Any, List, Optional
import boto3
import logging
from normalizer.schema import Finding

logger = logging.getLogger("cloudguard.collector")


class ReadOnlyViolationError(Exception):
    """Raised if any collector attempts to execute a mutating AWS API call."""
    pass


class ReadOnlyClientProxy:
    """
    Transparent proxy wrapping boto3 clients.
    Guarantees that only read-only methods (describe_*, get_*, list_*) can be invoked.
    """
    ALLOWED_PREFIXES = ("describe_", "get_", "list_")

    def __init__(self, client: Any, service_name: str):
        self._client = client
        self._service_name = service_name

    def __getattr__(self, name: str) -> Any:
        attr = getattr(self._client, name)
        if callable(attr):
            if not any(name.startswith(prefix) for prefix in self.ALLOWED_PREFIXES):
                raise ReadOnlyViolationError(
                    f"Forbidden mutating API call '{name}' on service '{self._service_name}'. "
                    f"CloudGuard AI is strictly read-only toward the audited account."
                )
        return attr


class BaseCollector(ABC):
    """Abstract base class for all domain collectors enforcing read-only behavior."""

    collector_id: str = "base"
    service_name: str = "base"
    category: str = "cost"

    def get_read_only_client(self, session: boto3.Session, service_name: str, region: Optional[str] = None):
        """Returns a protected read-only client proxy for the given service."""
        raw_client = session.client(service_name, region_name=region)
        return ReadOnlyClientProxy(raw_client, service_name)

    @abstractmethod
    def collect(self, session: boto3.Session, region: str) -> List[Finding]:
        """
        Execute domain audit check and return standardized Findings.
        Must only call read-only methods.
        """
        pass
