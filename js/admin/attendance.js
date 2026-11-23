
import storage from "../storage.js";
import AdminUtils from "./admin-utils.js";

const Attendance = {
    elements: {},

    init() {
        this.cacheElements();
        this.populateClassFilter();
        this.bindEvents();
        this.render();
    },

    cacheElements() {
        this.elements = {
            classFilter: document.getElementById("attendanceClassFilter"),
            dateFilter: document.getElementById("attendanceDateFilter"),
            statusFilter: document.getElementById("attendanceStatusFilter"),
            tableBody: document.getElementById("attendanceTableBody"),
            emptyState: document.getElementById("attendanceEmptyState"),
            presentCount: document.getElementById("attendancePresentCount"),
            absentCount: document.getElementById("attendanceAbsentCount"),
            lateCount: document.getElementById("attendanceLateCount"),
            leaveCount: document.getElementById("attendanceLeaveCount")
        };
    },

    populateClassFilter() {
        const filter = this.elements.classFilter;
        if (!filter) return;

        AdminUtils.populateSelect(filter, storage.get("classes"), {
            valueKey: "id",
            labelKey: "name",
            placeholder: "All classes"
        });
    },

    bindEvents() {
        this.elements.classFilter?.addEventListener("change", () => this.render());
        this.elements.dateFilter?.addEventListener("change", () => this.render());
        this.elements.statusFilter?.addEventListener("change", () => this.render());

        this.elements.tableBody?.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            if (button.dataset.action === "delete") {
                this.deleteRecord(button.dataset.id);
            }
        });
    },

    getRecords() {
        let records = storage.get("attendance");

        const classId = this.elements.classFilter?.value || "";
        const date = this.elements.dateFilter?.value || "";
        const status = this.elements.statusFilter?.value || "";

        if (classId) {
            records = records.filter(record =>
                String(record.classId) === String(classId)
            );
        }

        if (date) {
            records = records.filter(record => record.date === date);
        }

        if (status) {
            records = records.filter(record =>
                String(record.status).toLowerCase() === status.toLowerCase()
            );
        }

        return records;
    },

    render() {
        const records = this.getRecords();

        this.renderSummary(records);
        this.renderTable(records);
    },

    renderSummary(records) {
        const counts = {
            present: 0,
            absent: 0,
            late: 0,
            leave: 0
        };

        records.forEach(record => {
            const status = String(record.status || "").toLowerCase();

            if (Object.hasOwn(counts, status)) {
                counts[status]++;
            }
        });

        if (this.elements.presentCount) {
            this.elements.presentCount.textContent = counts.present;
        }

        if (this.elements.absentCount) {
            this.elements.absentCount.textContent = counts.absent;
        }

        if (this.elements.lateCount) {
            this.elements.lateCount.textContent = counts.late;
        }

        if (this.elements.leaveCount) {
            this.elements.leaveCount.textContent = counts.leave;
        }
    },

    renderTable(records) {
        const tbody = this.elements.tableBody;

        if (!tbody) return;

        tbody.innerHTML = "";

        if (!records.length) {
            if (this.elements.emptyState) {
                this.elements.emptyState.hidden = false;
            }

            return;
        }

        if (this.elements.emptyState) {
            this.elements.emptyState.hidden = true;
        }

        records
            .slice()
            .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
            .forEach(record => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${AdminUtils.escapeHTML(record.studentName || "—")}</td>
                    <td>${AdminUtils.escapeHTML(record.admissionNumber || "—")}</td>
                    <td>${AdminUtils.escapeHTML(record.className || "—")}</td>
                    <td>${AdminUtils.escapeHTML(record.section || "—")}</td>
                    <td>${AdminUtils.escapeHTML(AdminUtils.formatDate(record.date))}</td>
                    <td>
                        <span class="status-badge status-${AdminUtils.escapeHTML(String(record.status || "").toLowerCase())}">
                            ${AdminUtils.escapeHTML(record.status || "—")}
                        </span>
                    </td>
                    <td>
                        <button
                            type="button"
                            class="btn-icon btn-danger"
                            data-action="delete"
                            data-id="${AdminUtils.escapeHTML(record.id)}"
                            aria-label="Delete attendance record"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;

                tbody.appendChild(row);
            });
    },

    deleteRecord(id) {
        if (AdminUtils.delete("attendance", id)) {
            this.render();
        }
    }
};

export default Attendance;
