
import Notifications from "./notifications.js";

const Navigation = {
    sidebar: null,
    overlay: null,
    menuToggle: null,
    sidebarClose: null,

    init() {
        this.sidebar = document.getElementById("sidebar");
        this.overlay = document.getElementById("sidebarOverlay");
        this.menuToggle = document.getElementById("menuToggle");
        this.sidebarClose = document.getElementById("sidebarClose");

        this.bindEvents();
        this.setActiveLink();
    },

    bindEvents() {
        this.menuToggle?.addEventListener("click", () => {
            this.openSidebar();
        });

        this.sidebarClose?.addEventListener("click", () => {
            this.closeSidebar();
        });

        this.overlay?.addEventListener("click", () => {
            this.closeSidebar();
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                this.closeSidebar();
            }
        });

        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            this.logout();
        });
    },

    openSidebar() {
        this.sidebar?.classList.add("active");
        this.overlay?.classList.add("active");

        document.body.classList.add("sidebar-open");
    },

    closeSidebar() {
        this.sidebar?.classList.remove("active");
        this.overlay?.classList.remove("active");

        document.body.classList.remove("sidebar-open");
    },

    setActiveLink() {
        const currentPath = window.location.pathname
            .split("/")
            .pop();

        const links = document.querySelectorAll(
            ".sidebar-nav a, .sidebar a"
        );

        links.forEach(link => {
            const linkPath = link.getAttribute("href");

            if (!linkPath || linkPath === "#") {
                return;
            }

            const normalizedLink = linkPath.split("/").pop();

            if (normalizedLink === currentPath) {
                link.classList.add("active");

                link.closest(".nav-item")?.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    },

    logout() {
        const confirmed = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) return;

        sessionStorage.removeItem("nexit_session");

        Notifications.info("You have been logged out.");

        setTimeout(() => {
            window.location.href = this.getRootPath() + "login.html";
        }, 500);
    },

    getRootPath() {
        const path = window.location.pathname;

        if (path.includes("/admin/") ||
            path.includes("/teacher/") ||
            path.includes("/student/")) {
            return "../";
        }

        return "./";
    }
};

export default Navigation;
