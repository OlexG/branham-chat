const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, './data/messages.db');

class DBManager {
  async initialize() {
    const res = new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    await res;
    return new Promise((resolve, reject) => {
      this.db.run(
        `CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          msg TEXT,
          timestamp TEXT,
          room TEXT
        )`
      , err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      });
    });
  }
  write_message(msg, timestamp, room) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO messages (msg, timestamp, room) VALUES (?, ?, ?)`,
        [msg, timestamp, room],
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
  get_messages() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM messages`, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = DBManager;