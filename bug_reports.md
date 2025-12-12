# Bug Report #1: Cart Items Disappear After Page Refresh
**Status:** CLOSED  
**Priority:** High  
**Type:** Bug  
**Date Reported:** 07-11-2025  
**Date Closed:** 07-11-2025  

## Description
When users add items to their shopping cart and then refresh the page or navigate away and come back, all cart items disappear. This causes frustration as users have to re-add everything.

## Steps to Reproduce
1. Navigate to any product page  
2. Click "Add to Cart" button  
3. Add 2–3 different products  
4. Press F5 to refresh the page  
5. Check cart — it's now empty  

## Expected Behavior
Cart items should persist even after page refresh. They should be stored in localStorage or sessionStorage.

## Actual Behavior
Cart becomes empty after any page refresh.

## Root Cause
Cart state was only stored in React component state without persistence mechanism.

---

# Bug Report #2: Negative Quantity Values Allowed in Cart
**Status:** CLOSED  
**Priority:** Medium  
**Type:** Bug  
**Date Reported:** 19-11-2025  
**Date Closed:** 19-11-2025  

## Description
Users can enter negative numbers in the quantity input field of the shopping cart. This causes incorrect total calculations and can even show negative prices.

## Steps to Reproduce
1. Add any product to cart  
2. Go to cart page  
3. In the quantity input field, type "-5" or use the decrease button repeatedly  
4. Observe that negative quantities are accepted  
5. Total price becomes negative  

## Expected Behavior
Quantity should never go below 1. The decrease button should be disabled at quantity 1, and manual input should not accept values less than 1.

## Actual Behavior
System accepts negative quantities and calculates prices accordingly.

## Root Cause
Missing input validation on quantity field. No min/max constraints on the input element.

## Fix Applied
Added input validation: `min="1"` attribute, added check in decrease function, and added onChange validation.

---

# Bug Report #3: Product Images Broken on Slow Internet Connections
**Status:** CLOSED  
**Priority:** Medium  
**Type:** Bug  
**Date Reported:** 28-11-2025  
**Date Closed:** 28-11-2025  

## Description
On slower internet connections (3G/4G), product images fail to load and show broken image icons.

## Steps to Reproduce
1. Open Chrome DevTools  
2. Go to Network tab  
3. Set throttling to "Slow 3G"  
4. Navigate to product listing page  
5. Observe broken images  

## Expected Behavior
Images should load completely or show placeholders and have proper error handling.

## Actual Behavior
Broken image icons appear with no fallbacks.

## Root Cause
No error handling on `img` tags and no fallback or loading states.

## Fix Applied
Implemented lazy loading, placeholder images, `onError` fallback logic, and optimized image sizes.

---

# Bug Report #4: Price Calculation Error with Multiple Items
**Status:** CLOSED  
**Priority:** Critical  
**Type:** Bug  
**Date Reported:** 03-12-2025  
**Date Closed:** 03-12-2025  

## Description
Multiplying price by quantity results in floating-point errors, e.g. `$59.96999999` instead of `$59.97`.

## Steps to Reproduce
1. Add a product priced at $19.99  
2. Increase quantity to 3  
3. Observe subtotal  
4. Try with other prices  

## Expected Behavior
Prices should always show two decimal places with proper rounding.

## Actual Behavior
Incorrect decimals and rounding.

## Root Cause
Floating-point arithmetic issues in JavaScript.

## Fix Applied
Used rounding via `Math.round(price * 100) / 100`, centralized calculation logic, and `.toFixed(2)` for formatting.

---

# Bug Report #5: Items Duplicate in Cart on Fast Double-Click
**Status:** CLOSED  
**Priority:** High  
**Type:** Bug  
**Date Reported:** 09-12-2025  
**Date Closed:** 09-12-2025  

## Description
Fast double-clicking the "Add to Cart" button adds multiple units unintentionally.

## Steps to Reproduce
1. Navigate to a product page  
2. Rapidly double-click the "Add to Cart" button  
3. Open the cart  
4. Observe duplicate entries or increased quantity  

## Expected Behavior
Each click should add only 1 unit, with temporary button disabling or debouncing.

## Actual Behavior
Multiple rapid clicks cause multiple additions.

## Root Cause
No debouncing or click-lock mechanism, causing race conditions.
