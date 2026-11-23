
import storage from "../storage.js";
import AdminUtils from "./admin-utils.js";
import Notifications from "../notifications.js";

const Timetable = {
    elements: {},

    days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ],

    init() {
        this.cacheElements();
        this.populateFilters();
        this.bindEvents();
        this.render();
    },

    cacheElements() {
        this.elements = {
            classFilter: document.getElementById("timetableClassFilter"),
            dayFilter: document.getElementById("timetableDayFilter"),
            container: document.getElementById("timetableContainer"),
            addButton: document.getElementById("addTimetableBtn"),
            emptyAddButton: document.getElementById("emptyAddTimetableBtn")
        };
    },

    populateFilters() {
        const classFilter = this.elements.classFilter;

        if (classFilter) {
            AdminUtils.populateSelect(classFilter, storage.get("classes"), {
                valueKey: "id",
                labelKey: "name",
                placeholder: "All classes"
            });
        }

        const dayFilter = this.elements.dayFilter;

        if (dayFilter) {
            dayFilter.innerHTML = `<option value="">All days</option>`;

            this.days.forEach(day => {
                const option = document.createElement("option");
                option.value = day;
                option.textContent = day;
                dayFilter.appendChild(option);
            });
        }
    },

    bindEvents() {
        this.elements.classFilter?.addEventListener("change", () => this.render());
        this.elements.dayFilter?.addEventListener("change", () => this.render());

        this.elements.addButton?.addEventListener("click", () => {
            this.requestAdd();
        });

        this.elements.emptyAddButton?.addEventListener("click", () => {
            this.requestAdd();
        });

        this.elements.container?.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            const { action, id } = button.dataset;

            if (action === "delete") {
                this.deleteEntry(id);
            }

            if (action === "edit") {
                this.requestEdit(id);
            }
        });
    },

    getRecords() {
        let records = storage.get("timetable");

        const classId = this.elements.classFilter?.value || "";
        const day = this.elements.dayFilter?.value || "";

        if (classId) {
            records = records.filter(record =>
                String(record.classId) === String(classId)
            );
        }

        if (day) {
            records = records.filter(record =>
                String(record.day).toLowerCase() === day.toLowerCase()
            );
        }

        return records.sort((a, b) => {
            const dayOrder = this.days.indexOf(a.day) - this.days.indexOf(b.day);

            if (dayOrder !== 0) return dayOrder;

            return String(a.startTime || "").localeCompare(
                String(b.startTime || "")
            );
        });
    },

    render() {
        const container = this.elements.container;

        if (!container) return;

        const records = this.getRecords();

        if (!records.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <h3>No timetable entries found</h3>
                        <p>Add timetable periods or adjust your filters.</p>
                    </div>
                </div>
            `;

            return;
        }

        const grouped = this.groupByDay(records);

        container.innerHTML = this.days
            .filter(day => grouped[day]?.length)
            .map(day => this.renderDay(day, grouped[day]))
            .join("");
    },

    groupByDay(records) {
        return records.reduce((groups, record) => {
            const day = record.day || "Other";

            if (!groups[day]) {
                groups[day] = [];
            }

            groups[day].push(record);

            return groups;
        }, {});
    },

    renderDay(day, records) {
        const sorted = records.slice().sort((a, b) =>
            String(a.startTime || "").localeCompare(String(b.startTime || ""))
        );

        return `
            <section class="timetable-day">
                <div class="timetable-day-header">
                    <h3>${AdminUtils.escapeHTML(day)}</h3>
                    <span>${sorted.length} period${sorted.length === 1 ? "" : "s"}</span>
                </div>

                <div class="timetable-period-list">
                    ${sorted.map(record => this.renderPeriod(record)).join("")}
                </div>
            </section>
        `;
    },

    renderPeriod(record) {
        const overlap = this.hasOverlap(record);

        return `
            <article class="timetable-period ${overlap ? "has-overlap" : ""}">
                <div class="timetable-period-time">
                    <strong>${AdminUtils.escapeHTML(this.formatTime(record.startTime))}</strong>
                    <span>${AdminUtils.escapeHTML(this.formatTime(record.endTime))}</span>
                </div>

                <div class="timetable-period-info">
                    <h4>${AdminUtils.escapeHTML(record.subject || "Unnamed subject")}</h4>
                    <p>
                        ${AdminUtils.escapeHTML(record.className || "—")}
                        ${record.section ? ` · Section ${AdminUtils.escapeHTML(record.section)}` : ""}
                    </p>
                    <p>${AdminUtils.escapeHTML(record.teacher || "Unassigned teacher")}</p>
                    ${record.room ? `<span class="timetable-room">Room ${AdminUtils.escapeHTML(record.room)}</span>` : ""}
                    ${overlap ? `<span class="timetable-conflict">Schedule conflict</span>` : ""}
                </div>

                <div class="timetable-period-actions">
                    <button
                        type="button"
                        class="btn-icon"
                        data-action="edit"
                        data-id="${AdminUtils.escapeHTML(record.id)}"
                        aria-label="Edit timetable entry"
                        title="Edit timetable entry"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        type="button"
                        class="btn-icon btn-danger"
                        data-action="delete"
                        data-id="${AdminUtils.escapeHTML(record.id)}"
                        aria-label="Delete timetable entry"
                        title="Delete timetable entry"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </article>
        `;
    },

    formatTime(value) {
        if (!value) return "—";

        const [hours, minutes] = String(value).split(":");

        if (hours === undefined || minutes === undefined) {
            return value;
        }

        const date = new Date();
        date.setHours(Number(hours), Number(minutes), 0, 0);

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    },

    hasOverlap(record) {
        if (!record.startTime || !record.endTime) return false;

        const currentStart = this.toMinutes(record.startTime);
        const currentEnd = this.toMinutes(record.endTime);

        if (currentStart === null || currentEnd === null) return false;

        return storage.get("timetable").some(other => {
            if (String(other.id) === String(record.id)) return false;

            if (String(other.day).toLowerCase() !== String(record.day).toLowerCase()) {
                return false;
            }

            if (String(other.classId) !== String(record.classId)) {
                return false;
            }

            const otherStart = this.toMinutes(other.startTime);
            const otherEnd = this.toMinutes(other.endTime);

            if (otherStart === null || otherEnd === null) return false;

            return currentStart < otherEnd && currentEnd > otherStart;
        });
    },

    toMinutes(time) {
        if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;

        const [hours, minutes] = time.split(":").map(Number);

        if (hours > 23 || minutes > 59) return null;

        return hours * 60 + minutes;
    },

    requestAdd() {
        document.dispatchEvent(
            new CustomEvent("nexit:add-timetable")
        );
    },

    requestEdit(id) {
        const record = storage.getById("timetable", id);

        if (!record) {
            Notifications.error("Timetable entry not found.");
            return;
        }

        document.dispatchEvent(
            new CustomEvent("nexit:edit-timetable", {
                detail: { record }
            })
        );
    },

    deleteEntry(id) {
        if (AdminUtils.delete("timetable", id)) {
            this.render();
        }
    }
};

export default Timetable;
