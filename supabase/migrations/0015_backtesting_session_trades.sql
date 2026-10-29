-- Carlangax Hub — link trades to a backtesting session so you can log
-- simulated trades while reviewing a session's chart.

alter table trades
  add column if not exists backtesting_session_id uuid references backtesting_sessions(id) on delete set null;

create index if not exists trades_backtesting_session_id_idx
  on trades (backtesting_session_id)
  where backtesting_session_id is not null;
