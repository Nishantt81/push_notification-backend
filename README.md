# Flutter FCM Backend


Simple Node.js + Express backend for a Flutter app that uses Firebase Cloud Messaging (FCM) for notifications and MongoDB for storage.


## Setup
1. Copy `.env.example` to `.env` and fill the values.
2. Install dependencies:
```bash
npm install express mongoose bcryptjs jsonwebtoken dotenv cors node-fetch@2
npm install --save-dev nodemon
```
3. Run in dev mode:
```bash
npm run dev
```


## Endpoints
- `POST /api/auth/signup` - body: `{ username, email, password, fcmToken? }`
- `POST /api/auth/login` - body: `{ email, password, fcmToken? }` -> returns JWT
- `POST /api/auth/logout` - protected, body: `{ fcmToken? }` remove token from user
- `GET /api/messages` - protected, returns messages for authenticated user
- `POST /api/messages/send` - protected, body: `{ receiverId, text }` -> saves message + sends FCM




// End of files