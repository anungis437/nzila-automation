-- Dues Calculation SQL Functions
-- PostgreSQL functions for calculating member dues, arrears, and totals

-- Function 1: Calculate Base Dues for a Member
CREATE OR REPLACE FUNCTION calculate_base_dues(
  p_member_id UUID,
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
  v_base_dues NUMERIC(10, 2);
  v_member_rate NUMERIC(10, 2);
  v_organization_rate NUMERIC(10, 2);
BEGIN
  -- Get member's dues rate (either from member record or organization)
  SELECT 
    COALESCE(m.custom_dues_rate, o.default_dues_rate, 50.00)
  INTO v_base_dues
  FROM members m
  JOIN organizations o ON m.organization_id = o.id
  WHERE m.id = p_member_id;

  RETURN COALESCE(v_base_dues, 50.00);
END;
$$ LANGUAGE plpgsql;

-- Function 2: Calculate Arrears (Overdue Amounts)
CREATE OR REPLACE FUNCTION calculate_arrears(
  p_member_id UUID,
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
  v_total_arrears NUMERIC(10, 2);
BEGIN
  -- Sum all overdue unpaid transactions
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_arrears
  FROM dues_transactions
  WHERE member_id = p_member_id
    AND status = 'pending'
    AND due_date < p_calculation_date;

  RETURN v_total_arrears;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Calculate Late Fees
CREATE OR REPLACE FUNCTION calculate_late_fees(
  p_member_id UUID,
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
  v_late_fees NUMERIC(10, 2);
  v_days_overdue INTEGER;
  v_late_fee_rate NUMERIC(5, 2);
BEGIN
  -- Get organization's late fee rate (default 2% per month)
  SELECT COALESCE(o.late_fee_rate, 0.02)
  INTO v_late_fee_rate
  FROM members m
  JOIN organizations o ON m.organization_id = o.id
  WHERE m.id = p_member_id;

  -- Calculate late fees for all overdue transactions
  SELECT COALESCE(SUM(
    CASE 
      WHEN due_date < p_calculation_date THEN
        total_amount * v_late_fee_rate * 
        CEIL((p_calculation_date - due_date) / 30.0)
      ELSE 0
    END
  ), 0)
  INTO v_late_fees
  FROM dues_transactions
  WHERE member_id = p_member_id
    AND status = 'pending'
    AND due_date < p_calculation_date;

  RETURN v_late_fees;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Calculate Total Due (Current + Arrears + Fees)
CREATE OR REPLACE FUNCTION calculate_total_due(
  p_member_id UUID,
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  base_dues NUMERIC(10, 2),
  arrears NUMERIC(10, 2),
  late_fees NUMERIC(10, 2),
  total_due NUMERIC(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    calculate_base_dues(p_member_id, p_calculation_date),
    calculate_arrears(p_member_id, p_calculation_date),
    calculate_late_fees(p_member_id, p_calculation_date),
    calculate_base_dues(p_member_id, p_calculation_date) + 
    calculate_arrears(p_member_id, p_calculation_date) + 
    calculate_late_fees(p_member_id, p_calculation_date);
END;
$$ LANGUAGE plpgsql;

-- Function 5: Create Monthly Dues Transaction
CREATE OR REPLACE FUNCTION create_monthly_dues_transaction(
  p_member_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_base_dues NUMERIC(10, 2);
  v_cope_amount NUMERIC(10, 2);
  v_pac_amount NUMERIC(10, 2);
  v_strike_fund NUMERIC(10, 2);
  v_total_amount NUMERIC(10, 2);
BEGIN
  -- Calculate dues components
  v_base_dues := calculate_base_dues(p_member_id, p_period_start);
  v_cope_amount := v_base_dues * 0.10; -- 10% for COPE
  v_pac_amount := v_base_dues * 0.05;  -- 5% for PAC
  v_strike_fund := v_base_dues * 0.15; -- 15% for strike fund
  v_total_amount := v_base_dues + v_cope_amount + v_pac_amount + v_strike_fund;

  -- Insert transaction
  INSERT INTO dues_transactions (
    member_id,
    period_start,
    period_end,
    dues_amount,
    cope_amount,
    pac_amount,
    strike_fund_amount,
    total_amount,
    status,
    due_date,
    created_at
  ) VALUES (
    p_member_id,
    p_period_start,
    p_period_end,
    v_base_dues,
    v_cope_amount,
    v_pac_amount,
    v_strike_fund,
    v_total_amount,
    'pending',
    p_period_end + INTERVAL '15 days', -- Due 15 days after period end
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_base_dues TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_arrears TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_late_fees TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_due TO authenticated;
GRANT EXECUTE ON FUNCTION create_monthly_dues_transaction TO authenticated;
