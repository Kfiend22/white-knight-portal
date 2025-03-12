const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (req, res) => {
  const { email, vendorId, username, portalUrl } = req.body;

  // Configure your email transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to White Knight Motor Club Partnership',
    html: `
      <h1>Welcome to White Knight Motor Club Partnership!</h1>
      <p>Congratulations on being approved as our partner.</p>
      <p><strong>Your Credentials:</strong></p>
      <ul>
        <li>Vendor ID: ${vendorId}</li>
        <li>Username: ${username}</li>
      </ul>
      <p>Please visit <a href="${portalUrl}">${portalUrl}</a> to create your company account.</p>
      <p>You'll need to register using these credentials and create a secure password.</p>
      <p>If you have any questions, please contact our support team.</p>
      <br>
      <p>Best regards,<br>White Knight Motor Club Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Welcome email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendWelcomeEmail };
