
import storage from "../storage.js";
import AdminUtils from "./admin-utils.js";

const Subjects = {
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
    },

    cacheElements() {
        this.elements = {
            search: document.getElementById("subjectSearch"),
            classFilter: document.getElementById("subjectClassFilter"),
            tableBody: document.getElementById("subjectsTableBody"),
            emptyState: document.getElementById("subjectsEmptyState")
        };
    },

    bindEvents() {
        this.elements.search?.addEventListener("input", () => this.render());

        this.elements.classFilter?.addEventListener("change", () => {
            this.render();
        });

        this.elements.tableBody?.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            if (button.dataset.action === "delete") {
                this.deleteSubject(button.dataset.id);
            }
        });
    },

    getSubjects() {
        let subjects = storage.get("subjects");

        subjects = AdminUtils.search(
            subjects,
            this.elements.search?.value || "",
            ["name", "subjectName", "code", "teacher", "className"]
        );

        const classId = this.elements.classFilter?.value || "";

        if (classId) {
            subjects = subjects.filter(subject =>
                String(subject.classId) === String(classId)
            );
        }

        return subjects;
    },

    render() {
        const tbody = this.elements.tableBody;

        if (!tbody) return;

        const subjects = this.getSubjects();

        tbody.innerHTML = "";

        if (!subjects.length) {
            if (this.elements.emptyState) {
                this.elements.emptyState.hidden = false;
            }

            return;
        }

        if (this.elements.emptyState) {
            this.elements.emptyState.hidden = true;
        }

        subjects.forEach(subject => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${AdminUtils.escapeHTML(subject.name || subject.subjectName || "Unnamed subject")}</td>
                <td>${AdminUtils.escapeHTML(subject.code || "—")}</td>
                <td>${AdminUtils.escapeHTML(subject.className || "—")}</td>
                <td>${AdminUtils.escapeHTML(subject.teacher || "—")}</td>
                <td>
                    <button
                        type="button"
                        class="btn-icon btn-danger"
                        data-action="delete"
                        data-id="${AdminUtils.escapeHTML(subject.id)}"
                        aria-label="Delete subject"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    deleteSubject(id) {
        if (AdminUtils.delete("subjects", id)) {
            this.render();
        }
    }
};

export default Subjects;
