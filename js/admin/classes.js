
import storage from "../storage.js";
import AdminUtils from "./admin-utils.js";

const Classes = {
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },

    cacheElements() {
        this.elements = {
            search: document.getElementById("classSearch"),
            tableBody: document.getElementById("classesTableBody"),
            emptyState: document.getElementById("classesEmptyState"),
            addButton: document.getElementById("addClassBtn")
        };
    },

    bindEvents() {
        this.elements.search?.addEventListener("input", () => this.render());

        this.elements.tableBody?.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            if (button.dataset.action === "delete") {
                this.deleteClass(button.dataset.id);
            }
        });
    },

    getClasses() {
        return AdminUtils.search(
            storage.get("classes"),
            this.elements.search?.value || "",
            ["name", "className", "grade", "section", "teacher"]
        );
    },

    render() {
        const tbody = this.elements.tableBody;

        if (!tbody) return;

        const classes = this.getClasses();

        tbody.innerHTML = "";

        if (!classes.length) {
            if (this.elements.emptyState) {
                this.elements.emptyState.hidden = false;
            }

            return;
        }

        if (this.elements.emptyState) {
            this.elements.emptyState.hidden = true;
        }

        classes.forEach(classItem => {
            const row = document.createElement("tr");

            const className =
                classItem.name ||
                classItem.className ||
                classItem.grade ||
                "Unnamed class";

            const studentCount = storage.get("students").filter(student =>
                String(student.classId) === String(classItem.id)
            ).length;

            row.innerHTML = `
                <td>${AdminUtils.escapeHTML(className)}</td>
                <td>${AdminUtils.escapeHTML(classItem.section || "—")}</td>
                <td>${AdminUtils.escapeHTML(classItem.teacher || "—")}</td>
                <td>${studentCount}</td>
                <td>
                    <button
                        type="button"
                        class="btn-icon btn-danger"
                        data-action="delete"
                        data-id="${AdminUtils.escapeHTML(classItem.id)}"
                        aria-label="Delete class"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    deleteClass(id) {
        const linkedStudents = storage.get("students").filter(student =>
            String(student.classId) === String(id)
        );

        if (linkedStudents.length) {
            window.alert(
                "This class contains students. Reassign or remove those students before deleting the class."
            );

            return;
        }

        if (AdminUtils.delete("classes", id)) {
            this.render();
        }
    }
};

export default Classes;
