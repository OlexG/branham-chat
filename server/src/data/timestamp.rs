use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ToSqlOutput, ValueRef};
use rusqlite::ToSql;
use serde::{Deserialize, Serialize};
use std::ops::Deref;
use time::OffsetDateTime;

#[repr(transparent)]
#[derive(Clone, Debug)]
pub struct Timestamp(pub OffsetDateTime);

impl Deref for Timestamp {
	type Target = OffsetDateTime;
	fn deref(&self) -> &Self::Target {
		&self.0
	}
}

impl ToSql for Timestamp {
	fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
		Ok(self.0.unix_timestamp().into())
	}
}

impl FromSql for Timestamp {
	fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
		value
			.as_i64()?
			.try_into()
			.map_err(|err| FromSqlError::Other(Box::new(err)))
	}
}

impl TryFrom<i64> for Timestamp {
	type Error = time::error::ComponentRange;
	fn try_from(raw: i64) -> Result<Self, Self::Error> {
		OffsetDateTime::from_unix_timestamp(raw).map(Self)
	}
}

impl From<OffsetDateTime> for Timestamp {
	fn from(inner: OffsetDateTime) -> Self {
		Self(inner)
	}
}

impl Serialize for Timestamp {
	fn serialize<S: serde::ser::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
		self.0.unix_timestamp().serialize(serializer)
	}
}

impl<'de> Deserialize<'de> for Timestamp {
	fn deserialize<D: serde::de::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
		OffsetDateTime::from_unix_timestamp(Deserialize::deserialize(deserializer)?)
			.map_err(serde::de::Error::custom)
			.map(Self)
	}
}
