-- ============================================
-- Sample Data for Enhanced Analytics Dashboard
-- ============================================
-- This script inserts realistic sample data for demonstration purposes
-- Run this AFTER running create_analytics_tables.sql

USE DATABASE GATEGROUP_DB;
USE SCHEMA PUBLIC;

-- ============================================
-- 1. INVENTORY_SESSIONS (30 days of sample sessions)
-- ============================================
INSERT INTO INVENTORY_SESSIONS (SESSION_ID, USER_ID, FLIGHT_NUMBER, CART_IDENTIFIER, START_TIME, END_TIME, DURATION_MINUTES, ITEMS_VALIDATED, ERRORS_FOUND, ACCURACY_SCORE, NOTES)
VALUES
-- Employee 1 (employee@gategroup.com) - Good performer
('sess_001', 'employee@gategroup.com', 'AA1234', 'CART-A1', DATEADD(day, -30, CURRENT_TIMESTAMP()), DATEADD(day, -30, CURRENT_TIMESTAMP()) + INTERVAL '45 minutes', 45, 65, 1, 98.5, 'Completed successfully'),
('sess_002', 'employee@gategroup.com', 'UA5678', 'CART-B2', DATEADD(day, -29, CURRENT_TIMESTAMP()), DATEADD(day, -29, CURRENT_TIMESTAMP()) + INTERVAL '42 minutes', 42, 68, 0, 100.0, 'Perfect validation'),
('sess_003', 'employee@gategroup.com', 'DL9012', 'CART-C3', DATEADD(day, -28, CURRENT_TIMESTAMP()), DATEADD(day, -28, CURRENT_TIMESTAMP()) + INTERVAL '48 minutes', 48, 62, 2, 96.8, 'Minor errors detected'),
('sess_004', 'employee@gategroup.com', 'AA2345', 'CART-D4', DATEADD(day, -27, CURRENT_TIMESTAMP()), DATEADD(day, -27, CURRENT_TIMESTAMP()) + INTERVAL '40 minutes', 40, 70, 1, 98.6, 'Good performance'),
('sess_005', 'employee@gategroup.com', 'UA6789', 'CART-E5', DATEADD(day, -26, CURRENT_TIMESTAMP()), DATEADD(day, -26, CURRENT_TIMESTAMP()) + INTERVAL '44 minutes', 44, 66, 0, 100.0, 'Excellent work'),

-- Employee 2 (employee2@gategroup.com) - Needs improvement
('sess_006', 'employee2@gategroup.com', 'AA3456', 'CART-F6', DATEADD(day, -30, CURRENT_TIMESTAMP()), DATEADD(day, -30, CURRENT_TIMESTAMP()) + INTERVAL '65 minutes', 65, 58, 5, 91.4, 'Multiple errors found'),
('sess_007', 'employee2@gategroup.com', 'DL0123', 'CART-G7', DATEADD(day, -29, CURRENT_TIMESTAMP()), DATEADD(day, -29, CURRENT_TIMESTAMP()) + INTERVAL '70 minutes', 70, 55, 6, 89.1, 'Slow performance'),
('sess_008', 'employee2@gategroup.com', 'UA7890', 'CART-H8', DATEADD(day, -28, CURRENT_TIMESTAMP()), DATEADD(day, -28, CURRENT_TIMESTAMP()) + INTERVAL '62 minutes', 62, 60, 4, 93.3, 'Needs training'),
('sess_009', 'employee2@gategroup.com', 'AA4567', 'CART-I9', DATEADD(day, -27, CURRENT_TIMESTAMP()), DATEADD(day, -27, CURRENT_TIMESTAMP()) + INTERVAL '68 minutes', 68, 56, 5, 91.1, 'Error patterns detected'),
('sess_010', 'employee2@gategroup.com', 'DL1234', 'CART-J10', DATEADD(day, -26, CURRENT_TIMESTAMP()), DATEADD(day, -26, CURRENT_TIMESTAMP()) + INTERVAL '66 minutes', 66, 57, 4, 93.0, 'Improving slightly'),

