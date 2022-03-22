import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
	process.env.CLIENT_ID,
	process.env.CLIENT_SECRET
);

export default async function verifyToken(token) {
	try {
		const ticket = await client.verifyIdToken({
			audience: process.env.GOOGLE_CLIENT_ID,
			idToken: token,
		});
		ticket.getPayload();
		return true;
	} catch (err) {
		return false;
	}
}
