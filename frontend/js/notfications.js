function showNotification(message, type = 'info') {
    let notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000); // Уведомление исчезает через 3 секунды
}

// Добавляем стили для уведомлений
const style = document.createElement('style');
style.innerHTML = `
    .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 5px;
        font-size: 14px;
        z-index: 1000;
        transition: opacity 0.3s ease-in-out;
    }
    .notification.error { background: red; }
    .notification.success { background: green; }
`;
document.head.appendChild(style);
