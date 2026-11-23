
import storage from "../storage.js";
import Notifications from "../notifications.js";

const AdminUtils = {
    storage,

    get(collection) {
        return storage.get(collection);
    },

    find(collection, id) {
        return storage.getById(collection, id);
    },

    create(collection, data) {
        try {
            const record = storage.create(collection, data);
            Notifications.success("Record added successfully.");
            return record;
        } catch (error) {
            Notifications.error(error.message || "Unable to add record.");
            return null;
        }
    },

    update(collection, id, data) {
        try {
            const record = storage.update(collection, id, data);

            if (record) {
                Notifications.success("Record updated successfully.");
            }

            return record;
        } catch (error) {
            Notifications.error(error.message || "Unable to update record.");
            return null;
        }
    },

    delete(collection, id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this record? This action cannot be undone."
        );

        if (!confirmed) return false;

        try {
            const deleted = storage.delete(collection, id);

            if (deleted) {
                Notifications.success("Record deleted successfully.");
            }

            return deleted;
        } catch (error) {
            Notifications.error(error.message || "Unable to delete record.");
            return false;
        }
    },

    search(records, query, fields) {
        const searchTerm = String(query || "").trim().toLowerCase();

        if (!searchTerm) return records;

        return records.filter(record =>
            fields.some(field =>
                String(record[field] ?? "")
                    .toLowerCase()
                    .includes(searchTerm)
            )
        );
    },

    filter(records, filters) {
        return records.filter(record => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === "" || value === null || value === undefined) {
                    return true;
                }

                return String(record[key]) === String(value);
            });
        });
    },

    escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

   
emptyState(message = "No records found.") {
    return `
        <div class="empty-state">
            <div class="empty-state-content">
                <p>${this.escapeHTML(message)}</p>
            </div>
        </div>
    `;
},


    populateSelect(select, items, options = {}) {
        if (!select) return;

        const {
            valueKey = "id",
            labelKey = "name",
            placeholder = "Select an option",
            selectedValue = ""
        } = options;

        select.innerHTML = "";

        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = placeholder;

        select.appendChild(placeholderOption);

        items.forEach(item => {
            const option = document.createElement("option");

            option.value = item[valueKey];
            option.textContent = item[labelKey];

            if (String(item[valueKey]) === String(selectedValue)) {
                option.selected = true;
            }

            select.appendChild(option);
        });
    },

    formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    },

    createActionButton(action, id, label, className = "") {
        const button = document.createElement("button");

        button.type = "button";
        button.className = className;
        button.dataset.action = action;
        button.dataset.id = id;
        button.textContent = label;

        return button;
    },

    getUniqueValues(collection, field) {
        return [...new Set(
            storage.get(collection)
                .map(item => item[field])
                .filter(value => value !== undefined && value !== null && value !== "")
        )];
    }
};

export default AdminUtils;
