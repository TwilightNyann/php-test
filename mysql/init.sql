CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    status ENUM('new', 'in_progress', 'done', 'canceled') DEFAULT 'new',
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

INSERT INTO orders (customer_name, customer_phone, status, total_price) VALUES
('Іван Петренко', '+380501234567', 'new', 1250.00),
('Марія Коваленко', '+380671234568', 'in_progress', 850.50),
('Олександр Сидоренко', '+380931234569', 'done', 2100.00),
('Наталя Мельник', '+380631234570', 'new', 750.25),
('Дмитро Шевченко', '+380501234571', 'canceled', 320.00),
('Анна Бондаренко', '+380671234572', 'done', 1875.75),
('Сергій Ткаченко', '+380931234573', 'in_progress', 945.00),
('Оксана Лисенко', '+380631234574', 'new', 1120.50),
('Василь Гриценко', '+380501234575', 'done', 680.00),
('Тетяна Козлова', '+380671234576', 'new', 1450.25),
('Микола Савченко', '+380931234577', 'in_progress', 2250.00),
('Людмила Кравченко', '+380631234578', 'done', 890.75);