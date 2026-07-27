export const QUANTITY_EPSILON = 0.0001 // float-safety only; any real qty diff is a break
export const PRICE_TOLERANCE_BPS = 5 // 0.05% of market value — rounding/noise band
export const TIMING_WINDOW_DAYS = 3
export const MATERIALITY_THRESHOLD_BPS = 25 // 0.25% of fund NAV
export const MATERIALITY_ABS_FLOOR = 10_000 // floor so a tiny fund NAV doesn't trivialize this
