from . import v1_core
from .. import authz
from kubernetes import client
from kubeflow.kubeflow.crud_backend import logging


log = logging.getLogger(__name__)


def create_serviceaccount(namespace: str, name: str, iam_role: str, owner_references=None):
    authz.ensure_authorized("create", "", "v1", "serviceaccounts", namespace)
    body = client.V1ServiceAccount(
        metadata=client.V1ObjectMeta(
            name=name,
            annotations={
                "eks.amazonaws.com/role-arn": iam_role, 
                "eks.amazonaws.com/sts-regional-endpoints": "true",
            },
            owner_references = [owner_references],
        )
    )
    try:
        log.info(f'Create: serviceaccount {name}')
        v1_core.create_namespaced_service_account(namespace, body)
        log.info(f'Successfully created ServiceAccount {name}')
    except client.rest.ApiException as e:
        log.error(f'Exception when calling CoreV1Api->create_namespaced_service_account: {e}\n')
        raise (e)


# kubernetes client does not have a get_namespaced_service_account function, have to use list
# which returns a list no matter what so we return the only index in that list which is our 
# target ServiceAccount.
def get_serviceaccount(namespace: str, name: str) -> client.V1ServiceAccount:
    authz.ensure_authorized("list", "", "v1", "serviceaccounts", namespace)
    field_selector = f'metadata.name={name}'
    log.info(f'Get: serviceaccount {name}')
    return v1_core.list_namespaced_service_account(
        namespace, field_selector=field_selector
    ).items[0]


def patch_serviceaccount(namespace: str, name: str, sa: client.V1ServiceAccount):
    authz.ensure_authorized("patch", "", "v1", "serviceaccounts", namespace)
    try:
        log.info(f'Patch: serviceaccount {name}')
        v1_core.patch_namespaced_service_account(name, namespace, sa)
    except client.rest.ApiException as e:
        log.error(f'Exception when calling CoreV1Api->patch_namespaced_service_account: {e}\n')


def delete_serviceaccount(namespace: str, name: str):
    authz.ensure_authorized("delete", "", "v1", "serviceaccounts", namespace)
    try:
        log.info(f'Delete: serviceaccount {name}')
        v1_core.delete_namespaced_service_account(name, namespace)
    except client.rest.ApiException as e:
        log.error(f'Exception when calling CoreV1Api->delete_namespaced_service_account: {e}\n')