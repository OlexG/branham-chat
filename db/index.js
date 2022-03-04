const sqlite3 = require('sqlite3').verbose();

class DBManager {
  async initialize() {
    const res = new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./data/messages.db', err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    await res;
    this.db.run(
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        msg TEXT,
        date TEXT,
      )`
    );
  }
  writeMessage(msg, date) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO messages (msg, timestamp) VALUES (?, ?)`,
        [msg, date],
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
  getMessages() {
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