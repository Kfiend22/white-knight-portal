const nodemailer = require('nodemailer');

// Helper function to create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

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

// Request a new W9 from the applicant
const requestW9Email = async (req, res) => {
  const { email, companyName, applicationId, uploadUrl } = req.body;

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'W9 Form Request - White Knight Motor Club',
    html: `
      <h1>W9 Form Request</h1>
      <p>Dear ${companyName},</p>
      <p>We're reviewing your application and need an updated W9 form to proceed with your onboarding process.</p>
      <p>Please upload a new W9 form using the link below:</p>
      <p><a href="${uploadUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Upload W9 Form</a></p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <br>
      <p>Best regards,<br>White Knight Motor Club Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'W9 request email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send rate sheet to the applicant
const sendRateSheetEmail = async (req, res) => {
  const { email, companyName, uploadUrl, attachments } = req.body;

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Rate Sheet for Review - White Knight Motor Club',
    html: `
      <h1>Rate Sheet for Review</h1>
      <p>Dear ${companyName},</p>
      <p>Please find attached your rate sheet(s) for review.</p>
      <p>After reviewing, please sign and upload the completed rate sheet(s) using the following secure link:</p>
      <p><a href="${uploadUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Upload Signed Rate Sheet</a></p>
      <p>If you have any questions about the rates, please contact our support team.</p>
      <br>
      <p>Best regards,<br>White Knight Motor Club Team</p>
    `,
    attachments: attachments // Array of attachment objects
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Rate sheet email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send approval notification with temporary credentials
const sendApprovalEmail = async (req, res) => {
  const { email, companyName, vendorId, tempPassword, portalUrl } = req.body;

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Application Approved - Welcome to White Knight Motor Club!',
    html: `
      <h1>Application Approved!</h1>
      <p>Dear ${companyName},</p>
      <p>We're thrilled to inform you that your application to become a service provider with White Knight Motor Club has been approved!</p>
      <p><strong>Here are your temporary login credentials:</strong></p>
      <ul>
        <li>Username: ${vendorId}</li>
        <li>Password: ${tempPassword}</li>
      </ul>
      <p>Please log in to the portal here: <a href="${portalUrl}">${portalUrl}</a></p>
      <p>You will be prompted to change your password on your first login.</p>
      <p>We're excited to have you as a partner! If you have any questions, please contact our support team.</p>
      <br>
      <p>Best regards,<br>White Knight Motor Club Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Approval email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request a new Certificate of Insurance from the applicant
const requestCOIEmail = async (req, res) => {
  const { email, companyName, applicationId, uploadUrl } = req.body;

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Certificate of Insurance Request - White Knight Motor Club',
    html: `
      <h1>Certificate of Insurance Request</h1>
      <p>Dear ${companyName},</p>
      <p>We're reviewing your application and need an updated Certificate of Insurance to proceed with your onboarding process.</p>
      <p>Please upload your Certificate of Insurance using the link below:</p>
      <p><a href="${uploadUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Upload Certificate of Insurance</a></p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <br>
      <p>Best regards,<br>White Knight Motor Club Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'COI request email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  sendWelcomeEmail,
  requestW9Email,
  sendRateSheetEmail,
  sendApprovalEmail,
  requestCOIEmail
};
