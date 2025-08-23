import mongoose from "mongoose";
import { dbUrl } from "./config.js";

const options = {
  // useNewUrlParser: true,
  // autoIndex:          false,            // Don't build indexes
  connectTimeoutMS: 30000, // Increased from 5000 to 30000
  socketTimeoutMS: 45000,  // Add socket timeout
  serverSelectionTimeoutMS: 30000, // Add server selection timeout
  // family: 4,
  // useUnifiedTopology: true,
};

// Use the default mongoose instance instead of creating a new one
export const mongoDB = mongoose;

mongoDB.connection.on("reconnected", () => {
  console.info("MongoDB reconnected!");
});
mongoDB.connection.on("disconnected", () => {
  console.info("MongoDB disconnected!");
  mongoDBConnection();
});

mongoDB.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

export const mongoDBConnection = function () {
  try {
    console.info("Attempting to connect to MongoDB...");
    mongoDB
      .connect(dbUrl, options)
      .then(async (connection) => {
        console.info("mongoDB.onSucces");
        console.info("Connected to MongoDB successfully");
      })
      .catch((err) => {
        console.error("MongoDB connection failed:", err);
        console.info("mongoDB.onError");
        // Retry connection after 5 seconds
        setTimeout(() => {
          console.info("Retrying MongoDB connection...");
          mongoDBConnection();
        }, 5000);
      });
  } catch (err) {
    console.error("Error in mongoDBConnection:", err);
  }
};

// create admin user of no user exist
mongoDB.connection.once("open", async () => {
  console.info("MongoDB connection opened successfully");
});

// if (getConfig('mongoDB.debug')){
//     mongoDB.set('debug',function(collectionName,method,query,doc){

//         const txt = `Mongoose: ${collectionName} ${method} (
// ${JSON.stringify(query,null,4)}
// ${JSON.stringify(doc,null,2)}
// )`
//         console.debug(txt)
//     });
// }
