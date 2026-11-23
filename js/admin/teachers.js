
import storage from "../storage.js";
import AdminUtils from "./admin-utils.js";

const Teachers = {
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },

    cacheElements() {
        this.elements = {
            search: document.getElementById("teacherSearch"),
            departmentFilter: document.getElementById("teacherDepartmentFilter"),
            tableBody: document.getElementById("teachersTableBody"),
            emptyState: document.getElementById("teachersEmptyState")
        };
    },

    bindEvents() {
        this.elements.search?.addEventListener("input", () => this.render());

        this.elements.departmentFilter?.addEventListener("change", () => {
            this.render();
        });

        this.elements.tableBody?.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            if (button.dataset.action === "delete") {
                this.deleteTeacher(button.dataset.id);
            }
        });
    },

    getFilteredTeachers() {
        let teachers = storage.get("teachers");

        teachers = AdminUtils.search(
            teachers,
            this.elements.search?.value || "",
            ["name", "fullName", "email", "phone", "employeeId", "department"]
        );

        const department = this.elements.departmentFilter?.value || "";

        if (department) {
            teachers = teachers.filter(teacher =>
                String(teacher.department) === String(department)
            );
        }

        return teachers;
    },

    render() {
        const tbody = this.elements.tableBody;

        if (!tbody) return;

        const teachers = this.getFilteredTeachers();

        tbody.innerHTML = "";

        if (!teachers.length) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        teachers.forEach(teacher => {
            const row = document.createElement("tr");

            const name = teacher.name || teacher.fullName || "Unnamed teacher";

            row.innerHTML = `
                <td>
                    <div class="teacher-cell">
                        <div class="teacher-avatar">
                            ${AdminUtils.escapeHTML(name.charAt(0).toUpperCase())}
                        </div>
                        <div>
                            <strong>${AdminUtils.escapeHTML(name)}</strong>
                            <small>${AdminUtils.escapeHTML(teacher.email || "—")}</small>
                        </div>
                    </div>
                </td>
                <td>${AdminUtils.escapeHTML(teacher.employeeId || "—")}</td>
                <td>${AdminUtils.escapeHTML(teacher.department || "—")}</td>
                <td>${AdminUtils.escapeHTML(teacher.phone || "—")}</td>
                <td>
                    <button
                        type="button"
                        class="btn-icon btn-danger"
                        data-action="delete"
                        data-id="${AdminUtils.escapeHTML(teacher.id)}"
                        aria-label="Delete teacher"
                        title="Delete teacher"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    showEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.hidden = false;
        }
    },

    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.hidden = true;
        }
    },

    deleteTeacher(id) {
        if (AdminUtils.delete("teachers", id)) {
            this.render();
        }
    }
};

export default Teachers;