-- Employee 3 (employee3@gategroup.com) - Average performer
('sess_011', 'employee3@gategroup.com', 'UA8901', 'CART-K11', DATEADD(day, -30, CURRENT_TIMESTAMP()), DATEADD(day, -30, CURRENT_TIMESTAMP()) + INTERVAL '52 minutes', 52, 63, 2, 96.8, 'Standard performance'),
('sess_012', 'employee3@gategroup.com', 'AA5678', 'CART-L12', DATEADD(day, -29, CURRENT_TIMESTAMP()), DATEADD(day, -29, CURRENT_TIMESTAMP()) + INTERVAL '55 minutes', 55, 61, 3, 95.1, 'Average work'),
('sess_013', 'employee3@gategroup.com', 'DL2345', 'CART-M13', DATEADD(day, -28, CURRENT_TIMESTAMP()), DATEADD(day, -28, CURRENT_TIMESTAMP()) + INTERVAL '50 minutes', 50, 64, 2, 96.9, 'Good session'),
('sess_014', 'employee3@gategroup.com', 'UA9012', 'CART-N14', DATEADD(day, -27, CURRENT_TIMESTAMP()), DATEADD(day, -27, CURRENT_TIMESTAMP()) + INTERVAL '53 minutes', 53, 62, 2, 96.8, 'Consistent results'),
('sess_015', 'employee3@gategroup.com', 'AA6789', 'CART-O15', DATEADD(day, -26, CURRENT_TIMESTAMP()), DATEADD(day, -26, CURRENT_TIMESTAMP()) + INTERVAL '51 minutes', 51, 63, 2, 96.8, 'Steady performance'),

-- Recent sessions for all employees (last 7 days)
('sess_016', 'employee@gategroup.com', 'AA7890', 'CART-P16', DATEADD(day, -6, CURRENT_TIMESTAMP()), DATEADD(day, -6, CURRENT_TIMESTAMP()) + INTERVAL '43 minutes', 43, 67, 1, 98.5, 'Recent excellent work'),
('sess_017', 'employee2@gategroup.com', 'DL3456', 'CART-Q17', DATEADD(day, -5, CURRENT_TIMESTAMP()), DATEADD(day, -5, CURRENT_TIMESTAMP()) + INTERVAL '64 minutes', 64, 59, 4, 93.2, 'Still needs improvement'),
('sess_018', 'employee3@gategroup.com', 'UA0123', 'CART-R18', DATEADD(day, -4, CURRENT_TIMESTAMP()), DATEADD(day, -4, CURRENT_TIMESTAMP()) + INTERVAL '52 minutes', 52, 63, 2, 96.8, 'Consistent as always'),
('sess_019', 'employee@gategroup.com', 'AA8901', 'CART-S19', DATEADD(day, -3, CURRENT_TIMESTAMP()), DATEADD(day, -3, CURRENT_TIMESTAMP()) + INTERVAL '41 minutes', 41, 69, 0, 100.0, 'Perfect session'),
('sess_020', 'employee2@gategroup.com', 'DL4567', 'CART-T20', DATEADD(day, -2, CURRENT_TIMESTAMP()), DATEADD(day, -2, CURRENT_TIMESTAMP()) + INTERVAL '67 minutes', 67, 57, 5, 91.2, 'Ongoing issues'),
('sess_021', 'employee3@gategroup.com', 'UA1234', 'CART-U21', DATEADD(day, -1, CURRENT_TIMESTAMP()), DATEADD(day, -1, CURRENT_TIMESTAMP()) + INTERVAL '51 minutes', 51, 63, 2, 96.8, 'Standard work'),
('sess_022', 'employee@gategroup.com', 'AA9012', 'CART-V22', CURRENT_TIMESTAMP() - INTERVAL '2 hours', CURRENT_TIMESTAMP() - INTERVAL '2 hours' + INTERVAL '44 minutes', 44, 66, 1, 98.5, 'Today excellent'),
('sess_023', 'employee2@gategroup.com', 'DL5678', 'CART-W23', CURRENT_TIMESTAMP() - INTERVAL '1 hour', CURRENT_TIMESTAMP() - INTERVAL '1 hour' + INTERVAL '65 minutes', 65, 58, 4, 93.1, 'Today needs work');

