from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
from flask import Flask, abort, jsonify,request
import requests, math
from flask_cors import CORS
##the authenticator produces output of form 
##    { "id": "1234", "given_name": "John", "name": "John Doe", "email": "john_doe@idp.example" }
## for now we can just store that whole thing, we will use the email as the indexing entity tho because theoretically we might want to support email password logins
##
ATLAS_URI="mongodb+srv://pythhon:8x5pGda7EWdKGtV0@nomcents.5fhvz.mongodb.net/?retryWrites=true&w=majority&appName=nomcents"
DB_NAME = 'users'
COLLECTION_NAME = 'users_test'
class AtlasClient ():
   def __init__ (self, altas_uri, dbname):
       self.mongodb_client = MongoClient(altas_uri)
       self.database = self.mongodb_client[dbname]
   ## A quick way to test if we can connect to Atlas instance
   def ping (self):
       self.mongodb_client.admin.command('ping')
   def get_collection (self, collection_name):
       collection = self.database[collection_name]
       return collection
   def find (self, collection_name, filter = {}, limit=0):
       collection = self.database[collection_name]
       items = list(collection.find(filter=filter, limit=limit))
       return items
   def insWrapper(self,newDoc,collection_name):
       collection = self.database[collection_name]
       collection.insert_one(newDoc)
   def upWrapper(self,eDock,collection_name):
       collection = self.database[collection_name]
       collection.update_one({"email":eDock['email']},{"$set": eDock}) 
       
   
class datauser():
    def __init__(self,atlas_uri, dbname, collection_name):
        self.atlas_client = AtlasClient (atlas_uri, dbname)
        self.atlas_client.ping()
        print ('Connected to Atlas instance! We are good to go!')
        self.collection_name=collection_name
    def userLookup (self,userString):
       userdet=json.loads(userString)
       collection = self.atlas_client.database[self.collection_name]
       user = collection.find_one({"email":userdet['email']})
       return user
    def isUser(self,userstring):
        user = self.userLookup (userstring)
        if(not (user is None)):
            return True
        else:
            return False
    def makeUser(self,userdet):
        usstring=('{"email":"'+ userdet['email']+'"}')
        if(not data.isUser(usstring)):
            self.atlas_client.insWrapper(userdet,self.collection_name)
            return True
        else:
            return False
    def editUser(self,userdet):
        usstring=('{"email":"'+ userdet['email']+'"}')
        if(not data.isUser(usstring)):
            return False
        else:
            self.atlas_client.upWrapper(userdet,self.collection_name)
            return True;



# data = datauser (ATLAS_URI, DB_NAME,COLLECTION_NAME)
# email=input("Enter email: ")
# usstring=('{"email":"'+ email+'"}')
# if(data.isUse"emailr(usstring)):
#     user=data.userLookup(usstring)
#     print("user name is "+ user['name'])
#     usstrindg='{"email":"'+ email+'", "name":"'+user['name']+'e"}'
#     data.editUser(usstrindg)
#     user=data.userLookup(usstring)
#     print("user name is "+ user['name'])
# else:
#     print("user not found, create user now")
#     name = input("Enter name: ")
#     usstring='{"email":"'+ email+'", "name":"'+name+'"}'

#     data.makeUser(usstring)
# print(data.isUser(usstring))

app = Flask(__name__)
CORS(app) # allows cross-origin requests, which is needed for the frontend to access the backend

data = datauser (ATLAS_URI, DB_NAME,COLLECTION_NAME)

# get takes ?email= and the other two methods take json for the user as teh user variable
@app.route('/api/user', methods=['GET', 'POST', 'PUT'])
def user():
    print(request.method)
    if request.method == 'GET':
        # usstring=request.args['user']
        email=request.args['email']
        usstring=('{"email":"'+ email+'"}')

        user=data.userLookup(usstring)
        if(not (user is None)):
            user['_id'] = str(user['_id'])
            return jsonify(user)
        else:
            abort(404)
    elif request.method== 'POST':
        udat=request.get_json()
        if data.makeUser(udat):
                return jsonify({"message": "User made successfully"}), 200
 
        else:
            abort(404)
    elif request.method== 'PUT':
        udat=request.get_json()
        if data.editUser(udat):
                return jsonify({"message": "User updated successfully"}), 200
 
        else:
            abort(404)

@app.route('/api/auth/google', methods=['OPTIONS','POST'])
def verify_google_token():
    token = request.json.get('token')
    response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
    if response.status_code == 200:
        user_info = response.json()
        email = user_info['email']
        print(email)
        user = data.userLookup(json.dumps({"email": email}))
        if not user:
            return jsonify({"message":  "User does not exist"}), 404
        return jsonify(user_info), 200
    else:
        return jsonify({"message": "Invalid token"}), 400

if __name__ == '__main__':
    app.run(debug=True)
    
