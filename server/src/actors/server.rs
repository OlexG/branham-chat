use super::client::{self, Client, Id as ClientId};
use crate::data;
use actix::{Actor, Addr, Context, Handler, Message as ActixMessage};
use actix_web::http::StatusCode as HttpStatus;
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
		log::debug!("Initialize server");
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
				log::trace!("Issuing client ID {}", id);
				return Some(id);
			}
		}
		log::error!("Failed to issue client ID due to ID resource exhaustion");
		None
	}
}

#[derive(Debug)]
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
		log::trace!("Handle new connection {:?}", event); // note: module name is included in log output
		let id = self.get_client_id().ok_or(ConnectError::TooManyClients)?;
		self.clients.insert(id, event.client);
		let room = self.rooms.get_mut(&event.room).ok_or_else(|| {
			log::debug!("Client requested unknown room {:?}", event.room);
			ConnectError::UnknownRoom
		})?;
		room.insert(id);
		Ok(id)
	}
}

#[derive(Debug)]
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
		log::trace!("Handle disconnect {:?}", event);
		if let Some(room) = self.rooms.get_mut(&event.room) {
			room.remove(&event.id);
		} else {
			log::warn!(
				"Attempted to remove unregistered client {:?} from nonexistent room {:?}",
				event.id,
				event.room
			);
		}
		if self.clients.remove(&event.id).is_none() {
			log::warn!(
				"Attempted to remove unregistered client {:?} from clients map",
				event.id
			);
		}
	}
}

#[derive(Debug)]
pub struct NewMessage {
	pub message: crate::data::Message,
	pub room: String,
}

#[derive(Debug)]
pub enum NewMessageError {
	UnknownRoom,
}
impl From<NewMessageError> for actix_web::error::InternalError<&'static str> {
	fn from(err: NewMessageError) -> Self {
		match err {
			NewMessageError::UnknownRoom => {
				actix_web::error::InternalError::new("Unknown room", HttpStatus::BAD_REQUEST)
			}
		}
	}
}

impl ActixMessage for NewMessage {
	type Result = Result<(), NewMessageError>;
}
impl Handler<NewMessage> for Server {
	type Result = <NewMessage as ActixMessage>::Result;

	fn handle(&mut self, event: NewMessage, _context: &mut Self::Context) -> Self::Result {
		log::trace!("Handle new message event {:?}", event);
		let room = self.rooms.get(&event.room).ok_or_else(|| {
			log::warn!("Attempted to send message to unknown room {:?}", event.room);
			NewMessageError::UnknownRoom
		})?;
		let message = std::sync::Arc::new(data::MessageEvent::NewMessage(event.message));
		for client_id in room {
			if let Some(client) = self.clients.get_mut(client_id) {
				client.do_send(client::MessageEvent(message.clone()));
			}
		}
		Ok(())
	}
}
