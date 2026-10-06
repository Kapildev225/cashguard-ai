++ 
register-user.js
================

Small helper script to POST a registration request to the running backend. Useful for quick manual testing or creating a test user.

Usage
-----

- Run directly with node from the backend directory:

  node register-user.js

- Or via npm script from the backend directory:

  npm run register:user

Configuration
-------------

The script reads the following environment variables (all optional):

- REGISTER_HOST (default: localhost)
- REGISTER_PORT (default: 3000)
- REGISTER_PATH (default: /api/auth/register)
- REGISTER_NAME (default: "Alice Test (node)")
- REGISTER_EMAIL (default: "alice.node@example.com")
- REGISTER_PASSWORD (default: "secret123")

Examples
--------

- Run against a server on port 5000:

  REGISTER_PORT=5000 node register-user.js

- Provide custom user data:

  REGISTER_EMAIL=test@example.com REGISTER_PASSWORD=pass123 node register-user.js

Notes
-----

- The script performs an HTTP request; the target server must be running and reachable.
- For automated seeding/tests prefer using prisma/seed.ts or direct DB seeding instead of HTTP-based scripts.
