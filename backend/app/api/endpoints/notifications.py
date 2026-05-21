from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_my_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all notifications for the current authenticated user, sorted by newest first."""
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.user_id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )
    return notifications

@router.put("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification of the current user as read."""
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.notification_id == notification_id,
            models.Notification.user_id == current_user.user_id
        )
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông báo hoặc bạn không có quyền sở hữu thông báo này"
        )
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/read-all")
def mark_all_notifications_as_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all unread notifications of the current user as read."""
    unread_notifications = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == current_user.user_id,
            models.Notification.is_read == False
        )
        .all()
    )
    for noti in unread_notifications:
        noti.is_read = True
    
    db.commit()
    
    return {"message": "Tất cả thông báo đã được đánh dấu là đã đọc"}
