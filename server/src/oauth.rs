use actix_web::error::InternalError;
use actix_web::http::StatusCode as HttpStatus;
use awc::Client;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
pub struct UserInfo {
	pub email: String,
	pub name: String,
	#[serde(rename = "picture")]
	pub profile_picture: String,
}

pub async fn resolve_oauth_token(audience: &str, token: &str) -> actix_web::Result<UserInfo> {
	#[derive(Deserialize)]
	struct Response {
		#[serde(rename = "iss")]
		pub issuer: String,
		#[serde(rename = "aud")]
		pub audience: String,
		#[serde(rename = "hd")]
		pub hosted_domain: String,
		#[serde(flatten)]
		pub info: UserInfo,
	}

	#[derive(Serialize)]
	struct QueryParams<'a> {
		id_token: &'a str,
	}

	let response: Response = Client::default()
		.get("https://www.googleapis.com/oauth2/v3/tokeninfo")
		.query(&QueryParams { id_token: token })
		.map_err(|err| {
			InternalError::new(
				format!("Serializing query parameters: {:?}", err),
				HttpStatus::INTERNAL_SERVER_ERROR,
			)
		})?
		.send()
		.await
		.map_err(|err| {
			InternalError::new(
				format!("Sending request: {:?}", err),
				HttpStatus::BAD_GATEWAY,
			)
		})?
		.json()
		.await
		.map_err(|err| {
			InternalError::new(
				format!("Extracting JSON from the response: {:?}", err),
				HttpStatus::BAD_GATEWAY,
			)
		})?;

	if !matches!(
		response.issuer.as_str(),
		"accounts.google.com" | "https://accounts.google.com"
	) {
		return Err(InternalError::new("Invalid issuer", HttpStatus::FORBIDDEN).into());
	}
	if response.audience != audience {
		return Err(InternalError::new("Invalid audience", HttpStatus::FORBIDDEN).into());
	}
	if response.hosted_domain != "my.cuhsd.org" {
		return Err(InternalError::new("Invalid hosted domain", HttpStatus::FORBIDDEN).into());
	}

	Ok(response.info)
}
