use crate::data;
use crate::db::Database;
use actix_web::error::{Error, InternalError};
use actix_web::http::StatusCode as HttpStatus;
use actix_web::{dev::Payload, web::Data as WebData, FromRequest, HttpRequest};
use std::future::{ready, Ready};
use std::sync::Mutex;

pub struct Auth(data::User);

impl Auth {
	fn _from_request(req: &HttpRequest) -> Result<Self, Error> {
		let token = req.cookie("token").ok_or_else(|| {
			InternalError::new(
				anyhow::anyhow!("No token cookie provided"),
				HttpStatus::UNAUTHORIZED,
			)
		})?;
		let token = token.value();
		let token: data::Token = token.parse().map_err(|err| {
			InternalError::new(
				format!("Invalid token cookie: {}", err),
				HttpStatus::BAD_REQUEST,
			)
		})?;
		let db = req
			.app_data::<WebData<Mutex<Database>>>()
			.unwrap()
			.lock()
			.unwrap();
		let user = db.get_user_by_token(&token).map_err(|err| {
			InternalError::new(
				format!("Failed to get user by token: {:?}", err),
				HttpStatus::INTERNAL_SERVER_ERROR,
			)
		})?;
		let user = user.ok_or_else(|| {
			InternalError::new(
				anyhow::anyhow!("Token does not exist in database"),
				HttpStatus::FORBIDDEN,
			)
		})?;
		Ok(Self(user))
	}
	pub fn into_inner(self) -> data::User {
		self.0
	}
}

impl FromRequest for Auth {
	type Error = Error;
	type Future = Ready<Result<Self, Error>>;

	fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
		ready(Self::_from_request(req))
	}
}
