from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
import os
 
app = Flask(__name__)
 
MONGODB_URI = os.environ.get('MONGODB_URI')
# MONGODB_HOST = 'localhost'
# MONGODB_PORT = 27017
DBS_NAME = os.environ.get('MONGO_DB_NAME','NCT2016')
COLLECTION_NAME = os.environ.get('MONGO_COLLECTION_NAME','data')
 
 
@app.route("/")
def index():
    """
    A Flask view to serve the main dashboard page.
    """
    return render_template("index.html")
 
 
@app.route("/NCT2016/data")
def donor_projects():
    """
    A Flask view to serve the project data from
    MongoDB in JSON format.
    """
 
    # A constant that defines the record fields that we wish to retrieve.
    FIELDS = {
        '_id': False, 'VehicleMake': True, 'YearOfBirth': True,
        'PASS': True, 'PASS %': True, 'FAIL %':True, 'Total': True, 'VehicleModel': True, 'FAIL': True, 'Emmissions': True
    }
 
    # Open a connection to MongoDB using a with statement such that the
    # connection will be closed as soon as we exit the with statement
    with MongoClient(MONGODB_URI) as conn:
        # Define which collection we wish to access
        collection = conn[DBS_NAME][COLLECTION_NAME]
        # Retrieve a result set only with the fields defined in FIELDS
        # and limit the the results to 55000
        projects = collection.find(projection=FIELDS, limit=55000)
        # Convert projects to a list in a JSON object and return the JSON data
        return json.dumps(list(projects))
 
 
if __name__ == "__main__":
    app.run(debug=True)