-- ============================================
-- 2. EMPLOYEE_PERFORMANCE_METRICS (Daily aggregated data for 30 days)
-- ============================================
-- Generate daily metrics for each employee over the past 30 days
-- Employee 1: High performer (1.4-1.6 items/hour, 0.5-1.5% error rate)
INSERT INTO EMPLOYEE_PERFORMANCE_METRICS (METRIC_ID, USER_ID, METRIC_DATE, SESSIONS_COMPLETED, TOTAL_ITEMS_VALIDATED, TOTAL_ERRORS, AVG_SESSION_DURATION, ITEMS_PER_HOUR, ERROR_RATE, ACCURACY_SCORE, PERFORMANCE_SCORE)
SELECT
    'metric_emp1_' || SEQ4() AS METRIC_ID,
    'employee@gategroup.com' AS USER_ID,
    DATEADD(day, -SEQ4(), CURRENT_DATE()) AS METRIC_DATE,
    1 + FLOOR(UNIFORM(0, 2, RANDOM())) AS SESSIONS_COMPLETED,
    64 + FLOOR(UNIFORM(0, 8, RANDOM())) AS TOTAL_ITEMS_VALIDATED,
    FLOOR(UNIFORM(0, 2, RANDOM())) AS TOTAL_ERRORS,
    43 + FLOOR(UNIFORM(-3, 5, RANDOM())) AS AVG_SESSION_DURATION,
    1.40 + UNIFORM(0, 0.20, RANDOM()) AS ITEMS_PER_HOUR,
    0.5 + UNIFORM(0, 1.0, RANDOM()) AS ERROR_RATE,
    98.0 + UNIFORM(0, 2.0, RANDOM()) AS ACCURACY_SCORE,
    85.0 + UNIFORM(0, 10.0, RANDOM()) AS PERFORMANCE_SCORE
FROM TABLE(GENERATOR(ROWCOUNT => 30));

-- Employee 2: Lower performer (0.8-1.0 items/hour, 3.0-5.0% error rate)
INSERT INTO EMPLOYEE_PERFORMANCE_METRICS (METRIC_ID, USER_ID, METRIC_DATE, SESSIONS_COMPLETED, TOTAL_ITEMS_VALIDATED, TOTAL_ERRORS, AVG_SESSION_DURATION, ITEMS_PER_HOUR, ERROR_RATE, ACCURACY_SCORE, PERFORMANCE_SCORE)
SELECT
    'metric_emp2_' || SEQ4() AS METRIC_ID,
    'employee2@gategroup.com' AS USER_ID,
    DATEADD(day, -SEQ4(), CURRENT_DATE()) AS METRIC_DATE,
    1 + FLOOR(UNIFORM(0, 2, RANDOM())) AS SESSIONS_COMPLETED,
    56 + FLOOR(UNIFORM(0, 6, RANDOM())) AS TOTAL_ITEMS_VALIDATED,
    3 + FLOOR(UNIFORM(0, 3, RANDOM())) AS TOTAL_ERRORS,
    65 + FLOOR(UNIFORM(-3, 5, RANDOM())) AS AVG_SESSION_DURATION,
    0.80 + UNIFORM(0, 0.20, RANDOM()) AS ITEMS_PER_HOUR,
    3.0 + UNIFORM(0, 2.0, RANDOM()) AS ERROR_RATE,
    90.0 + UNIFORM(0, 3.0, RANDOM()) AS ACCURACY_SCORE,
    65.0 + UNIFORM(0, 10.0, RANDOM()) AS PERFORMANCE_SCORE
FROM TABLE(GENERATOR(ROWCOUNT => 30));

