import "dotenv/config";
import menuData from "../assets/data.json" with { type: "json" };
import { VectorDb } from "./vector-db.js";
import { log } from "node:console";

const COLLECTION_NAME = "items";

const main = async () => {
  const vectorDb = VectorDb.getInstance();
  // await vectorDb.createCollection(COLLECTION_NAME);
  log(`Completed successfullly!!!`);
};

main();
