# CRUD API

Simple CRUD API using Node.js with in-memory database. Supports single instance and cluster modes.

## Quick Start

```bash
npm install
cp .env.example .env
npm run start:dev
```

## Scripts

- `npm run start:dev` - Development mode (hot-reload)
- `npm run start:prod` - Production mode
- `npm run start:multi` - Cluster mode with load balancing
- `npm test` - Run tests

## API Endpoints

Base URL: `http://localhost:4000/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:userId` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:userId` | Update user |
| DELETE | `/api/users/:userId` | Delete user |

### User Object

```json
{
  "id": "uuid",
  "username": "string",
  "age": "number",
  "hobbies": ["string"]
}
```

### Examples

```bash
# Get all users
curl http://localhost:4000/api/users

# Create user
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"John","age":30,"hobbies":["coding"]}'

# Get user by ID
curl http://localhost:4000/api/users/{userId}

# Update user
curl -X PUT http://localhost:4000/api/users/{userId} \
  -H "Content-Type: application/json" \
  -d '{"username":"Jane","age":25}'

# Delete user
curl -X DELETE http://localhost:4000/api/users/{userId}
```

## Response Codes

- `200` - Success
- `201` - Created
- `204` - No Content (delete success)
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

## Cluster Mode

- Load balancer on `PORT` (default: 4000)
- Workers on `PORT + 1`, `PORT + 2`, etc.
- Shared state via IPC
- Round-robin load balancing

## Requirements

- Node.js 24.10.0+
