import requests
import json
import time
import os


#JSON output file path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_OUTPUT_FILE = os.path.join(BASE_DIR, "depauw_professors.json")
# GraphQL endpoint (assumed based on RateMyProfessors)
url = "https://www.ratemyprofessors.com/graphql"
depauw_id = "U2Nob29sLTE1MjM="

# Headers to mimic a browser request
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Content-Type": "application/json",
    # Add Authorization header if required (e.g., "Authorization": "Bearer YOUR_TOKEN")
}

# GraphQL query template (provided by user)
query = """query TeacherSearchPaginationQuery(
  $count: Int!
  $cursor: String
  $query: TeacherSearchQuery!
    ) {
    search: newSearch {
        ...TeacherSearchPagination_search_1jWD3d
    }
    }

    fragment CardFeedback_teacher on Teacher {
    wouldTakeAgainPercent
    avgDifficulty
    }

    fragment CardName_teacher on Teacher {
    firstName
    lastName
    }

    fragment CardSchool_teacher on Teacher {
    department
    school {
        name
        id
    }
    }

    fragment TeacherBookmark_teacher on Teacher {
        id
        isSaved
    }

    fragment TeacherCard_teacher on Teacher {
        id
        legacyId
        avgRating
        numRatings
        ...CardFeedback_teacher
        ...CardSchool_teacher
        ...CardName_teacher
        ...TeacherBookmark_teacher
    }

    fragment TeacherSearchPagination_search_1jWD3d on newSearch {
        teachers(query: $query, first: $count, after: $cursor) {
            didFallback
            edges {
            cursor
            node {
                ...TeacherCard_teacher
                id
                __typename
            }
            }
            pageInfo {
            hasNextPage
            endCursor
            }
            resultCount
        }
    }
"""

def fetch_professor_data(count, cursor=""):
    payload = {
        "query": query,
        "variables": {
            "count": count,
            "cursor": cursor,
            "query": {
                "text": "",
                "schoolID": depauw_id,
                "fallback": True
            }
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def main():
    all_professors = []
    cursor = ""
    has_next_page = True
    max_per_page = 100 

#Fetch all:
    while has_next_page:
        print(f"Fetching {max_per_page} professors, cursor: {cursor or 'start'}...")
        data = fetch_professor_data(count=max_per_page, cursor=cursor)
        if not data or "data" not in data:
            print("Failed to fetch page data.")
            break

        teachers = data["data"]["search"]["teachers"]
        edges = teachers["edges"]
        for edge in edges:
            node = edge["node"]
            professor = {
                "id": node["id"],
                "legacyId": node["legacyId"],
                "firstName": node["firstName"],
                "lastName": node["lastName"],
                "department": node["department"],
                "school": node["school"]["name"],
                "avgRating": node["avgRating"],
                "numRatings": node["numRatings"],
                "wouldTakeAgainPercent": node["wouldTakeAgainPercent"],
                "avgDifficulty": node["avgDifficulty"],
                "isSaved": node["isSaved"]
            }
            all_professors.append(professor)

        # Update pagination info
        page_info = teachers["pageInfo"]
        has_next_page = page_info["hasNextPage"]
        cursor = page_info["endCursor"]
        print(f"Retrieved {len(all_professors)} professors so far...")

        # Avoid rate limiting
        time.sleep(0.5)


#Save to JSON file:
    with open(JSON_OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_professors, f, indent=2)
    print(f"Saved {len(all_professors)} professors to {output_file}")

# Print summary
    print("Successfully saved all professors to depauw_professors.json")
    print(f"\nTotal number of professors saved: {len(all_professors)}")

if __name__ == "__main__":
    main()