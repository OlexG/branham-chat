use crate::annotated::{AnnotatedError, StatusContextExt as _};
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

pub async fn resolve_oauth_token(audience: &str, token: &str) -> Result<UserInfo, AnnotatedError> {
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

	let response = Client::default()
		.get("https://www.googleapis.com/oauth2/v3/tokeninfo")
		.query(&QueryParams { id_token: token })
		.status_context(
			HttpStatus::INTERNAL_SERVER_ERROR,
			"Serializing query parameters",
		)?
		.send()
		.await
		.map_err(|err| {
			AnnotatedError(
				HttpStatus::BAD_GATEWAY,
				anyhow::anyhow!(err.to_string()).context("Sending request"),
			)
		})? // SendRequestError is not Send or Sync
		.json::<Response>()
		.await
		.status_context(HttpStatus::BAD_GATEWAY, "Extracting JSON from the response")?;

	if !matches!(
		response.issuer.as_str(),
		"accounts.google.com" | "https://accounts.google.com"
	) {
		return Err(AnnotatedError(
			HttpStatus::FORBIDDEN,
			anyhow::anyhow!("Invalid issuer"),
		));
	}
	if response.audience != audience {
		return Err(AnnotatedError(
			HttpStatus::FORBIDDEN,
			anyhow::anyhow!("Invalid audience"),
		));
	}
	if response.hosted_domain != "my.cuhsd.org" {
		return Err(AnnotatedError(
			HttpStatus::FORBIDDEN,
			anyhow::anyhow!("Invalid hosted domain"),
		));
	}

	Ok(response.info)
}
