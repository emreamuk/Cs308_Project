// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// ✅ Create reusable email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * ✅ Send discount notification email to user
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's name
 * @param {object} product - Product object with discount info
 */
const sendDiscountNotification = async (userEmail, userName, product) => {
  try {
    const discountPercentage = Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `🎉 ${discountPercentage}% OFF on ${product.name} - Limited Time!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff4141; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .product-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .discount-badge { background: #ff4141; color: white; padding: 10px 20px;
                             border-radius: 5px; font-size: 24px; font-weight: bold;
                             display: inline-block; margin: 10px 0; }
            .price-info { font-size: 20px; margin: 15px 0; }
            .original-price { text-decoration: line-through; color: #999; }
            .new-price { color: #ff4141; font-weight: bold; font-size: 28px; }
            .cta-button { background: #ff4141; color: white; padding: 15px 30px;
                         text-decoration: none; border-radius: 5px; display: inline-block;
                         margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Special Discount Alert!</h1>
            </div>

            <div class="content">
              <p>Hi ${userName},</p>

              <p>Great news! A product in your wishlist is now on sale!</p>

              <div class="product-info">
                <h2>${product.name}</h2>
                <p><strong>Category:</strong> ${product.category}</p>

                <div class="discount-badge">
                  -${discountPercentage}% OFF
                </div>

                <div class="price-info">
                  <div class="new-price">$${product.price.toFixed(2)}</div>
                  <div class="original-price">Was: $${product.originalPrice.toFixed(2)}</div>
                  <div style="color: #27ae60; font-weight: bold; margin-top: 10px;">
                    You save: $${(product.originalPrice - product.price).toFixed(2)}
                  </div>
                </div>

                ${product.quantityInStock > 0
                  ? `<p style="color: #27ae60;">✓ In Stock (${product.quantityInStock} available)</p>`
                  : `<p style="color: #e74c3c;">Currently Out of Stock</p>`
                }
              </div>

              <center>
                <a href="http://localhost:3000/product/${product._id}" class="cta-button">
                  View Product →
                </a>
              </center>

              <p style="margin-top: 30px; font-size: 14px; color: #777;">
                This discount won't last forever! Visit our store now to grab this deal.
              </p>
            </div>

            <div class="footer">
              <p>AO Comics - Your Premium Comic Book Store</p>
              <p>You received this email because this product is in your wishlist.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Discount email sent to ${userEmail} for product: ${product.name}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending discount email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ✅ Send discount notifications to all users who have the product in wishlist
 * @param {object} product - Product object with discount
 * @param {array} users - Array of users who have this product in wishlist
 */
const notifyWishlistUsers = async (product, users) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const user of users) {
    const result = await sendDiscountNotification(user.email, user.name, product);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ user: user.email, error: result.error });
    }
  }

  console.log(`Email notification results: ${results.sent} sent, ${results.failed} failed`);
  return results;
};

module.exports = {
  sendDiscountNotification,
  notifyWishlistUsers
};
