# AI Prompt Steering & Validation Log

**Candidate:** Azril Miqraji  
**Role:** IT Operations & QA Support Engineer (AI-Oriented)  
**Assessment:** Easy Rent Bali Technical Assessment  
**AI Tool:** ChatGPT

---

## Task 1 - Production Incident Analysis

### Prompt

> Analyze Task 1 of the provided Easy Rent Bali technical assessment from the perspective of an IT Operations & QA Support Engineer. Use only the supplied request payload and production stack trace as evidence.
>
> Identify:
>
> 1. the immediate technical root cause,
> 2. the value that triggered the failure,
> 3. the property access that failed,
> 4. where the exception originated,
> 5. and why the checkout resulted in an HTTP 500 error.
>
> Keep the analysis concise, technical, and evidence-based. Do not introduce business rules or implementation details that are not supported by the assessment.

### AI Analysis

The supplied request payload contained:

```json
{
  "customer": {
    "id": "cust_8810",
    "license_verified": true,
    "doc_urls": null
  }
}
```

The production error was:

```text
TypeError: Cannot read properties of null (reading 'passport_scan')
```

The stack trace identified the failure inside:

```text
validateCustomerCompliance()
```

The immediate technical root cause was unsafe access to `passport_scan`
while `customer.doc_urls` was `null`.

### Validation

The result was checked directly against the supplied payload and production
stack trace.

The payload explicitly contained:

```text
doc_urls: null
```

and the error explicitly reported:

```text
Cannot read properties of null (reading 'passport_scan')
```

The root-cause conclusion was therefore supported directly by the supplied
production evidence.

---

## Task 1 - Defensive Patch & Operational Impact Assessment

### Prompt

> Based on the Task 1 production incident analysis, propose a defensive TypeScript patch for `validateCustomerCompliance()` and an operational recovery strategy for affected failed checkout requests.
>
> For the defensive patch:
>
> - safely handle `customer.doc_urls` when it is `null` or `undefined`,
> - use optional chaining and/or nullish coalescing,
> - prevent unsafe access to `passport_scan`,
> - return a controlled validation result instead of causing a runtime error,
> - and avoid introducing fields or business rules not supported by the assessment.
>
> For the operational impact assessment:
>
> - explain how to identify affected failed requests,
> - preserve the original booking information,
> - apply and verify the fix before reprocessing,
> - safely retry affected bookings,
> - prevent duplicate booking creation,
> - and monitor production logs after deployment.
>
> Keep the answer concise, technically grounded, and limited to the information supported by the assessment.

### AI Response

The defensive patch used optional chaining and nullish coalescing:

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

The expression:

```ts
customer.doc_urls?.passport_scan ?? null
```

prevents unsafe access when `doc_urls` is `null` or `undefined`.

The operational recovery strategy included:

1. Identify affected requests using the existing `booking_id`.
2. Preserve the original booking payload and failure information.
3. Apply and verify the defensive patch before reprocessing.
4. Reprocess eligible affected bookings.
5. Prevent duplicate booking creation.
6. Monitor production logs after deployment.

### Validation

The patch directly addresses the null-document failure shown in the supplied
production log.

The operational recovery strategy was limited to the assessment requirement
of handling failed requests without losing customer booking information.

---

## Task 2 - QA Edge-Case Test Matrix

### Prompt

> Create a prioritized QA edge-case test matrix for Task 2 of the Easy Rent Bali technical assessment.
>
> Use only the supplied specification:
>
> - Minimum rental duration is strictly 24 hours.
> - Promo code `BALIFAST` grants a 10% discount on orders greater than or equal to IDR 500,000.
> - Vehicles must reject overlapping bookings for identical vehicle IDs.
> - Domestic renters require KTP.
> - Foreign tourists require Passport.
>
> Include coverage for:
>
> 1. Standard happy path.
> 2. Rental-duration boundary cases.
> 3. Timezone boundaries, including WITA and UTC conversion.
> 4. Voucher threshold edge cases.
> 5. Voucher case sensitivity.
> 6. Expired voucher handling.
> 7. Missing document objects.
> 8. Overlapping bookings.
> 9. Concurrent race conditions / double booking.
>
> Use the required columns:
>
> `Test ID | Category | Scenario Description | Input Payload / Mock Data | Expected Result | Severity (P1-P4)`
>
> Provide at least 6 prioritized test cases.
>
> If the specification does not define the exact expected behavior for a case, explicitly mark it as a requirement clarification instead of inventing a business rule.

### AI Result

The generated QA matrix covered:

- standard happy path,
- rental duration below 24 hours,
- exact 24-hour boundary,
- WITA / UTC timezone handling,
- voucher threshold below IDR 500,000,
- voucher threshold exactly at IDR 500,000,
- voucher case sensitivity,
- expired voucher,
- missing identification documents,
- domestic / foreign identification requirements,
- overlapping bookings,
- concurrent / double booking.

Voucher case sensitivity and expired-voucher behavior were identified as
requirement clarifications because their exact expected behavior was not
defined in the supplied specification.

### Validation

The generated test cases were reviewed against the original specification.

During the final review, one issue was found in the initial overlapping
booking case: the example booking periods were shorter than the required
24-hour minimum.

This introduced two possible rejection reasons:

- invalid rental duration,
- overlapping booking.

The case was corrected so both bookings independently satisfy the 24-hour
minimum while still overlapping.

The corrected overlap example is:

```text
Existing:
2026-10-05T10:00+08:00 -> 2026-10-06T10:00+08:00

New:
2026-10-05T18:00+08:00 -> 2026-10-06T18:00+08:00
```

This isolates the overlapping-booking rule correctly.

---

## Task 3 - Operational Fleet Triage Script