-- Employee 3: Average performer (1.1-1.3 items/hour, 1.5-2.5% error rate)
INSERT INTO EMPLOYEE_PERFORMANCE_METRICS (METRIC_ID, USER_ID, METRIC_DATE, SESSIONS_COMPLETED, TOTAL_ITEMS_VALIDATED, TOTAL_ERRORS, AVG_SESSION_DURATION, ITEMS_PER_HOUR, ERROR_RATE, ACCURACY_SCORE, PERFORMANCE_SCORE)
SELECT
    'metric_emp3_' || SEQ4() AS METRIC_ID,
    'employee3@gategroup.com' AS USER_ID,
    DATEADD(day, -SEQ4(), CURRENT_DATE()) AS METRIC_DATE,
    1 + FLOOR(UNIFORM(0, 2, RANDOM())) AS SESSIONS_COMPLETED,
    62 + FLOOR(UNIFORM(0, 4, RANDOM())) AS TOTAL_ITEMS_VALIDATED,
    1 + FLOOR(UNIFORM(0, 2, RANDOM())) AS TOTAL_ERRORS,
    52 + FLOOR(UNIFORM(-2, 3, RANDOM())) AS AVG_SESSION_DURATION,
    1.10 + UNIFORM(0, 0.20, RANDOM()) AS ITEMS_PER_HOUR,
    1.5 + UNIFORM(0, 1.0, RANDOM()) AS ERROR_RATE,
    96.0 + UNIFORM(0, 2.0, RANDOM()) AS ACCURACY_SCORE,
    78.0 + UNIFORM(0, 8.0, RANDOM()) AS PERFORMANCE_SCORE
FROM TABLE(GENERATOR(ROWCOUNT => 30));

-- ============================================
-- 3. ERROR_LOG (Various error types and severities)
-- ============================================
INSERT INTO ERROR_LOG (ERROR_ID, SESSION_ID, USER_ID, ERROR_TYPE, ERROR_DESCRIPTION, SEVERITY, PRODUCT_SKU, EXPECTED_QUANTITY, ACTUAL_QUANTITY, RESOLUTION_STATUS, RESOLVED_AT, NOTES)
VALUES
-- Missing items errors
('err_001', 'sess_006', 'employee2@gategroup.com', 'missing_item', 'Canelitas missing from cart', 'high', 'canelitas_35g', 5, 3, 'resolved', DATEADD(minute, 10, DATEADD(day, -30, CURRENT_TIMESTAMP())), 'Items found in wrong compartment'),
('err_002', 'sess_008', 'employee2@gategroup.com', 'missing_item', 'Chocolate cookies not detected', 'high', 'galletas_choco_50g', 8, 6, 'resolved', DATEADD(minute, 15, DATEADD(day, -28, CURRENT_TIMESTAMP())), 'Items were hidden behind other products'),
('err_003', 'sess_020', 'employee2@gategroup.com', 'missing_item', 'Mini pretzels missing', 'high', 'pretzels_mini_40g', 6, 4, 'pending', NULL, 'Under investigation'),

-- Weight discrepancies
('err_004', 'sess_003', 'employee@gategroup.com', 'weight_discrepancy', 'Weight mismatch for juice boxes', 'medium', 'jugo_manzana_200ml', 10, 10, 'resolved', DATEADD(minute, 5, DATEADD(day, -28, CURRENT_TIMESTAMP())), 'Scale calibration issue'),
('err_005', 'sess_007', 'employee2@gategroup.com', 'weight_discrepancy', 'Sandwich weight incorrect', 'medium', 'sandwich_jamon_150g', 4, 4, 'resolved', DATEADD(minute, 12, DATEADD(day, -29, CURRENT_TIMESTAMP())), 'Packaging variation'),
('err_006', 'sess_017', 'employee2@gategroup.com', 'weight_discrepancy', 'Snack weight off', 'medium', 'papas_sal_45g', 12, 12, 'resolved', DATEADD(minute, 8, DATEADD(day, -5, CURRENT_TIMESTAMP())), 'Acceptable variance'),

-- Damaged items
('err_007', 'sess_009', 'employee2@gategroup.com', 'damaged_item', 'Crushed cookie packages', 'high', 'galletas_choco_50g', 8, 6, 'resolved', DATEADD(minute, 20, DATEADD(day, -27, CURRENT_TIMESTAMP())), 'Replaced damaged items'),
('err_008', 'sess_011', 'employee3@gategroup.com', 'damaged_item', 'Leaking juice container', 'high', 'jugo_naranja_200ml', 10, 9, 'resolved', DATEADD(minute, 18, DATEADD(day, -30, CURRENT_TIMESTAMP())), 'Removed and documented'),

