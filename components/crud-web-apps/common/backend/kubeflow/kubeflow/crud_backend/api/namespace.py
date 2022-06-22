from .. import authz
from . import v1_core, serialize
from kubernetes.client.exceptions import ApiException
from kubeflow.kubeflow.crud_backend import logging


log = logging.getLogger(__name__)


@authz.needs_authorization("list", "core", "v1", "namespaces")
def list_namespaces():
    return v1_core.list_namespace()


@authz.needs_authorization("list", "core", "v1", "namespaces")
def namespace_created_by_aip_onboarding_service(namespace: str) -> bool:
    """ Return true if the current namespace was created by aip-onboarding-service.
    """
    metadata_name = f'metadata.name={namespace}'
    log.info(f'Validating if namespace {namespace} was created by aip-onboarding-service.')
    try:
        response = v1_core.list_namespace(field_selector=metadata_name)
    except ApiException as e:
        print (f'Exception when calling CoreV1Api->list_namespace: {e}\n')

    response_dict = serialize(response)
    labels = response_dict["items"][0]["metadata"]["labels"]

    created_by_aip_onboarding_service = labels.get("app.kubernetes.io/created-by")

    if created_by_aip_onboarding_service is None:
        log.info(f'Namespace {namespace} was not created by aip-onboarding-service.')
        return False

    return created_by_aip_onboarding_service == "aip-onboarding-service"