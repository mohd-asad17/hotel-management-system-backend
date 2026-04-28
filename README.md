# Hotel Management System
This is the hotel booking platform backend where:
- **Hotel Owners** can list their properties and manage rooms.
- **Customers** can search hotels, book rooms, and manage bookings.
  
## Rules
1. One hotel can have multiple rooms with different types
2. Owners **cannot** book rooms in their own hotels
3. Bookings allowed **only for future dates**
4. No double booking - same room cannot be booked for overlapping dates
5. Customers can cancel bookings up to 24 hours before check-in
6. JWT required for **all APIs except signup/login**
7. Responses must match the format exactly

## Techonology Used
- Node.js ( Express )
- PostreSQL
- JWT ( Authentication )
- Bcrypt for Password hashing
- Zod Validation
- Prisma ORM
