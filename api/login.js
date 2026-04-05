require('dotenv').config();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  const securePassword = process.env.ADMIN_PASSWORD;

  // Simple check for demo purposes. 
  // In a real production app, you would use a database and hashed passwords.
  if (username === 'admin' && password === securePassword) {
    // Return a dummy token or success message
    // In a real app, you would set a secure cookie or return a JWT
    return res.status(200).json({ 
      success: true, 
      user: { name: 'Admin User', role: 'admin' } 
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password' });
};
