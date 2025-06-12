// Check notification permission on page load
document.addEventListener('DOMContentLoaded', function() {
    checkNotificationPermission();
    loadTasks();

    // Set up event listeners
    document.getElementById('add-task').addEventListener('click', addTask);
    document.getElementById('enable-notifications').addEventListener('click', requestNotificationPermission);

    // Check for tasks that need reminders
    checkReminders();

    // Check every minute for upcoming tasks
    setInterval(checkReminders, 60000);
});

// Check notification permission
function checkNotificationPermission() {
    if (Notification.permission !== 'granted') {
        document.getElementById('permission-alert').style.display = 'block';
    } else {
        document.getElementById('permission-alert').style.display = 'none';
    }
}

// Request notification permission
function requestNotificationPermission() {
    Notification.requestPermission().then(function(permission) {
        checkNotificationPermission();
    });
}

// Add a new task
function addTask() {
    const taskName = document.getElementById('task-name').value;
    const taskDescription = document.getElementById('task-description').value;
    const dueDate = document.getElementById('due-date').value;
    const reminderTime = document.getElementById('reminder-time').value;

    if (!taskName || !dueDate) {
        alert('Please fill in all required fields');
        return;
    }

    const task = {
        id: Date.now(),
        name: taskName,
        description: taskDescription,
        dueDate: new Date(dueDate).getTime(),
        reminderTime: parseInt(reminderTime),
        reminded: false
    };

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Clear form
    document.getElementById('task-name').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('due-date').value = '';

    // Refresh task list
    loadTasks();
}

// Load tasks from localStorage
function loadTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    tasksContainer.innerHTML = '';

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p>No tasks added yet.</p>';
        return;
    }

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <h3>${task.name}</h3>
            ${task.description ? `<p>${task.description}</p>` : ''}
            <p class="due-date">Due: ${formatDate(task.dueDate)}</p>
            <p class="reminder-time">Reminder: ${formatReminderTime(task.reminderTime)} before</p>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
        `;
        tasksContainer.appendChild(taskElement);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            deleteTask(parseInt(this.getAttribute('data-id')));
        });
    });
}

// Delete a task
function deleteTask(taskId) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
}

// Check for tasks that need reminders
function checkReminders() {
    if (Notification.permission !== 'granted') return;

    const now = new Date().getTime();
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let updated = false;

    tasks.forEach(task => {
        if (!task.reminded) {
            const reminderTime = task.reminderTime * 60000;
            const reminderDate = task.dueDate - reminderTime;

            if (now >= reminderDate) {
                showNotification(task);
                task.reminded = true;
                updated = true;
            }
        }
    });

    if (updated) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
    }
}

// Show browser notification
function showNotification(task) {
    const notification = new Notification('Task Reminder', {
        body: `${task.name} is due soon (${formatDate(task.dueDate)})`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'
    });

    notification.onclick = function() {
        window.focus();
        this.close();
    };
}

// Helper function to format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Helper function to format reminder time
function formatReminderTime(minutes) {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(minutes / 1440);
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
}