from .. import authz
from . import custom_api
from kubernetes.client.rest import ApiException


def list_poddefaults(namespace):
    authz.ensure_authorized("list", "kubeflow.org", "v1alpha1", "poddefaults",
                            namespace)
    return custom_api.list_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults")


def post_all_poddefault(namespace, body):
    authz.ensure_authorized("create", "kubeflow.org", "v1alpha1", "poddefaults",
                            namespace)
    try:
        response = custom_api.create_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults", body)
    except ApiException as e:
        # if the all-pod-default already exists than patch it
        if ("AlreadyExists" in str(e)):
            response = patch_zodiac_service(namespace, body)

    return response


def patch_zodiac_service(namespace, body):
    authz.ensure_authorized("patch", "kubeflow.org", "v1alpha1", "poddefaults",
                            namespace)
    poddefault_name = "all-pod-default"
    return custom_api.patch_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults", poddefault_name, body)