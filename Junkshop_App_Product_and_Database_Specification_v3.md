# Junkshop Management App

Product Requirements + Database Specification — Local-Only + Phone-to-Phone Sync

This file is the readable working copy of `Junkshop_App_Product_and_Database_Specification_v3.docx`. Section 26 is the coding start plan and is also appended to the Word document.

Purpose: A fast mobile app for an owner-operated junkshop to record scrap purchases, planned and actual selling prices, sellers, buyers, expenses, payments, and profit. The app is local-only for now. Data can be exported to a file, imported onto another phone, and either replace existing data or merge with existing data.

## 1. Product Vision

- Record who sold scrap, material, quantity/weight, and actual purchase price.
- Record Supplier Price / Planned Selling Price: expected price per unit at which the junkshop plans to sell the scrap onward.
- Optionally record the planned buyer/destination for the scrap.
- Record actual resale and buyer.
- Show expected profit before sale and realized profit after sale.
- Record operating expenses and show net profit.
- Keep all data on the phone by default; no account, cloud server, or internet connection is required for normal use.
- Allow data export/import so one phone can act as the main data phone and another can be used for daily transactions.

## 2. Important Business Rule: No Conventional Stock

The junkshop does not operate like a normal retail inventory business.

- Do not require a permanent current-stock quantity for every material.
- Do not build low-stock alerts, warehouse/bin management, or supermarket-style inventory screens.
- Purchases are recorded as purchase items/lots that may remain unsold, be partially sold, or be completely sold.
- Purchase history remains after resale so the system can calculate realized profit.

The central business record is the purchase and its resale economics: what was bought, what was paid, the Supplier Price expected on resale, what it actually sold for, and the resulting profit.

## 3. Local-Only Architecture

- MVP data storage is entirely local on the device.
- No required login.
- No required cloud database.
- No required internet connection for buying, selling, expenses, reports, or normal operation.
- Use a local relational database such as SQLite.
- Export/import is the mechanism for backup and phone-to-phone synchronization in the MVP.
- Cloud sync can be added later without changing the core purchase/sale business model.

## 4. Two-Phone Workflow

Recommended operating model: one Main Phone stores the complete history, while a Daily Phone is used for transactions during the day.

- Main Phone: authoritative long-term database containing all historical purchases, sales, expenses, people, materials, and reports.
- Daily Phone: used for fast transaction entry during the day.
- Afternoon sync: export the Daily Phone database/data package and import it into the Main Phone.
- The Main Phone should offer two import modes: Replace All Data and Merge With Existing Data.
- After a successful merge, the Daily Phone can be cleared/reset for the next day if desired.
- The workflow must not require both phones to be online at the same time.

## 5. Export / Import Requirements

### 5.1 Export

- Export all local data into a portable file/package.
- Export should include database records and the metadata required for safe merging.
- Recommended format: a versioned ZIP package containing SQLite/JSON data plus a manifest.
- The export file should include a unique database/device identifier, export timestamp, app version, schema version, and record counts.
- User should be able to choose an export destination supported by the phone, such as Files, local storage, messaging, cable transfer, or another file-sharing method.
- Export should not depend on a cloud account.

### 5.2 Import Modes

- REPLACE ALL DATA: delete/replace the current local database with the imported data after a strong confirmation.
- MERGE WITH EXISTING DATA: keep current records and add/update records from the imported package without intentionally duplicating the same records.
- Before either operation, show a preview: source phone/export date, number of purchases, purchase items, sales, expenses, people, materials, and payments.
- For Replace, require explicit confirmation such as typing or selecting "Replace All Data".
- Create an automatic local backup of the current database before destructive Replace operations.
- After import, show a result summary: added, updated, skipped, conflicted, and failed records.

### 5.3 Daily Phone to Main Phone Merge

- Each record must have a globally unique UUID generated when it is first created.
- The merge process uses UUIDs and record metadata rather than names, dates, or amounts alone to identify records.
- Records created on the Daily Phone should be added to the Main Phone.
- Records already present on the Main Phone with the same UUID should not be duplicated.
- Updated records should carry an updated_at timestamp and, preferably, a revision/version number.
- The importer must preserve relationships between imported purchases, purchase_items, sales, sale_items, expenses, payments, people, and materials.
- A sale item that references a purchase item must still point to the correct purchase item after merge.
- If the same record was independently edited on both phones, the importer must flag it as a conflict instead of silently overwriting important financial data.
- For MVP, conflicts should be presented for review; a later version may provide more advanced conflict resolution.

