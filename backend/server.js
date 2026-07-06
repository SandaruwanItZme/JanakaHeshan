/**
 * Example backend for the contact form on Janaka Heshan's portfolio.
 *
 * This is a minimal, self-contained reference implementation — not required
 * to view the site, but shows one way to receive and email form submissions.
 *
 * Setup:
 *   1. cd backend-example
 *   2. npm init -y
 *   3. npm install express cors nodemailer dotenv express-rate-limit
 *   4. Create a .env file with:
 *        EMAIL_USER=your-gmail-address@gmail.com
 *        EMAIL_PASS=your-gmail-app-password
 *        PORT=4000
 *   5. node server.js
 *   6. In js/script.js, set CONTACT_ENDPOINT = 'http://localhost:4000/api/contact'
 *      (or your deployed backend URL).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json());

// Basic abuse protection: 5 submissions per IP per 15 minutes.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please try again later.' },
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message, company } = req.body || {};

  // Honeypot: real users never fill this hidden field.
  if (company) return res.status(200).json({ ok: true });

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
      to: 'heshanmd.ml@gmail.com',
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Email send failed:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Contact API listening on port ${PORT}`));
