from flask import Flask, jsonify, send_file, request
from flask_cors import CORS 
import json
import os
from difflib import SequenceMatcher

app = Flask(__name__)
CORS(app, origins="https://my.depauw.edu")

# Path to JSON file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

JSON_FILE = os.path.join(BASE_DIR, "rmp_crawl_data", "depauw_professors.json")
SCRIPT_FILE = os.path.join(BASE_DIR, "rmp_crawl_data", "crawl_rmp.py")


#Health check route !
@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Welcome to the DePauw RMP Flask Server"})


#sample data route + check download
@app.route('/sample_data', methods=['GET'])
def get_sample_data():
    SAMPLE_SIZE = 5
    if not check_download():
        return jsonify({"error": "Failed to download data"}), 500
    
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify({
            "exists": True,
            "count": len(data),
            "sample_data": data[:SAMPLE_SIZE]
        })
    except Exception as e:
        return jsonify({"error": f"Failed to read JSON: {str(e)}"}), 500
    


@app.route('/search/professors', methods=['POST'])
def search_professors():
    if not check_download():
        return jsonify({"error": "Failed to download data"}), 500
    
    #get list of professors from request body:
    next_year_professors = request.json.get('professors', [])
    print("Received request with professors:", len(next_year_professors))
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            next_year_professors_data = []
            for professor in next_year_professors:
                highest_fuzzy_match_score = 0
                for p in data:
                    fuzzy_match_score, threshold_pass = check_name_match(p, professor)
                    if threshold_pass and fuzzy_match_score > highest_fuzzy_match_score:
                        highest_fuzzy_match_score = fuzzy_match_score
                        prof_response_data = data_form_response(p, professor)
                        next_year_professors_data.append(prof_response_data)

            return jsonify({
                "exists": True,
                "count": len(next_year_professors_data),
                "data": next_year_professors_data
            })
    except Exception as e:
        return jsonify({"error": f"Failed to read JSON: {str(e)}"}), 500


#Helper functions
def check_download():
    if not os.path.exists(JSON_FILE):
        try:
            os.system(f"python {SCRIPT_FILE}")
            print("Successfully downloaded data")
        except Exception as e:
            return False
    return True

#Helper function to format return professor data
def data_form_response(prof_data, professor_name):
    return {
        "name": professor_name,
        "difficulty": prof_data['avgDifficulty'],
        "rating": prof_data['avgRating'],
        "num_ratings": prof_data['numRatings'],
        "id": prof_data['legacyId']
    }

def check_name_match(prof_data, prof_name):
    data_prof_name = prof_data['firstName'] + " " + prof_data['lastName']
    res = SequenceMatcher(None, data_prof_name, prof_name).ratio()
    
    last_name = prof_name.split(" ")[-1] if len(prof_name.split(" ")) > 1 else prof_name
    last_name_res = SequenceMatcher(None, prof_data['lastName'], last_name).ratio()
    
    first_name = prof_name.split(" ")[0] if len(prof_name.split(" ")) > 1 else prof_name
    first_name_res = SequenceMatcher(None, prof_data['firstName'], first_name).ratio()

    THRESHOLD_NAME = 0.67
    THRESHOLD_FIRST_NAME = 0.5
    THRESHOLD_LAST_NAME = 0.85
    condition = res >= THRESHOLD_NAME and last_name_res > THRESHOLD_LAST_NAME and first_name_res >= THRESHOLD_FIRST_NAME
    
    #check fuzzy match fix
    if condition and res < 1.0:
        print(f"Fuzzy match ratio for {data_prof_name} and {prof_name}: {res}", f"Fuzzy match ratio for {prof_data['lastName']} and {last_name}: {last_name_res}", f"Fuzzy match ratio for {prof_data['firstName']} and {first_name}: {first_name_res}")
    
    return res, (condition)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)