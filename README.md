# Cipher

Cipher is a real-time chat app with Google OAuth2 login, JWT auth, Spring WebSocket messaging, and React UI.

## Backend

Location: `backend/`

Main features included:
- Google OAuth2 login flow
- JWT generation and validation
- JWT filter for REST APIs
- STOMP over SockJS endpoint at `/ws`
- Public and private chat message handlers
- Message persistence with JPA
- User presence updates

## Frontend

Location: `frontend/`

Main features included:
- Login page with Google OAuth2 entry
- OAuth2 redirect token extraction
- JWT storage and `/api/auth/me` bootstrap
- Public and private chat UI
- STOMP subscriptions for public, private, and presence channels

## Run backend

```bash
cd backend
mvn spring-boot:run
```

Set env vars before running:
- `DATABASE_URL`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `FRONTEND_REDIRECT_URI`
- `FRONTEND_ORIGIN`

## Run frontend

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_BACKEND_URL` in `.env`.
