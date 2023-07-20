const fs = require('fs');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Đường dẫn tới file credentials.json đã tải về
const credentialsPath = './credentials.json';

// Kết nối tới cơ sở dữ liệu MongoDB
mongoose.connect('mongodb://localhost:27017/emails', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to the database.');
});

// Định nghĩa Schema cho email
const emailSchema = new mongoose.Schema({
  subject: String,
  content: String,
  attachments: [String],
  read: { type: Boolean, default: false }
});

// Tạo một model từ schema
const Email = mongoose.model('Email', emailSchema);

// Đọc tất cả email chưa đọc và lưu vào cơ sở dữ liệu
async function fetchUnreadEmails() {
  try {
    const auth = await authenticate();
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread' // Lọc email chưa đọc
    });

    const messages = res.data.messages;
    if (messages.length) {
      console.log(`Found ${messages.length} unread email(s).`);

      for (const message of messages) {
        const emailData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full' // Lấy email dạng đầy đủ
        });

        const email = parseEmailData(emailData.data);
        await saveEmail(email);
        await markAsRead(gmail, message.id);
        console.log(`Saved email with subject: ${email.subject}`);
      }
    } else {
      console.log('No unread emails found.');
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
}

// Phân tích dữ liệu email và trích xuất thông tin cần thiết
function parseEmailData(emailData) {
  const headers = emailData.payload.headers;
  const parts = emailData.payload.parts;
  const email = { subject: '', content: '', attachments: [] };

  for (const header of headers) {
    if (header.name.toLowerCase() === 'subject') {
      email.subject = header.value;
    }
  }

  if (parts && parts.length) {
    email.content = parts[0].body.data;

    for (const part of parts) {
      if (part.filename && part.filename.length) {
        const attachmentId = part.body.attachmentId;
        const filePath = `attachments/${attachmentId}_${part.filename}`;
        email.attachments.push(filePath);

        saveAttachment(part, filePath);
      }
    }
  }

  return email;
}

// Lưu trữ tệp đính kèm email
function saveAttachment(attachment, filePath) {
  const data = attachment.body.data;
  const buffer = Buffer.from(data, 'base64');

  fs.writeFileSync(filePath, buffer, 'binary');
  console.log(`Saved attachment: ${filePath}`);
}

// Lưu email vào cơ sở dữ liệu
async function saveEmail(email) {
  const newEmail = new Email(email);
  await newEmail.save();
}

// Đánh dấu email đã đọc
async function markAsRead(gmail, messageId) {
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    resource: {
      removeLabelIds: ['UNREAD']
    }
  });
  console.log(`Marked email as read: ${messageId}`);
}

// Xác thực với Gmail API
async function authenticate() {
  const credentials = fs.readFileSync(credentialsPath);
  const { client_secret, client_id, redirect_uris } = JSON.parse(credentials).web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = "1//04ICzTdIXgFxRCgYIARAAGAQSNwF-L9Ir7ux6IaQAaHDLH3SJurb5_GahjgSgGFs5Qx_ES3TC4z9BiTrdVwmEm_8Mo3KsWJD3540";
    oAuth2Client.setCredentials({ refresh_token: token });
    const accessToken = await oAuth2Client.getAccessToken();
    console.log(accessToken);
    return oAuth2Client;
  } catch (error) {
    return getAccessToken(oAuth2Client);
  }
}

// Lấy mã truy cập mới
async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  console.log('Authorize this app by visiting the following URL:');
  console.log(authUrl);

  const code = await getCodeFromUser();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync('token.json', JSON.stringify(tokens));
  return oAuth2Client;
}

// Lấy mã xác thực từ người dùng
function getCodeFromUser() {
  return new Promise((resolve, reject) => {
    // Lấy mã từ người dùng và truyền vào hàm resolve
  });
}

// Thực thi chương trình
fetchUnreadEmails().catch(console.error);
