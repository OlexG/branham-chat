use log::LevelFilter;
use serde::{Deserialize, Serialize};

pub mod bindable;
pub use bindable::BindableAddr;

#[derive(Serialize, Deserialize)]
pub struct Config {
	#[serde(default = "default_address")]
	pub address: BindableAddr,
	#[serde(
		serialize_with = "serialize_log_level",
		deserialize_with = "deserialize_log_level",
		default = "default_log_level"
	)]
	pub log_level: LevelFilter,
	pub client_secret: String,
	pub client_id: String,
	pub num_workers: Option<usize>,
}

fn default_address() -> BindableAddr {
	"tcp://127.0.0.1:3000".parse().unwrap()
}

fn serialize_log_level<S: serde::ser::Serializer>(
	level: &LevelFilter,
	s: S,
) -> Result<S::Ok, S::Error> {
	level.to_string().serialize(s)
}
fn deserialize_log_level<'de, D: serde::de::Deserializer<'de>>(
	d: D,
) -> Result<LevelFilter, D::Error>
where
	D::Error: serde::de::Error,
{
	String::deserialize(d)?
		.parse()
		.map_err(serde::de::Error::custom)
}

fn default_log_level() -> LevelFilter {
	LevelFilter::Warn
}

pub fn config() -> anyhow::Result<Config> {
	use figment::providers::Format as _;

	figment::Figment::new()
		.merge(figment::providers::Toml::file("branham-chat.toml"))
		.merge(figment::providers::Env::prefixed("BRANHAM_CHAT_"))
		.extract()
		.map_err(anyhow::Error::from)
}
