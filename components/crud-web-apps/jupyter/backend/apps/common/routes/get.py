from kubeflow.kubeflow.crud_backend import api, logging

from .. import utils
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/config")
def get_config():
    config = utils.load_spawner_ui_config()
    return api.success_response("config", config)


@bp.route("/api/namespaces/<namespace>/pvcs")
def get_pvcs(namespace):
    pvcs = api.list_pvcs(namespace).items
    data = [{"name": pvc.metadata.name,
             "size": pvc.spec.resources.requests["storage"],
             "mode": pvc.spec.access_modes[0]} for pvc in pvcs]

    return api.success_response("pvcs", data)


@bp.route("/api/namespaces/<namespace>/poddefaults")
def get_poddefaults(namespace):
    pod_defaults = api.list_poddefaults(namespace)

    # Return a list of (label, desc) with the pod defaults
    contents = []
    for pd in pod_defaults["items"]:
        # Some podDefault do not use "matchLabels", i.e. use "matchExpressions"
        #   https://zbrt.atl.zillow.net/browse/AIP-5086
        if "matchLabels" not in pd["spec"]["selector"]:
            continue

        label = list(pd["spec"]["selector"]["matchLabels"].keys())[0]
        if "desc" in pd["spec"]:
            desc = pd["spec"]["desc"]
        else:
            desc = pd["metadata"]["name"]

        contents.append({"label": label, "desc": desc})

    log.info("Found poddefaults: %s", contents)
    return api.success_response("poddefaults", contents)


@bp.route("/api/namespaces/<namespace>/notebooks")
def get_notebooks(namespace):
    notebooks = api.list_notebooks(namespace)["items"]
    contents = [utils.notebook_dict_from_k8s_obj(nb) for nb in notebooks]

    return api.success_response("notebooks", contents)


@bp.route("/api/gpus")
def get_gpu_vendors():
    """
    Return a list of GPU vendors for which at least one node has the necessary
    annotation required to schedule pods
    """
    frontend_config = utils.load_spawner_ui_config()
    gpus_value = frontend_config.get("gpus", {}).get("value", {})
    config_vendor_keys = [
        v.get("limitsKey", "") for v in gpus_value.get("vendors", [])
    ]

    # Get all of the different resources installed in all nodes
    installed_resources = set()
    nodes = api.list_nodes().items
    for node in nodes:
        installed_resources.update(node.status.capacity.keys())

    # Keep the vendors the key of which exists in at least one node
    available_vendors = installed_resources.intersection(config_vendor_keys)

    return api.success_response("vendors", list(available_vendors))


@bp.route("/api/namespaces/<namespace>/services")
def get_zodiac_services(namespace):
    """ Return a list of zodiac services by which the current user's team owns.
    """
    # Get all of the zodiac services
    log.info(f'Gathering zodiac services for namespace {namespace}.')
    owned_services = api.get_zodiac_services(namespace)

    return api.success_response("services", list(owned_services))


@bp.route("/api/namespaces/<namespace>/onboarding-service-namespace")
def get_namespace_created_by_aip_onboarding_service(namespace):
    """ Return whether a namespace was created by aip-onboarding-service.
    """
    log.info(f'Entering validation if namespace {namespace} was created by aip-onboarding-service.')
    is_aip_onboarding_service_namespace = api.namespace_created_by_aip_onboarding_service(namespace)

    return api.success_response("isonboardingnamespace", str(is_aip_onboarding_service_namespace))