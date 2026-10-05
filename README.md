# Easy Rent Bali - IT Operations & Support Engineer Assessment

**Candidate:** Azril Miqraji  
**Role:** IT Operations & QA Support Engineer (AI-Oriented)

---

## Task 1 - Production Incident Triage & Root Cause Analysis

### 1. Root Cause Analysis

The checkout request failed because `customer.doc_urls` was `null`.

The request payload contained:

```json
{
  "booking_id": "erb_live_99482",
  "vehicle_id": "car_avanza_04",
  "pickup_date": "2026-08-25T00:00:00.000Z",
  "return_date": "2026-08-27T00:00:00.000Z",
  "customer": {
    "id": "cust_8810",
    "license_verified": true,
    "doc_urls": null
  },
  "applied_voucher": "BALISUMMER26"
}
```

The production log shows that `validateCustomerCompliance()` attempted to
read the `passport_scan` property while `doc_urls` was `null`.

This caused the runtime error:

```text
TypeError: Cannot read properties of null (reading 'passport_scan')
```

The stack trace shows the failure occurring in
`validateCustomerCompliance()`, followed by `processBooking()` and the
booking controller.

Therefore, the root cause is that the compliance validation logic did not
safely handle a `null` document payload before accessing `passport_scan`.

---

### 2. Defensive Patch

The validation function should safely handle the optional document payload
before accessing `passport_scan`.

```ts
type Customer = {
  id: string;
  license_verified: boolean;
  doc_urls?: {
    passport_scan?: string | null;
  } | null;
};

function validateCustomerCompliance(customer: Customer) {
  const passportScan = customer.doc_urls?.passport_scan ?? null;

  if (!passportScan) {
    return {
      valid: false,
      reason: "Passport document is missing",
    };
  }

  return {
    valid: true,
  };
}
```

The optional chaining operator (`?.`) prevents property access when
`doc_urls` is `null` or `undefined`.

The nullish coalescing operator (`??`) provides a safe fallback when
`passport_scan` is unavailable.

As a result, missing document data can be handled through a controlled
validation result instead of causing the null-property runtime error.

---

### 3. Operational Impact Assessment

Existing failed checkout requests should be preserved and handled carefully
after the defensive patch is applied so customer booking information is not
lost or duplicated.

Recommended handling:

1. Identify affected failed requests from production logs using the existing
   `booking_id`.

2. Preserve the original request payload and failure information.

3. Apply and verify the defensive patch before processing affected requests
   again.

4. Reprocess eligible affected bookings using their existing booking
   identifiers.

5. Ensure repeated processing does not create duplicate bookings.

6. Continue monitoring production logs to confirm that requests with
   `doc_urls: null` no longer produce the `passport_scan` TypeError.

---

## Task 2 - QA Edge-Case Test Matrix

### Specification

The following rules are used as the basis for the test cases:

- Minimum rental duration is 24 hours.
- Promo code `BALIFAST` grants a 10% discount for orders greater than or equal to IDR 500,000.
- Vehicles must reject overlapping bookings for the same vehicle ID.
- Domestic renters require KTP.
- Foreign tourists require Passport.

### Test Matrix

| Test ID | Category | Scenario Description | Input Payload / Mock Data | Expected Result | Severity |
| --- | --- | --- | --- | --- | --- |
| TC-01 | Happy Path | Domestic renter creates a valid 24-hour rental with valid KTP and an eligible `BALIFAST` voucher. | `vehicle_id: car_01`, `pickup: 2026-10-05T10:00:00+08:00`, `return: 2026-10-06T10:00:00+08:00`, `amount: 500000`, `voucher: BALIFAST`, `document: KTP` | Booking succeeds and the 10% discount is applied. Final amount: IDR 450,000. | P2 |
| TC-02 | Rental Duration | Rental duration is one minute below 24 hours. | `pickup: 2026-10-05T10:00:00+08:00`, `return: 2026-10-06T09:59:00+08:00` | Booking is rejected because the rental duration is below the 24-hour minimum. | P1 |
| TC-03 | Rental Duration Boundary | Rental duration is exactly 24 hours. | `pickup: 2026-10-05T10:00:00+08:00`, `return: 2026-10-06T10:00:00+08:00` | Booking is accepted because it satisfies the 24-hour minimum. | P1 |
| TC-04 | Timezone Boundary | Rental begins at 23:59 WITA and ends exactly 24 hours later. Verify that UTC conversion preserves the duration. | WITA: `2026-10-05T23:59:00+08:00` → `2026-10-06T23:59:00+08:00`; UTC: `2026-10-05T15:59:00Z` → `2026-10-06T15:59:00Z` | Duration remains exactly 24 hours after UTC conversion and the booking is accepted. | P1 |
| TC-05 | Voucher Threshold | Customer uses `BALIFAST` with an order below the required threshold. | `amount: 499999`, `voucher: BALIFAST` | The 10% discount is not applied because the amount is below IDR 500,000. | P2 |
| TC-06 | Voucher Threshold Boundary | Customer uses `BALIFAST` with an order exactly equal to IDR 500,000. | `amount: 500000`, `voucher: BALIFAST` | The 10% discount is applied because the amount satisfies the `>= IDR 500,000` requirement. | P2 |
| TC-07 | Voucher Case Sensitivity | Customer enters the voucher using lowercase characters. | `amount: 600000`, `voucher: balifast` | **Requirement clarification required.** The specification does not define whether voucher matching is case-sensitive. | P3 |
| TC-08 | Expired Voucher | Customer attempts to use an expired `BALIFAST` voucher. | `amount: 600000`, `voucher: BALIFAST`, `voucher_status: expired` | **Requirement clarification required.** The specification requests expired-voucher testing but does not define the expected expiration behavior. | P3 |
| TC-09 | Missing Document | Foreign tourist submits a booking without the required Passport document object. | `customer_type: foreign`, `document: null` | Booking validation fails safely because a Passport is required. Missing document data must not cause a runtime crash. | P1 |
| TC-10 | Identification Requirement | Domestic renter provides a Passport instead of the required KTP. | `customer_type: domestic`, `document: Passport` | Booking validation is rejected because domestic renters require KTP. | P2 |
| TC-11 | Overlapping Booking | A new valid 24-hour booking overlaps an existing valid 24-hour booking for the same vehicle. | Existing `car_01`: `2026-10-05T10:00+08:00` → `2026-10-06T10:00+08:00`; New `car_01`: `2026-10-05T18:00+08:00` → `2026-10-06T18:00+08:00` | The new booking is rejected because the periods overlap for the same vehicle ID. | P1 |
| TC-12 | Concurrent / Double Booking | Two customers attempt to reserve the same vehicle for the same valid 24-hour period at nearly the same time. | Request A and Request B: `vehicle_id: car_01`, `2026-10-05T10:00+08:00` → `2026-10-06T10:00+08:00`, required document present | Only one booking may be accepted. The other must be rejected to prevent overlapping or double booking. | P1 |

### QA Notes

Two behaviors are intentionally marked for clarification because the supplied
specification does not define their exact expected behavior:

1. Whether voucher codes such as `BALIFAST` are case-sensitive.
2. The exact validation behavior for expired vouchers.

These cases should not be silently assumed in production. The expected
business rules should be clarified before implementation.