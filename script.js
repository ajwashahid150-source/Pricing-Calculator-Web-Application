/* ==========================================================================
   PRICING CALCULATOR — SCRIPT.JS
   Vanilla JavaScript only. Handles validation, calculation, DOM updates,
   notifications, and UI interactions.
   ========================================================================== */

(function () {
    "use strict";

    /* ----------------------------------------------------------------------
       1. ELEMENT REFERENCES
    ----------------------------------------------------------------------- */
    const form = document.getElementById("pricingForm");
    const calculateBtn = document.getElementById("calculateBtn");
    const resetBtn = document.getElementById("resetBtn");
    const toastContainer = document.getElementById("toastContainer");

    const fields = {
        productName: document.getElementById("productName"),
        productPrice: document.getElementById("productPrice"),
        quantity: document.getElementById("quantity"),
        discount: document.getElementById("discount"),
        tax: document.getElementById("tax"),
    };

    const emptyState = document.getElementById("emptyState");
    const resultsContent = document.getElementById("resultsContent");

    const resultEls = {
        productName: document.getElementById("resProductName"),
        productPrice: document.getElementById("resProductPrice"),
        quantity: document.getElementById("resQuantity"),
        subtotal: document.getElementById("resSubtotal"),
        discountAmount: document.getElementById("resDiscountAmount"),
        taxAmount: document.getElementById("resTaxAmount"),
        finalTotal: document.getElementById("resFinalTotal"),
    };

    const CURRENCY_SYMBOL = "$";

    /* ----------------------------------------------------------------------
       2. VALIDATION RULES
       Each rule returns true (valid) or false (invalid) for the raw string.
    ----------------------------------------------------------------------- */
    const validators = {
        productName: (value) => value.trim().length > 0,

        productPrice: (value) => {
            const num = parseFloat(value);
            return value.trim() !== "" && !isNaN(num) && num > 0;
        },

        quantity: (value) => {
            const num = parseFloat(value);
            return (
                value.trim() !== "" &&
                !isNaN(num) &&
                num > 0 &&
                Number.isInteger(num)
            );
        },

        discount: (value) => {
            const num = parseFloat(value);
            return value.trim() !== "" && !isNaN(num) && num >= 0 && num <= 100;
        },

        tax: (value) => {
            const num = parseFloat(value);
            return value.trim() !== "" && !isNaN(num) && num >= 0 && num <= 100;
        },
    };

    /* ----------------------------------------------------------------------
       3. VALIDATE A SINGLE FIELD & UPDATE ITS UI STATE
    ----------------------------------------------------------------------- */
    function validateField(name) {
        const input = fields[name];
        const errorEl = document.getElementById("error-" + name);
        const isValid = validators[name](input.value);

        if (isValid) {
            input.classList.remove("is-invalid");
            input.classList.add("is-valid");
            errorEl.classList.remove("show");
        } else {
            input.classList.remove("is-valid");
            input.classList.add("is-invalid");
            errorEl.classList.add("show");
        }

        return isValid;
    }

    /* ----------------------------------------------------------------------
       4. VALIDATE ALL FIELDS (used before calculation)
    ----------------------------------------------------------------------- */
    function validateAllFields() {
        let allValid = true;
        Object.keys(fields).forEach((name) => {
            const valid = validateField(name);
            if (!valid) allValid = false;
        });
        return allValid;
    }

    /* ----------------------------------------------------------------------
       5. CHECK IF FORM IS "READY" (all fields non-empty) TO TOGGLE BUTTON
       This runs silently on every keystroke without flashing error states
       unless the field has already been touched/invalid.
    ----------------------------------------------------------------------- */
    function updateCalculateButtonState() {
        const allFilled = Object.keys(fields).every((name) => {
            return fields[name].value.trim() !== "";
        });
        calculateBtn.disabled = !allFilled;
    }

    /* ----------------------------------------------------------------------
       6. NUMBER / CURRENCY FORMATTING HELPERS
    ----------------------------------------------------------------------- */
    function formatCurrency(amount) {
        return (
            CURRENCY_SYMBOL +
            amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
        );
    }

    function formatNumber(num) {
        return num.toLocaleString("en-US");
    }

    /* ----------------------------------------------------------------------
       7. CORE CALCULATION LOGIC
       Formula:
         Subtotal            = Price × Quantity
         Discount Amount     = (Subtotal × Discount%) / 100
         Price After Discount= Subtotal − Discount Amount
         Tax Amount          = (Price After Discount × Tax%) / 100
         Final Total         = Price After Discount + Tax Amount
    ----------------------------------------------------------------------- */
    function calculatePricing({ price, quantity, discountPct, taxPct }) {
        const subtotal = price * quantity;
        const discountAmount = (subtotal * discountPct) / 100;
        const priceAfterDiscount = subtotal - discountAmount;
        const taxAmount = (priceAfterDiscount * taxPct) / 100;
        const finalTotal = priceAfterDiscount + taxAmount;

        return { subtotal, discountAmount, taxAmount, finalTotal };
    }

    /* ----------------------------------------------------------------------
       8. RENDER RESULTS INTO THE DOM
    ----------------------------------------------------------------------- */
    function renderResults(data) {
        resultEls.productName.textContent = data.name;
        resultEls.productPrice.textContent = formatCurrency(data.price);
        resultEls.quantity.textContent = formatNumber(data.quantity);
        resultEls.subtotal.textContent = formatCurrency(data.subtotal);
        resultEls.discountAmount.textContent = "− " + formatCurrency(data.discountAmount);
        resultEls.taxAmount.textContent = "+ " + formatCurrency(data.taxAmount);
        resultEls.finalTotal.textContent = formatCurrency(data.finalTotal);

        // Swap empty state for results, retriggering the fade/slide animation
        emptyState.classList.add("d-none");
        resultsContent.classList.remove("d-none");
        resultsContent.classList.remove("results-content");
        // Force reflow so the animation class can be re-applied
        void resultsContent.offsetWidth;
        resultsContent.classList.add("results-content");
    }

    /* ----------------------------------------------------------------------
       9. TOAST NOTIFICATIONS (success / error)
    ----------------------------------------------------------------------- */
    function showToast(message, type) {
        const toast = document.createElement("div");
        toast.className = "custom-toast " + type;

        const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
        toast.innerHTML = '<i class="bi ' + icon + '"></i><span>' + message + "</span>";

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(40px)";
            toast.style.transition = "all 0.4s ease";
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    /* ----------------------------------------------------------------------
       10. RIPPLE EFFECT ON BUTTON CLICK
    ----------------------------------------------------------------------- */
    function triggerRipple(button, event) {
        const rect = button.getBoundingClientRect();
        const x = event.clientX ? event.clientX - rect.left : rect.width / 2;
        const y = event.clientY ? event.clientY - rect.top : rect.height / 2;

        button.style.setProperty("--ripple-x", x + "px");
        button.style.setProperty("--ripple-y", y + "px");

        button.classList.remove("rippling");
        // Force reflow to restart animation
        void button.offsetWidth;
        button.classList.add("rippling");

        setTimeout(() => button.classList.remove("rippling"), 650);
    }

    /* ----------------------------------------------------------------------
       11. HANDLE FORM SUBMISSION (Calculate Total)
    ----------------------------------------------------------------------- */
    function handleCalculate(event) {
        event.preventDefault();
        triggerRipple(calculateBtn, event);

        const isValid = validateAllFields();

        if (!isValid) {
            showToast("Please fix the highlighted fields before calculating.", "error");
            return;
        }

        // Show loading state on the button
        const btnContent = calculateBtn.querySelector(".btn-content");
        const btnSpinner = calculateBtn.querySelector(".btn-spinner");
        btnContent.classList.add("d-none");
        btnSpinner.classList.remove("d-none");
        calculateBtn.disabled = true;

        // Simulate a brief processing delay for a premium "loading effect"
        setTimeout(() => {
            const price = parseFloat(fields.productPrice.value);
            const quantity = parseFloat(fields.quantity.value);
            const discountPct = parseFloat(fields.discount.value);
            const taxPct = parseFloat(fields.tax.value);
            const name = fields.productName.value.trim();

            const results = calculatePricing({ price, quantity, discountPct, taxPct });

            renderResults({
                name,
                price,
                quantity,
                subtotal: results.subtotal,
                discountAmount: results.discountAmount,
                taxAmount: results.taxAmount,
                finalTotal: results.finalTotal,
            });

            // Restore button state
            btnContent.classList.remove("d-none");
            btnSpinner.classList.add("d-none");
            calculateBtn.disabled = false;

            showToast("Total calculated successfully!", "success");
        }, 550);
    }

    /* ----------------------------------------------------------------------
       12. HANDLE FORM RESET
    ----------------------------------------------------------------------- */
    function handleReset(event) {
        triggerRipple(resetBtn, event);

        form.reset();

        // Clear validation states
        Object.keys(fields).forEach((name) => {
            fields[name].classList.remove("is-valid", "is-invalid");
            document.getElementById("error-" + name).classList.remove("show");
        });

        // Restore empty state in the results panel
        resultsContent.classList.add("d-none");
        emptyState.classList.remove("d-none");

        calculateBtn.disabled = true;

        showToast("Form has been reset.", "success");
    }

    /* ----------------------------------------------------------------------
       13. EVENT LISTENERS
    ----------------------------------------------------------------------- */

    // Live validation + button toggle as the user types
    Object.keys(fields).forEach((name) => {
        fields[name].addEventListener("input", () => {
            // Only show validation errors once the field has content or was already invalid
            if (fields[name].classList.contains("is-invalid") || fields[name].value !== "") {
                validateField(name);
            }
            updateCalculateButtonState();
        });

        // Validate on blur so users get feedback when leaving a field
        fields[name].addEventListener("blur", () => {
            if (fields[name].value !== "") {
                validateField(name);
            }
        });
    });

    // Form submit (Calculate Total button, or Enter key inside the form)
    form.addEventListener("submit", handleCalculate);

    // Reset button
    resetBtn.addEventListener("click", handleReset);

    // Extra keyboard support: Enter key triggers calculation from any field
    Object.values(fields).forEach((input) => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (!calculateBtn.disabled) {
                    form.requestSubmit ? form.requestSubmit() : handleCalculate(e);
                }
            }
        });
    });

    /* ----------------------------------------------------------------------
       14. INITIAL STATE ON PAGE LOAD
    ----------------------------------------------------------------------- */
    updateCalculateButtonState();
})();