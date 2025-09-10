const API_URL = 'http://localhost/api/orders';

const ordersOutput = document.getElementById('ordersOutput');
const formMessage = document.getElementById('formMessage');
const refreshBtn = document.getElementById('refreshBtn');
const statusFilter = document.getElementById('statusFilter');
const orderForm = document.getElementById('orderForm');
const orderListTab = document.getElementById('order-list-tab');

async function loadOrders() {
    try {
        const selectedStatus = statusFilter.value;
        const url = selectedStatus ? `${API_URL}?status=${selectedStatus}` : API_URL;

        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Невідома помилка' }));
            throw new Error(`HTTP статус ${res.status}: ${errorData.message}`);
        }

        const data = await res.json();
        if (data.status !== 'success') throw new Error(data.message);

        if (data.items.length === 0) {
            ordersOutput.innerHTML = '<p>Замовлень немає</p>';
            return;
        }

        const rows = data.items.map(order => `
            <tr id="order-${order.id}" class="${getStatusClass(order.status)}">
                <td>${order.id}</td>
                <td>${order.customer_name}</td>
                <td>${order.customer_phone}</td>
                <td>
                    <select class="form-select order-status-select" data-id="${order.id}">
                        <option value="new" ${order.status === 'new' ? 'selected' : ''}>Нове</option>
                        <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>В роботі</option>
                        <option value="done" ${order.status === 'done' ? 'selected' : ''}>Виконане</option>
                        <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Скасоване</option>
                    </select>
                </td>
                <td>${parseFloat(order.total_price ?? 0).toFixed(2)}</td>
                <td>${order.created_at}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${order.id}">Видалити</button>
                </td>
            </tr>
        `).join('');

        ordersOutput.innerHTML = `
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ім'я</th>
                        <th>Телефон</th>
                        <th>Статус</th>
                        <th>Сума</th>
                        <th>Дата створення</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
        addEventListenersToTable();
    } catch (err) {
        ordersOutput.innerHTML = `<div class="alert alert-danger">Помилка: ${err.message}</div>`;
    }
}

function addEventListenersToTable() {
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;
            await updateOrderStatus(orderId, newStatus);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.id;
                await deleteOrder(orderId);
        });
    });
}


async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: status})
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Невідома помилка' }));
            throw new Error(`HTTP статус ${res.status}: ${errorData.message}`);
        }

        const result = await res.json();
        if (result.status === 'success') {
            const orderRow = document.getElementById(`order-${id}`);
            if (orderRow) {

                orderRow.className = '';
                orderRow.classList.add(getStatusClass(status));
            }
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert(`Помилка оновлення: ${error.message}`);
    }
}

async function deleteOrder(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Невідома помилка' }));
            throw new Error(`HTTP статус ${res.status}: ${errorData.message}`);
        }

        const result = await res.json();
        if (result.status === 'success') {
            const orderRow = document.getElementById(`order-${id}`);
            if (orderRow) {
                orderRow.remove();
            }
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert(`Помилка видалення: ${error.message}`);
    }
}

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const totalPrice = parseFloat(document.getElementById('totalPrice').value);

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({customer_name: name, customer_phone: phone, total_price: totalPrice})
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Невідома помилка' }));
            throw new Error(`HTTP статус ${res.status}: ${errorData.message}`);
        }

        const result = await res.json();
        if (result.status === 'success') {
            formMessage.innerHTML = '<div class="alert alert-success">Замовлення успішно створено!</div>';
            e.target.reset();
            loadOrders();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        formMessage.innerHTML = `<div class="alert alert-danger">Помилка: ${error.message}</div>`;
    }
});

function getStatusClass(status) {
    switch (status) {
        case 'new': return 'table-primary';
        case 'in_progress': return 'table-warning';
        case 'done': return 'table-success';
        case 'canceled': return 'table-danger';
        default: return '';
    }
}

refreshBtn.addEventListener('click', async (e) => {

    e.preventDefault();
    try {
        await loadOrders();
    } catch (error) {
        console.error("Помилка при оновленні: ", error);
    }
});
statusFilter.addEventListener('change', loadOrders);
orderListTab.addEventListener('shown.bs.tab', loadOrders);