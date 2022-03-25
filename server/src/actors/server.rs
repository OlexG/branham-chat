use super::client::{self, Client, Id as ClientId};
use crate::data;
use actix::{Actor, Addr, Context, Handler, Message as ActixMessage};
use std::collections::{HashMap, HashSet};

pub struct Server {
	clients: HashMap<ClientId, Addr<Client>>,
	rooms: HashMap<String, HashSet<ClientId>>,
}

impl Actor for Server {
	type Context = Context<Self>;
}

impl Server {
	pub fn new() -> Self {
		Self {
			clients: HashMap::default(),
			rooms: HashMap::from([("general".to_owned(), HashSet::default())]),
		}
	}
	fn get_client_id(&mut self) -> Option<ClientId> {
		use rand::Rng as _;

		const ID_TRIES: usize = 10;
		for _ in 0..ID_TRIES {
			let id = rand::thread_rng().gen();
			if !self.clients.contains_key(&id) {
				return Some(id);
			}
		}
		None
	}
}

pub struct Connect {
	pub client: Addr<Client>,
	pub room: String,
}
#[derive(Debug)]
pub enum ConnectError {
	UnknownRoom,
	TooManyClients,
}
impl ActixMessage for Connect {
	type Result = Result<usize, ConnectError>;
}
impl Handler<Connect> for Server {
	type Result = <Connect as ActixMessage>::Result;

	fn handle(&mut self, event: Connect, _ctx: &mut Self::Context) -> Self::Result {
		let id = self.get_client_id().ok_or(ConnectError::TooManyClients)?;
		self.clients.insert(id, event.client);
		let room = self
			.rooms
			.get_mut(&event.room)
			.ok_or(ConnectError::UnknownRoom)?;
		room.insert(id);
		Ok(id)
	}
}

pub struct Disconnect {
	pub id: ClientId,
	pub room: String,
}
impl ActixMessage for Disconnect {
	type Result = ();
}
impl Handler<Disconnect> for Server {
	type Result = <Disconnect as ActixMessage>::Result;

	fn handle(&mut self, event: Disconnect, _ctx: &mut Self::Context) -> Self::Result {
		if let Some(room) = self.rooms.get_mut(&event.room) {
			room.remove(&event.id);
		}
		self.clients.remove(&event.id);
	}
}

pub struct NewMessage {
	pub message: crate::data::Message,
	pub room: String,
}

#[derive(Debug)]
pub enum NewMessageError {
	UnknownRoom,
}

impl ActixMessage for NewMessage {
	type Result = Result<(), NewMessageError>;
}
impl Handler<NewMessage> for Server {
	type Result = <NewMessage as ActixMessage>::Result;

	fn handle(&mut self, event: NewMessage, _context: &mut Self::Context) -> Self::Result {
		let room = self
			.rooms
			.get(&event.room)
			.ok_or(NewMessageError::UnknownRoom)?;
		let message = std::sync::Arc::new(data::MessageEvent::NewMessage(event.message));
		for client_id in room {
			if let Some(client) = self.clients.get_mut(client_id) {
				client.do_send(client::MessageEvent(message.clone()));
			}
		}
		Ok(())
	}
}
