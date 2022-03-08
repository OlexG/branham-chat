import sqlite from "better-sqlite3";

export default class DBManager {
	static #db_path = new URL("../messages.db", import.meta.url).pathname;

	static valid_name(name) {
		return /[a-z][a-z0-9_]*/.test(name);
	}

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
		this.db.prepare(`INSERT OR IGNORE INTO rooms (name) VALUES ('general')`).run();
	}

	get_rooms() {
		return this.db.prepare(`SELECT * FROM rooms`).all();
	}
	room_id(name, create = false) {
		if (!this.constructor.valid_name(name)) {
			throw new Error(`That room name ("${name}") is not valid`);
		}
		if (create) {
			this.db.prepare(`INSERT OR IGNORE INTO rooms (name) VALUES (?)`).run(name);
		}
		const ret = this.db.prepare(`SELECT id FROM rooms WHERE name = ?`).get(name)?.id;
		if (create || ret) {
			return ret;
		} else {
			throw new Error("The room does not exist and was not requested to be created");
		}
	}

	push_message(room_id, msg, timestamp) {
		if (typeof room_id === "string") {
			room_id = this.room_id(room_id, false);
		}
		if (timestamp instanceof Date) {
			timestamp = timestamp.valueOf();
		}

		const inserted_id = this.db.prepare(`INSERT INTO messages (msg, timestamp, room) VALUES (?, ?, ?)`).run(msg, timestamp, room_id).lastInsertRowid;
		return {
			msg,
			timestamp,
			id: inserted_id,
		};
	}
	get_messages(room_id) {
		if (typeof room_id === "string") {
			room_id = this.room_id(room_id, false);
		}

		return this.db
			.prepare(`SELECT msg, timestamp FROM messages WHERE room = ?`)
			.all(room_id)
			.map((row) => ({ timestamp: new Date(row.timestamp), ...row }));
	}
}