-- Wrong items
('err_009', 'sess_012', 'employee3@gategroup.com', 'wrong_item', 'Orange juice instead of apple', 'medium', 'jugo_manzana_200ml', 10, 0, 'resolved', DATEADD(minute, 25, DATEADD(day, -29, CURRENT_TIMESTAMP())), 'Corrected inventory'),
('err_010', 'sess_013', 'employee3@gategroup.com', 'wrong_item', 'Wrong sandwich type', 'low', 'sandwich_pavo_150g', 4, 0, 'resolved', DATEADD(minute, 10, DATEADD(day, -28, CURRENT_TIMESTAMP())), 'Swapped items'),

-- Quantity mismatches
('err_011', 'sess_001', 'employee@gategroup.com', 'quantity_mismatch', 'Extra water bottles found', 'low', 'agua_500ml', 15, 16, 'resolved', DATEADD(minute, 5, DATEADD(day, -30, CURRENT_TIMESTAMP())), 'Documented extra item'),
('err_012', 'sess_014', 'employee3@gategroup.com', 'quantity_mismatch', 'Fewer napkins than expected', 'low', 'servilletas_pack', 20, 18, 'resolved', DATEADD(minute, 3, DATEADD(day, -27, CURRENT_TIMESTAMP())), 'Within acceptable range'),
('err_013', 'sess_016', 'employee@gategroup.com', 'quantity_mismatch', 'Coffee cup count off', 'low', 'vasos_cafe_240ml', 30, 29, 'resolved', DATEADD(minute, 2, DATEADD(day, -6, CURRENT_TIMESTAMP())), 'Minor discrepancy'),

-- Expiration issues
('err_014', 'sess_018', 'employee3@gategroup.com', 'expiration_warning', 'Products expiring soon', 'medium', 'sandwich_jamon_150g', 4, 4, 'resolved', DATEADD(minute, 15, DATEADD(day, -4, CURRENT_TIMESTAMP())), 'Flagged for priority use'),
('err_015', 'sess_020', 'employee2@gategroup.com', 'expiration_warning', 'Near expiration yogurt', 'medium', 'yogurt_vainilla_125g', 6, 6, 'pending', NULL, 'Awaiting supervisor review'),

-- Recent errors
('err_016', 'sess_022', 'employee@gategroup.com', 'quantity_mismatch', 'Condiment packet count', 'low', 'sal_paquete', 50, 48, 'resolved', CURRENT_TIMESTAMP() - INTERVAL '1 hour', 'Acceptable variance'),
('err_017', 'sess_023', 'employee2@gategroup.com', 'missing_item', 'Chips missing from cart', 'high', 'papas_sal_45g', 12, 10, 'pending', NULL, 'Currently investigating');

-- ============================================
-- 4. TRAINING_NEEDS (Identified based on error patterns)
-- ============================================
INSERT INTO TRAINING_NEEDS (TRAINING_ID, USER_ID, IDENTIFIED_DATE, SKILL_GAP, RECOMMENDED_TRAINING, PRIORITY, STATUS, NOTES)
VALUES
('train_001', 'employee2@gategroup.com', DATEADD(day, -25, CURRENT_DATE()), 'Item Detection', 'Visual Inspection Techniques - Advanced', 'high', 'scheduled', 'Multiple missing item errors detected. Training scheduled for next week.'),
('train_002', 'employee2@gategroup.com', DATEADD(day, -20, CURRENT_DATE()), 'Speed Optimization', 'Efficient Cart Validation Methods', 'medium', 'scheduled', 'Session duration consistently above target. Focus on workflow optimization.'),
('train_003', 'employee3@gategroup.com', DATEADD(day, -15, CURRENT_DATE()), 'Error Identification', 'Quality Assurance Best Practices', 'low', 'pending', 'Minor improvement opportunity in error detection accuracy.'),
('train_004', 'employee2@gategroup.com', DATEADD(day, -10, CURRENT_DATE()), 'System Usage', 'SmartStation Platform Advanced Features', 'high', 'scheduled', 'Needs better understanding of system capabilities to reduce validation time.'),
('train_005', 'employee3@gategroup.com', DATEADD(day, -5, CURRENT_DATE()), 'Product Knowledge', 'Airline Catering Product Catalog Training', 'medium', 'pending', 'Occasional product confusion. Refresher training recommended.');

