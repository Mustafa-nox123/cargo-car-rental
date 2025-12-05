-- Sample Data for CarGo Car Rental System
-- Run this after creating all tables

-- Insert Branches
INSERT INTO Branch (name, city, address) VALUES ('CarGo Downtown', 'Karachi', 'Main Boulevard, Gulshan-e-Iqbal');
INSERT INTO Branch (name, city, address) VALUES ('CarGo Airport', 'Karachi', 'Jinnah International Airport');
INSERT INTO Branch (name, city, address) VALUES ('CarGo Clifton', 'Karachi', 'Clifton Block 5, Main Road');

-- Insert Categories
INSERT INTO Category (name, description) VALUES ('Economy', 'Fuel-efficient compact cars perfect for city driving');
INSERT INTO Category (name, description) VALUES ('SUV', 'Spacious SUVs ideal for families and long trips');
INSERT INTO Category (name, description) VALUES ('Luxury', 'Premium vehicles with advanced features');

-- Insert Rate Plans (assuming category_id 1=Economy, 2=SUV, 3=Luxury)
-- Weekday rates
INSERT INTO RatePlan (category_id, day_type, base_daily_rate, single_day_base_rate, extra_hour_rate, deposit_amount, effective_from, effective_to)
VALUES (1, 'weekday', 4000, 4500, 300, 8000, SYSDATE, ADD_MONTHS(SYSDATE, 12));

INSERT INTO RatePlan (category_id, day_type, base_daily_rate, single_day_base_rate, extra_hour_rate, deposit_amount, effective_from, effective_to)
VALUES (2, 'weekday', 6000, 6500, 500, 12000, SYSDATE, ADD_MONTHS(SYSDATE, 12));

INSERT INTO RatePlan (category_id, day_type, base_daily_rate, single_day_base_rate, extra_hour_rate, deposit_amount, effective_from, effective_to)
VALUES (3, 'weekday', 10000, 11000, 800, 20000, SYSDATE, ADD_MONTHS(SYSDATE, 12));

-- Weekend rates
INSERT INTO RatePlan (category_id, day_type, base_daily_rate, single_day_base_rate, extra_hour_rate, deposit_amount, effective_from, effective_to)
VALUES (1, 'weekend', 4500, 5000, 350, 8000, SYSDATE, ADD_MONTHS(SYSDATE, 12));

INSERT INTO RatePlan (category_id, day_type, base_daily_rate, single_day_base_rate, extra_hour_rate, deposit_amount, effective_from, effective_to)
VALUES (2, 'weekend', 6500, 7000, 550, 12000, SYSDATE, ADD_MONTHS(SYSDATE, 12));

INSERT INTO RatePlan (category_id, day_type, base_daily_rate, single_day_base_rate, extra_hour_rate, deposit_amount, effective_from, effective_to)
VALUES (3, 'weekend', 11000, 12000, 900, 20000, SYSDATE, ADD_MONTHS(SYSDATE, 12));

-- Insert Cars (assuming branch_id 1,2,3 and category_id 1,2,3)
-- Economy Cars
INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-1001', 'Toyota', 'Corolla', 2023, 'VIN123456789ABC01', 1, 1, 15000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-1002', 'Honda', 'Civic', 2023, 'VIN123456789ABC02', 1, 1, 12000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-1003', 'Suzuki', 'Swift', 2024, 'VIN123456789ABC03', 1, 2, 8000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-1004', 'Toyota', 'Yaris', 2023, 'VIN123456789ABC04', 1, 3, 20000, 'Available');

-- SUV Cars
INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-2001', 'Toyota', 'Fortuner', 2024, 'VIN123456789DEF01', 2, 1, 5000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-2002', 'Honda', 'CR-V', 2023, 'VIN123456789DEF02', 2, 2, 18000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-2003', 'Kia', 'Sportage', 2024, 'VIN123456789DEF03', 2, 2, 10000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-2004', 'Hyundai', 'Tucson', 2023, 'VIN123456789DEF04', 2, 3, 22000, 'Available');

-- Luxury Cars
INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-3001', 'Mercedes', 'E-Class', 2024, 'VIN123456789GHI01', 3, 1, 3000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-3002', 'BMW', '5 Series', 2024, 'VIN123456789GHI02', 3, 2, 2500, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-3003', 'Audi', 'A6', 2023, 'VIN123456789GHI03', 3, 3, 8000, 'Available');

INSERT INTO Car (reg_no, make, model, year, vin, category_id, branch_id, odometer, status)
VALUES ('KHI-2024-3004', 'Lexus', 'ES', 2024, 'VIN123456789GHI04', 3, 1, 4000, 'Available');

-- Commit the changes
COMMIT;

-- Verify data
SELECT 'Branches', COUNT(*) FROM Branch
UNION ALL
SELECT 'Categories', COUNT(*) FROM Category
UNION ALL
SELECT 'Rate Plans', COUNT(*) FROM RatePlan
UNION ALL
SELECT 'Cars', COUNT(*) FROM Car;