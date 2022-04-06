use serde::{Deserialize, Serialize};

/// Should be treated as an arbitrary integral type
pub type Id = i64;

#[derive(Deserialize, Debug)]
pub struct MessageRequest {
	pub content: String,
}

/// Weak new-type protection for IDs
macro_rules! typed_id {
	($name:ident, $for:ident) => {
		#[repr(transparent)]
		#[derive(Clone, Copy, Debug)]
		pub struct $name(pub Id);
		impl $for {
			fn id(&self) -> $name {
				$name(self.id)
			}
		}
		impl std::ops::Deref for $name {
			type Target = Id;
			fn deref(&self) -> &Id {
				&self.0
			}
		}
		impl rusqlite::ToSql for $name {
			fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
				self.0.to_sql()
			}
		}
	};
}

#[derive(Serialize, Debug)]
pub struct Message {
	// this (and likewise for `User`, `Room`, etc) are intentionally `Id` rather than `MessageId`, since the `id()` method allows getting the typed ID
	pub id: Id,
	pub content: String,
	pub timestamp: Timestamp,
	#[serde(flatten)]
	pub user: User,
}
typed_id!(MessageId, Message);

#[derive(Serialize, Debug)]
pub struct User {
	#[serde(rename = "user_id")]
	pub id: Id,
	#[serde(rename = "user_name")]
	pub name: String,
	#[serde(rename = "user_picture")]
	pub picture: String,
	#[serde(rename = "user_email")]
	pub email: String,
}
typed_id!(UserId, User);

#[derive(Serialize, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MessageEvent {
	NewMessage(Message),
	DeleteMessage { id: Id },
}

pub struct Room {
	pub id: Id,
	pub name: String,
}
typed_id!(RoomId, Room);
