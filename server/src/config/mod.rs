use log::LevelFilter;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub mod bindable;
pub use bindable::BindableAddr;

#[derive(Serialize, Deserialize)]
pub struct Config {
	#[serde(default = "default_address")]
	pub address: BindableAddr,
	#[serde(default = "default_log_level")]
	pub log_level: LogLevel,
	pub client_secret: String,
	pub client_id: String,
	pub num_workers: Option<usize>,
	#[serde(default = "default_db_path")]
	pub db_path: PathBuf,
}

fn default_db_path() -> PathBuf {
	"messages.db".into()
}

fn default_address() -> BindableAddr {
	"tcp://127.0.0.1:3000".parse().unwrap()
}

fn serialize_level_filter<S: serde::ser::Serializer>(
	level: &LevelFilter,
	s: S,
) -> Result<S::Ok, S::Error> {
	level.to_string().serialize(s)
}
fn deserialize_level_filter<'de, D: serde::de::Deserializer<'de>>(
	d: D,
) -> Result<LevelFilter, D::Error>
where
	D::Error: serde::de::Error,
{
	String::deserialize(d)?
		.parse()
		.map_err(serde::de::Error::custom)
}

#[derive(Serialize, Deserialize)]
#[serde(from = "LogLevelSerdeHelper")]
pub struct LogLevel {
	#[serde(serialize_with = "serialize_level_filter")]
	pub internal: LevelFilter,
	#[serde(serialize_with = "serialize_level_filter")]
	pub external: LevelFilter,
}

const fn default_log_level_internal() -> LevelFilter {
	LevelFilter::Info
}

const fn default_log_level_external() -> LevelFilter {
	LevelFilter::Warn
}

#[derive(Deserialize)]
#[serde(untagged)]
enum LogLevelSerdeHelper {
	#[serde(deserialize_with = "deserialize_level_filter")]
	Together(LevelFilter),
	Separate {
		#[serde(
			deserialize_with = "deserialize_level_filter",
			default = "default_log_level_internal"
		)]
		internal: LevelFilter,
		#[serde(
			deserialize_with = "deserialize_level_filter",
			default = "default_log_level_external"
		)]
		external: LevelFilter,
	},
}
impl From<LogLevelSerdeHelper> for LogLevel {
	fn from(helper: LogLevelSerdeHelper) -> Self {
		match helper {
			LogLevelSerdeHelper::Together(level) => Self {
				internal: level,
				external: level,
			},
			LogLevelSerdeHelper::Separate { internal, external } => Self { internal, external },
		}
	}
}

const fn default_log_level() -> LogLevel {
	LogLevel {
		internal: default_log_level_internal(),
		external: default_log_level_external(),
	}
}

pub fn config() -> anyhow::Result<Config> {
	use figment::providers::Format as _;

	figment::Figment::new()
		.merge(figment::providers::Toml::file("branham-chat.toml"))
		.merge(figment::providers::Env::prefixed("BRANHAM_CHAT_"))
		.extract()
		.map_err(anyhow::Error::from)
}
