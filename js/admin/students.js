
import storage from "../storage.js";
import AdminUtils from "./admin-utils.js";

const Students = {
    elements: {},

    init() {
        this.cacheElements();
        this.populateFilters();
        this.bindEvents();
        this.render();
    },

    cacheElements() {
        this.elements = {
            search: document.getElementById("studentSearch"),
            classFilter: document.getElementById("studentClassFilter"),
            sectionFilter: document.getElementById("studentSectionFilter"),
            tableBody: document.getElementById("studentsTableBody"),
            emptyState: document.getElementById("studentsEmptyState")
        };
    },

    populateFilters() {
        const classFilter = this.elements.classFilter;

        if (!classFilter) return;

        const classes = storage.get("classes");

        AdminUtils.populateSelect(classFilter, classes, {
            valueKey: "id",
            labelKey: "name",
            placeholder: "All classes"
        });
    },

    bindEvents() {
        this.elements.search?.addEventListener("input", () => this.render());

        this.elements.classFilter?.addEventListener("change", () => {
            this.populateSectionFilter();
            this.render();
        });

        this.elements.sectionFilter?.addEventListener("change", () => {
            this.render();
        });

        this.elements.tableBody?.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            const { action, id } = button.dataset;

            if (action === "delete") {
                this.deleteStudent(id);
            }
        });
    },

    populateSectionFilter() {
        const sectionFilter = this.elements.sectionFilter;

        if (!sectionFilter) return;

        const selectedClass = this.elements.classFilter?.value || "";

        let students = storage.get("students");

        if (selectedClass) {
            students = students.filter(student =>
                String(student.classId) === String(selectedClass)
            );
        }

        const sections = [
            ...new Set(
                students
                    .map(student => student.section)
                    .filter(Boolean)
            )
        ];

        sectionFilter.innerHTML = `
            <option value="">All sections</option>
        `;

        sections.forEach(section => {
            const option = document.createElement("option");

            option.value = section;
            option.textContent = section;

            sectionFilter.appendChild(option);
        });
    },

    getFilteredStudents() {
        let students = storage.get("students");

        const search = this.elements.search?.value || "";
        const classId = this.elements.classFilter?.value || "";
        const section = this.elements.sectionFilter?.value || "";

        students = AdminUtils.search(students, search, [
            "name",
            "fullName",
            "admissionNumber",
            "email",
            "phone",
            "className",
            "section"
        ]);

        if (classId) {
            students = students.filter(student =>
                String(student.classId) === String(classId)
            );
        }

        if (section) {
            students = students.filter(student =>
                String(student.section) === String(section)
            );
        }

        return students;
    },

    render() {
        const tbody = this.elements.tableBody;

        if (!tbody) return;

        const students = this.getFilteredStudents();

        tbody.innerHTML = "";

        if (!students.length) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        students.forEach(student => {
            const row = document.createElement("tr");

            const studentName = student.name || student.fullName || "Unnamed student";

            row.innerHTML = `
                <td>
                    <div class="student-cell">
                        <div class="student-avatar">
                            ${AdminUtils.escapeHTML(
                                studentName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <strong>${AdminUtils.escapeHTML(studentName)}</strong>
                            <small>${AdminUtils.escapeHTML(student.email || "—")}</small>
                        </div>
                    </div>
                </td>
                <td>${AdminUtils.escapeHTML(student.admissionNumber || "—")}</td>
                <td>${AdminUtils.escapeHTML(student.className || "—")}</td>
                <td>${AdminUtils.escapeHTML(student.section || "—")}</td>
                <td>${AdminUtils.escapeHTML(student.phone || "—")}</td>
                <td>
                    <div class="table-actions">
                        <button
                            type="button"
                            class="btn-icon btn-danger"
                            data-action="delete"
                            data-id="${AdminUtils.escapeHTML(student.id)}"
                            aria-label="Delete student"
                            title="Delete student"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    showEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.hidden = false;
        }

        if (this.elements.tableBody) {
            this.elements.tableBody.closest("table")?.classList.add("is-empty");
        }
    },

    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.hidden = true;
        }

        if (this.elements.tableBody) {
            this.elements.tableBody.closest("table")?.classList.remove("is-empty");
        }
    },

    deleteStudent(id) {
        const deleted = AdminUtils.delete("students", id);

        if (deleted) {
            this.render();
        }
    }
};

export default Students;
