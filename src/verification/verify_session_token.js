import DBManager from "../db.js";

const db_manager = new DBManager();
export default async function verify_session_token(req, res, next) {
  if (!req.headers.authorization) return res.status(401).end("No token");
  const token = req.headers.authorization.split(' ')[1];
  const email = req.headers.email;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  if (!email) {
    return res.status(401).json({ error: 'No email provided' });
  }
  const valid = db_manager.verify_user(email, token);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
}
