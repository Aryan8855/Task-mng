// Task Manager Application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksList = document.getElementById('tasks-list');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const visibleTaskCount = document.getElementById('visible-task-count');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const editModal = document.getElementById('edit-modal');
    const editTaskInput = document.getElementById('edit-task-input');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveEditBtn = document.getElementById('save-edit');
    const closeModalBtn = document.querySelector('.close-modal');
    
    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let taskToEdit = null;
    
    // Initialize the app
    function init() {
        renderTasks();
        updateStats();
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Add task
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Filter tasks
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                currentFilter = this.getAttribute('data-filter');
                renderTasks();
            });
        });
        
        // Edit modal
        cancelEditBtn.addEventListener('click', closeEditModal);
        closeModalBtn.addEventListener('click', closeEditModal);
        saveEditBtn.addEventListener('click', saveEditedTask);
        
        // Close modal when clicking outside
        editModal.addEventListener('click', function(e) {
            if (e.target === this) closeEditModal();
        });
    }
    
    // Add a new task
    function addTask() {
        const text = taskInput.value.trim();
        
        if (text === '') {
            showNotification('Please enter a task!', 'warning');
            taskInput.focus();
            return;
        }
        
        // Create new task object
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Add to tasks array
        tasks.unshift(newTask);
        
        // Update UI and localStorage
        updateLocalStorage();
        renderTasks();
        updateStats();
        
        // Clear input and focus
        taskInput.value = '';
        taskInput.focus();
        
        // Show success notification
        showNotification('Task added successfully!', 'success');
    }
    
    // Render tasks based on current filter
    function renderTasks() {
        // Clear the task list
        tasksList.innerHTML = '';
        
        // Filter tasks based on current filter
        let filteredTasks = tasks;
        if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (currentFilter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
        }
        
        // Update visible task count
        visibleTaskCount.textContent = filteredTasks.length;
        
        // If no tasks, show empty state
        if (filteredTasks.length === 0) {
            let emptyMessage = '';
            if (currentFilter === 'all') emptyMessage = 'No tasks yet. Add your first task above!';
            else if (currentFilter === 'completed') emptyMessage = 'No completed tasks yet.';
            else if (currentFilter === 'pending') emptyMessage = 'No pending tasks. Great job!';
            
            tasksList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>${emptyMessage.split('.')[0]}</h3>
                    <p>${emptyMessage.split('.')[1] || ''}</p>
                </li>
            `;
            return;
        }
        
        // Create task items
        filteredTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            tasksList.appendChild(taskItem);
        });
    }
    
    // Create a task element
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        
        li.innerHTML = `
            <div class="task-checkbox">
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            </div>
            <div class="task-content">
                <p class="task-text">${escapeHtml(task.text)}</p>
                <small class="task-date">${formatDate(task.createdAt)}</small>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners to the task
        const checkbox = li.querySelector('input[type="checkbox"]');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
        editBtn.addEventListener('click', () => openEditModal(task));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        return li;
    }
    
    // Toggle task completion status
    function toggleTaskCompletion(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            updateLocalStorage();
            renderTasks();
            updateStats();
            
            const status = tasks[taskIndex].completed ? 'completed' : 'marked as pending';
            showNotification(`Task ${status}!`, 'success');
        }
    }
    
    // Delete a task
    function deleteTask(taskId) {
        // Add fade out animation
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('fade-out');
            
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== taskId);
                updateLocalStorage();
                renderTasks();
                updateStats();
                showNotification('Task deleted successfully!', 'success');
            }, 300);
        }
    }
    
    // Open edit modal
    function openEditModal(task) {
        taskToEdit = task;
        editTaskInput.value = task.text;
        editModal.classList.add('active');
        editTaskInput.focus();
        editTaskInput.select();
    }
    
    // Close edit modal
    function closeEditModal() {
        editModal.classList.remove('active');
        taskToEdit = null;
        editTaskInput.value = '';
    }
    
    // Save edited task
    function saveEditedTask() {
        const newText = editTaskInput.value.trim();
        
        if (newText === '') {
            showNotification('Task cannot be empty!', 'warning');
            editTaskInput.focus();
            return;
        }
        
        if (taskToEdit) {
            const taskIndex = tasks.findIndex(task => task.id === taskToEdit.id);
            if (taskIndex !== -1) {
                tasks[taskIndex].text = newText;
                updateLocalStorage();
                renderTasks();
                showNotification('Task updated successfully!', 'success');
            }
        }
        
        closeEditModal();
    }
    
    // Update task statistics
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
    }
    
    // Update localStorage with current tasks
    function updateLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Show notification
    function showNotification(message, type) {
        // Remove existing notification if present
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide and remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
    
    // Add notification styles dynamically
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1001;
            transform: translateX(150%);
            transition: transform 0.3s ease-out;
            max-width: 350px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-left: 4px solid var(--success-color);
        }
        
        .notification.warning {
            border-left: 4px solid var(--warning-color);
        }
        
        .notification i {
            font-size: 1.5rem;
        }
        
        .notification.success i {
            color: var(--success-color);
        }
        
        .notification.warning i {
            color: var(--warning-color);
        }
        
        .notification span {
            font-weight: 500;
        }
        
        @media (max-width: 576px) {
            .notification {
                left: 20px;
                right: 20px;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // Initialize the app
    init();
    
    // Add some sample tasks if empty
    if (tasks.length === 0) {
        const sampleTasks = [
            "Complete project proposal",
            "Schedule team meeting",
            "Review design mockups",
            "Update documentation",
            "Prepare presentation slides"
        ];
        
        // Add sample tasks with a delay for visual effect
        let delay = 0;
        sampleTasks.forEach((taskText, index) => {
            setTimeout(() => {
                tasks.unshift({
                    id: Date.now() + index,
                    text: taskText,
                    completed: index === 0 || index === 4, // Mark first and last as completed
                    createdAt: new Date(Date.now() - (index * 3600000)).toISOString() // Stagger creation times
                });
                
                updateLocalStorage();
                renderTasks();
                updateStats();
                
                if (index === sampleTasks.length - 1) {
                    showNotification('Sample tasks added! Try out the features.', 'success');
                }
            }, delay);
            
            delay += 300;
        });
    }
});