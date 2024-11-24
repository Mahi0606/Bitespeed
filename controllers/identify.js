const prisma = require('../config/db');

const createContact = async (req, res) => {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ message: 'At least Email or phone number is required' });
    }

    try {
        let existingEmail = null;
        let existingPhoneNumber = null;

        if (email) {
            existingEmail = await prisma.contact.findFirst({ where: { email: email } });
        }

        if (phoneNumber) {
            existingPhoneNumber = await prisma.contact.findFirst({ where: { phoneNumber: phoneNumber } });
        }

        // Both email and phoneNumber exist
        if (existingEmail && existingPhoneNumber) {
            const existingContact = await prisma.contact.findFirst({
                where: {
                    email: email,
                    phoneNumber: phoneNumber
                }
            });

            if (existingContact) {
                const primaryContact = existingContact.linkedId === null
                    ? existingContact
                    : await prisma.contact.findUnique({ where: { id: existingContact.linkedId } });

                const secondaryContacts = await prisma.contact.findMany({ where: { linkedId: primaryContact.id } });


                const uniqueEmails = new Set((primaryContact.email ? [primaryContact.email] : []).concat(secondaryContacts.map(contact => contact.email).filter(email => email !== null)));
                const uniquePhoneNumbers = new Set((primaryContact.phoneNumber ? [primaryContact.phoneNumber] : []).concat(secondaryContacts.map(contact => contact.phoneNumber).filter(phone => phone !== null)));

                return res.status(200).json({
                    message: 'Contact already exists',
                    contact: {
                        "primaryContactId": primaryContact.id,
                        "emails": Array.from(uniqueEmails),
                        "phoneNumbers": Array.from(uniquePhoneNumbers),
                        "secondaryContactIds": secondaryContacts.map(contact => contact.id)
                    }
                });
            }

            // If the email and phoneNumber refers to different primary contacts
            const allContacts = await prisma.contact.findMany({where: {
                OR: [
                    {email: email},
                    {phoneNumber: phoneNumber}
                ]
            }})
            const primaryContact = allContacts[0];
            const secondaryContacts = allContacts.slice(1);

            secondaryContacts.forEach(async (contact) => {
                if (contact.linkedId !== primaryContact.id) {
                    await prisma.contact.updateMany({
                        where: { id: contact.id },
                        data: {
                            linkPrecedence: "secondary",
                            linkedId: primaryContact.id
                        }
                    });
                }
            });


            const uniqueEmails = new Set((primaryContact.email ? [primaryContact.email] : []).concat(secondaryContacts.map(contact => contact.email).filter(email => email !== null)));
            const uniquePhoneNumbers = new Set((primaryContact.phoneNumber ? [primaryContact.phoneNumber] : []).concat(secondaryContacts.map(contact => contact.phoneNumber).filter(phone => phone !== null)));

            return res.status(200).json({
                contact: {
                    "primaryContactId": primaryContact.id,
                    "emails": Array.from(uniqueEmails),
                    "phoneNumbers": Array.from(uniquePhoneNumbers),
                    "secondaryContactIds": secondaryContacts.map(contact => contact.id)
                }
            });
        }


        // Case where either email or phoneNumber exists
        if (existingEmail || existingPhoneNumber) {
            const primaryContact = existingEmail
                ? (existingEmail.linkedId === null ? existingEmail : await prisma.contact.findUnique({ where: { id: existingEmail.linkedId } }))
                : (existingPhoneNumber.linkedId === null ? existingPhoneNumber : await prisma.contact.findUnique({ where: { id: existingPhoneNumber.linkedId } }));

            const secondaryContacts = await prisma.contact.findMany({ where: { linkedId: primaryContact.id } });


            const uniqueEmails = new Set((primaryContact.email ? [primaryContact.email] : []).concat(secondaryContacts.map(contact => contact.email).filter(email => email !== null)));
            const uniquePhoneNumbers = new Set((primaryContact.phoneNumber ? [primaryContact.phoneNumber] : []).concat(secondaryContacts.map(contact => contact.phoneNumber).filter(phone => phone !== null)));

            if (!email || !phoneNumber) {
                return res.status(200).json({
                    message: 'Contact already exists',
                    contact: {
                        "primaryContactId": primaryContact.id,
                        "emails": Array.from(uniqueEmails),
                        "phoneNumbers": Array.from(uniquePhoneNumbers),
                        "secondaryContactIds": secondaryContacts.map(contact => contact.id)
                    }
                });
            }

            const newUser = await prisma.contact.create({
                data: {
                    "email": email,
                    "phoneNumber": phoneNumber,
                    "linkPrecedence": "secondary",
                    "linkedId": primaryContact.id
                }
            })

            return res.status(200).json({
                contact: {
                    "primaryContactId": primaryContact.id,
                    "emails": Array.from(uniqueEmails).concat(!existingEmail ? newUser.email : []),
                    "phoneNumbers": Array.from(uniquePhoneNumbers).concat(!existingPhoneNumber ? newUser.phoneNumber : []),
                    "secondaryContactIds": secondaryContacts.map(contact => contact.id).concat(newUser.id)
                }
            })
        }

        // If no existing contact, creating a new primary contact
        const newUser = await prisma.contact.create({
            data: {
                "email": email,
                "phoneNumber": phoneNumber,
                "linkPrecedence": "primary"
            }
        });

        return res.status(200).json({
            contact: {
                "primaryContactId": newUser.id,
                "emails": newUser.email ? [newUser.email] : [],
                "phoneNumbers": newUser.phoneNumber ? [newUser.phoneNumber] : [],
                "secondaryContactIds": []
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

module.exports = { createContact };
