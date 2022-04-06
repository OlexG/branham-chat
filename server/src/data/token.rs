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
