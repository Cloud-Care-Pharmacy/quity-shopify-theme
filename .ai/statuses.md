# Quity — Status Reference

> Canonical list of the lifecycle statuses used across the Quity patient
> journey, in the order a patient moves through them: **account → intake →
> prescription**, with the store-wide **shop** status sitting above them all.
>
> Status values are written in **Title Case**, matching the value stored in
> `customer.metafields.customer.status` (e.g. `Approved`), which is the only
> group currently wired into the theme.

---

## 1. Customer status

Tracks where a customer sits in the verification process. Backed by the
`customer.metafields.customer.status` metafield and consumed by
`snippets/customer-gate-status.liquid`, `snippets/customer-gate-status-end.liquid`,
and `templates/customers/account.liquid`. A blank or missing value is treated
as **Pending**.

| Status | Meaning |
|---|---|
| **Pending** | Account created and awaiting review by the pharmacy team. The default for a new customer. |
| **Approved** | Identity and eligibility verified. The customer can browse and purchase products. |
| **Declined** | The application was rejected. The customer cannot access gated content. |
| **Expired** | A previously approved customer whose access has lapsed (e.g. their prescription has expired) and must be renewed. |

---

## 2. Intake form status

Tracks whether the patient has completed the health questionnaire
(`sections/patient-intake-form.liquid`).

| Status | Meaning |
|---|---|
| **Pending** | The intake form has not yet been completed. |
| **Submitted** | The patient has submitted the form, which is now awaiting doctor review. |

---

## 3. Prescription status

Tracks the state of the patient's prescription (script).

| Status | Meaning |
|---|---|
| **Pending** | A prescription has been requested but not yet issued by a doctor. |
| **Prescribed** | A doctor has issued an active prescription. |
| **Expired** | The prescription has reached the end of its validity and must be renewed. |

---

## 4. Shop status

A store-wide toggle that controls whether the shop is trading.

| Status | Meaning |
|---|---|
| **Open** | The shop is trading and accepting orders. |
| **Closed** | The shop is not trading; ordering is unavailable. |

---

## Quick reference

| Group | Statuses |
|---|---|
| Customer | Pending · Approved · Declined · Expired |
| Intake form | Pending · Submitted |
| Prescription | Pending · Prescribed · Expired |
| Shop | Open · Closed |
