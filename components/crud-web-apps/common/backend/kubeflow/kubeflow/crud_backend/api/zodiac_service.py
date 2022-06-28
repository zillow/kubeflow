import requests
import os

from kubeflow.kubeflow.crud_backend import logging
from typing import Any, Dict, Set
from requests import HTTPError


log = logging.getLogger(__name__)
ZODIAC_GRAPHQL_URL = "https://zodiac-graphql.prod.kong.zg-int.net"
GRAPHQL_KONG_APIKEY = os.environ.get("ZODIAC_GRAPHQL_KONG_APIKEY", None)


def jsonify_graphql_query_response(graphql_query: str) -> Dict[str, Any]:
    header = {"Content-Type": "application/json", "apikey": GRAPHQL_KONG_APIKEY}

    try:
        response = requests.post(ZODIAC_GRAPHQL_URL, json={"query": graphql_query}, headers=header)
    except HTTPError as e:
        raise Exception(f"Error {e.code} occurred, reason: {e.read().decode('utf-8')}")

    return response.json()


def get_contributor_services(ai_platform_contributor: str) -> Set[str]:
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
    services = set()

    for names in service_list:
        service = names["name"]
        team = names["teamName"]
        service_team = service + ":" + team
        services.add(service_team)
    
    log.info(f'Found zodiac services for contributor {ai_platform_contributor}.')

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
        "ai_platform_contributor": ai_platform_contributor
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
    _set = services.copy()

    # remove ai-platform-* or aip-* services for non-aip engineers.
    if not is_aip_engineer:
        log.info(f'Contributor {namespace} is not an AIP engineer.')
        for service in services:
            if "ai-platform" in service or "aip-" in service:
                _set.remove(service)

    return _set