const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '6a76059d33b4d4554b732fb6' }, 'kaamexpert_secret_key_2024_secure', { expiresIn: '30d' }); // Replace with actual admin ID if different, but let's see. Wait, I can just fetch it in node.
