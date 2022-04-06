use serde::{Deserialize, Serialize};

/// Should be treated as an arbitrary integral type
pub type Id = i64;

#[derive(Deserialize, Debug)]
pub struct MessageRequest {
	pub content: String,
}

#[derive(Serialize, Debug)]
pub struct Message {
	pub id: Id,
	pub content: String,
	pub timestamp: u64,
	#[serde(flatten)]
	pub user: User,
}

#[derive(Serialize, Debug)]
pub struct User {
	#[serde(rename = "user_name")]
	pub name: String,
	#[serde(rename = "user_picture")]
	pub picture: String,
}

#[derive(Serialize, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MessageEvent {
	NewMessage(Message),
	DeleteMessage { id: Id },
}
