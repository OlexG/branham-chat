use actix::Actor as _;
use actix_web::{middleware as mid, web, App as ActixApp, HttpServer};
use anyhow::Context as _;
use std::sync::Arc;
use tokio::sync::Mutex;

mod actors;
mod annotated;
mod config;
mod data;
mod db;
mod oauth;
mod routes;

async fn main_() -> anyhow::Result<()> {
	let config = Arc::new(config::config().context("Reading configuration")?);
	simple_logger::SimpleLogger::new()
		.with_level(config.log_level.external)
		.with_module_level(env!("CARGO_PKG_NAME"), config.log_level.internal)
		.init()
		.context("Initializing logging")?;

	log::info!("Listening on {}", config.address);

	let server_addr = actors::Server::new().start();

	let database = db::Database::open(&config.db_path).context("Initializing database")?;
	let database = Arc::new(Mutex::new(database));

	let mut http = {
		let config = Arc::clone(&config);
		HttpServer::new(move || {
			ActixApp::new()
				.app_data(web::Data::from(Arc::clone(&config)))
				.app_data(web::Data::new(server_addr.clone()))
				.app_data(web::Data::from(Arc::clone(&database)))
				.wrap(mid::NormalizePath::trim())
				.service(routes::get_messages)
				.service(routes::post_message)
				.service(routes::messages_ws)
				.service(routes::oauth_login)
				.service(
					actix_files::Files::new("/", "../client/build")
						.prefer_utf8(true)
						.index_file("index.html"),
				)
				.wrap(mid::Logger::default())
		})
	};
	if let Some(num_workers) = config.num_workers {
		http = http.workers(num_workers);
	}

	match &config.address {
		config::BindableAddr::Tcp(addr) => http.bind(addr),
		config::BindableAddr::Unix(path) => http.bind_uds(path),
	}
	.context("Binding server to address")?
	.run()
	.await
	.context("Running server")
}

fn main() -> anyhow::Result<()> {
	actix_web::rt::System::new().block_on(main_())
}