### Prompt

> Implement Task 3 of the Easy Rent Bali technical assessment using Node.js / JavaScript.
>
> Use the supplied `fleet_status.json` data exactly as provided.
>
> A vehicle must be selected when:
>
> `overdue_hours > 0`
>
> OR
>
> `(status === "rented" && fuel_level < 20%)`
>
> Requirements:
>
> 1. Read the fleet data from `fleet_status.json`.
> 2. Parse percentage values such as `"15%"` into numeric fuel levels.
> 3. Preserve the exact OR filtering condition from the assessment.
> 4. Add the urgency tag `🚨 OVERDUE` when `overdue_hours > 0`.
> 5. Add the urgency tag `⚠️ LOW FUEL` when the vehicle status is `rented` and the fuel level is below 20%.
> 6. Allow a vehicle to receive both urgency tags when both conditions are met.
> 7. Output a formatted WhatsApp/Slack-style alert containing:
>    - plate number,
>    - model,
>    - status,
>    - urgency tag(s).
> 8. Handle file-read or JSON-parsing errors gracefully.
> 9. Use built-in Node.js functionality where possible and avoid unnecessary dependencies.
>
> After generating the script:
>
> - manually validate the filtering logic against every vehicle in the supplied dataset,
> - identify which vehicles should appear in the alert,
> - explain which condition caused each vehicle to match,
> - and provide the exact expected console output.
>
> Keep the implementation simple, readable, and suitable for an operational support environment.

### AI Implementation

The implementation used built-in Node.js modules and separated the logic into:

- fleet JSON loading,
- fuel-level parsing,
- urgency-tag generation,
- vehicle filtering,
- alert formatting,
- and final console output.

The required filter was implemented as:

```js
vehicle.overdue_hours > 0 ||
(vehicle.status === "rented" && fuelLevel < 20)
```

### Manual Validation

#### DK 1234 AB - Honda Beat

```text
status: rented
fuel_level: 80%
overdue_hours: 0
```

Result:

```text
NOT INCLUDED
```

Neither alert condition is satisfied.

#### DK 5678 CD - Toyota Avanza

```text
status: rented
fuel_level: 15%
overdue_hours: 3
```

Matches:

```text
overdue_hours > 0
```

and:

```text
status == rented AND fuel_level < 20%
```

Expected tags:

```text
🚨 OVERDUE
⚠️ LOW FUEL
```

#### DK 9012 EF - Mitsubishi Xpander

```text
status: available
fuel_level: 40%
overdue_hours: 0
```

Result:

```text
NOT INCLUDED
```

Neither alert condition is satisfied.

#### DK 3456 GH - Honda Scoopy

```text
status: rented
fuel_level: 90%
overdue_hours: 5
```

Matches:

```text
overdue_hours > 0
```

Expected tag:

```text
🚨 OVERDUE
```

#### DK 7890 IJ - Yamaha NMAX

```text
status: rented
fuel_level: 10%
overdue_hours: 0
```

Matches:

```text
status == rented AND fuel_level < 20%
```

Expected tag:

```text
⚠️ LOW FUEL
```

### Expected Alert

```text
🚘 Fleet Operational Alert

1. Plate: DK 5678 CD
Model: Toyota Avanza
Status: rented
Urgency: 🚨 OVERDUE | ⚠️ LOW FUEL

2. Plate: DK 3456 GH
Model: Honda Scoopy
Status: rented
Urgency: 🚨 OVERDUE

3. Plate: DK 7890 IJ
Model: Yamaha NMAX
Status: rented
Urgency: ⚠️ LOW FUEL
```

---

## Final Technical Review

### Prompt

> Perform a final technical review of Tasks 1, 2, and 3 of the Easy Rent Bali assessment against the original assessment document.
>
> Verify:
>
> 1. Task 1 is fully supported by the supplied production payload and stack trace.
> 2. The defensive patch correctly handles the reported null-document failure without introducing unsupported assumptions.
> 3. Task 2 covers all mandatory QA categories and does not invent undefined business rules.
> 4. Task 3 implements the exact required filtering condition and produces the expected alert output.
> 5. Identify any technical mistake, unsupported assumption, missing requirement, or inconsistency in the current solution.
>
> Do not automatically approve the solution. If an issue exists, explain it clearly and provide the corrected version.

### Review Findings

The final review identified two concrete issues and one improvement.

#### Finding 1 - Overlapping Booking Test

The original overlapping-booking test used rental periods shorter than the
required 24-hour minimum.

As a result, the test did not isolate the overlap rule.

The test was corrected so both booking periods are independently valid
24-hour rentals while still overlapping.

#### Finding 2 - Alert Formatting

The initial alert formatter used:

```js
return ["🚘 Fleet Operational Alert", "", ...alerts].join("\n\n");
```

The explicit empty string introduced unnecessary blank lines.

The corrected implementation is:

```js
return ["🚘 Fleet Operational Alert", ...alerts].join("\n\n");
```

#### Improvement - Timezone Validation

The timezone test was improved by explicitly showing equivalent WITA and UTC
timestamps:

```text
WITA:
2026-10-05T23:59:00+08:00
2026-10-06T23:59:00+08:00

UTC:
2026-10-05T15:59:00Z
2026-10-06T15:59:00Z
```

This makes the exact 24-hour duration easier to verify.

---

## Final Validation Result

The AI-assisted workflow demonstrated:

1. production incident analysis,
2. defensive patch generation,
3. operational recovery planning,
4. QA edge-case design,
5. operational scripting,
6. manual validation,
7. final technical review,
8. defect identification,
9. correction before submission.

The AI-generated output was not accepted automatically.

Issues discovered during the final review were corrected before the final
submission was prepared.