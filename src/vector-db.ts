import { QdrantClient } from "@qdrant/js-client-rest";
import { log } from "node:console";
import type { MenuType } from "./types/MenuType.js";

export class VectorDb {
  private static instance: VectorDb;

  private readonly QDRANT_URL: string;
  private readonly QDRANT_API_KEY: string;
  private readonly _client: QdrantClient;

  private constructor() {
    this.QDRANT_URL = process.env.QDRANT_URL as string;
    this.QDRANT_API_KEY = process.env.QDRANT_API_KEY as string;
    try {
      this._client = new QdrantClient({
        url: this.QDRANT_URL,
        apiKey: this.QDRANT_API_KEY,
      });
    } catch (err: unknown) {
      log(err);
    }
  }

  public static getInstance(): VectorDb {
    if (!VectorDb.instance) {
      VectorDb.instance = new VectorDb();
    }
    return VectorDb.instance;
  }

  async createCollection(collectionName: string) {
    try {
      await this._client.createCollection(collectionName, {
        vectors: { size: 384, distance: "Cosine" },
      });
      log(`Collection "${collectionName}" created successfully.`);
    } catch (err: unknown) {
      log(`Collection "${collectionName}" might already exist or failed:`, err);
    }
  }

  async searchCollection(
    collectionName: string,
    queryVector: number[],
    limit = 5,
  ) {
    try {
      const results = await this._client.query(collectionName, {
        vector: queryVector,
        limit,
      });
      return results;
    } catch (err: unknown) {
      log("Error searching collection:", err);
      return [];
    }
  }

  async ingestToCollection(collectionName: string, items: MenuType) {
    const points: any[] = [];
    let idx = 0;

    const menuItems = items;
    for (const menuItem of menuItems) {
      points.push({
        id: idx,
        vector: {
          text: `${menuItem[0]} ${menuItem[1]}`,
          model: "sentence-transformers/all-MiniLM-L6-v2",
        },
        payload: {
          item_name: menuItem[0],
          description: menuItem[1],
          price: menuItem[2],
          category: menuItem[3],
        },
      });
      idx++;
    }
    // upsert points to collection
    try {
      await this._client.upsert(collectionName, { points });
    } catch (err: unknown) {
      log(err);
    }
  }
}
