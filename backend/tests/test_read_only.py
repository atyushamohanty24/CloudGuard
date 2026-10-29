import pytest
import boto3
from moto import mock_aws
from collectors.base import ReadOnlyClientProxy, ReadOnlyViolationError


def test_read_only_proxy_allows_describe():
    with mock_aws():
        client = boto3.client("ec2", region_name="us-east-1")
        proxy = ReadOnlyClientProxy(client, "ec2")
        # Allowed read-only method
        resp = proxy.describe_instances()
        assert "Reservations" in resp


def test_read_only_proxy_blocks_terminating_instances():
    with mock_aws():
        client = boto3.client("ec2", region_name="us-east-1")
        proxy = ReadOnlyClientProxy(client, "ec2")
        # Mutating call must raise ReadOnlyViolationError
        with pytest.raises(ReadOnlyViolationError) as exc_info:
            proxy.terminate_instances(InstanceIds=["i-1234567890abcdef0"])
        assert "Forbidden mutating API call 'terminate_instances'" in str(exc_info.value)


def test_read_only_proxy_blocks_delete_volume():
    with mock_aws():
        client = boto3.client("ec2", region_name="us-east-1")
        proxy = ReadOnlyClientProxy(client, "ec2")
        with pytest.raises(ReadOnlyViolationError):
            proxy.delete_volume(VolumeId="vol-1234567890")


def test_read_only_proxy_blocks_s3_put_object():
    with mock_aws():
        client = boto3.client("s3", region_name="us-east-1")
        proxy = ReadOnlyClientProxy(client, "s3")
        with pytest.raises(ReadOnlyViolationError):
            proxy.put_object(Bucket="mybucket", Key="test.txt", Body=b"data")
