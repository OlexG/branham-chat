const path = require("path");

class DBManager {
	static #db_path = path.resolve(__dirname, "../messages.db");

	constructor() {
		this.db = require("better-sqlite3")(this.constructor.#db_path, {});
		this.db
			.prepare(
				`CREATE TABLE IF NOT EXISTS messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					msg TEXT,
					timestamp TEXT,
					room TEXT
				)`
			)
			.run();
	}

	push(msg, timestamp, room) {
		this.db.prepare(`INSERT INTO messages (msg, timestamp, room) VALUES (?, ?, ?)`).run(msg, timestamp.toISOString(), room);
	}
	get() {
		return this.db.prepare(`SELECT * FROM messages`).all();
	}
}

module.exports = DBManager;
