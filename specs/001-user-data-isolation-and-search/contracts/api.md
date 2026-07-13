# API Contracts: User Data Isolation and Semantic Search

## Base URL: `/api`

### 1. User Registration (`POST /auth/signup`)
Registers a new user and creates their profile and empty wallet in the database.
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Wagner Alves",
    "nickname": "wagner",
    "email": "wagner@example.com",
    "password": "securepassword",
    "role": "reader",
    "tastes": ["Drama", "Fantasia"]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "uuid-v4",
      "name": "Wagner Alves",
      "nickname": "wagner",
      "email": "wagner@example.com",
      "role": "reader"
    }
  }
  ```

### 2. Get Wallet Balance & Subscription (`GET /wallet/balance`)
Retrieves the user's current credit balance and subscription status.
- **Request Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "balance": 150.00,
    "subscription_status": "active",
    "subscription_expires_at": "2026-08-12T00:00:00Z"
  }
  ```

### 3. Donate Credits to Author (`POST /wallet/donate`)
Transfers credits from a reader's wallet to an author's wallet.
- **Request Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "author_id": "uuid-v4-author",
    "amount": 25.00,
    "description": "Apoio para o novo capítulo!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Donation transfer completed successfully",
    "new_balance": 125.00
  }
  ```

### 4. Author Withdrawal Request (`POST /wallet/withdraw`)
Allows authors to request credit payouts to their bank accounts.
- **Request Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "amount": 100.00,
    "bank_token": "tok_12345abcdef"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Withdrawal request submitted successfully",
    "request_id": "uuid-v4"
  }
  ```

### 5. Create Support Ticket (`POST /support/ticket`)
Opens a new ticket for refund requests or billing claims.
- **Request Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "subject": "Reembolso de compra incorreta",
    "message": "Fiz a compra de créditos duas vezes por engano. Gostaria de reembolso da segunda transação."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "ticket_id": "uuid-v4",
    "status": "open"
  }
  ```

### 6. Semantic Search (`GET /search`)
Queries the library using semantic vector similarity.
- **Parameters**:
  - `q` (string, required): Semantic query description (e.g. `menino loiro na lua com raposa`)
  - `limit` (integer, optional, default=10)
- **Response (200 OK)**:
  ```json
  {
    "results": [
      {
        "id": "uuid-v4-book",
        "title": "O Pequeno Príncipe",
        "synopsis": "Um piloto cai no deserto do Saara e encontra um menino loiro que vive em outro asteroide...",
        "author": "Antoine de Saint-Exupéry",
        "similarity": 0.892
      }
    ]
  }
  ```
