import "./Login.css";
import * as api from "./api/requests";
import GoogleLogin from "react-google-login";
import cookies from "js-cookie";
import { useState } from "react";

export default function Login({ setIsLoggedIn }) {
	const [error, setError] = useState(null);
	async function onSuccess(response) {
		try {
			const res = await api.sendLoginRequest(response.tokenId);
			cookies.set("token", res.headers["x-user-token"]);
			cookies.set("email", response.profileObj.email);
			setIsLoggedIn(true);
		} catch (err) {
			console.error("our server failed", err);
			setError(err);
		}
	}
	function onFailure(err) {
		console.error("google auth failed", err);
		setError(err);
	}
	return (
		<div className="main">
			<GoogleLogin
				clientId="400565140821-omc6jcg0hpkv35d4iuveo6tskqg8b8c2.apps.googleusercontent.com"
				buttonText="Login with your school email"
				onSuccess={onSuccess}
				onFailure={onFailure}
				cookiePolicy={"single_host_origin"}
			/>
			{error && (
				<p
					className="error"
					style={{
						color: "red",
						textAlign: "center",
					}}
				>
					There was an error logging in. Please try again but using your Branham
					School Email. Check the console for more information.
				</p>
			)}
		</div>
	);
}
