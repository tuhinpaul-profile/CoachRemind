import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { NotificationPopup } from './NotificationPopup';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial unread count
    updateUnreadCount();
    
    // Set up polling to check for new notifications every 30 seconds
    const interval = setInterval(updateUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const updateUnreadCount = () => {
    const notifications = StorageService.getNotifications();
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Update count when opening popup
      updateUnreadCount();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Update count when closing popup (user might have read notifications)
    updateUnreadCount();
  };

  return (
    <>
      <button
        onClick={togglePopup}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        data-testid="button-notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPopup isOpen={isOpen} onClose={handleClose} />
    </>
  );
}