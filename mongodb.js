import { Mongoose } from "mongoose";
import { dbUrl } from "./config.js";

const options = {
  useNewUrlParser: true,
  // autoIndex:          false,            // Don't build indexes
  connectTimeoutMS: 5000,
  family: 4,
  useUnifiedTopology: true,
};

export const mongoDB = new Mongoose();

mongoDB.connection.on("reconnected", () => {
  console.info("MongoDB reconnected!");
});
mongoDB.connection.on("disconnected", () => {
  console.info("MongoDB disconnected!");
  mongoDBConnection();
});

export const mongoDBConnection = function () {
  try {
    mongoDB
      .connect(dbUrl, options)
      .then(async (connection) => {
        console.info("mongoDB.onSucces");
      })
      .catch((err) => {
        errorLog(err);
        console.info("mongoDB.onError");
      });
  } catch (err) {
    console.error(err);
  }
};

// create admin user of no user exist
mongoDB.connection.once("open", async () => {});

// if (getConfig('mongoDB.debug')){
//     mongoDB.set('debug',function(collectionName,method,query,doc){

//         const txt = `Mongoose: ${collectionName} ${method} (
// ${JSON.stringify(query,null,4)}
// ${JSON.stringify(doc,null,2)}
// )`
//         console.debug(txt)
//     });
// }


