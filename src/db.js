import sqlite from "better-sqlite3";

export default class DBManager {
	static #db_path = new URL("../messages.db", import.meta.url).pathname;

	constructor() {
		this.db = sqlite(this.constructor.#db_path, {});
		this.db.pragma("foreign_keys = true");
		this.db
			.prepare(
				`CREATE TABLE IF NOT EXISTS rooms (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT UNIQUE
				)`
			)
			.run();
		this.db
			.prepare(
				`CREATE TABLE IF NOT EXISTS messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					msg TEXT,
					timestamp INTEGER,
					room INTEGER,
					FOREIGN KEY(room) REFERENCES rooms(id) ON DELETE CASCADE
				)`
			)
			.run();
		this.add_room("default");
	}

	get_rooms() {
		return this.db.prepare(`SELECT * FROM rooms`).all();
	}
	room_name(id) {
		return this.db.prepare(`SELECT name FROM rooms WHERE id = ?`).get(id)?.name;
	}
	room_id(name) {
		return this.db.prepare(`SELECT id FROM rooms WHERE name = ?`).get(name)?.name;
	}
	add_room(name) {
		try {
			this.db.prepare(`INSERT INTO rooms (name) VALUES (?)`).run(name);
			return true;
		} catch (e) {
			if (e instanceof sqlite.SqliteError && e.code.startsWith("SQLITE_CONSTRAINT")) {
				return false;
			} else {
				throw e;
			}
		}
	}

	push_message(room_id, msg, timestamp) {
		this.db.prepare(`INSERT INTO messages (msg, timestamp, room) VALUES (?, ?, ?)`).run(msg, timestamp.valueOf(), room_id);
	}
	get_messages(room_id) {
		return this.db
			.prepare(`SELECT msg, timestamp FROM messages WHERE room = ?`)
			.all(room_id)
			.map((row) => ({ timestamp: new Date(row.timestamp), ...row }));
	}
}
