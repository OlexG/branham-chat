import TokenGenerator from "uuid-token-generator";
import path from "path";
import sqlite from "better-sqlite3";

const tokgen = new TokenGenerator();

export default class DBManager {
	static #db_path = path.resolve(process.env.DB_PATH ?? "messages.db");

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
				`CREATE TABLE IF NOT EXISTS users (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name TEXT,
					email TEXT UNIQUE,
					picture TEXT,
					token TEXT UNIQUE
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
					user INTEGER,
					FOREIGN KEY(room) REFERENCES rooms(id) ON DELETE CASCADE
					FOREIGN KEY(user) REFERENCES users(id)
				)`
			)
			.run();
		this.db
			.prepare(`INSERT OR IGNORE INTO rooms (name) VALUES ('general')`)
			.run();
	}

	get_rooms() {
		return this.db.prepare(`SELECT * FROM rooms`).all();
	}
	room_id(name, create = false) {
		if (!this.constructor.valid_name(name)) {
			throw new Error(`That room name ("${name}") is not valid`);
		}
		if (create) {
			this.db
				.prepare(`INSERT OR IGNORE INTO rooms (name) VALUES (?)`)
				.run(name);
		}
		const ret = this.db
			.prepare(`SELECT id FROM rooms WHERE name = ?`)
			.get(name)?.id;
		if (create || ret) {
			return ret;
		} else {
			throw new Error(
				"The room does not exist and was not requested to be created"
			);
		}
	}

	push_message(room_id, msg, timestamp, user_id) {
		if (typeof room_id === "string") {
			room_id = this.room_id(room_id, false);
		}
		if (timestamp instanceof Date) {
			timestamp = timestamp.valueOf();
		}

		const inserted_id = this.db
			.prepare(
				`INSERT INTO messages (msg, timestamp, room, user) VALUES (?, ?, ?, ?)`
			)
			.run(msg, timestamp, room_id, user_id).lastInsertRowid;
		return {
			id: inserted_id,
			msg,
			timestamp,
			user: user_id,
		};
	}
	get_messages(room_id) {
		if (typeof room_id === "string") {
			room_id = this.room_id(room_id, false);
		}

		return this.db
			.prepare(`SELECT msg, timestamp, user FROM messages WHERE room = ?`)
			.all(room_id)
			.map((row) => ({ timestamp: new Date(row.timestamp), ...row }));
	}

	add_user(email, name, picture) {
		const uuid = tokgen.generate();
		// check if user exists by email
		const user = this.db
			.prepare(`SELECT * FROM users WHERE email = ?`)
			.get(email);
		if (user) {
			// just update the token
			this.db
				.prepare(`UPDATE users SET token = ? WHERE id = ?`)
				.run(uuid, user.id);
		} else {
			this.db
				.prepare(
					`INSERT OR IGNORE INTO users (name, email, picture, token) VALUES (?, ?, ?, ?)`
				)
				.run(name, email, picture, uuid);
		}
		return uuid;
	}
	verify_user(email, uuid) {
		const user = this.db
			.prepare(`SELECT * FROM users WHERE email = ? AND token = ?`)
			.get(email, uuid);
		if (user) {
			return true;
		} else {
			return false;
		}
	}
	get_user(email) {
		const user = this.db
			.prepare(`SELECT * FROM users WHERE email = ?`)
			.get(email);
		if (user) {
			return user;
		} else {
			return null;
		}
	}
}
