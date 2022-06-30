from . import v1_core, utils
from kubernetes.client.exceptions import ApiException
from typing import Dict, Any

def list_contributor_zodiac_configmap(namespace: str) -> Dict[str, Any]:
    metadata_name = f'metadata.name=contributor-zodiac-configmap'
    try:
        response = v1_core.list_namespaced_config_map(namespace, field_selector=metadata_name)
    except ApiException as e:
        print (f'Exception when calling CoreV1Api->list_namespaced_config_map: {e}\n')
        return {"key": "error"}

    return utils.serialize(response)