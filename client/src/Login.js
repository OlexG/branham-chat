import GoogleLogin from "react-google-login";
import "./Login.css";
import api from "./api/requests";
import { useState } from "react";
import cookies from 'js-cookie';

export default function Login({setIsLoggedIn}) {
  const [error, setError] = useState(false);
	async function responseGoogle(response) {
    try {
		  const res = await api.sendLoginRequest(response.tokenId, response.profileObj.email, response.profileObj.name, response.profileObj.imageUrl);
      cookies.set('token', res.headers['x-user-token']);
      cookies.set('email', response.profileObj.email);
      setIsLoggedIn(true);
    } catch (err) {
      console.log(err);
      setError(true);
    }
  }
	return (
		<div className="main">
			<GoogleLogin clientId="400565140821-omc6jcg0hpkv35d4iuveo6tskqg8b8c2.apps.googleusercontent.com" buttonText="Login with your school email" onSuccess={responseGoogle} onFailure={responseGoogle} cookiePolicy={"single_host_origin"} />
      {
        error && <p className="error" style={{
          color: "red",
          fontSize: "1.5rem",
          textAlign: "center",
          fontFamily: "Roboto",
        }}>There was an error logging in. Please try again but using your Branham School Email</p>
      }
    </div>
	);
}
