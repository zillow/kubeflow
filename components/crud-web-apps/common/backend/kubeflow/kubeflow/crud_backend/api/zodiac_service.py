import json

from kubeflow.kubeflow.crud_backend import logging
from typing import Any, Dict, Set
from urllib.error import HTTPError
from urllib.request import Request, urlopen


log = logging.getLogger(__name__)
ZODIAC_GRAPHQL_URL = "https://zodiac-graphql.zillowgroup.net/"


def jsonify_graphql_query_response(graphql_query: str) -> Dict[str, Any]:
    request_data = json.dumps({"query": graphql_query}).encode("utf-8")
    request = Request(ZODIAC_GRAPHQL_URL, data=request_data)
    request.add_header("Content-Type", "application/json")

    try:
        response = urlopen(request)
    except HTTPError as e:
        raise Exception(f"Error {e.code} occurred, reason: {e.read().decode('utf-8')}")

    response_json = json.loads(response.read().decode("utf-8"))

    return response_json


def get_contributor_services(ai_platform_contributor: str) -> Set[str]:
    # Use the old style of string formatting to not over-complicate the GraphQL syntax
    # with weird escaping.
    graphql_query = """{
        user ( login : "%(ai_platform_contributor)s" ) {
  	        services (limit : 100) {
                items {
                    name
                }
            }
        }
    }""" % {
        "zodiac_service_name": ai_platform_contributor
    }

    response_data = jsonify_graphql_query_response(graphql_query)

    service_list = response_data["data"]["user"]["services"]["items"]
    services = set()

    for name in service_list:
        service = name["name"]
        services.add(service)
    
    log.info(f'Found zodiac services {services} for contributor {ai_platform_contributor}.')

    return services


def validate_ai_platform_engineer(ai_platform_contributor: str) -> bool:
    # Use the old style of string formatting to not over-complicate the GraphQL syntax
    # with weird escaping.
    graphql_query = """{
        user ( login : "%(ai_platform_contributor)s" ) {
  	        teams {
                items {
                    name    
                }
            }
        }
    }""" % {
        "zodiac_service_name": ai_platform_contributor
    }

    response_data = jsonify_graphql_query_response(graphql_query)

    team_list = response_data["data"]["user"]["teams"]["items"]
    teams = set()

    for name in team_list:
        team = name["name"]
        teams.add(team)

    return "ai-platform" in teams


def get_zodiac_services(namespace: str) -> Set[str]:
    """ For individual user namespaces, the user alias is the same as the namespace name.
        Return the set of zodiac services the user belongs to.
    """
    is_aip_engineer = validate_ai_platform_engineer(namespace)

    services = get_contributor_services(namespace)

    # remove ai-platform-* or aip-* services for non-aip engineers.
    if not is_aip_engineer:
        log.info(f'Contributor {namespace} is not an AIP engineer.')
        for service in services:
            if "ai-platform" in service or "aip-" in service:
                services.remove(service)

    # blanket remove platform services
    for service in services:
        if "kf-" in service or "metaflow-" in service:
            services.remove(service)

    return services