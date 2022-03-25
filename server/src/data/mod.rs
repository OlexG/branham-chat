use serde::{Deserialize, Serialize};

pub type Id = u64;

#[derive(Deserialize)]
pub struct MessageRequest {
	pub content: String,
}

#[derive(Serialize)]
pub struct Message {
	pub id: Id,
	pub content: String,
	pub timestamp: u64,
	#[serde(flatten)]
	pub user: User,
}

#[derive(Serialize)]
pub struct User {
	#[serde(rename = "user_name")]
	pub name: String,
	#[serde(rename = "user_picture")]
	pub picture: String,
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MessageEvent {
	NewMessage(Message),
	DeleteMessage { id: Id },
}