-- ============================================
-- 5. AI_CHAT_HISTORY (Sample conversations)
-- ============================================
INSERT INTO AI_CHAT_HISTORY (CHAT_ID, SESSION_ID, USER_ID, USER_MESSAGE, AI_RESPONSE, CONTEXT_DATA, CREATED_AT)
VALUES
('chat_001', 'chat-session-1', 'supervisor@gategroup.com',
 'Analyze the current performance trends',
 'Based on the last 30 days of data:\n\n📊 Performance Overview:\n- Employee 1 (employee@gategroup.com): Excellent performer with 1.5 items/hour and 0.8% error rate\n- Employee 2 (employee2@gategroup.com): Needs improvement - 0.9 items/hour with 4.2% error rate\n- Employee 3 (employee3@gategroup.com): Average performer - 1.2 items/hour with 2.1% error rate\n\n🎯 Key Insights:\n1. Employee 2 shows consistent patterns of missing items and slow validation times\n2. Overall team accuracy is trending upward (+2.3% vs last month)\n3. Peak error times are between 2-4 PM (fatigue factor)\n\n💡 Recommendations:\n- Schedule targeted training for Employee 2 on visual inspection\n- Consider afternoon break adjustments\n- Implement peer mentoring program',
 '{"avgErrorRate": 2.37, "avgItemsPerHour": 1.2}',
 DATEADD(day, -10, CURRENT_TIMESTAMP())),

('chat_002', 'chat-session-2', 'supervisor@gategroup.com',
 'Who needs training and why?',
 '🎓 Training Recommendations:\n\n**High Priority:**\n- **Employee 2** (employee2@gategroup.com)\n  - Issue: 4.2% error rate (target: <1.5%)\n  - Skills needed: Item detection, speed optimization\n  - Suggested: Visual Inspection Techniques course + System usage training\n  - Timeline: Within 1 week\n\n**Medium Priority:**\n- **Employee 3** (employee3@gategroup.com)\n  - Issue: Occasional product confusion\n  - Skills needed: Product knowledge refresher\n  - Suggested: Product Catalog training\n  - Timeline: Within 2 weeks\n\n**Low Priority:**\n- Employee 1 is performing excellently and could serve as a mentor for others\n\n📈 Expected Impact: 30-40% reduction in error rates within 30 days of training completion.',
 '{"trainingNeeds": 2}',
 DATEADD(day, -8, CURRENT_TIMESTAMP())),

('chat_003', 'chat-session-3', 'supervisor@gategroup.com',
 'How can we reduce error rates?',
 '🎯 Error Reduction Strategy:\n\n**Immediate Actions (This Week):**\n1. ✅ Implement double-check system for high-value carts\n2. ✅ Add visual guides to common error-prone items\n3. ✅ Adjust lighting in validation area\n\n**Short-term (1 Month):**\n1. 📚 Complete training for Employee 2\n2. 🤝 Start peer mentoring program\n3. 📊 Weekly performance reviews\n\n**Long-term (3 Months):**\n1. 🤖 AI-assisted pre-validation alerts\n2. 📱 Mobile quick-reference app\n3. 🏆 Performance incentive program\n\n**Expected Results:**\n- Week 1: -15% error rate\n- Month 1: -30% error rate\n- Month 3: -50% error rate\n\nCurrent error rate: 2.37% → Target: <1.2%',
 '{"currentErrors": 17}',
 DATEADD(day, -5, CURRENT_TIMESTAMP())),

