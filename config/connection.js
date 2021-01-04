const mongoClient = require('mongodb').MongoClient;
const atLast = 'mongodb+srv://shahabazkc:shahabazshabu@cluster0.q2cbw.mongodb.net/?retryWrites=true&w=majority'
let db = null;


module.exports.connect = function (done) {
    const dbname = 'mymart'
  //  const url = 'mongodb://localhost:27017' + dbname
  //  mongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
  //      if (err) {
            mongoClient.connect(atLast, { useUnifiedTopology: true }, (err, data) => {
                if (err) return done(err)
                db = data.db(dbname)
                done()
            })
   //     }
   //     db = data.db(dbname)
   //     done()
   // })

}

module.exports.get = function () {
    return db
}