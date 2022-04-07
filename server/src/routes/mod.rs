use crate::actors::{Client, Server};
use crate::config::Config;
use crate::data::{Message, MessageRequest, User};
use crate::db::Database;
use actix::Addr;
use actix_web::error::InternalError;
use actix_web::http::StatusCode as HttpStatus;
use actix_web::HttpResponse;
use actix_web::{route, web, HttpRequest, Responder};
use actix_web_actors::ws;
use std::sync::Mutex;

#[deprecated = "TODO actual users"]
fn fake_user() -> User {
	User {
		id: 0,
		name: "bob".to_owned(),
		picture: "https://picsum.photos/64/64".to_owned(),
		email: "bob@example.com".to_owned(),
	}
}

#[route("/rooms/{room}/messages", method = "GET")]
pub async fn get_messages(room: web::Path<String>) -> impl Responder {
	web::Json([Message {
		id: 3,
		content: format!("you are in room {}", room.into_inner()),
		timestamp: time::OffsetDateTime::UNIX_EPOCH.into(),
		user: fake_user(),
	}])
}

#[route("/rooms/{room}/messages", method = "POST")]
pub async fn post_message(
	room: web::Path<String>,
	message: web::Json<MessageRequest>,
	server: web::Data<Addr<Server>>,
) -> impl Responder {
	let message = Message {
		id: 3,
		content: message.into_inner().content,
		timestamp: time::OffsetDateTime::UNIX_EPOCH.into(),
		user: fake_user(),
	};
	let response = serde_json::to_string(&message);
	if let Err(err) = server
		.send(crate::actors::server::NewMessage {
			message,
			room: room.into_inner(),
		})
		.await
		.unwrap()
	{
		Err(actix_web::error::InternalError::from(err))
	} else {
		Ok(response)
	}
}

#[route("/rooms/{room}/messages.ws", method = "GET")]
pub async fn messages_ws(
	room: web::Path<String>,
	server: web::Data<Addr<Server>>,
	req: HttpRequest,
	stream: web::Payload,
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