### 5.4 Preventing Duplicate Daily Imports

- Each export package should have a unique export_id.
- The Main Phone should store an import/export history containing previously imported export_ids.
- If the same Daily Phone export is imported twice, the app should recognize it and warn that it has already been imported.
- The merge must be idempotent: importing the same package again must not create duplicate transactions.
- The app should provide an Import History screen showing date, source device, export ID, mode, and result.

### 5.5 Recommended Sync Safety

- Never silently wipe data during Merge.
- Never silently overwrite financial transactions during conflict.
- Before Replace, automatically create a backup/export of the current database.
- Keep a local audit/import log so the user can see when data was imported.
- Show a clear warning when importing a package created by a different app/schema version.
- Validate the entire package before changing the current database. If validation fails, make no partial changes.

## 6. Terminology

- Seller = person who sells scrap to the junkshop.
- Buyer = person/company who buys scrap from the junkshop.
- Supplier Price / Planned Selling Price = expected price per unit at which the junkshop plans to sell purchased scrap onward. This preserves the preferred "supplier price" terminology.
- Planned Buyer / Destination = optional person/company where the junkshop expects to sell scrap.
- Expected Profit = expected resale value minus purchase cost and applicable direct costs.
- Actual Profit = actual sale revenue minus allocated purchase cost and applicable direct costs.
- Purchase Lot = purchase item that can later be linked to one or more sales.
- Product = a scrap material in the `materials` catalog (Copper, Aluminum, and so on). This is the name used on the first coding screen. It is not a retail stock item.

## 7. MVP Principles

- No required login.
- No employee accounts.
- Seller/buyer registration is optional.
- Random people can be entered with a free-text name.
- Offline-first/local-only operation.
- Fast transaction entry.
- PHP currency.
- Export/import is part of the MVP, not a cloud-only future feature.

## 8. Main Modules

- Dashboard
- Buy Scrap
- Sell Scrap
- Purchase History
- People
- Materials
- Expenses
- Payments
- Price History
- Reports
- Daily Closing
- Import / Export
- Import History
- Attachments

## 9. Buy Scrap Screen

- Seller: saved person / manual name / walk-in / unknown.
- Purchase date.
- Material.
- Quantity/weight.
- Buy Price per unit.
- Purchase Total.
- Supplier Price / Planned Selling Price per unit.
- Expected Selling Total — automatic.
- Expected Profit — automatic.
- Supplier / Planned Buyer / Destination — optional.
- Payment status/method.
- Notes/photos.
- Add another material.

Example: Seller Pedro; Material Copper; Quantity 35.5 kg; Buy Price ₱420/kg; Purchase Cost ₱14,910; Supplier Price ₱470/kg; Expected Selling Value ₱16,685; Expected Profit ₱1,775; Planned Buyer ABC Recycling.

## 10. Sell Scrap Screen

- Buyer: saved person / manual name / walk-in / unknown. Buyers are usually individual people, not companies.
- Product (material). There is no stock and no purchase lot to pick.
- Quantity sold.
- Actual selling price per unit.
- Actual sale total.
- Cost: quantity sold × the product's current buy price.
- Actual profit — automatic.
- Payment status/method.
- Notes/photos.

## 11. Profit Formulas

- Expected Selling Value = planned/remaining quantity × Supplier Price.
- Expected Profit = Expected Selling Value − Purchase Cost − Direct Costs.
- Actual Sales Revenue = Quantity Sold × Actual Selling Price.
- Allocated Purchase Cost = Quantity Sold × Purchase Unit Cost.
- Actual Gross Profit = Actual Sales Revenue − Allocated Purchase Cost − Direct Costs.
- Net Profit = Actual Gross Profit − Operating Expenses.

For MVP, use the purchase item's unit buy cost as the cost basis. If sold in multiple sales, allocate cost proportionally by quantity sold.

After a partial sale, expected profit on what remains uses the remaining quantity only: remaining quantity × Supplier Price, minus remaining quantity × unit buy price. Do not subtract the original full purchase cost again.

## 12. Dashboard

- Today's Purchases.
- Today's Sales.
- Expected Profit from unsold/partially sold purchases using Supplier Price.
- Realized Profit.
- Today's Expenses.
- Net Profit.
- Unrealized Profit.
- Receivables.
- Payables.
- Optional sync status / last import date on the Main Phone.

