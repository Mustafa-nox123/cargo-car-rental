
# **Table of Contents**

1. Authentication Queries
2. Branch & Vehicle Reference Queries
3. Reservation Queries
4. Rental Queries
5. Payment Queries
6. Maintenance Queries
7. Stored Procedures
8. Functions
9. Triggers
10. Indexing Strategy
11. Views (Optional)
12. Summary of SQL Patterns

---

# **1. Authentication Queries**

## **1.1 User Registration**

**Purpose:** Create a new customer account in the system.

```sql
INSERT INTO customer (
   first_name, last_name, email, password,
   phone_no, license_no, license_expiry, address, national_id
)
VALUES (
   :first_name, :last_name, :email, :password,
   :phone_no, :license_no,
   TO_DATE(:license_expiry, 'YYYY-MM-DD'),
   :address, :national_id
)
RETURNING customer_id INTO :id;
```

### **Parameters**

* `:first_name, :last_name` — Customer name split for storage
* `:email` — Unique email identifier
* `:password` — Bcrypt-hashed password
* `:license_no`, `:license_expiry` — Required for renting vehicles
* `:address`, `:national_id` — Additional ID details

### **How it contributes**

* Creates customer identity for login and reservations
* Ensures license verification before rentals
* Enforces unique email via database constraint

---

## **1.2 Check Existing User**

```sql
SELECT customer_id 
FROM customer 
WHERE email = :email;
```

### **Purpose**

* Prevent duplicate registrations
* Speed up login lookup

### **Returns**

* `customer_id` if email exists
* Empty result if not

---

## **1.3 Login Query**

```sql
SELECT customer_id, first_name, last_name, email, password
FROM customer
WHERE email = :email;
```

### **How it contributes**

* Retrieves hashed password for verification
* Fetches user identity for token generation

---

# **2. Branch & Vehicle Reference Queries**

## **2.1 Get All Branches**

```sql
SELECT branch_id, branch_name, city, address_line, phone_no
FROM branch
ORDER BY city, branch_name;
```

### **Purpose**

* Populate pickup/drop-off lists
* Show all service locations

---

## **2.2 Get Vehicle Types**

```sql
SELECT vehicle_type_id, type_name, daily_rate, description
FROM vehicle_type
ORDER BY daily_rate;
```

### **Purpose**

* Display categories (Economy, SUV, Luxury)
* Used in pricing and vehicle filtering

---

# **3. Vehicle Availability Queries**

## **3.1 Check Available Vehicles**

```sql
SELECT v.vehicle_id,
       v.registration_no,
       v.make,
       v.model,
       v.year_made,
       vt.type_name,
       vt.description,
       vt.daily_rate,
       b.branch_name,
       b.city,
       v.status
FROM vehicle v
JOIN vehicle_type vt ON vt.vehicle_type_id = v.vehicle_type_id
JOIN branch b ON b.branch_id = v.branch_id
WHERE v.status = 'AVAILABLE'
  AND (:vehicle_type_id IS NULL OR v.vehicle_type_id = :vehicle_type_id)
  AND (:branch_id IS NULL OR v.branch_id = :branch_id)
  AND v.vehicle_id NOT IN (
        SELECT r.vehicle_id
        FROM reservation r
        WHERE r.status IN ('BOOKED','CONVERTED')
          AND ( r.start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
            AND r.end_date   >= TO_DATE(:start_date, 'YYYY-MM-DD'))
  );
```

### **Purpose**

* Real-time check of which vehicles can be rented
* Prevents double-booking
* Supports filtering by type + branch + date

---

# **4. Reservation Queries**

## **4.1 Check Car Availability (specific vehicle)**

```sql
SELECT reservation_id
FROM reservation
WHERE vehicle_id = :vehicle_id
  AND status IN ('BOOKED','CONVERTED')
  AND (
        start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
    AND end_date   >= TO_DATE(:start_date, 'YYYY-MM-DD')
  );
```

### **Purpose**

* Ensures the selected vehicle is not already rented
* Prevents overlapping bookings

---

## **4.2 Create Reservation**

```sql
INSERT INTO reservation (
   customer_id, vehicle_id, pickup_branch_id, dropoff_branch_id,
   start_date, end_date, status
)
VALUES (
   :customer_id, :vehicle_id, :pickup_branch_id, :dropoff_branch_id,
   TO_DATE(:start_date, 'YYYY-MM-DD'),
   TO_DATE(:end_date, 'YYYY-MM-DD'),
   'BOOKED'
)
RETURNING reservation_id INTO :res_id;
```

### **Purpose**

* Records customer intent to rent
* Used later to generate a rental

---

## **4.3 Get Customer’s Reservations**

