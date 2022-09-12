from . import rbac_client
from .. import authz
from kubernetes import client
from kubeflow.kubeflow.crud_backend import logging


log = logging.getLogger(__name__)


def create_rolebinding(namespace: str, name: str):
    body = client.V1RoleBinding(
        metadata=client.V1ObjectMeta(
            name=name,
        ),
        role_ref=client.V1RoleRef(
            api_group="rbac.authorization.k8s.io",
            kind="ClusterRole",
            name="kubeflow-edit",
        ),
        subjects=[
            client.V1Subject(
                kind="ServiceAccount",
                name=name,
                namespace=namespace,
            )
        ],
    )
    try:
        rbac_client.create_namespaced_role_binding(namespace, body)
        log.info(f'Successfully created RoleBinding {name}')
    except client.rest.ApiException as e:
        log.error(f'Exception when calling RbacAuthorizationV1Api->create_namespaced_role_binding: {e}\n')
        raise (e)


def get_rolebinding(namespace: str, name: str) -> client.V1RoleBinding:
    field_selector = f'metadata.name={name}'
    return rbac_client.list_namespaced_role_binding(
        namespace, field_selector=field_selector
    ).items[0]


def patch_rolebinding(namespace: str, name: str, rb: client.V1RoleBinding):
    try:
        rbac_client.patch_namespaced_role_binding(name, namespace, rb)
    except client.rest.ApiException as e:
        log.error(f'Exception when calling RbacAuthorizationV1Api->patch_namespaced_role_binding: {e}\n')


def delete_rolebinding(namespace: str, name: str):
    try:
        rbac_client.delete_namespaced_role_binding(name, namespace)
    except client.rest.ApiException as e:
        log.error(f'Exception when calling RbacAuthorizationV1Api->delete_namespaced_role_binding: {e}\n')