Example: Purchases ₱50,000; Sales ₱72,000; Realized Gross Profit ₱22,000; Operating Expenses ₱5,000; Net Profit ₱17,000; Expected Profit on Unsold Scrap ₱8,500.

## 13. Purchase Item / Resale Status

- Unrealized
- Partially Sold
- Sold
- Cancelled/Adjusted

## 14. Random Seller / Buyer Handling

- Regular seller: seller_id → people; seller_name snapshot may also be stored.
- Random seller: seller_id NULL + seller_name entered.
- Unknown seller: seller_id NULL + seller_name "Walk-in" or "Unknown".
- Regular buyer: buyer_id → people; buyer_name snapshot may also be stored.
- Random buyer: buyer_id NULL + buyer_name entered.
- Optional UX: after entering a random name, offer "Save as contact".

## 15. Database Schema

Recommended database: SQLite for the local MVP. The schema can later be migrated or synchronized with PostgreSQL/Supabase.

SQLite storage choices used when coding:

- Primary keys are UUID text, generated on the device when the row is created.
- Money columns (`numeric(14,2)`) are integer centavos. ₱420.00 is stored as 42000.
- Quantity columns (`numeric(14,3)`) are integer thousandths. 35.5 kg is stored as 35500.
- Timestamps are ISO-8601 text.

### materials

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text | |
| code | text | nullable |
| category | text | nullable |
| unit | text | |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### people

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text | |
| phone | text | nullable |
| address | text | nullable |
| person_type | text | seller, buyer, both, destination |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### purchases

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| purchase_number | text | display label, not the identity |
| seller_id | uuid | nullable FK → people.id |
| seller_name | text | nullable snapshot |
| purchase_date | timestamptz | |
| subtotal | numeric(14,2) | |
| other_cost | numeric(14,2) | |
| total_amount | numeric(14,2) | |
| payment_status | text | paid, partial, unpaid |
| payment_method | text | nullable. cash, gcash, bank, other. One method per ticket until the payments table (Step 8) |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### purchase_items

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| purchase_id | uuid | FK → purchases.id |
| material_id | uuid | FK → materials.id |
| quantity | numeric(14,3) | |
| unit_buy_price | numeric(14,2) | |
| purchase_total | numeric(14,2) | |
| supplier_price | numeric(14,2) | nullable. Planned selling price per unit |
| planned_sell_quantity | numeric(14,3) | nullable |
| expected_sell_total | numeric(14,2) | nullable |
| expected_profit | numeric(14,2) | nullable |
| supplier_id | uuid | nullable FK → people.id. Planned buyer |
| supplier_name | text | nullable. Planned buyer snapshot |
| status | text | unrealized, partial, sold, cancelled |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### sales

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| sale_number | text | display label, not the identity |
| buyer_id | uuid | nullable FK → people.id |
| buyer_name | text | nullable snapshot |
| sale_date | timestamptz | |
| subtotal | numeric(14,2) | |
| other_cost | numeric(14,2) | |
| total_amount | numeric(14,2) | |
| payment_status | text | |
| payment_method | text | nullable. cash, gcash, bank, other. One method per ticket until the payments table (Step 8) |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### sale_items

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| sale_id | uuid | FK → sales.id |
| purchase_item_id | uuid | nullable FK → purchase_items.id. Left empty: Sell Scrap picks a product, not a purchase lot |
| material_id | uuid | FK → materials.id |
| quantity | numeric(14,3) | |
| unit_sell_price | numeric(14,2) | |
| sale_total | numeric(14,2) | |
| allocated_purchase_cost | numeric(14,2) | quantity × the product's current buy price at the time of the sale |
| actual_profit | numeric(14,2) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### expenses

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| expense_date | timestamptz | |
| category | text | |
| description | text | nullable |
| amount | numeric(14,2) | |
| payment_method | text | |
| receipt_url | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### payments

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| transaction_type | text | purchase or sale |
| transaction_id | uuid | |
| payment_date | timestamptz | |
| amount | numeric(14,2) | |
| payment_method | text | |
| reference_number | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

