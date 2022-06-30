from flask import request
import yaml
import json

from kubeflow.kubeflow.crud_backend import api, decorators, helpers, logging

from ...common import form, utils, volumes
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/notebooks", methods=["POST"])
@decorators.request_is_json_type
@decorators.required_body_params("name")
def post_pvc(namespace):
    body = request.get_json()
    log.info("Got body: %s" % body)

    notebook = helpers.load_param_yaml(
        utils.NOTEBOOK_TEMPLATE_YAML,
        name=body["name"],
        namespace=namespace,
        serviceAccount="default-editor",
    )

    defaults = utils.load_spawner_ui_config()

    form.set_notebook_image(notebook, body, defaults)
    form.set_notebook_image_pull_policy(notebook, body, defaults)
    form.set_server_type(notebook, body, defaults)
    form.set_notebook_cpu(notebook, body, defaults)
    form.set_notebook_memory(notebook, body, defaults)
    form.set_notebook_storage(notebook, body, defaults)
    form.set_notebook_gpus(notebook, body, defaults)
    form.set_notebook_tolerations(notebook, body, defaults)
    form.set_notebook_affinity(notebook, body, defaults)
    form.set_notebook_configurations(notebook, body, defaults)
    form.set_notebook_shm(notebook, body, defaults)

    # Notebook volumes
    api_volumes = []
    api_volumes.extend(form.get_form_value(body, defaults, "datavols",
                                           "dataVolumes"))
    workspace = form.get_form_value(body, defaults, "workspace",
                                    "workspaceVolume", optional=True)
    if workspace:
        api_volumes.append(workspace)

    # ensure that all objects can be created
    api.create_notebook(notebook, namespace, dry_run=True)
    # Due to refactoring of this Web APP in v1.5.0 we no longer have a single variable to disable
    # creation of notebook volumes. Instead we block out this code to prevent creation of volumes
    # as AIP does not utilize notebook attached volumes.
    '''
    for api_volume in api_volumes:
        pvc = volumes.get_new_pvc(api_volume)
        if pvc is None:
            continue

        api.create_pvc(pvc, namespace, dry_run=True)

    # create the new PVCs and set the Notebook volumes and mounts
    for api_volume in api_volumes:
        pvc = volumes.get_new_pvc(api_volume)
        if pvc is not None:
            logging.info("Creating PVC: %s", pvc)
            pvc = api.create_pvc(pvc, namespace)

        v1_volume = volumes.get_pod_volume(api_volume, pvc)
        mount = volumes.get_container_mount(api_volume, v1_volume["name"])

        notebook = volumes.add_notebook_volume(notebook, v1_volume)
        notebook = volumes.add_notebook_container_mount(notebook, mount)
    '''
    log.info("Creating Notebook: %s", notebook)
    api.create_notebook(notebook, namespace)

    return api.success_response("message", "Notebook created successfully.")


@bp.route("/api/namespaces/<namespace>/allpoddefault", methods=["POST"])
@decorators.request_is_json_type
def post_zodiac_poddefault(namespace):
    """ Creates the allpoddefault for individual profiles as a workaround to prevent
        overwriting the resource when redeploying resources.
    """
    body = request.get_json()
    log.info(f'Got body: {body} for zodiac service')

    service = body["service"]
    team = body["team"]
    templates_dir = "../templates"
    with open(f"{templates_dir}/all-pod-default.yaml", "r") as f:
        all_poddefault_yaml = yaml.load(f, Loader=yaml.FullLoader)

    all_poddefault_yaml["spec"]["annotations"][
        "logging.zgtools.net/topic"] = f'log.fluentd-z1.{service}.dev'
    all_poddefault_yaml["spec"]["labels"][
        "zodiac.zillowgroup.net/team"] = team
    all_poddefault_yaml["spec"]["labels"][
        "zodiac.zillowgroup.net/service"] = service
    
    envs = all_poddefault_yaml["spec"]["env"]
    for env in envs:
        if (env["name"] == "METAFLOW_DATASTORE_SYSROOT_S3"):
            env["value"] = f"s3://serve-datalake-zillowgroup/zillow/workflow_sdk/metaflow_28d/dev/{service}"
        if (env["name"] == "METAFLOW_NOTIFY_ON_ERROR"):
            env["value"] = f"{namespace}@zillowgroup.com"

    all_poddefault_yaml["spec"]["env"] = envs

    log.info(f'Creating all-pod-default {json.dumps(all_poddefault_yaml)} for user {namespace}.')

    api.post_all_poddefault(namespace, json.dumps(all_poddefault_yaml))

    return api.success_response()