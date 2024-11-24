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


                const uniqueEmails = new Set([primaryContact.email].concat(secondaryContacts.map(contact => contact.email).filter(email => email !== null)));
                const uniquePhoneNumbers = new Set([primaryContact.phoneNumber].concat(secondaryContacts.map(contact => contact.phoneNumber).filter(phone => phone !== null)));

                return res.status(200).json({
                    message: 'Contact already exists',
                    contact: {
                        primaryContactId: primaryContact.id,
                        emails: Array.from(uniqueEmails),
                        phoneNumbers: Array.from(uniquePhoneNumbers),
                        secondaryContactIds: secondaryContacts.map(contact => contact.id)
                    }
                });
            }

            // If the email and phoneNumber refers to different primary contacts
            if (existingEmail.linkPrecedence === "primary" && existingPhoneNumber.linkPrecedence === "primary") {
                const primaryContact = existingEmail.createdAt < existingPhoneNumber.createdAt ? existingEmail : existingPhoneNumber;
                const secondaryContact = existingEmail.createdAt < existingPhoneNumber.createdAt ? existingPhoneNumber : existingEmail;

                await prisma.contact.updateMany({
                    where: { OR: [{ id: secondaryContact.id }, { linkedId: secondaryContact.id }] },
                    data: {
                        linkPrecedence: "secondary",
                        linkedId: primaryContact.id
                    }
                });

                const updatedSecondaries = await prisma.contact.findMany({ where: { linkedId: primaryContact.id } });

                const uniqueEmails = new Set([primaryContact.email].concat(updatedSecondaries.map(contact => contact.email).filter(email => email !== null)));
                const uniquePhoneNumbers = new Set([primaryContact.phoneNumber].concat(updatedSecondaries.map(contact => contact.phoneNumber).filter(phone => phone !== null)));

                return res.status(200).json({
                    contact: {
                        primaryContactId: primaryContact.id,
                        emails: Array.from(uniqueEmails),
                        phoneNumbers: Array.from(uniquePhoneNumbers),
                        secondaryContactIds: updatedSecondaries.map(contact => contact.id)
                    }
                });
            }
        }

        // Case where either email or phoneNumber exists
        if (existingEmail || existingPhoneNumber) {
            const primaryContact = existingEmail
                ? (existingEmail.linkedId === null ? existingEmail : await prisma.contact.findUnique({ where: { id: existingEmail.linkedId } }))
                : (existingPhoneNumber.linkedId === null ? existingPhoneNumber : await prisma.contact.findUnique({ where: { id: existingPhoneNumber.linkedId } }));

            const secondaryContacts = await prisma.contact.findMany({ where: { linkedId: primaryContact.id } });

            // Remove duplicate emails and phone numbers
            const uniqueEmails = new Set([primaryContact.email].concat(secondaryContacts.map(contact => contact.email).filter(email => email !== null)));
            const uniquePhoneNumbers = new Set([primaryContact.phoneNumber].concat(secondaryContacts.map(contact => contact.phoneNumber).filter(phone => phone !== null)));

            return res.status(200).json({
                message: 'Contact already exists',
                contact: {
                    primaryContactId: primaryContact.id,
                    emails: Array.from(uniqueEmails),
                    phoneNumbers: Array.from(uniquePhoneNumbers),
                    secondaryContactIds: secondaryContacts.map(contact => contact.id)
                }
            });
        }

        // If no existing contact, create a new primary contact
        const newUser = await prisma.contact.create({
            data: {
                email: email,
                phoneNumber: phoneNumber,
                linkPrecedence: "primary"
            }
        });

        return res.status(200).json({
            contact: {
                primaryContactId: newUser.id,
                emails: [newUser.email],
                phoneNumbers: [newUser.phoneNumber],
                secondaryContactIds: []
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

module.exports = { createContact };