('chat_004', 'chat-session-4', 'supervisor@gategroup.com',
 'What is our sustainability impact?',
 '🌱 Sustainability Impact (Last 30 Days):\n\n**Environmental Savings:**\n- ♻️ Waste Reduced: 127.8 kg\n- 🌍 Carbon Footprint Reduced: 45.3 kg CO₂\n- 💰 Cost Savings: $1,247.50\n\n**Operational Efficiency:**\n- ⚡ Time Saved: 1,845 minutes (30.75 hours)\n- ✅ Errors Prevented: 347 incidents\n- 📈 Process Efficiency: 94.2%\n\n**Year Projection:**\n- Potential waste reduction: 1,533 kg/year\n- Carbon savings: 544 kg CO₂/year\n- Cost impact: $14,970/year\n\n**Impact Breakdown:**\n- Reduced food waste from damage prevention\n- Fewer cart remakes = less transportation emissions\n- Optimized inventory = reduced spoilage\n\n🎯 This positions GateGroup as a leader in sustainable airline catering operations!',
 '{"sustainabilityScore": 94.2}',
 DATEADD(day, -3, CURRENT_TIMESTAMP())),

('chat_005', 'chat-session-5', 'supervisor@gategroup.com',
 'Show me todays performance',
 '📊 Today\'s Performance Snapshot:\n\n**Sessions Completed Today: 3**\n\n1. Employee 1: ✅ Excellent\n   - 66 items in 44 minutes\n   - 1 minor error (98.5% accuracy)\n   - Status: On track\n\n2. Employee 2: ⚠️ Needs Attention\n   - 58 items in 65 minutes\n   - 4 errors (93.1% accuracy)\n   - Status: Below target\n\n3. Employee 3: Not yet started today\n\n**Today\'s Metrics:**\n- Avg items/hour: 1.15\n- Avg error rate: 2.8%\n- Avg session time: 54.5 min\n\n**Alerts:**\n- 🔴 Employee 2 session time 48% above target\n- 🟡 Error rate 87% above daily goal\n\n**Next Actions:**\n- Check in with Employee 2 during next break\n- Monitor afternoon performance (historically lower)',
 '{"todaySessions": 3}',
 DATEADD(hour, -2, CURRENT_TIMESTAMP()));

-- ============================================
-- 6. SUSTAINABILITY_METRICS (30 days of impact data)
-- ============================================
INSERT INTO SUSTAINABILITY_METRICS (METRIC_ID, METRIC_DATE, ERRORS_PREVENTED, WASTE_REDUCTION_KG, TIME_SAVED_MINUTES, COST_SAVINGS_USD, CARBON_FOOTPRINT_REDUCED_KG, PROCESS_EFFICIENCY_PERCENTAGE, NOTES)
SELECT
    'sustain_' || SEQ4() AS METRIC_ID,
    DATEADD(day, -SEQ4(), CURRENT_DATE()) AS METRIC_DATE,
    10 + FLOOR(UNIFORM(0, 10, RANDOM())) AS ERRORS_PREVENTED,
    3.5 + UNIFORM(0, 2.5, RANDOM()) AS WASTE_REDUCTION_KG,
    50 + FLOOR(UNIFORM(0, 40, RANDOM())) AS TIME_SAVED_MINUTES,
    35 + UNIFORM(0, 25, RANDOM()) AS COST_SAVINGS_USD,
    1.2 + UNIFORM(0, 0.8, RANDOM()) AS CARBON_FOOTPRINT_REDUCED_KG,
    90 + UNIFORM(0, 8, RANDOM()) AS PROCESS_EFFICIENCY_PERCENTAGE,
    'Daily sustainability tracking'
FROM TABLE(GENERATOR(ROWCOUNT => 30));

