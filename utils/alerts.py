import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from tables.Medicine import Medicine  # Adjust import path if needed
from tables.Login import User        # Adjust import path if needed
import os

# Configuration (Use environment variables in production)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your_email@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "your_app_password")  # Gmail App Password

def check_and_send_alerts(db: Session):
    today = datetime.now()
    thirty_days_later = today + timedelta(days=30)

    # 1. Fetch low stock items (quantity <= reorder level)
    low_stock_items = db.query(Medicine).filter(Medicine.stock_quantity <= Medicine.reorder).all()

    # 2. Fetch medicines expiring in the next 30 days
    expiring_items = db.query(Medicine).filter(
        Medicine.expiry_date != None,
        Medicine.expiry_date <= thirty_days_later
    ).all()

    if not low_stock_items and not expiring_items:
        print("Alert Check: No low stock or expiring items found.")
        return

    # 3. Construct Email Body
    body = "=== MEDICINE INVENTORY ALERT ===\n\n"

    if low_stock_items:
        body += "⚠️ LOW STOCK ITEMS:\n"
        for m in low_stock_items:
            body += f"• {m.name} | Current Stock: {m.stock_quantity} (Reorder Threshold: {m.reorder})\n"
        body += "\n"

    if expiring_items:
        body += "⏰ EXPIRING SOON (Next 30 Days):\n"
        for m in expiring_items:
            exp_date = m.expiry_date.strftime('%Y-%m-%d') if m.expiry_date else 'N/A'
            body += f"• {m.name} | Expiry Date: {exp_date} | Current Stock: {m.stock_quantity}\n"

    # 4. Fetch distinct user emails to notify
    users = db.query(User).all()
    recipient_emails = [u.email for u in users if u.email]

    if not recipient_emails:
        return

    # 5. Send Email via SMTP
    try:
        msg = EmailMessage()
        msg['Subject'] = '🚨 Inventory Alert: Low Stock / Expiring Medicines'
        msg['From'] = SENDER_EMAIL
        msg['To'] = ", ".join(recipient_emails)
        msg.set_content(body)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)

        print(f"Alert email sent successfully to {len(recipient_emails)} recipient(s).")
    except Exception as e:
        print(f"Failed to send alert email: {e}")