### material_prices

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| material_id | uuid | FK → materials.id |
| price_type | text | buy or sell |
| price | numeric(14,2) | |
| effective_date | timestamptz | stored as the local date, YYYY-MM-DD |
| source | text | nullable. manual for prices set on the Products screens |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### attachments

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| reference_type | text | purchase, sale, expense, payment |
| reference_id | uuid | |
| file_path | text | |
| file_name | text | nullable |
| mime_type | text | nullable |
| created_at | timestamptz | |

### daily_cash_closings

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| closing_date | date | |
| opening_cash | numeric(14,2) | |
| expected_cash | numeric(14,2) | |
| actual_cash | numeric(14,2) | |
| difference | numeric(14,2) | |
| notes | text | nullable |
| created_at | timestamptz | |

### data_imports

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| export_id | uuid | UNIQUE |
| source_device_id | uuid | |
| source_device_name | text | nullable |
| imported_at | timestamptz | |
| import_mode | text | replace, merge |
| source_exported_at | timestamptz | |
| records_added | integer | |
| records_updated | integer | |
| records_skipped | integer | |
| records_conflicted | integer | |
| status | text | |
| notes | text | nullable |

### device_metadata

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| device_id | uuid | UNIQUE |
| device_name | text | nullable |
| role | text | main, daily, standalone |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### sync_metadata

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| record_type | text | |
| record_id | uuid | |
| updated_at | timestamptz | |
| revision | integer | |
| last_modified_device_id | uuid | |
| deleted_at | timestamptz | nullable |

## 16. Sync / Merge Data Model

- Every business record must have a UUID that remains unchanged across export/import.
- Every record should have created_at and updated_at timestamps.
- Financial records should preferably have a revision/version number for conflict detection.
- Soft deletion is recommended for synchronized records: deleted_at rather than immediately physically deleting records, so deletions can propagate during a later merge.
- The app must preserve foreign-key relationships when importing.
- The importer should process parent records before child records where necessary.
- Example order: materials/people → purchases → purchase_items → sales → sale_items → expenses/payments → attachments.
- Do not use auto-increment integer IDs as the only identity for records that need to move between phones.

## 17. Import Conflict Rules

- Same UUID + same revision/content: skip as already synchronized.
- Same UUID + imported revision newer: update local record after validation.
- Same UUID + local revision newer: keep local record and flag if appropriate.
- Same UUID + different content at the same revision: create a conflict requiring user review.
- Never merge financial amounts by simply adding two copies of the same transaction.
- Do not identify duplicates solely by seller name, buyer name, date, or amount because legitimate transactions may look identical.

## 18. Import/Export User Experience

- Settings → Data Management → Export Data.
- Settings → Data Management → Import Data.
- Import preview shows source phone, date, package size, schema version, and record counts.
- Buttons: "Replace Current Data" and "Merge With Current Data".
- Replace flow includes automatic backup and strong confirmation.
- Merge flow includes duplicate detection and conflict reporting.
- Import History shows previous imports and allows the user to inspect results.
- After a successful Daily → Main merge, show a concise message such as: "245 records imported. 0 duplicates. 2 conflicts need review."

## 19. What Replaces Inventory

- Purchase history.
- Purchase items/lots with unrealized/partial/sold status.
- Supplier Price / planned resale price.
- Planned buyer/destination.
- Expected profit.
- Actual sale linked back to purchase item.
- Actual realized profit.

## 20. Recommended Reports

- Daily/weekly/monthly purchases.
- Daily/weekly/monthly sales.
- Expected profit from unsold purchases.
- Realized gross profit from sales.
- Net profit after expenses.
- Profit by material.
- Buy Price vs Supplier Price.
- Supplier Price vs Actual Sell Price.
- Seller history.
- Buyer history.
- Outstanding purchase payments.
- Outstanding sales collections.
- Expense breakdown.
- Cash flow.
- Import/merge history.

## 21. Future Features

- Cloud backup/sync.
- Bluetooth/USB weighing scale.
- Automatic price suggestions from recent transactions.
- Price-change alerts.
- Receipt/scale photo capture.
- CSV/Excel export.
- Optional login.
- Optional employee accounts.
- Multi-branch support.
- Automatic cloud conflict resolution.

## 22. Suggested Tech

- React Native + Expo for mobile.
- SQLite for local/offline data.
- Supabase/PostgreSQL later for optional cloud sync.
- Supabase Storage later for cloud attachments.
- File-system/share APIs for local export/import.
- A versioned import/export package format should be designed now so future cloud sync can reuse the same record identities.

