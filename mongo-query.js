const { MongoClient } = require('mongodb');

// Helper function to establish connection
async function connectToMongoDB(uri = 'mongodb://localhost:27017/white-knight-portal') {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log(`Connected to MongoDB: ${uri}`);
    const db = client.db();
    console.log(`Database: ${db.databaseName}`);
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// List all collections
async function listCollections() {
  const { client, db } = await connectToMongoDB();
  try {
    const collections = await db.listCollections().toArray();
    console.log('\nDatabase collections:');
    console.log(collections.map(c => c.name).join(', '));
  } catch (error) {
    console.error('Error listing collections:', error);
  } finally {
    await client.close();
  }
}

// Count documents in a collection
async function countDocuments(collection, filter = {}) {
  const { client, db } = await connectToMongoDB();
  try {
    const count = await db.collection(collection).countDocuments(filter);
    console.log(`\nCount in collection "${collection}": ${count}`);
    if (Object.keys(filter).length > 0) {
      console.log(`(with filter: ${JSON.stringify(filter)})`);
    }
  } catch (error) {
    console.error(`Error counting documents in ${collection}:`, error);
  } finally {
    await client.close();
  }
}

// Query documents from a collection
async function findDocuments(collection, filter = {}, projection = {}, limit = 5) {
  const { client, db } = await connectToMongoDB();
  try {
    const results = await db.collection(collection)
      .find(filter, { projection })
      .limit(limit)
      .toArray();
    
    console.log(`\nDocuments from "${collection}" (showing ${results.length} of ${await db.collection(collection).countDocuments(filter)}):`)
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(`Error finding documents in ${collection}:`, error);
  } finally {
    await client.close();
  }
}

// Process command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case 'list':
      await listCollections();
      break;
    
    case 'count':
      const countCollection = args[1];
      let countFilter = {};
      
      if (args[2]) {
        try {
          countFilter = JSON.parse(args[2]);
        } catch (e) {
          console.error('Invalid filter JSON format');
          process.exit(1);
        }
      }
      
      if (!countCollection) {
        console.error('Usage: node mongo-query.js count <collection> [filterJSON]');
        process.exit(1);
      }
      
      await countDocuments(countCollection, countFilter);
      break;
    
    case 'find':
      const findCollection = args[1];
      let findFilter = {}, findProjection = {}, findLimit = 5;
      
      if (args[2]) {
        try {
          findFilter = JSON.parse(args[2]);
        } catch (e) {
          console.error('Invalid filter JSON format');
          process.exit(1);
        }
      }
      
      if (args[3]) {
        try {
          findProjection = JSON.parse(args[3]);
        } catch (e) {
          console.error('Invalid projection JSON format');
          process.exit(1);
        }
      }
      
      if (args[4]) {
        findLimit = parseInt(args[4], 10) || 5;
      }
      
      if (!findCollection) {
        console.error('Usage: node mongo-query.js find <collection> [filterJSON] [projectionJSON] [limit]');
        process.exit(1);
      }
      
      await findDocuments(findCollection, findFilter, findProjection, findLimit);
      break;
    
    default:
      console.log(`
MongoDB Query Utility for White Knight Portal

Usage:
  node mongo-query.js list                         # List all collections
  node mongo-query.js count <collection> [filter]  # Count documents in collection
  node mongo-query.js find <collection> [filter] [projection] [limit]  # Find documents

Examples:
  node mongo-query.js list
  node mongo-query.js count users
  node mongo-query.js count users '{"role":"admin"}'
  node mongo-query.js find users
  node mongo-query.js find users '{"active":true}' '{"username":1,"email":1}' 10
      `);
  }
}

main()
  .catch(console.error);
