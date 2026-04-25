const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

async function getDb() {
  if (db) return db;
  
  const dbPath = path.resolve(__dirname, '../../data-pipeline/news.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  return db;
}

module.exports = { getDb };
