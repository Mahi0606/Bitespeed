# Bitespeed

Tech Stack:
  Backend: Node.js with Express.js
  Database: MySQL
  ORM: Prisma

Endpoints:
  1. "api/identify" [POST]
  This endpoint receives an email and/or phone number, consolidates the contact information, and returns a unified contact response.
  
  Request Body (json)

  {
      "email": "string (optional)",
      "phoneNumber": "string (optional)"
  }
  
  At least one of email or phoneNumber is required.


Project Structure:

      ├── config/
      │   └── db.js            # Prisma database configuration
      ├── controllers/
      │   └── contactController.js  # Contact handling logic
      ├── routes/
      │   └── contactRoutes.js  # API routes for contact management
      ├── prisma/
      │   └── schema.prisma     # Prisma schema for database
      ├── app.js                # Express app initialization
      ├── package.json          # Project metadata and dependencies
      └── README.md             # Project documentation



Prisma Schema:

      model Contact {
      	id                   Int @id @default(autoincrement())        
        phoneNumber          String?
        email                String?
        linkedId             Int? // the ID of another Contact linked to this one
        linkPrecedence       LinkPrecedence
        createdAt            DateTime @default(now())     
        updatedAt            DateTime @updatedAt          
        deletedAt            DateTime?
      }
      
      enum LinkPrecedence {
        primary
        secondary
      }


Key Features Explained:
    Primary Contact: A primary contact is created when a unique email or phone number is introduced. Any future entries with the same email or phone number will be linked to this         primary contact.
    Secondary Contact: If a new entry has a matching phone number or email, it will be linked to the corresponding primary contact as a secondary contact.

