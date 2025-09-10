const API_URL = "http://localhost/api/orders";
let currentPage = 1;
let currentStatus = "";

document.addEventListener("DOMContentLoaded", () => {
    loadOrders();

    document.getElementById("orderForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await createOrder();
    });


    document.getElementById("statusFilter").addEventListener("change", (e) => {
        currentStatus = e.target.value;
        currentPage = 1;
        loadOrders();
    });


    document.getElementById("refreshBtn").addEventListener("click", () => {
        loadOrders();
    });

    document.getElementById("order-list-tab").addEventListener("shown.bs.tab", () => {
        loadOrders();
    });
});

async function loadOrders() {
    const url = new URL(API_URL);
    url.searchParams.append("page", currentPage);
    url.searchParams.append("limit", 12);
    if (currentStatus) url.searchParams.append("status", currentStatus);

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "success") {
            renderOrders(data.items);
            renderPagination(data.page, data.totalPages);
        } else {
            document.getElementById("ordersOutput").innerHTML =
                `<div class="alert alert-danger">Помилка: ${data.message}</div>`;
        }
    } catch (err) {
        document.getElementById("ordersOutput").innerHTML =
            `<div class="alert alert-danger">Помилка з'єднання з сервером</div>`;
    }
}


function renderOrders(orders) {
    const output = document.getElementById("ordersOutput");

    if (!orders || orders.length === 0) {
        output.innerHTML = "<p>Немає замовлень</p>";
        return;
    }

    const rows = orders.map(order => `
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
    `).join("");

    output.innerHTML = `
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
}

function renderPagination(page, totalPages) {
    const pagination = document.querySelector(".pagination");
    pagination.innerHTML = "";

    const prev = document.createElement("li");
    prev.className = "page-item" + (page <= 1 ? " disabled" : "");
    prev.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
    prev.onclick = (e) => {
        e.preventDefault();
        if (page > 1) {
            currentPage = page - 1;
            loadOrders();
        }
    };
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.className = "page-item" + (i === page ? " active" : "");
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => {
            e.preventDefault();
            currentPage = i;
            loadOrders();
        };
        pagination.appendChild(li);
    }

    const next = document.createElement("li");
    next.className = "page-item" + (page >= totalPages ? " disabled" : "");
    next.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
    next.onclick = (e) => {
        e.preventDefault();
        if (page < totalPages) {
            currentPage = page + 1;
            loadOrders();
        }
    };
    pagination.appendChild(next);
}

function addEventListenersToTable() {
    document.querySelectorAll(".order-status-select").forEach(select => {
        select.addEventListener("change", async (e) => {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;
            await updateOrderStatus(orderId, newStatus);
        });
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", async (e) => {
            const orderId = e.target.dataset.id;
            await deleteOrder(orderId);
        });
    });
}

async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        const result = await res.json();
        if (result.status === "success") {
            const row = document.getElementById(`order-${id}`);
            if (row) {
                row.className = getStatusClass(status);
            }
        } else {
            alert(`Помилка: ${result.message}`);
        }
    } catch (err) {
        alert("Помилка оновлення замовлення");
    }
}


async function deleteOrder(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        const result = await res.json();

        if (result.status === "success") {
            const row = document.getElementById(`order-${id}`);
            if (row) row.remove();
        } else {
            alert(`Помилка: ${result.message}`);
        }
    } catch (err) {
        alert("Помилка видалення замовлення");
    }
}

async function createOrder() {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const price = parseFloat(document.getElementById("totalPrice").value);

    const formMessage = document.getElementById("formMessage");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_name: name,
                customer_phone: phone,
                total_price: price
            })
        });

        const data = await res.json();
        if (data.status === "success") {
            formMessage.innerHTML = `<div class="alert alert-success">Замовлення створено</div>`;
            document.getElementById("orderForm").reset();
            loadOrders();
        } else {
            formMessage.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        }
    } catch (err) {
        formMessage.innerHTML = `<div class="alert alert-danger">Помилка з'єднання</div>`;
    }
}

function getStatusClass(status) {
    switch (status) {
        case "new": return "table-primary";
        case "in_progress": return "table-warning";
        case "done": return "table-success";
        case "canceled": return "table-danger";
        default: return "";
    }
}