## 23. MVP Phases

- Phase 1: Buy, Sell, materials, random names, Supplier Price, expected profit, profit dashboard, expenses, SQLite local storage.
- Phase 2: Purchase-lot tracking, actual profit, buyer/seller history, payments/balances, price history.
- Phase 3: Export/Import, Replace All, Merge With Existing, duplicate prevention, import preview, import history, automatic pre-replace backup.
- Phase 4: Reports, daily cash closing, attachments, CSV/Excel export.
- Phase 5: Optional cloud sync, weighing scale integration, notifications, optional login/employee accounts.

Section 26 breaks Phase 1 into the actual coding order. Materials (add a product) come before the POS, because a purchase line needs a material to select.

## 24. Key Product Rule

The app should not behave like a supermarket inventory system. The central business record is the purchase and its resale economics: what was bought, how much was paid, the Supplier Price expected when reselling it, who the junkshop expects to sell it to, what it actually sold for, and how much profit was realized. The system must remain useful completely offline, while allowing two phones to exchange data safely through export/import.

## 25. Recommended Daily Operating Procedure

- Morning: start with the Main Phone as the historical master and use the Daily Phone for new transactions.
- During the day: record purchases, sales, expenses, and payments on the Daily Phone.
- Afternoon/end of day: export the Daily Phone data package.
- Transfer the file to the Main Phone using any available local file-sharing method.
- On Main Phone: Import → Merge With Current Data.
- Review the import summary and resolve any conflicts.
- Verify dashboard totals and profit.
- Optionally export a fresh Main Phone backup.
- Optionally clear/reset the Daily Phone after confirming the Main Phone contains the day's transactions.

## 26. Coding Start Plan

This is the order we will write the app. Each step finishes with something that can be used on the phone. A later step does not start until the current step's checks pass.

The first feature is adding a product. The second is the POS. A product is a scrap material such as Copper or Aluminum (`materials`). The POS is the counter: Buy Scrap, then Sell Scrap.

### What we build first

The first milestone is one phone recording a real shop day and showing profit. People, payments, price history, phone-to-phone sync, and reports come after those numbers are trustworthy.

- Step 1. Add a product.
- Step 2. POS: Buy Scrap.
- Step 3. Purchase history, so a saved buy can be opened again.
- Step 4. POS: Sell Scrap.
- Step 5. Expenses.
- Step 6. Dashboard.

Step 0 below is only the app shell those screens need. It is not a user feature.

### Decisions locked before the first screen

- React Native with Expo and TypeScript.
- Local SQLite from the first feature. No stand-in storage that we throw away.
- A product is a row in `materials`. There is no separate products table and no stock-on-hand quantity.
- Every row gets a UUID, created_at, and updated_at now, so export and merge do not require a rewrite.
- Money is an integer number of centavos. ₱420.00 is stored as 42000.
- Quantity is an integer number of thousandths. 35.5 kg is stored as 35500.
- Dates are ISO-8601 text.
- Seller and buyer names are typed on the POS first. The People directory is a later step. A blank name is stored as Unknown.
- Notes are saved with the purchase. Photos wait for the attachments step.
- Purchase and sale numbers are display labels such as P-20261006-001. The UUID is the real identity.
- Direct costs (`other_cost`) stay 0 until a later pass. Early profit is resale value minus purchase cost.

### Step 0. App shell

A short setup so the product screen has a place to live.

- Create the Expo TypeScript app.
- Add SQLite, open the database on launch, and run migrations in order.
- Add helpers for a new UUID, peso display, and quantity display.
- Add navigation. Show a tab only when its step exists. The first tab is Products.

Done when the app opens and creates the local database file.

### Step 1. Add a product

Build this before any POS work. A buy line cannot exist without a material to pick.

Database: `materials` only.

Screens:

- Product list, with search. Active products come first.
- Add product.
- Edit product.

Fields:

- Name, required.
- Unit, required, default kg.
- Code, optional.
- Category, optional.
- Active, default on.

Rules:

- Warn if another active product already has the same name and unit.
- Turning a product off sets is_active to false. Do not delete the row. Old purchases must keep the material.

Done when Copper in kg can be added, found, edited, turned off, and is still in the database after the app is closed and opened.

### Step 2. POS: Buy Scrap

The main counter screen.

Database: `purchases` and `purchase_items`.

