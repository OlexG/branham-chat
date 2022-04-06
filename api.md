# API Specification

Note: the frontend is available at the root.

## Basic Types

Members marked with `#[request]` are used for requests.

```rust
type Id = <some integral type>;

struct Message {
	id: Id,
	#[request]
	content: String,
	timestamp: u64,
	#[serde(flatten)]
	user: User,
}

struct User {
	#[serde(rename = "user_name")]
	name: String,
	#[serde(rename = "user_picture")]
	picture: String,
}

struct Room {
	#[request]
	id: Id,
	name: String,
}

#[serde(tag = "type", rename_all = "snake_case")]
enum MessageEvent {
	NewMessage(Message),
	DeleteMessage{ id: Id },
}
```

## HTTP Endpoints

### GET `/rooms/<room name>/messages`

Returns the messages in a room as an array of `Message`s.

Response type: `[Message]`

### POST `/rooms/<room name>/messages`

Sends a message to a room.

Request type: `Message` (`#[request]` fields only) Response type: `Message`

### POST `/login`

Gets a user token from an OAuth token.

Request type: `struct { token: String }` Responds with 204; token is set as a cookie.

## WebSocket Protocol

### `/rooms/<room name>/messages.ws`

Server sends a series of `MessageEvent`s. Client does not send anything.
