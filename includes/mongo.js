const MongoClient = require('mongodb').MongoClient;
const MONGO_URL = "mongodb://localhost:27017/";


module.exports = function (app) {
    MongoClient.connect(MONGO_URL)
        .then((client) => {
            app.db = client.db('koa_example');
            app.users = app.db.collection("users");
            app.notes = app.db.collection("notes");
            console.log("Database connection established")
        })
        .catch((err) => console.error(err))

};
