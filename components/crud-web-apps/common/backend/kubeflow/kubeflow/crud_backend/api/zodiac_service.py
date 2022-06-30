import requests
import os
import json

from kubeflow.kubeflow.crud_backend import api, logging
from typing import Any, Dict, Set
from requests import HTTPError


log = logging.getLogger(__name__)
ZODIAC_GRAPHQL_URL = "https://zodiac-graphql.prod.kong.zg-int.net"
GRAPHQL_KONG_APIKEY = os.environ.get("ZODIAC_GRAPHQL_KONG_APIKEY", None)


def jsonify_graphql_query_response(graphql_query: str) -> Dict[str, Any]:
    request_data = json.dumps({"query": graphql_query}).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "Origin": ZODIAC_GRAPHQL_URL,
        "apikey": GRAPHQL_KONG_APIKEY
    }
    log.info(f'Calling zodiac graphql with url {ZODIAC_GRAPHQL_URL}')
    try:
        response = requests.post(ZODIAC_GRAPHQL_URL, data=request_data, headers=headers)
    except HTTPError as e:
        log.error(f"Error when calling zodiac graphql {e.read().decode('utf-8')}")
        raise Exception(f"Error {e.code} occurred, reason: {e.read().decode('utf-8')}")

    return response.json()


def get_contributor_zodiac_metadata(ai_platform_contributor: str) -> Set[str]:
    # Use the old style of string formatting to not over-complicate the GraphQL syntax
    # with weird escaping.
    graphql_query = """{
        user ( login : "%(ai_platform_contributor)s" ) {
            services (limit : 100) {
                items {
                    name
                    teamName
                }
            }
        }
    }""" % {
        "ai_platform_contributor": ai_platform_contributor
    }

    response_data = jsonify_graphql_query_response(graphql_query)

    service_list = response_data["data"]["user"]["services"]["items"]
    metadata = set()

    for service_team in service_list:
        zodiac_tuple = service_team["name"] + ":" + service_team["teamName"]
        metadata.add(zodiac_tuple)
    
    log.info(f'Found zodiac services for contributor {ai_platform_contributor}.')

    return metadata

        #for item in json.loads(zodiac_metadata)['items']:
        #    print (item)
def _get_ai_platform_engineers() -> Set[str]:
    # TODO: AIP-6338 Remove when the cluster is able to reach zodiac Graphql
    # Use the old style of string formatting to not over-complicate the GraphQL syntax
    # with weird escaping.
    graphql_query = """{
        team (name : "ai-platform") {
            members {
                items {
                    login
                }
             }
        }
    }"""

    response_data = jsonify_graphql_query_response(graphql_query)

    return {contributor['login'] for contributor in response_data["data"]["team"]["members"]["items"]}


def get_zodiac_services(namespace: str) -> Set[str]:
    """ For individual user namespaces, the user alias is the same as the namespace name.
        Return the set of zodiac services the user belongs to.
    """
    log.info(f'Validating if user {namespace} is an aip engineer')
    is_aip_engineer = namespace in _get_ai_platform_engineers()

    zodiac_metadata = get_contributor_zodiac_metadata(namespace)
    _zodiac_metadata = zodiac_metadata.copy()

    # remove ai-platform-* team metadata for non-aip engineers.
    if not is_aip_engineer:
        for service_team in zodiac_metadata:
            if "ai-platform" in service_team:
                _zodiac_metadata.remove(service_team)

    return _zodiac_metadata


# TODO: AIP-6338. Remove this method and subsequent configmap api calls
# and revert back to other zodiac logic in this file once we are able to
# access zodiac graphql from the aianalytics clusters.
def get_contributor_zodiac_configmap(namespace: str) -> Set[str]:
    """ Returns the contributor zodiac service and team data as a string
        in the format 'service:team'.
    """
    log.info(f'Gathering zodiac metadata for {namespace} from contributor configmap.')
    service_list = json.loads(api.list_contributor_zodiac_configmap(namespace)["items"][0]["data"]["zodiac-data.json"])
    log.info(service_list)
    log.info(f'Retrieved configmap from namespace {namespace}')
    metadata = set()
    # account for possible upstream error retrieving the configmap
    if (service_list.get("key") == "error"):
        return metadata

    for service_team in service_list["items"]:
        zodiac_tuple = service_team["name"] + ":" + service_team["teamName"]
        metadata.add(zodiac_tuple)

    return metadata