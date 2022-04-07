use crate::data;
use anyhow::{Context as _, Result};
use rusqlite::{Connection, OptionalExtension as _};
use std::path::Path;

pub struct Database {
	conn: Connection,
}

impl Database {
	#[inline]
	fn execute_none(&self, stmt: &str) -> Result<usize> {
		self.execute(stmt, [])
	}
	#[inline]
	fn execute(&self, stmt: &str, args: impl rusqlite::Params) -> Result<usize> {
		self
			.conn
			.prepare_cached(stmt)
			.context("Preparing statement")?
			.execute(args)
			.context("Executing statement")
	}
	#[inline]
	fn insert(&self, stmt: &str, args: impl rusqlite::Params) -> Result<data::Id> {
		self
			.conn
			.prepare_cached(stmt)
			.context("Preparing statement")?
			.insert(args)
			.context("Executing statement")
	}
	#[inline]
	fn prepare(&self, stmt: &str) -> Result<rusqlite::CachedStatement> {
		self
			.conn
			.prepare_cached(stmt)
			.context("Preparing statement")
	}

	pub fn open(path: &Path) -> Result<Self> {
		let conn = Connection::open(path).context("Opening database file")?;
		conn
			.pragma_update(None, "foreign_keys", true)
			.context("Enabling foreign keys")?;

		let ret = Self { conn };
		ret
			.execute_none(
				r#"
CREATE TABLE IF NOT EXISTS rooms (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE
) STRICT
			"#,
			)
			.context("Ensuring existence of rooms table")?;
		ret
			.execute_none(
				r#"
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	picture NOT NULL TEXT,
	token INTEGER NOT NULL UNIQUE
) STRICT
			"#,
			)
			.context("Ensuring existence of users table")?;
		ret
			.execute_none(
				r#"
CREATE TABLE IF NOT EXISTS messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	content TEXT NOT NULL,
	timestamp INTEGER NOT NULL,
	room INTEGER NOT NULL,
	user INTEGER NULL,
	FOREIGN KEY (room) REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE RESTRICT,
	FOREIGN KEY (user) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT
) STRICT
				"#,
			)
			.context("Ensuring existence of messages table")?;
		ret
			.execute_none(r#"INSERT OR IGNORE INTO rooms (name) VALUES ('general')"#)
			.context("Ensuring existence of 'general' room")?;

		Ok(ret)
	}

	pub fn get_rooms(&self) -> Result<Vec<data::Room>> {
		self
			.prepare("SELECT * FROM rooms")?
			.query_map([], |row| {
				Ok(data::Room {
					id: row.get("id")?,
					name: row.get("name")?,
				})
			})?
			.collect::<Result<_, rusqlite::Error>>()
			.map_err(anyhow::Error::from)
	}
	pub fn get_room_by_name(&self, name: &str) -> Result<Option<data::Room>> {
		self
			.prepare("SELECT id FROM rooms WHERE name = ?")?
			.query_row([name], |row| {
				Ok(data::Room {
					id: row.get("id")?,
					name: name.to_owned(),
				})
			})
			.optional()
			.map_err(anyhow::Error::from)
	}

	pub fn push_message(
		&self,
		room_id: data::RoomId,
		user_id: data::UserId,
		content: &str,
		timestamp: &data::Timestamp,
	) -> Result<data::MessageId> {
		self
			.insert(
				"INSERT INTO messages (content, timestamp, room, user) VALUES (?, ?, ?, ?)",
				[
					&content as &dyn rusqlite::ToSql,
					&timestamp,
					&room_id,
					&user_id,
				],
			)
			.map(data::MessageId)
	}
	pub fn get_messages(&self, room_id: data::RoomId) -> Result<Vec<data::Message>> {
		self
			.prepare("SELECT content, timestamp, user FROM messages WHERE room = ?")?
			.query_and_then([room_id], |row| {
				Ok(data::Message {
					id: row.get("id")?,
					content: row.get("content")?,
					timestamp: row.get("timestamp")?,
					user: self
						.get_user_by_id(data::UserId(row.get("user")?))?
						.unwrap(), // foreign key
				})
			})?
			.collect()
	}

	pub fn refresh_user(
		&self,
		crate::oauth::UserInfo {
			name,
			email,
			profile_picture: picture,
			..
		}: &crate::oauth::UserInfo,
	) -> Result<data::Token> {
		use rand::Rng as _;
		let new_token = data::Token(rand::thread_rng().gen());
		// update user's token when user already exists with `ON CONFLICT (email) DO UPDATE`
		self.insert("INSERT INTO users (name, email, picture, token) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET token=excluded.token", [
			&name as &dyn rusqlite::ToSql,
			&email,
			&picture,
			&new_token.0,
		]).map(|token| token.into())
	}
	pub fn verify_user_token(&self, email: &str, token: &str) -> Result<bool> {
		self
			.prepare("SELECT count(id) FROM users WHERE email = ? AND token = ?")?
			.exists([email, token])
			.map_err(anyhow::Error::from)
	}
	pub fn get_user_by_id(&self, id: data::UserId) -> Result<Option<data::User>> {
		self
			.prepare("SELECT * FROM users WHERE id = ?")?
			.query_row([id], |row| {
				Ok(data::User {
					id: row.get("id")?,
					name: row.get("name")?,
					picture: row.get("picture")?,
					email: row.get("email")?,
				})
			})
			.optional()
			.map_err(anyhow::Error::from)
	}
	pub fn get_user_by_email(&self, email: &str) -> Result<Option<data::User>> {
		self
			.prepare("SELECT * FROM users WHERE email = ?")?
			.query_row([email], |row| {
				Ok(data::User {
					id: row.get("id")?,
					name: row.get("name")?,
					picture: row.get("picture")?,
					email: row.get("email")?,
				})
			})
			.optional()
			.map_err(anyhow::Error::from)
	}
}