-- ============================================
-- 7. REAL_TIME_ALERTS (Active alerts for dashboard)
-- ============================================
INSERT INTO REAL_TIME_ALERTS (ALERT_ID, ALERT_TYPE, SEVERITY, TITLE, MESSAGE, USER_ID, FLIGHT_NUMBER, CREATED_AT, IS_ACKNOWLEDGED, ACKNOWLEDGED_AT, ACTION_REQUIRED)
VALUES
('alert_001', 'performance', 'high', 'Low Performance Detected', 'Employee 2 session time is 48% above target. Consider intervention or break.', 'employee2@gategroup.com', 'DL5678', DATEADD(hour, -1, CURRENT_TIMESTAMP()), FALSE, NULL, 'Check in with employee during next break'),
('alert_002', 'error_rate', 'medium', 'Error Rate Above Threshold', 'Employee 2 has 4 errors in current session (6.9% error rate). Target is <1.5%.', 'employee2@gategroup.com', 'DL5678', DATEADD(minute, -45, CURRENT_TIMESTAMP()), FALSE, NULL, 'Review validation process with employee'),
('alert_003', 'training', 'medium', 'Training Scheduled', 'Visual Inspection training scheduled for Employee 2 on Monday 9:00 AM.', 'employee2@gategroup.com', NULL, DATEADD(day, -2, CURRENT_TIMESTAMP()), TRUE, DATEADD(day, -2, CURRENT_TIMESTAMP()) + INTERVAL '30 minutes', 'Confirm attendance'),
('alert_004', 'system', 'low', 'Excellent Performance Streak', 'Employee 1 has maintained >98% accuracy for 15 consecutive sessions!', 'employee@gategroup.com', NULL, DATEADD(day, -1, CURRENT_TIMESTAMP()), TRUE, DATEADD(day, -1, CURRENT_TIMESTAMP()) + INTERVAL '2 hours', 'Consider recognition/reward'),
('alert_005', 'sustainability', 'low', 'Milestone Achieved', 'Team has prevented 350+ errors this month, saving $1,247 in waste!', NULL, NULL, DATEADD(hour, -6, CURRENT_TIMESTAMP()), FALSE, NULL, 'Share achievement with team');

-- ============================================
-- 8. PERFORMANCE_BENCHMARKS (Target thresholds)
-- ============================================
INSERT INTO PERFORMANCE_BENCHMARKS (BENCHMARK_ID, METRIC_NAME, TARGET_VALUE, THRESHOLD_GOOD, THRESHOLD_ACCEPTABLE, THRESHOLD_POOR, UNIT, CATEGORY, DESCRIPTION)
VALUES
('bench_001', 'Items Per Hour', 1.2, 1.2, 1.0, 0.8, 'items/hour', 'speed', 'Target cart validation speed'),
('bench_002', 'Error Rate', 1.5, 1.0, 1.5, 3.0, 'percentage', 'accuracy', 'Maximum acceptable error rate'),
('bench_003', 'Accuracy Score', 98.0, 98.0, 95.0, 90.0, 'percentage', 'quality', 'Overall accuracy target'),
('bench_004', 'Session Duration', 50, 45, 55, 65, 'minutes', 'speed', 'Target time per cart validation'),
('bench_005', 'Performance Score', 85.0, 85.0, 75.0, 65.0, 'score', 'overall', 'Composite performance metric'),
('bench_006', 'Daily Sessions', 6, 6, 5, 4, 'sessions', 'productivity', 'Expected sessions per employee per day');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment these to verify data was inserted correctly

-- SELECT 'Sessions' AS Table_Name, COUNT(*) AS Row_Count FROM INVENTORY_SESSIONS
-- UNION ALL
-- SELECT 'Performance Metrics', COUNT(*) FROM EMPLOYEE_PERFORMANCE_METRICS
-- UNION ALL
-- SELECT 'Errors', COUNT(*) FROM ERROR_LOG
-- UNION ALL
-- SELECT 'Training Needs', COUNT(*) FROM TRAINING_NEEDS
-- UNION ALL
-- SELECT 'Chat History', COUNT(*) FROM AI_CHAT_HISTORY
-- UNION ALL
-- SELECT 'Sustainability', COUNT(*) FROM SUSTAINABILITY_METRICS
-- UNION ALL
-- SELECT 'Alerts', COUNT(*) FROM REAL_TIME_ALERTS
-- UNION ALL
-- SELECT 'Benchmarks', COUNT(*) FROM PERFORMANCE_BENCHMARKS;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ Sample data inserted successfully! Dashboard is ready to display analytics.' AS STATUS;
