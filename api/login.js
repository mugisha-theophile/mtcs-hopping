module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  const securePassword = (process.env.ADMIN_PASSWORD || '').trim();

  // Logging for debugging (will show in Vercel logs)
  console.log('Login attempt for user:', username);
  console.log('Password length provided:', (password || '').length);
  console.log('Expected password length:', securePassword.length);
  
  if (!securePassword) {
    console.error('CRITICAL: ADMIN_PASSWORD environment variable is not set!');
    return res.status(500).json({ 
      success: false, 
      message: 'Server configuration error. Admin password not set in environment variables.' 
    });
  }

  if (username === 'admin' && password === securePassword) {
    return res.status(200).json({
      success: true,
      user: { name: 'Admin', role: 'admin' }
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password.' });
};