```sql
SELECT r.reservation_id,
       r.start_date,
       r.end_date,
       r.status,
       v.make,
       v.model,
       v.registration_no,
       pb.branch_name AS pickup_branch,
       db.branch_name AS dropoff_branch
FROM reservation r
JOIN vehicle v ON r.vehicle_id = v.vehicle_id
JOIN branch pb ON r.pickup_branch_id = pb.branch_id
JOIN branch db ON r.dropoff_branch_id = db.branch_id
WHERE r.customer_id = :customer_id
ORDER BY r.start_date DESC;
```

### **Purpose**

* Displays booking history in the user dashboard

---

# **5. Rental Queries**

## **5.1 Rental Creation (within procedure START_RENTAL)**

```sql
INSERT INTO rental (
   reservation_id, customer_id, vehicle_id,
   pickup_datetime, dropoff_datetime,
   pickup_branch_id, dropoff_branch_id,
   total_amount, status
)
VALUES (
   p_reservation_id, v_customer_id, v_vehicle_id,
   NVL(p_pickup_date, SYSDATE), NULL,
   v_pickup_branch, v_dropoff_branch,
   NULL, 'OPEN'
)
RETURNING rental_id INTO p_rental_id;
```

### **Purpose**

* Converts a reservation into an active rental
* Sets pickup timestamp
* Vehicle status becomes RENTED via trigger

---

# **6. Payment Queries**

## **6.1 Make Payment (Simplified, actual logic inside `MAKE_PAYMENT`)**

```sql
INSERT INTO payment (
   payment_id, rental_id, payment_date, amount, method, remarks
)
VALUES (
   payment_seq.NEXTVAL, :rental_id, SYSDATE, :amount, :method, :remarks
);
```

### **Purpose**

* Records payments during or after rental
* Supports multiple payment events per rental

---

# **7. Maintenance Queries**

## **7.1 Insert Maintenance Record**

```sql
INSERT INTO maintenance (
   maintenance_id, vehicle_id, start_date, end_date, description, cost
)
VALUES (
   maintenance_seq.NEXTVAL, :vehicle_id, :start_date, :end_date, :description, :cost
);
```

### **Contribution**

* Logs mechanical servicing
* Triggers automatically update vehicle status

---

# **8. Stored Procedures**

## **8.1 START_RENTAL Procedure**

**Purpose:** Convert reservation → active rental.

### **Key Operations**

* Validate reservation
* Validate vehicle availability
* Insert rental
* Update reservation to "CONVERTED"
* Update vehicle to "RENTED"

### **Contribution**

* Central business workflow
* Ensures clean transition from booking to rental

---

## **8.2 CLOSE_RENTAL Procedure**

**Purpose:** Complete rental & compute charges.

### **Key Steps**

* Lock rental record
* Calculate amount using `COMPUTE_RENTAL_AMOUNT`
* Update rental row
* Move vehicle to dropoff branch
* Set vehicle status back to AVAILABLE

---

## **8.3 MAKE_PAYMENT Procedure**

**Purpose:** Insert payment entry for a rental.

---

# **9. Functions**

## **9.1 CALC_BILLABLE_DAYS**

```sql
RETURN CEIL(p_end_date - p_start_date);
```

* Ensures minimum 1 day billing
* Rounds partial days upward

---

## **9.2 COMPUTE_RENTAL_AMOUNT**

```sql
total_amount := v_daily_rate * v_days;
```

* Fetches rate from vehicle type
* Uses CALC_BILLABLE_DAYS
* Computes total rental cost

---

# **10. Triggers**

## **10.1 TRG_RENTAL_AI – After Insert Rental**

* Vehicle status → RENTED
* Reservation → CONVERTED

---

## **10.2 TRG_RENTAL_AU_CLOSE – After Rental Closed**

* Vehicle status → AVAILABLE
* Vehicle moves branch

---

## **10.3 TRG_MAINT_AI – After Maintenance Insert**

* Vehicle status → MAINTENANCE

---

## **10.4 TRG_MAINT_AU – After Maintenance Update**

* When end_date filled → AVAILABLE

---

# **11. Indexing Strategy**

```sql
CREATE INDEX idx_vehicle_status ON vehicle(status);
CREATE INDEX idx_vehicle_branch ON vehicle(branch_id);
CREATE INDEX idx_reservation_vehicle ON reservation(vehicle_id);
CREATE INDEX idx_reservation_dates ON reservation(start_date, end_date);
CREATE INDEX idx_rental_customer ON rental(customer_id);
CREATE INDEX idx_payment_rental ON payment(rental_id);
```

### **Contribution**

* Fast availability checking
* Faster reservation lookup
* Efficient join performance

---

# **12. Summary of SQL Usage Patterns**

| Pattern         | Use Case                                 |
| --------------- | ---------------------------------------- |
| Bind parameters | Prevent SQL injection                    |
| JOINs           | Combine vehicle, branch, customer data   |
| Subqueries      | Detect reservation overlaps              |
| Triggers        | Automate status updates                  |
| Procedures      | Control business logic (rental workflow) |
| Functions       | Reusable billing logic                   |
| Indexes         | Performance optimization                 |

---
