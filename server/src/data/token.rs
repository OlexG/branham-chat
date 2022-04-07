/// Inner type should be treated as an arbitrary integral type
#[derive(Debug)]
pub struct Token(pub i64);

impl From<i64> for Token {
	fn from(inner: i64) -> Self {
		Self(inner)
	}
}

use std::fmt::{self, Display, Formatter};
impl Display for Token {
	fn fmt(&self, formatter: &mut Formatter) -> fmt::Result {
		write!(formatter, "{:x}", self.0)
	}
}

use std::num::ParseIntError;
use std::str::FromStr;
impl FromStr for Token {
	type Err = ParseIntError;
	fn from_str(s: &str) -> Result<Self, ParseIntError> {
		i64::from_str_radix(s, 16).map(Self)
	}
}
