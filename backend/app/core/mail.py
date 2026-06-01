import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(to_email: str, subject: str, html_content: str):
    """
    Sends an email using standard SMTP.
    Since sending emails takes 1-3 seconds, this should be executed in a BackgroundTask.
    """
    # If SMTP_USERNAME is empty, skip sending
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print("SMTP credentials are not configured. Skipping email send.")
        return
        
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.SMTP_USERNAME
        msg['To'] = to_email
        
        # Record the MIME types of both parts - text/html.
        part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part)
        
        # Connect to server
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls() # Secure connection with TLS
        
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        print(f"Successfully sent email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")

def send_assignment_notification_email(to_email: str, lecturer_name: str, list_name: str):
    subject = "[Quản lý Phân công TKB] Thông báo phân công giảng dạy mới"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Inter', Arial, sans-serif;
                background-color: #f4f5f7;
                margin: 0;
                padding: 0;
                color: #333333;
            }}
            .container {{
                max-width: 600px;
                margin: 30px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
                border: 1px solid #e1e4e8;
            }}
            .header {{
                background-color: #f37423;
                padding: 24px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 0;
                font-size: 20px;
                font-weight: 700;
            }}
            .content {{
                padding: 30px;
                line-height: 1.6;
                font-size: 14px;
            }}
            .content p {{
                margin: 0 0 16px 0;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0 10px 0;
            }}
            .btn {{
                background-color: #f37423;
                color: #ffffff !important;
                padding: 12px 24px;
                text-decoration: none;
                font-weight: bold;
                border-radius: 6px;
                display: inline-block;
                box-shadow: 0 2px 5px rgba(243, 116, 35, 0.3);
            }}
            .footer {{
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #777777;
                border-top: 1px solid #e1e4e8;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Hệ Thống Quản Lý Phân Công TKB</h1>
            </div>
            <div class="content">
                <p>Kính chào Thầy/Cô <strong>{lecturer_name}</strong>,</p>
                <p>Hệ thống xin thông báo: Quản trị viên đã thực hiện phân công giảng dạy mới cho Thầy/Cô tại bảng phân công <strong>{list_name}</strong>.</p>
                <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết lịch dạy và xác nhận các môn học được phân công.</p>
                <div class="button-container">
                    <a href="http://localhost:5173/my-registrations" class="btn" style="color: #ffffff;">Xem chi tiết phân công</a>
                </div>
            </div>
            <div class="footer">
                <p>Đây là email tự động từ Hệ thống Quản lý Phân công Thời khóa biểu.</p>
                <p>Vui lòng không trả lời trực tiếp email này.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    send_email(to_email, subject, html_content)
