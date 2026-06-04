#!/bin/bash

echo "=== DeliveryIQ Setup ==="

export PGPASSWORD=password
DB="deliveryiq"
USER="postgres"
HOST="localhost"

echo "Creating PostgreSQL database..."
psql -U $USER -h $HOST -c "CREATE DATABASE $DB;" 2>/dev/null || echo "Database already exists"

echo "Creating tables..."
psql -U $USER -h $HOST -d $DB <<SQL
CREATE TABLE IF NOT EXISTS zones (
    zone_id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    avg_delivery_minutes INT DEFAULT 30
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS agents (
    agent_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    zone_id INT REFERENCES zones(zone_id),
    availability_status VARCHAR(20) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    zone_id INT REFERENCES zones(zone_id),
    status VARCHAR(50) DEFAULT 'placed',
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    estimated_delivery_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    item_name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assignments (
    assignment_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    agent_id INT REFERENCES agents(agent_id),
    assigned_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) UNIQUE,
    rating INT,
    comments TEXT,
    sentiment VARCHAR(20) DEFAULT 'neutral'
);
SQL

echo "Seeding zones..."
psql -U $USER -h $HOST -d $DB <<SQL
INSERT INTO zones (zone_name, avg_delivery_minutes) VALUES
  ('North Zone', 25),
  ('South Zone', 35),
  ('East Zone', 20),
  ('West Zone', 40)
ON CONFLICT DO NOTHING;
SQL

echo "Seeding agents..."
psql -U $USER -h $HOST -d $DB <<SQL
INSERT INTO agents (name, phone, zone_id, availability_status) VALUES
  ('Alice Kumar', '9876543210', 1, 'available'),
  ('Bob Singh', '9876543211', 1, 'available'),
  ('Carol Das', '9876543212', 2, 'available'),
  ('David Roy', '9876543213', 2, 'available'),
  ('Eva Nair', '9876543214', 3, 'available'),
  ('Frank Rao', '9876543215', 4, 'available')
ON CONFLICT DO NOTHING;
SQL

echo "Seeding sample customers..."
psql -U $USER -h $HOST -d $DB <<SQL
INSERT INTO customers (name, email, phone) VALUES
  ('John Doe', 'john@example.com', '9000000001'),
  ('Jane Smith', 'jane@example.com', '9000000002'),
  ('Raj Patel', 'raj@example.com', '9000000003')
ON CONFLICT (email) DO NOTHING;
SQL

echo "Setting up .env file..."
cat > backend/.env <<ENV
POSTGRES_URL=postgresql://postgres:password@localhost:5432/deliveryiq
MONGO_URL=mongodb://localhost:27017
ENV

echo ""
echo "=== Setup Complete ==="
echo "Zones, agents, and customers seeded."
echo "Run: cd backend && uvicorn main:app --reload"
echo "Run: cd frontend && npm install && npm run dev"
