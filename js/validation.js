
const Validation = {
    required(value, message = "This field is required.") {
        const valid = String(value ?? "").trim() !== "";

        return {
            valid,
            message: valid ? "" : message
        };
    },

    email(value) {
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const valid = emailRegex.test(String(value || "").trim());

        return {
            valid,
            message: valid ? "" : "Enter a valid email address."
        };
    },

    phone(value) {
        const cleaned = String(value || "").replace(/\s+/g, "");

        const phoneRegex = /^\+?[0-9]{7,15}$/;

        const valid = phoneRegex.test(cleaned);

        return {
            valid,
            message: valid ? "" : "Enter a valid phone number."
        };
    },

    minLength(value, length) {
        const valid = String(value || "").length >= length;

        return {
            valid,
            message: valid
                ? ""
                : `Must contain at least ${length} characters.`
        };
    },

    maxLength(value, length) {
        const valid = String(value || "").length <= length;

        return {
            valid,
            message: valid
                ? ""
                : `Must not exceed ${length} characters.`
        };
    },

    password(value) {
        const password = String(value || "");

        const valid = password.length >= 8;

        return {
            valid,
            message: valid
                ? ""
                : "Password must contain at least 8 characters."
        };
    },

    confirmPassword(password, confirmation) {
        const valid = String(password) === String(confirmation);

        return {
            valid,
            message: valid ? "" : "Passwords do not match."
        };
    },

    number(value) {
        const valid =
            value !== "" &&
            value !== null &&
            value !== undefined &&
            Number.isFinite(Number(value));

        return {
            valid,
            message: valid ? "" : "Enter a valid number."
        };
    },

    positiveNumber(value) {
        const valid =
            Number.isFinite(Number(value)) &&
            Number(value) > 0;

        return {
            valid,
            message: valid ? "" : "Enter a number greater than zero."
        };
    },

    date(value) {
        const valid =
            Boolean(value) &&
            !Number.isNaN(new Date(value).getTime());

        return {
            valid,
            message: valid ? "" : "Select a valid date."
        };
    },

    validateForm(form) {
        const fields = form.querySelectorAll("[data-validate]");
        let isValid = true;

        fields.forEach(field => {
            const rules = field.dataset.validate
                .split("|")
                .map(rule => rule.trim());

            let result = { valid: true, message: "" };

            for (const rule of rules) {
                if (rule === "required") {
                    result = this.required(field.value);
                }

                if (rule === "email") {
                    result = this.email(field.value);
                }

                if (rule === "phone") {
                    result = this.phone(field.value);
                }

                if (rule === "password") {
                    result = this.password(field.value);
                }

                if (rule.startsWith("min:")) {
                    const length = Number(rule.split(":")[1]);
                    result = this.minLength(field.value, length);
                }

                if (rule.startsWith("max:")) {
                    const length = Number(rule.split(":")[1]);
                    result = this.maxLength(field.value, length);
                }

                if (!result.valid) {
                    break;
                }
            }

            this.showFieldError(field, result);

            if (!result.valid) {
                isValid = false;
            }
        });

        return isValid;
    },

    showFieldError(field, result) {
        field.classList.toggle("is-invalid", !result.valid);

        let errorElement = field.parentElement.querySelector(
            ".field-error"
        );

        if (!result.valid) {
            if (!errorElement) {
                errorElement = document.createElement("span");
                errorElement.className = "field-error";

                field.parentElement.appendChild(errorElement);
            }

            errorElement.textContent = result.message;
        } else if (errorElement) {
            errorElement.remove();
        }
    },

    clearErrors(form) {
        form.querySelectorAll(".is-invalid").forEach(field => {
            field.classList.remove("is-invalid");
        });

        form.querySelectorAll(".field-error").forEach(error => {
            error.remove();
        });
    }
};

export default Validation;
