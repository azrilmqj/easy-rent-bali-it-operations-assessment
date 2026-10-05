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

The supplied payload contained:

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

The immediate root cause was identified as unsafe property access on
`customer.doc_urls` while the value was `null`.

### Validation

The analysis was verified against the supplied request payload and stack trace.

The payload explicitly contained:

```text
doc_urls: null
```

and the error explicitly stated:

```text
Cannot read properties of null (reading 'passport_scan')
```

The root-cause conclusion was therefore directly supported by the supplied
production evidence.

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

The QA matrix included coverage for:

- happy path,
- rental duration below 24 hours,
- exact 24-hour boundary,
- WITA / UTC timezone handling,
- BALIFAST below IDR 500,000,
- BALIFAST exactly at IDR 500,000,
- voucher case sensitivity,
- expired voucher,
- missing document objects,
- domestic / foreign identification requirements,
- overlapping bookings,
- concurrent double booking.

### Validation

The generated matrix was compared against the supplied requirements.

Two cases were intentionally marked as requirement clarifications:

1. Voucher case sensitivity.
2. Expired voucher behavior.

The specification requests those scenarios to be tested but does not define
their exact business behavior, so no unsupported rule was invented.

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

The generated implementation used built-in Node.js modules and separated the
logic into:

- fleet data loading,
- fuel-level parsing,
- urgency-tag generation,
- vehicle filtering,
- alert formatting,
- and final output.

The core filter was:

```js
vehicle.overdue_hours > 0 ||
(vehicle.status === "rented" && fuelLevel < 20)
```

### Manual Validation

Expected flagged vehicles:

#### DK 5678 CD - Toyota Avanza

```text
status: rented
fuel_level: 15%
overdue_hours: 3
```

Matches both conditions.

Expected tags:

```text
🚨 OVERDUE
⚠️ LOW FUEL
```

#### DK 3456 GH - Honda Scoopy

```text
status: rented
fuel_level: 90%
overdue_hours: 5
```

Matches the overdue condition.

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

Matches the rented + low fuel condition.

Expected tag:

```text
⚠️ LOW FUEL
```

The following vehicles should not be selected:

- DK 1234 AB
- DK 9012 EF

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

The review identified two issues and one improvement.

#### Finding 1 - Task 2 Overlap Test

The previous overlap test used booking periods shorter than 24 hours.

This meant the test could fail because of both:

- invalid rental duration,
- and booking overlap.

The test was therefore revised so both bookings independently satisfy the
24-hour minimum while still overlapping.

#### Finding 2 - Task 3 Alert Formatting

The original alert formatter used:

```js
return ["🚘 Fleet Operational Alert", "", ...alerts].join("\n\n");
```

The extra empty string introduced unnecessary blank lines.

The corrected implementation is:

```js
return ["🚘 Fleet Operational Alert", ...alerts].join("\n\n");
```

#### Improvement - Timezone Test

The timezone test was improved by explicitly showing equivalent WITA and UTC
timestamps so the expected 24-hour duration can be verified more clearly.

---

## Final Validation Result

The AI-assisted workflow included:

1. incident analysis,
2. QA test design,
3. operational script implementation,
4. manual validation,
5. final technical review,
6. identification of defects,
7. correction of the affected solution.

The final result was not accepted without review. Issues identified during the
final validation step were corrected before submission.