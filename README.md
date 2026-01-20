Distributed Transaction Manager (2PC Simulation)
📌 Project Overview
This project implements a Distributed Database Management System (DDMS) simulation focusing on Concurrency Control and Atomic Consistency.

It addresses specific gaps identified in the 2023 literature survey "Revolution of Database Management System", which highlighted that modern database systems (NewSQL/NoSQL) often lack mature integrity approaches and require better concurrency control mechanisms to guarantee ACID properties in distributed environments.

🎯 Objective
To demonstrate a Two-Phase Commit (2PC) Protocol that ensures data integrity across decoupled, shared-nothing nodes. The system guarantees that a transaction either commits on all nodes or rolls back on all nodes, preventing data inconsistency during network failures.

🏗️ System Architecture
The project simulates a distributed environment using a central Coordinator and two independent data nodes.

Coordinator (Laravel Service): Manages the transaction lifecycle. It does not hold data but orchestrates the "Prepare" and "Commit" phases.

Node A (SQLite DB 1): Represents "Sender" (e.g., New York Branch).

Node B (SQLite DB 2): Represents "Receiver" (e.g., London Branch).

Client (React Dashboard): A real-time visual interface for initiating transactions and monitoring node states.

✨ Key Features
Two-Phase Commit (2PC) Algorithm:

Phase 1 (Voting): Nodes lock funds and vote "Yes" or "No".

Phase 2 (Completion): Coordinator enforces Global Commit or Global Rollback.

Distributed Concurrency Control:

Implements locking mechanisms (locked_amount, active_transaction_id) to prevent double-spending and ensure isolation.

Fault Tolerance (Chaos Engineering):

Includes a "Simulate Failure" toggle that artificially breaks the connection to Node B, forcing the system to demonstrate a safe Rollback on Node A.

Real-Time Visualization:

Live dashboard showing balance updates and lock states via polling.

🚀 Installation & Setup
Prerequisites
PHP >= 8.1

Composer

Node.js & NPM

SQLite

1. Backend Setup (Laravel)
The backend acts as the Coordinator and hosts the two database nodes.

Bash
# 1. Clone/Navigate to project
cd distinct-db-transaction

# 2. Install PHP dependencies
composer install

# 3. Environment Setup
cp .env.example .env
php artisan key:generate

# 4. Create the distinct Database Nodes (Linux/Mac)
touch database/node_a.sqlite database/node_b.sqlite
# (On Windows, just create two empty files with these names in the database folder)

# 5. Run Migrations on BOTH nodes
php artisan migrate --database=node_a
php artisan migrate --database=node_b

# 6. Seed Initial Data (User A: $1000, User B: $0)
php artisan db:seed --class=NodeSeeder

# 7. Start the Server
php artisan serve
The Backend will run at http://127.0.0.1:8000

2. Frontend Setup (React + Vite)
The frontend visualizes the transaction states.

Bash
# 1. Navigate to the dashboard folder
cd transaction-dashboard

# 2. Install JS dependencies
npm install

# 3. Start the Development Server
npm run dev
The Frontend will run at http://localhost:5173

🧪 Usage & Testing Scenarios
To validate the "Reliability" and "Integrity" requirements mentioned in the survey paper, perform the following tests:

Test A: The Happy Path (Atomicity)
Enter Amount: $100.

Ensure "Simulate Failure" is OFF.

Click Execute Transaction.

Result: Node A decreases ($900), Node B increases ($100). Status logs show Global Commit.

Test B: The Integrity Check (Failure Handling)
Toggle ON "Simulate Network Failure".

Click Execute Transaction.

Result:

Node A temporarily locks funds (Phase 1).

Node B fails to respond.

Coordinator detects failure and sends ROLLBACK.

Node A returns to original balance ($900). No money is lost.

📂 Project Structure
distinct-db-transaction/
├── app/
│   ├── Services/
│   │   └── TwoPhaseCommitService.php  <-- The Core 2PC Algorithm
│   ├── Models/
│   │   ├── AccountNodeA.php           <-- Connection to DB 1
│   │   └── AccountNodeB.php           <-- Connection to DB 2
│   └── Http/Controllers/Api/          <-- API Endpoints
├── config/
│   └── database.php                   <-- Multi-connection setup
├── database/
│   ├── node_a.sqlite                  <-- Physical File for Node A
│   └── node_b.sqlite                  <-- Physical File for Node B
└── transaction-dashboard/             <-- React Frontend
    └── src/App.jsx                    <-- Dashboard Logic
📚 References
This implementation is based on the analysis provided in:

Patel, S., Choudhary, J., & Patil, G. (2023). Revolution of Database Management System: A Literature Survey. International Journal of Engineering Trends and Technology. 

Specific concepts implemented:


ACID Properties in NewSQL: Addressing the need for greater integrity approaches.


Shared-Nothing Architecture: Simulating independent nodes.


Predictability: Ensuring consistent data states in real-time.
