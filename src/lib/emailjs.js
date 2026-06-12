export const sendEmail = async (toEmail, subject, message) => {
  const serviceId = 'service_y867dpo';
  const templateId = 'template_d5bd8vm';
  const publicKey = 'xIewOUnWfX9q0QNdv';

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: toEmail,
          subject: subject,
          message: message
        }
      })
    });

    if (response.ok) {
      console.log('Email sent successfully!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('Failed to send email:', errorText);
      return false;
    }
  } catch (err) {
    console.error('EmailJS error:', err);
    return false;
  }
};
