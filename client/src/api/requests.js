import axios from "axios";
import cookies from "js-cookie";

export const sendGetMessagesRequest = (room) => {
	return axios.get(`${window.location.origin}/rooms/${room}/messages`);
};

export const sendPostMessageRequest = (room, msg) => {
	return axios.post(`${window.location.origin}/rooms/${room}/messages`, {
		content: msg,
	});
};

export const sendLoginRequest = (token, email, name, picture) => {
	return axios.post(`${window.location.origin}/login`, {
		email,
		name,
		picture,
		token,
	});
};

// intercept all requests and add the token to the header
axios.interceptors.request.use((config) => {
	const token = cookies.get("token");
	const email = cookies.get("email");
	if (config?.headers) {
		config.headers.Authorization = `Bearer ${token}`;
		config.headers.email = email;
	}

	return config;
});
