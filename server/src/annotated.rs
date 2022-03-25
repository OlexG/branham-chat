use actix_web::http::StatusCode as HttpStatus;
use anyhow::Error;

#[derive(Debug)]
pub struct AnnotatedError(pub HttpStatus, pub Error);

impl std::fmt::Display for AnnotatedError {
	fn fmt(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
		write!(formatter, "{} error: {:?}", self.0, self.1)
	}
}

pub trait StatusContextExt<T, E>: anyhow::Context<T, E> {
	fn status_context<C: std::fmt::Display + Send + Sync + 'static>(
		self,
		status: HttpStatus,
		context: C,
	) -> Result<T, AnnotatedError>;
}

impl<T, E: std::error::Error + Send + Sync + 'static> StatusContextExt<T, E> for Result<T, E> {
	fn status_context<C: std::fmt::Display + Send + Sync + 'static>(
		self,
		status: HttpStatus,
		context: C,
	) -> Result<T, AnnotatedError> {
		use anyhow::Context;
		self
			.context(context)
			.map_err(|err| AnnotatedError(status, err))
	}
}

impl actix_web::error::ResponseError for AnnotatedError {
	fn status_code(&self) -> HttpStatus {
		self.0
	}
	// use default error_response impl which delegates to Display
}
