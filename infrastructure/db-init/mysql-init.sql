-- Create Databases
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS cart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS payment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS shipping_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create User and Grant Privileges
CREATE USER IF NOT EXISTS 'ecom_user'@'%' IDENTIFIED BY 'ecom_password';

GRANT ALL PRIVILEGES ON user_db.* TO 'ecom_user'@'%';
GRANT ALL PRIVILEGES ON cart_db.* TO 'ecom_user'@'%';
GRANT ALL PRIVILEGES ON order_db.* TO 'ecom_user'@'%';
GRANT ALL PRIVILEGES ON payment_db.* TO 'ecom_user'@'%';
GRANT ALL PRIVILEGES ON shipping_db.* TO 'ecom_user'@'%';

FLUSH PRIVILEGES;
