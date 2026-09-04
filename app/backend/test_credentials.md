# BizMatch — Test Credentials

## Admin / Demo Business Account
- Email: `admin@bizmatch.com`
- Password: `admin123`
- Role: business

## Seeded Business Users (password: `password123`)
- `biz1@bizmatch.com` — Nova Logistics
- `biz2@bizmatch.com` — Loomcraft Textiles
- `biz3@bizmatch.com` — Kinetic Robotics
- `biz4@bizmatch.com` — Verdant Farms
- `biz5@bizmatch.com` — Solstice Coffee Co.
- `biz6@bizmatch.com` — Aegis Cyber
- `biz7@bizmatch.com` — Marina Biotech
- `biz8@bizmatch.com` — Trailhead Outdoor

## Seeded Investor Users (password: `password123`)
- `inv1@bizmatch.com` — Northlight Ventures
- `inv2@bizmatch.com` — Meridian Capital Partners
- `inv3@bizmatch.com` — Baobab Impact Fund
- `inv4@bizmatch.com` — Ravenwood Angels
- `inv5@bizmatch.com` — Silvergate Growth
- `inv6@bizmatch.com` — Kairos Family Office
- `inv7@bizmatch.com` — Halcyon Deep Tech
- `inv8@bizmatch.com` — Coastal Trade Finance

## Auth Endpoints
- POST `/api/auth/register` (body: email, password, role, display_name)
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET  `/api/auth/me`

Auth uses httpOnly cookies (`access_token`). Frontend axios must use `withCredentials: true`.