Screen:

- Purchase date, default today.
- Seller name. Blank becomes Unknown. No contact picker yet.
- One or more lines:
  - Product, active products only. Stored in material_id.
  - Quantity.
  - Buy price per unit. Stored in unit_buy_price.
  - Purchase total, calculated as quantity times buy price. The cashier does not type this.
  - Supplier price, the planned selling price per unit.
  - Expected selling total, calculated as quantity times supplier price.
  - Expected profit, calculated as expected selling total minus purchase total.
  - Planned buyer, optional free text, stored in supplier_name.
- Payment status: paid, partial, or unpaid. Store one payment method on the purchase. The payments table comes in Step 8.
- Notes.
- Add another material on the same ticket.
- Save.

Header subtotal and total_amount are the sum of the lines. Each new line starts with status unrealized. planned_sell_quantity starts equal to the quantity bought.

Save the purchase and its lines in one SQLite transaction. If any line fails, save nothing.

Acceptance example, which must match exactly:

- Seller Pedro, material Copper, 35.5 kg, buy price ₱420 per kg.
- Purchase cost ₱14,910.
- Supplier price ₱470 per kg.
- Expected selling value ₱16,685.
- Expected profit ₱1,775.
- Lot status unrealized.

Done when that ticket can be saved and shows the same figures after a restart.

### Step 3. Purchase history

- List purchases, newest first: date, seller, total, and whether any line is still unsold.
- Open a purchase and show each line, supplier price, expected profit, and status.

Done when the copper ticket from Step 2 is in the list and opens with the same figures. Money on a saved purchase is not edited in this step.

### Step 4. POS: Sell Scrap

Database: `sales` and `sale_items`.

Screen:

- Sale date, default today.
- Buyer name. Blank becomes Unknown.
- Pick a purchase line whose status is unrealized or partial.
- Show remaining quantity. Remaining is purchased quantity minus every quantity already sold against that line.
- Quantity sold. Reject a quantity above remaining.
- Actual selling price per unit.
- Sale total, calculated as quantity sold times selling price.
- Allocated purchase cost, calculated as quantity sold times that line's unit buy price.
- Actual profit, calculated as sale total minus allocated purchase cost.
- Payment status and one payment method, same approach as Buy.
- Save.

On save, in one transaction, insert the sale and update the lot:

- Remaining 0: status sold.
- Remaining between 0 and the purchased quantity: status partial.
- A sold line no longer appears in the picker.

Done when selling 10 kg of the copper lot sets the lot to partial and the profit uses ₱420 per kg as the cost. Selling the rest sets the lot to sold.

### Step 5. Expenses

Database: `expenses`.

- Date, category, amount, payment method, optional description and notes.
- List expenses, newest first.
- Editing an expense is allowed here because it is not yet tied to a sale.

Done when a ₱5,000 expense is saved and still listed after a restart.

### Step 6. Dashboard

Read only. It sums what Steps 2 to 5 saved.

- Today's purchases: sum of purchase totals dated today.
- Today's sales: sum of sale totals dated today.
- Realized profit: sum of actual profit on sales dated today.
- Today's expenses.
- Net profit: realized profit minus today's expenses.
- Expected profit on unsold and partial lots, using remaining quantity and supplier price. This figure is not limited to today.
- Until Step 8, show how many tickets are unpaid or partial. Do not treat that count as a peso balance. Receivables and payables are peso totals only after payments exist.

Done when a day that contains the copper purchase, a sale, and the ₱5,000 expense can be checked by hand against these formulas.

### Step 7. People

Database: `people`.

- Add a person: name, phone, address, type (seller, buyer, both, or destination), and notes.
- On Buy and Sell, pick a saved person or keep typing a name.
- After a typed name, offer Save as contact.
- Store the person id and a name snapshot. A later rename must not rewrite old tickets.

### Step 8. Payments

Database: `payments`.

- Record a payment against a purchase or a sale: date, amount, method, optional reference and notes.
- Derive payment status from the sum of payments compared with the ticket total: unpaid, partial, or paid.
- Dashboard shows receivables (sales not fully collected) and payables (purchases not fully paid).
- When this step starts, a ticket marked paid in Step 2 or Step 4 gets one payment row for its full total so older tickets stay consistent.

### Step 9. Price history

Database: `material_prices`.

Already built (current prices, added after Step 2):

