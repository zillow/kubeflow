from .. import authz
from . import custom_api
from kubernetes.client.rest import ApiException


def list_poddefaults(namespace):
    authz.ensure_authorized("list", "kubeflow.org", "v1alpha1", "poddefaults",
                            namespace)
    return custom_api.list_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults")


def post_all_poddefault(namespace, body):
    try:
        response = custom_api.create_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults", body)
    except ApiException as e:
        # if the all-poddefault already exists than delete it
        if ("AlreadyExists" in e):
            response = custom_api.replace_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                        namespace, "poddefaults", "all-pod-default", body)
    return response

"""
def patch_zodiac_service(namespace, body):
    poddefault_name = "all-pod-default"
    return custom_api.patch_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults", poddefault_name, body)
"""