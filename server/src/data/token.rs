#[derive(Debug)]
pub struct Token([u8; 32]);

impl Token {
	pub fn generate() -> Self {
		use rand::Rng as _;
		Self(rand::thread_rng().gen())
	}
}

use rusqlite::types::{ToSql, ToSqlOutput, ValueRef};
impl ToSql for Token {
	fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
		Ok(ToSqlOutput::Borrowed(ValueRef::Blob(&self.0)))
	}
}

const BASE_64_CONFIG: base64::Config = base64::STANDARD;

use std::fmt::{self, Display, Formatter};
impl Display for Token {
	fn fmt(&self, f: &mut Formatter) -> fmt::Result {
		base64::display::Base64Display::with_config(&self.0, BASE_64_CONFIG).fmt(f)
	}
}

#[derive(Debug)]
pub enum TokenFromStrError {
	InvalidLength,
	Decode(base64::DecodeError),
}

impl Display for TokenFromStrError {
	fn fmt(&self, f: &mut Formatter) -> fmt::Result {
		match self {
			Self::InvalidLength => write!(f, "invalid length"),
			Self::Decode(b64_err) => write!(f, "decode error: {}", b64_err),
		}
	}
}

use std::str::FromStr;
impl FromStr for Token {
	type Err = TokenFromStrError;
	fn from_str(s: &str) -> Result<Self, Self::Err> {
		let mut ret = [0u8; 32];
		let amt = base64::decode_config_slice(s.as_bytes(), BASE_64_CONFIG, &mut ret)
			.map_err(TokenFromStrError::Decode)?;
		if amt != ret.len() {
			return Err(TokenFromStrError::InvalidLength);
		}
		Ok(Self(ret))
	}
}
