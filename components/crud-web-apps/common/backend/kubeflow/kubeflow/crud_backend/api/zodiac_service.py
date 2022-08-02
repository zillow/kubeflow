import requests

from kubeflow.kubeflow.crud_backend import api, logging
from typing import Any, Dict, Set


log = logging.getLogger(__name__)
ZODIAC_GRAPHQL_URL = "https://zodiac-graphql.zgtools.net/"


def jsonify_graphql_query_response(graphql_query: str) -> Dict[str, Any]:
    header = {"Content-Type": "application/json"}  
    log.info(f'Calling zodiac graphql with url {ZODIAC_GRAPHQL_URL}')
    try:
        response = requests.post(ZODIAC_GRAPHQL_URL, json={"query": graphql_query}, headers=header)
    except requests.HTTPError as e:
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


def _get_ai_platform_engineers() -> Set[str]:
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


def get_zodiac_metadata(namespace: str) -> Set[str]:
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