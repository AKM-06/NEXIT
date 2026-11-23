
const Notifications = {
    container: null,

    init() {
        this.container = document.getElementById("toastContainer");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.id = "toastContainer";
            this.container.className = "toast-container";

            document.body.appendChild(this.container);
        }
    },

    show(message, type = "info", duration = 3500) {
        if (!this.container) {
            this.init();
        }

        const icons = {
            success: "✓",
            error: "✕",
            warning: "⚠",
            info: "ℹ"
        };

        const toast = document.createElement("div");

        toast.className = `toast toast-${type}`;

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message"></span>
            <button class="toast-close" aria-label="Dismiss notification">
                &times;
            </button>
        `;

        toast.querySelector(".toast-message").textContent = message;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        const closeButton = toast.querySelector(".toast-close");

        closeButton.addEventListener("click", () => {
            this.dismiss(toast);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    },

    success(message, duration) {
        return this.show(message, "success", duration);
    },

    error(message, duration) {
        return this.show(message, "error", duration);
    },

    warning(message, duration) {
        return this.show(message, "warning", duration);
    },

    info(message, duration) {
        return this.show(message, "info", duration);
    },

    dismiss(toast) {
        if (!toast || toast.classList.contains("removing")) {
            return;
        }

        toast.classList.add("removing");

        setTimeout(() => {
            toast.remove();
        }, 250);
    },

    clear() {
        if (!this.container) return;

        this.container.querySelectorAll(".toast").forEach(toast => {
            this.dismiss(toast);
        });
    }
};

export default Notifications;