- Each product has a current buy price and sell price (Supplier Price), stored in `material_prices` with source `manual`.
- A price stays current until the user changes it. Prices are not re-entered every day; only a changed price writes a row. Changing it twice on the same day updates that day's row.
- Set prices on the product form or on Products → Prices.
- The Buy screen fills in the current buy price and Supplier Price when a product is picked. The cashier can still type a different price, and the screen shows the difference from the current price and whether it means more or less profit.
- The Buy product picker lists the most often bought products first.

Still to do:

- Saving a buy writes a buy price for that material and date.
- Saving a sell writes a sell price.
- Show a history list per product.
- Sell Scrap (Step 4) fills in and compares against the current sell price the same way.

### Step 10. Sync identity

Before any export work, confirm every business table already has a UUID, created_at, and updated_at. Add a revision number on financial records. Add `device_metadata`. When a synced row is removed, set deleted_at so the deletion can travel in a later merge. Do not use an auto-increment id as the identity that moves between phones.

### Step 11. Export

Settings → Data Management → Export Data.

- Write a versioned ZIP package.
- Manifest: export id, device id, device name, export time, app version, schema version, and record counts.
- The package contains the business rows as JSON, plus the manifest.
- The phone share sheet sends the file through Files, cable, or messaging. No account.

### Step 12. Import preview and Replace

- Validate the whole package first. If validation fails, change nothing.
- Preview: source phone, export date, schema version, and counts for purchases, purchase items, sales, expenses, people, materials, and payments.
- Replace All Data asks the user to confirm by typing Replace All Data.
- Before replace, write an automatic backup export of the current database.
- Then replace the local data.

### Step 13. Merge and import history

- Merge keeps current rows and adds or updates rows from the package.
- Match on UUID, never on name, date, or amount.
- Import parents before children: materials and people, then purchases, purchase items, sales, sale items, expenses and payments, then attachments.
- A sale line must still point at the same purchase line after merge.
- Same content and revision: skip.
- Imported revision newer: update.
- Local revision newer: keep the local row and flag it.
- Same revision with different content: conflict. Do not overwrite the money. Show the conflict for review.
- Never add two copies of the same transaction together.
- Store export_id in `data_imports`. Importing that package again warns and does not duplicate rows.
- Import History shows date, source device, export id, mode, and result counts.

### Step 14. Reports

- Daily, weekly, and monthly purchases and sales.
- Expected profit on unsold lots.
- Realized gross profit.
- Net profit after expenses.
- Profit by material.
- Buy price versus supplier price.
- Supplier price versus actual sell price.
- Seller history and buyer history.
- Outstanding purchase payments and sales collections.
- Expense breakdown.

### Step 15. Daily cash closing

Database: `daily_cash_closings`.

- Opening cash, expected cash, counted cash, and the difference.

### Step 16. Attachments

Database: `attachments`.

- A photo on a purchase, sale, or expense, stored as a local file path.
- No cloud file storage in this step.

### Later, not in this build

- Cloud backup and sync.
- Bluetooth or USB scale.
- Automatic price suggestions and price-change alerts.
- CSV or Excel export.
- Login, employee accounts, and multi-branch.
- Automatic conflict resolution.

### Leave these out of the early steps

- A current-stock quantity, low-stock alerts, or bin locations.
- Accounts, and any screen that needs the internet in order to buy or sell.
- Employee permissions.
- Editing the money on a purchase line after any part of that line has been sold.

### Tabs as the steps land

- Step 1: Products.
- Step 2: Buy.
- Step 3: History.
- Step 4: Sell.
- Step 5: Expenses.
- Step 6: Home, the dashboard.
- Step 7: People.
- Step 11: Settings, for export and import.

### Checklist

- [x] Step 0. App shell
- [x] Step 1. Add a product
- [x] Step 2. POS: Buy Scrap
- [x] Step 3. Purchase history
- [ ] Step 4. POS: Sell Scrap
- [ ] Step 5. Expenses
- [ ] Step 6. Dashboard
- [ ] Step 7. People
- [ ] Step 8. Payments
- [ ] Step 9. Price history
- [ ] Step 10. Sync identity
- [ ] Step 11. Export
- [ ] Step 12. Import preview and Replace
- [ ] Step 13. Merge and import history
- [ ] Step 14. Reports
- [ ] Step 15. Daily cash closing
- [ ] Step 16. Attachments
