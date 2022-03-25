use super::server::{self, Server};
use crate::data;
use actix::{
	Actor, ActorContext as _, Addr, AsyncContext as _, Handler, Message as ActixMessage,
	StreamHandler,
};
use actix_web_actors::ws;
use std::sync::Arc;
use std::time::{Duration, Instant};

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

pub type Id = usize;

pub struct Client {
	id: Option<Id>,
	server: Addr<Server>,
	room: String,
	last_heartbeat: Instant,
}

impl Client {
	pub fn new(server: Addr<Server>, room: String) -> Self {
		Self {
			id: None,
			server,
			room,
			last_heartbeat: Instant::now(),
		}
	}

	fn heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
		ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
			if Instant::now().duration_since(act.last_heartbeat) > CLIENT_TIMEOUT {
				log::debug!("Client timed out");
				ctx.stop();
			} else {
				ctx.ping(b"");
			}
		});
	}
}

impl Actor for Client {
	type Context = ws::WebsocketContext<Self>;

	fn started(&mut self, context: &mut Self::Context) {
		use actix::fut::future::WrapFuture as _;
		use actix::ActorFutureExt as _;
		use actix::ContextFutureSpawner as _;
		self.heartbeat(context);
		self
			.server
			.send(server::Connect {
				client: context.address(),
				room: self.room.clone(),
			})
			.into_actor(self)
			.then(|res, act, ctx| {
				match res {
					Ok(Ok(res)) => act.id = Some(res),
					_ => ctx.stop(),
				};
				actix::fut::ready(())
			})
			.wait(context);
	}

	fn stopping(&mut self, _context: &mut Self::Context) -> actix::Running {
		if let Some(id) = self.id {
			self.server.do_send(server::Disconnect {
				id,
				room: self.room.clone(),
			});
		}
		actix::Running::Stop
	}
}

pub struct MessageEvent(pub Arc<data::MessageEvent>);
impl ActixMessage for MessageEvent {
	type Result = ();
}
impl Handler<MessageEvent> for Client {
	type Result = <MessageEvent as ActixMessage>::Result;

	fn handle(&mut self, event: MessageEvent, context: &mut Self::Context) -> Self::Result {
		context.text(serde_json::to_string(&*event.0).expect("Failed to serialize message data"));
	}
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for Client {
	fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
		let msg = match msg {
			Ok(msg) => msg,
			Err(err) => {
				log::debug!("Client protocol error: {}", err);
				ctx.close(Some(ws::CloseReason::from(ws::CloseCode::Invalid)));
				return ctx.stop();
			}
		};
		match msg {
			ws::Message::Ping(msg) => {
				self.last_heartbeat = Instant::now();
				ctx.pong(&msg);
			}
			ws::Message::Pong(_msg) => {
				self.last_heartbeat = Instant::now();
			}
			ws::Message::Binary(_) | ws::Message::Text(_) => {
				log::debug!("Client sent data, terminating connection");
				ctx.close(Some(ws::CloseReason::from(ws::CloseCode::Unsupported)));
				ctx.stop();
			}
			ws::Message::Close(reason) => {
				ctx.close(reason);
				ctx.stop();
			}
			ws::Message::Continuation(_) => {
				log::debug!("Client sent continuation, terminating connection");
				ctx.close(Some(ws::CloseReason::from(ws::CloseCode::Unsupported)));
				ctx.stop();
			}
			_ => (),
		}
	}
}
