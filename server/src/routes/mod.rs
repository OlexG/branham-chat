use crate::actors::{Client, Server};
use crate::config::Config;
use crate::data;
use crate::db::Database;
use actix::Addr;
use actix_web::error::InternalError;
use actix_web::http::StatusCode as HttpStatus;
use actix_web::HttpResponse;
use actix_web::{route, web, HttpRequest, Responder};
use actix_web_actors::ws;
use std::sync::Mutex;

mod helpers;

fn get_room(db: &Database, room: &str) -> Result<data::RoomId, InternalError<anyhow::Error>> {
	match db.get_room_by_name(room) {
		Ok(Some(room)) => Ok(room.id()),
		Ok(None) => Err(InternalError::new(
			anyhow::anyhow!("Invalid room {:?}", room),
			HttpStatus::NOT_FOUND,
		)),
		Err(err) => Err(InternalError::new(err, HttpStatus::INTERNAL_SERVER_ERROR)),
	}
}

#[route("/rooms/{room}/messages", method = "GET")]
pub async fn get_messages(
	room: web::Path<String>,
	db: web::Data<Mutex<Database>>,
	_auth: helpers::Auth,
) -> impl Responder {
	let db = db.lock().unwrap();
	let room = get_room(&db, &room.into_inner())?;
	match db.get_messages(room) {
		Ok(messages) => Ok(web::Json(messages)),
		Err(err) => Err(InternalError::new(err, HttpStatus::INTERNAL_SERVER_ERROR)),
	}
}

#[route("/rooms/{room}/messages", method = "POST")]
pub async fn post_message(
	room: web::Path<String>,
	req: web::Json<data::MessageRequest>,
	server: web::Data<Addr<Server>>,
	db: web::Data<Mutex<Database>>,
	auth: helpers::Auth,
) -> actix_web::Result<HttpResponse> {
	let user = auth.into_inner();
	let now = data::Timestamp::now();
	let room_name = room.into_inner();
	let message_id = {
		let db = db.lock().unwrap();
		let room_id = get_room(&db, &room_name)?;
		let message_id = db
			.push_message(room_id, user.id(), &req.content, &now)
			.map_err(|err| InternalError::new(err, HttpStatus::INTERNAL_SERVER_ERROR))?;
		message_id.0
	};
	let message = data::Message {
		id: message_id,
		user,
		content: req.into_inner().content,
		timestamp: now,
	};
	let message_response = serde_json::to_string(&message)
		.map_err(|err| InternalError::new(err, HttpStatus::INTERNAL_SERVER_ERROR))?;
	server
		.send(crate::actors::server::NewMessage {
			message,
			room: room_name,
		})
		.await
		.unwrap()
		.map_err(InternalError::from)?;
	Ok(HttpResponse::build(HttpStatus::OK).body(message_response))
}

#[route("/rooms/{room}/messages.ws", method = "GET")]
pub async fn messages_ws(
	room: web::Path<String>,
	server: web::Data<Addr<Server>>,
	req: HttpRequest,
	stream: web::Payload,
	_auth: helpers::Auth,
) -> impl Responder {
	ws::start(
		Client::new((*server.into_inner()).clone(), room.into_inner()),
		&req,
		stream,
	)
}

#[derive(serde::Deserialize)]
pub struct LoginBody {
	token: String,
}
#[route("/login", method = "POST")]
pub async fn oauth_login(
	data: web::Json<LoginBody>,
	config: web::Data<Config>,
	db: web::Data<Mutex<Database>>,
) -> actix_web::Result<HttpResponse> {
	use actix_web::cookie::{self, Cookie};
	let user_info = crate::oauth::resolve_oauth_token(&config.client_id, &data.token).await?;
	let token = db
		.lock()
		.unwrap()
		.refresh_user(&user_info)
		.map_err(|err| InternalError::new(err, HttpStatus::INTERNAL_SERVER_ERROR))?;
	Ok(
		HttpResponse::build(HttpStatus::NO_CONTENT)
			.cookie(
				Cookie::build("token", token.to_string())
					.http_only(true)
					.same_site(cookie::SameSite::Strict)
					.finish(),
			)
			.finish(),
	)
}
