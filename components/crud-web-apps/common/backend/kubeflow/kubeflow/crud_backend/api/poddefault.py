from .. import authz
from . import custom_api, utils
from typing import Dict


def list_poddefaults(namespace):
    authz.ensure_authorized("list", "kubeflow.org", "v1alpha1", "poddefaults",
                            namespace)
    return custom_api.list_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults")


def post_all_poddefault(namespace, body):
    return custom_api.create_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults", body)


"""
def get_all_poddefault(namespace) -> Dict[str, str]:
    poddefault_name = "all-pod-default"
    response = custom_api.get_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults", poddefault_name)

    response_dict = utils.serialize(response)

    return response_dict


def patch_zodiac_service(namespace, body):
    poddefault_name = "all-pod-default"
    return custom_api.patch_namespaced_custom_object("kubeflow.org", "v1alpha1",
                                                    namespace, "poddefaults", poddefault_name, body)
"""