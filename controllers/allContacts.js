const prisma = require('../config/db');

const AllContacts = async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany();
        res.status(200).json(contacts);
    } catch {
        res.status(500).json({ message: 'Error fetching contacts' });
    }
}

module.exports = {AllContacts};