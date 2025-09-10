# Тестове завдання PHP 
Проєкт для роботи із замовленнями. Складається з REST API на PHP та фронтенду для візуальної взаємодії.

## Використані технології

- **PHP 8+**
- **MySQL 8**
- **PhpMyAdmin**
- **Nginx**
- **Docker + docker-compose**
- **HTML, CSS, JavaScript (Vanilla)**
- **Postman**

## Запуск

Перед запуском встановіть **Docker** та **docker-compose**.

```bash
# Клонування репозиторію
git clone https://github.com/twilightnyann/php-test.git
cd orders-api

# Запуск контейнерів
docker-compose up -d
```

## База даних

При старті автоматично створюється база orders_db з таблицею orders.
SQL-дамп знаходиться у mysql/init.sql
## Postman

Файл New Collection.postman_collection.json містить усі приклади запитів.

Щоб використати:
1. Відкрити Postman.
2. Натиснути Import → вибрати файл.
3. Виконати запити до API.
## Автор

Розробник: Юдін Юрій Олегович