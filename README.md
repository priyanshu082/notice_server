
# Campus Echo Board Backend

This is the backend for the Campus Echo Board application, a digital notice board system for educational institutions.

## Setup

1. Create a PostgreSQL database
2. Update the `.env` file with your database connection string
3. Install dependencies: `npm install`
4. Run the database migrations: `npx prisma migrate dev`
5. Generate Prisma client: `npx prisma generate`
6. Start the development server: `npm run dev`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Notices
- `GET /api/notices` - Get all notices
- `POST /api/notices` - Create a notice (teachers and admin only)
- `DELETE /api/notices/:id` - Delete a notice (by author or admin)

## Technologies Used
- Node.js with Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
