
import storage from "../storage.js";

const AdminDashboard = {
    init() {
        this.renderMetrics();
        this.renderRecentStudents();
        this.renderRecentAnnouncements();
    },

    renderMetrics() {
        const metrics = {
            students: storage.count("students"),
            teachers: storage.count("teachers"),
            classes: storage.count("classes"),
            subjects: storage.count("subjects")
        };

        this.setText("totalStudents", metrics.students);
        this.setText("totalTeachers", metrics.teachers);
        this.setText("totalClasses", metrics.classes);
        this.setText("totalSubjects", metrics.subjects);
    },

    renderRecentStudents() {
        const container = document.getElementById("recentStudentsTable");

        if (!container) return;

        const students = storage.get("students")
            .sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            )
            .slice(0, 5);

        if (!students.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <p>No students have been added yet.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = students.map(student => `
            <tr>
                <td>${this.escape(student.name || student.fullName)}</td>
                <td>${this.escape(student.admissionNumber || "—")}</td>
                <td>${this.escape(student.className || "—")}</td>
                <td>${this.escape(student.section || "—")}</td>
                <td>${this.formatDate(student.createdAt)}</td>
            </tr>
        `).join("");
    },

    renderRecentAnnouncements() {
        const container = document.getElementById("recentAnnouncements");

        if (!container) return;

        const announcements = storage.get("announcements")
            .sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            )
            .slice(0, 5);

        if (!announcements.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No announcements available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = announcements.map(item => `
            <div class="announcement-item">
                <h4>${this.escape(item.title)}</h4>
                <p>${this.escape(item.message)}</p>
                <small>${this.formatDate(item.createdAt)}</small>
            </div>
        `).join("");
    },

    setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    },

    escape(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
    }
};

export default AdminDashboard;
