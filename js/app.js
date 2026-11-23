
import storage from "./storage.js";
import Validation from "./validation.js";
import Notifications from "./notifications.js";
import Navigation from "./navigation.js";

import AdminDashboard from "./admin/dashboard.js";
import Students from "./admin/students.js";
import Teachers from "./admin/teachers.js";
import Classes from "./admin/classes.js";
import Subjects from "./admin/subjects.js";
import Attendance from "./admin/attendance.js";
import Timetable from "./admin/timetable.js";

const NEXIT = {
    storage,
    Validation,
    Notifications,
    Navigation,

   init() {
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            () => this.initializeApp(),
            { once: true }
        );
    } else {
        this.initializeApp();
    }
},

    initializeApp() {
        Notifications.init();
        Navigation.init();
        this.detectPortal();
        this.initializeGlobalEvents();
        this.applyTheme();
        this.initializeAuth();
        this.initializePortal();
        this.initializeAdminCrud();
        this.initializeStudentPages();
        this.initializeTeacherPages();
        this.initializeSettings();
        this.initializeForgotPassword();
        this.initializeLandingMenu();
        this.initializeCurrentYear();

        console.log("NEXIT application initialized.");
    },

    detectPortal() {
        const path = window.location.pathname.toLowerCase();

        if (path.includes("/admin/")) {
            document.body.dataset.portal = "admin";
        } else if (path.includes("/teacher/")) {
            document.body.dataset.portal = "teacher";
        } else if (path.includes("/student/")) {
            document.body.dataset.portal = "student";
        } else {
            document.body.dataset.portal = "public";
        }
    },

    initializeGlobalEvents() {
        document.addEventListener("click", event => {
            const trigger = event.target.closest("[data-modal-close]");

            if (trigger) {
                const modal = trigger.closest(".modal");

                modal?.classList.remove("active");
            }
        });

        document.addEventListener("submit", event => {
            const form = event.target;

            if (form.matches("[data-validate-form]")) {
                if (!Validation.validateForm(form)) {
                    event.preventDefault();
                }
            }
        });

        window.addEventListener("storage", event => {
            if (event.key === "nexit_database_v1") {
                console.log("NEXIT database updated in another tab.");
            }
        });
    },

    initializeAuth() {
        if (!storage.get("users").length) {
            storage.create("users", {
                name: "Administrator",
                email: "admin@nexit.com",
                password: "admin123",
                role: "admin"
            });
        }

        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            const passwordToggle = document.getElementById("loginPasswordToggle");
            const passwordInput = document.getElementById("loginPassword");
            passwordToggle?.addEventListener("click", () => {
                const showing = passwordInput.type === "text";
                passwordInput.type = showing ? "password" : "text";
                passwordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
            });

            loginForm.addEventListener("submit", event => {
                event.preventDefault();
                const role = document.getElementById("loginRole").value;
                const email = document.getElementById("loginEmail").value.trim().toLowerCase();
                const password = document.getElementById("loginPassword").value;

                if (!role || !email || !password) {
                    Notifications.error("Select a role and enter your email and password.");
                    return;
                }

                const user = storage.get("users").find(item =>
                    item.role === role &&
                    String(item.email).toLowerCase() === email &&
                    item.password === password
                );

                if (!user) {
                    Notifications.error("Invalid email, password, or account role.");
                    return;
                }

                sessionStorage.setItem("nexit_session", JSON.stringify({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }));
                Notifications.success("Signed in successfully.");
                setTimeout(() => {
                    window.location.href = role === "admin"
                        ? "admin/dashboard.html"
                        : `${role}/dashboard.html`;
                }, 300);
            });
        }

        const signupForm = document.getElementById("signupForm");
        if (signupForm) {
            ["signupPasswordToggle", "signupConfirmPasswordToggle"].forEach(id => {
                const toggle = document.getElementById(id);
                const inputId = id === "signupPasswordToggle"
                    ? "signupPassword"
                    : "signupConfirmPassword";
                const input = document.getElementById(inputId);
                toggle?.addEventListener("click", () => {
                    input.type = input.type === "text" ? "password" : "text";
                });
            });

            signupForm.addEventListener("submit", event => {
                event.preventDefault();
                const role = document.getElementById("signupRole").value;
                const name = document.getElementById("signupFullName").value.trim();
                const email = document.getElementById("signupEmail").value.trim().toLowerCase();
                const phone = document.getElementById("signupPhone").value.trim();
                const password = document.getElementById("signupPassword").value;
                const confirmation = document.getElementById("signupConfirmPassword").value;
                const terms = document.getElementById("signupTerms").checked;

                if (!role || !name || !email || !password) {
                    Notifications.error("Please complete all required fields.");
                    return;
                }
                if (!Validation.email(email).valid) {
                    Notifications.error("Enter a valid email address.");
                    return;
                }
                if (!Validation.password(password).valid) {
                    Notifications.error("Password must contain at least 8 characters.");
                    return;
                }
                if (password !== confirmation) {
                    Notifications.error("Passwords do not match.");
                    return;
                }
                if (!terms) {
                    Notifications.error("Accept the terms to create an account.");
                    return;
                }
                if (storage.get("users").some(item =>
                    String(item.email).toLowerCase() === email
                )) {
                    Notifications.error("An account with this email already exists.");
                    return;
                }

                const user = storage.create("users", {
                    name,
                    email,
                    phone,
                    password,
                    role
                });

                if (role === "student") {
                    storage.create("students", {
                        name,
                        email,
                        phone,
                        userId: user.id
                    });
                } else {
                    storage.create("teachers", {
                        name,
                        email,
                        phone,
                        userId: user.id
                    });
                }

                Notifications.success("Account created successfully.");
                setTimeout(() => { window.location.href = "login.html"; }, 400);
            });
        }
    },

    initializePortal() {
        const page = document.body.dataset.page;
        const portal = document.body.dataset.portal;

        if (portal === "admin" || portal === "teacher" || portal === "student") {
            const session = this.getSession();
            if (!session || session.role !== portal) {
                window.location.replace(this.getRootPath() + "login.html");
                return;
            }
        }

        if (portal === "admin") {
            if (page === "dashboard") AdminDashboard.init();
            if (page === "students") Students.init();
            if (page === "teachers") Teachers.init();
            if (page === "classes") Classes.init();
            if (page === "subjects") Subjects.init();
            if (page === "attendance") this.initializeAdminAttendance();
            if (page === "timetable") {
                Timetable.init();
                this.initializeTimetableForms();
            }
            if (["assignments", "announcements", "examinations", "results"].includes(page)) {
                this.initializeGenericAdminPage(page);
            }
        }
    },

    initializeTimetableForms() {
        const openForm = record => {
            this.openModal(record ? "Edit timetable entry" : "Add timetable entry", [
                ["day", "Day", "select:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday", record?.day || "Monday"],
                ["startTime", "Start time", "time", record?.startTime],
                ["endTime", "End time", "time", record?.endTime],
                ["subject", "Subject", "text", record?.subject],
                ["className", "Class", "text", record?.className],
                ["section", "Section", "text", record?.section],
                ["teacher", "Teacher", "text", record?.teacher],
                ["room", "Room", "text", record?.room]
            ], data => {
                if (record) storage.update("timetable", record.id, data);
                else storage.create("timetable", data);
                Notifications.success(record ? "Timetable entry updated." : "Timetable entry added.");
                Timetable.init();
            });
        };
        document.addEventListener("nexit:add-timetable", () => openForm());
        document.addEventListener("nexit:edit-timetable", event => openForm(event.detail.record));
    },

    initializeAdminAttendance() {
        const classSelect = document.getElementById("attendanceClass");
        const sectionSelect = document.getElementById("attendanceSection");
        const dateInput = document.getElementById("attendanceDate");
        const subjectSelect = document.getElementById("attendanceSubject");
        const tbody = document.getElementById("attendanceTableBody");
        const emptyState = document.getElementById("attendanceEmptyState");
        let loaded = [];

        const fillSelect = (select, items, valueKey, labelKey, placeholder) => {
            if (!select) return;
            select.innerHTML = `<option value="">${placeholder}</option>`;
            items.forEach(item => {
                const option = document.createElement("option");
                option.value = item[valueKey];
                option.textContent = item[labelKey] || item.name || "Unnamed";
                select.appendChild(option);
            });
        };

        fillSelect(classSelect, storage.get("classes"), "id", "name", "Select class");
        fillSelect(subjectSelect, storage.get("subjects"), "id", "name", "All subjects");
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

        classSelect?.addEventListener("change", () => {
            const sections = [...new Set(
                storage.get("students")
                    .filter(student => String(student.classId) === classSelect.value)
                    .map(student => student.section)
                    .filter(Boolean)
            )];
            fillSelect(sectionSelect, sections.map(section => ({ id: section, name: section })),
                "id", "name", "Select section");
        });

        const renderLoaded = () => {
            tbody.innerHTML = "";
            if (!loaded.length) {
                if (emptyState) emptyState.hidden = false;
                return;
            }
            if (emptyState) emptyState.hidden = true;
            loaded.forEach(student => {
                const existing = storage.find("attendance", record =>
                    String(record.studentId) === String(student.id) &&
                    record.date === dateInput.value
                )[0];
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${this.escapeHTML(student.name || student.fullName || "Unnamed")}</td>
                    <td>${this.escapeHTML(student.admissionNumber || "—")}</td>
                    <td>
                        <select class="attendance-status" data-student-id="${this.escapeHTML(student.id)}">
                            ${["present", "absent", "late", "leave"].map(status =>
                                `<option value="${status}" ${existing?.status === status || (!existing && status === "present") ? "selected" : ""}>${this.capitalize(status)}</option>`
                            ).join("")}
                        </select>
                    </td>`;
                tbody.appendChild(row);
            });
            this.updateAttendanceSummary(tbody);
        };

        tbody?.addEventListener("change", () => this.updateAttendanceSummary(tbody));
        document.getElementById("markAllPresentBtn")?.addEventListener("click", () => {
            tbody.querySelectorAll(".attendance-status").forEach(select => { select.value = "present"; });
            this.updateAttendanceSummary(tbody);
        });
        document.getElementById("loadAttendanceBtn")?.addEventListener("click", () => {
            if (!classSelect.value) {
                Notifications.warning("Select a class first.");
                return;
            }
            loaded = storage.get("students").filter(student =>
                String(student.classId) === classSelect.value &&
                (!sectionSelect?.value || String(student.section) === sectionSelect.value)
            );
            renderLoaded();
        });
        document.getElementById("saveAttendanceBtn")?.addEventListener("click", () => {
            if (!loaded.length || !dateInput.value) {
                Notifications.warning("Load students and select a date first.");
                return;
            }
            const date = dateInput.value;
            tbody.querySelectorAll(".attendance-status").forEach(select => {
                const student = storage.getById("students", select.dataset.studentId);
                if (!student) return;
                const existing = storage.find("attendance", record =>
                    String(record.studentId) === String(student.id) && record.date === date
                )[0];
                const data = {
                    studentId: student.id,
                    studentName: student.name || student.fullName,
                    admissionNumber: student.admissionNumber,
                    classId: student.classId,
                    className: student.className,
                    section: student.section,
                    date,
                    status: select.value,
                    subjectId: subjectSelect?.value || "",
                    subjectName: subjectSelect?.selectedOptions[0]?.textContent || ""
                };
                if (existing) storage.update("attendance", existing.id, data);
                else storage.create("attendance", data);
            });
            Notifications.success("Attendance saved successfully.");
        });

        if (emptyState) emptyState.hidden = false;
    },

    updateAttendanceSummary(tbody) {
        const counts = { present: 0, absent: 0, late: 0, leave: 0 };
        tbody.querySelectorAll(".attendance-status").forEach(select => {
            counts[select.value] = (counts[select.value] || 0) + 1;
        });
        const ids = { present: "presentCount", absent: "absentCount", late: "lateCount", leave: "leaveCount" };
        Object.entries(ids).forEach(([status, id]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = counts[status];
        });
    },

    initializeGenericAdminPage(page) {
        const configs = {
            assignments: { collection: "assignments", container: "assignmentsTableBody", add: "addAssignmentBtn", emptyAdd: "emptyAddAssignmentBtn", fields: ["title", "subjectName", "className", "dueDate", "status"] },
            announcements: { collection: "announcements", container: "announcementsContainer", add: "addAnnouncementBtn", emptyAdd: "emptyAddAnnouncementBtn" },
            examinations: { collection: "examinations", container: "examinationsTableBody", add: "addExamBtn", emptyAdd: "emptyAddExamBtn" },
            results: { collection: "results", container: "resultsTableBody", add: "addResultBtn", emptyAdd: "emptyAddResultBtn" }
        };
        const config = configs[page];
        if (!config) return;

        const openForm = (record = null) => {
            const collectionFields = {
                assignments: [
                    ["title", "Assignment title", "text", record?.title],
                    ["subjectName", "Subject", "text", record?.subjectName],
                    ["className", "Class", "text", record?.className],
                    ["dueDate", "Due date", "date", record?.dueDate],
                    ["status", "Status", "select:active,completed", record?.status || "active"]
                ],
                announcements: [
                    ["title", "Title", "text", record?.title],
                    ["message", "Message", "textarea", record?.message],
                    ["priority", "Priority", "select:normal,important,urgent", record?.priority || "normal"]
                ],
                examinations: [
                    ["name", "Examination name", "text", record?.name],
                    ["className", "Class", "text", record?.className],
                    ["startDate", "Start date", "date", record?.startDate],
                    ["endDate", "End date", "date", record?.endDate]
                ],
                results: [
                    ["studentName", "Student name", "text", record?.studentName],
                    ["admissionNumber", "Admission number", "text", record?.admissionNumber],
                    ["className", "Class", "text", record?.className],
                    ["examinationName", "Examination", "text", record?.examinationName],
                    ["totalMarks", "Total marks", "number", record?.totalMarks],
                    ["percentage", "Percentage", "number", record?.percentage],
                    ["grade", "Grade", "text", record?.grade]
                ]
            };
            this.openModal(
                record ? `Edit ${page.slice(0, -1)}` : `Create ${page.slice(0, -1)}`,
                collectionFields[page],
                data => {
                    if (record) storage.update(config.collection, record.id, data);
                    else storage.create(config.collection, data);
                    Notifications.success(record ? "Record updated." : "Record added.");
                    render();
                }
            );
        };

        const render = () => {
            const records = storage.get(config.collection);
            const container = document.getElementById(config.container);
            const empty = document.getElementById(`${page}EmptyState`);

            if (page === "announcements") {
                if (!records.length) {
                    if (empty) empty.hidden = false;
                    return;
                }
                if (empty) empty.hidden = true;
                container.innerHTML = records.map(record => `
                    <article class="announcement-card">
                        <div class="announcement-card-header"><h3>${this.escapeHTML(record.title)}</h3><span>${this.escapeHTML(record.priority || "normal")}</span></div>
                        <p>${this.escapeHTML(record.message)}</p>
                        <small>${this.formatDate(record.createdAt)}</small>
                        <div class="table-actions"><button class="btn-icon" data-edit="${this.escapeHTML(record.id)}">Edit</button><button class="btn-icon btn-danger" data-delete="${this.escapeHTML(record.id)}">Delete</button></div>
                    </article>`).join("");
            } else if (container) {
                container.innerHTML = "";
                if (!records.length) {
                    if (empty) empty.hidden = false;
                } else {
                    if (empty) empty.hidden = true;
                    records.forEach(record => {
                        const row = document.createElement("tr");
                        const values = page === "assignments"
                            ? [record.title, record.subjectName, record.className, this.formatDate(record.dueDate), record.status]
                            : page === "examinations"
                                ? [record.name, record.className, this.formatDate(record.startDate), this.formatDate(record.endDate), record.subjects || "—"]
                                : [record.studentName, record.admissionNumber, record.className, record.examinationName, record.totalMarks, `${record.percentage || 0}%`, record.grade];
                        row.innerHTML = values.map(value => `<td>${this.escapeHTML(value ?? "—")}</td>`).join("") +
                            `<td><div class="table-actions"><button class="btn-icon" data-edit="${this.escapeHTML(record.id)}">Edit</button><button class="btn-icon btn-danger" data-delete="${this.escapeHTML(record.id)}">Delete</button></div></td>`;
                        container.appendChild(row);
                    });
                }
            }
        };

        [config.add, config.emptyAdd].forEach(id => {
            document.getElementById(id)?.addEventListener("click", () => openForm());
        });
        const container = document.getElementById(config.container);
        container?.addEventListener("click", event => {
            const edit = event.target.closest("[data-edit]");
            const remove = event.target.closest("[data-delete]");
            if (edit) openForm(storage.getById(config.collection, edit.dataset.edit));
            if (remove) {
                if (window.confirm("Delete this record?")) {
                    storage.delete(config.collection, remove.dataset.delete);
                    Notifications.success("Record deleted.");
                    render();
                }
            }
        });
        render();
    },

    openModal(title, fields, onSubmit) {
        const container = document.getElementById("modalContainer") || document.body;
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal active" role="dialog" aria-modal="true">
                <div class="modal-header"><h3>${this.escapeHTML(title)}</h3><button type="button" class="modal-close" aria-label="Close">&times;</button></div>
                <form class="modal-body" novalidate>
                    ${fields.map(([name, label, type, value]) => {
                        const safeValue = this.escapeHTML(value ?? "");
                        if (type === "textarea") return `<label>${label}<textarea name="${name}" required>${safeValue}</textarea></label>`;
                        if (type.startsWith("select:")) {
                            const options = type.slice(7).split(",");
                            return `<label>${label}<select name="${name}">${options.map(option =>
                                `<option value="${option}" ${String(value) === option ? "selected" : ""}>${this.capitalize(option)}</option>`
                            ).join("")}</select></label>`;
                        }
                        return `<label>${label}<input name="${name}" type="${type}" value="${safeValue}" ${type === "text" ? "required" : ""}></label>`;
                    }).join("")}
                    <div class="modal-footer"><button type="button" class="btn btn-outline modal-cancel">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
                </form>
            </div>`;
        container.appendChild(modal);
        const close = () => modal.remove();
        modal.querySelector(".modal-close").addEventListener("click", close);
        modal.querySelector(".modal-cancel").addEventListener("click", close);
        modal.addEventListener("click", event => { if (event.target === modal) close(); });
        modal.querySelector("form").addEventListener("submit", event => {
            event.preventDefault();
            const data = {};
            fields.forEach(([name]) => {
                data[name] = modal.querySelector(`[name="${name}"]`).value;
            });
            close();
            onSubmit(data);
        });
    },

    initializeAdminCrud() {
        if (!document.body.dataset.portal) return;
        if (document.body.dataset.portal !== "admin") return;

        const configs = {
            students: {
                collection: "students",
                add: "addStudentBtn",
                emptyAdd: "emptyAddStudentBtn",
                title: "Student",
                fields: [
                    ["name", "Full name", "text"],
                    ["admissionNumber", "Admission number", "text"],
                    ["email", "Email", "email"],
                    ["phone", "Phone", "tel"],
                    ["className", "Class", "text"],
                    ["section", "Section", "text"]
                ]
            },
            teachers: {
                collection: "teachers",
                add: "addTeacherBtn",
                emptyAdd: "emptyAddTeacherBtn",
                title: "Teacher",
                fields: [
                    ["name", "Full name", "text"],
                    ["employeeId", "Employee ID", "text"],
                    ["email", "Email", "email"],
                    ["phone", "Phone", "tel"],
                    ["department", "Department", "text"]
                ]
            },
            classes: {
                collection: "classes",
                add: "addClassBtn",
                emptyAdd: "emptyAddClassBtn",
                title: "Class",
                fields: [
                    ["name", "Class name", "text"],
                    ["section", "Section", "text"],
                    ["teacher", "Class teacher", "text"]
                ]
            },
            subjects: {
                collection: "subjects",
                add: "addSubjectBtn",
                emptyAdd: "emptyAddSubjectBtn",
                title: "Subject",
                fields: [
                    ["name", "Subject name", "text"],
                    ["code", "Subject code", "text"],
                    ["className", "Class", "text"],
                    ["teacher", "Teacher", "text"]
                ]
            }
        };
        const page = document.body.dataset.page;
        const config = configs[page];
        if (!config) return;

        const openAdd = () => this.openModal(`Add ${config.title}`, config.fields, data => {
            if (config.collection === "students" && data.className) {
                const matchingClass = storage.get("classes").find(item =>
                    String(item.name).toLowerCase() === String(data.className).toLowerCase()
                );
                if (matchingClass) {
                    data.classId = matchingClass.id;
                }
            }
            storage.create(config.collection, data);
            Notifications.success(`${config.title} added successfully.`);
            if (page === "students") Students.init();
            if (page === "teachers") Teachers.init();
            if (page === "classes") Classes.init();
            if (page === "subjects") Subjects.init();
        });
        [config.add, config.emptyAdd].forEach(id => {
            document.getElementById(id)?.addEventListener("click", openAdd);
        });
    },

    initializeSettings() {
        if (document.body.dataset.page !== "settings") return;
        const settings = storage.getSettings();
        const institutionName = document.getElementById("institutionName");
        const institutionEmail = document.getElementById("institutionEmail");
        const institutionPhone = document.getElementById("institutionPhone");
        const institutionAddress = document.getElementById("institutionAddress");
        const theme = document.getElementById("themePreference");
        const academicYear = document.getElementById("academicYear");
        const attendanceStatus = document.getElementById("defaultAttendanceStatus");

        if (institutionName) institutionName.value = settings.institution.name || "";
        if (institutionEmail) institutionEmail.value = settings.institution.email || "";
        if (institutionPhone) institutionPhone.value = settings.institution.phone || "";
        if (institutionAddress) institutionAddress.value = settings.institution.address || "";
        if (theme) theme.value = settings.preferences.theme || "light";
        if (academicYear) academicYear.value = settings.preferences.academicYear || "";
        if (attendanceStatus) attendanceStatus.value = settings.preferences.defaultAttendanceStatus || "present";

        document.getElementById("institutionSettingsForm")?.addEventListener("submit", event => {
            event.preventDefault();
            storage.updateSettings({
                institution: {
                    name: institutionName?.value || "",
                    email: institutionEmail?.value || "",
                    phone: institutionPhone?.value || "",
                    address: institutionAddress?.value || ""
                }
            });
            Notifications.success("Institution details saved.");
        });
        document.getElementById("preferencesForm")?.addEventListener("submit", event => {
            event.preventDefault();
            storage.updateSettings({
                preferences: {
                    theme: theme?.value || "light",
                    academicYear: academicYear?.value || "",
                    defaultAttendanceStatus: attendanceStatus?.value || "present"
                }
            });
            this.applyTheme();
            Notifications.success("Preferences saved.");
        });
        document.getElementById("exportDataBtn")?.addEventListener("click", () => {
            const blob = new Blob([storage.exportData()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "nexit-data.json";
            link.click();
            URL.revokeObjectURL(url);
        });
        document.getElementById("clearDataBtn")?.addEventListener("click", () => {
            if (!window.confirm("Clear all local NEXIT data?")) return;
            storage.clearAll();
            Notifications.success("Local data cleared.");
            setTimeout(() => window.location.reload(), 300);
        });
    },

    initializeForgotPassword() {
        const form = document.getElementById("forgotPasswordForm");
        if (!form) return;
        form.addEventListener("submit", event => {
            event.preventDefault();
            const email = document.getElementById("forgotEmail").value.trim();
            if (!Validation.email(email).valid) {
                Notifications.error("Enter a valid email address.");
                return;
            }
            document.getElementById("forgotPasswordSuccess")?.classList.remove("hidden");
            Notifications.info("If the account exists, recovery instructions would be sent.");
        });
    },

    initializeLandingMenu() {
        const toggle = document.getElementById("landingMenuToggle");
        const nav = document.querySelector(".landing-nav");
        toggle?.addEventListener("click", () => nav?.classList.toggle("active"));
    },

    initializeCurrentYear() {
        const year = document.getElementById("currentYear");
        if (year) year.textContent = new Date().getFullYear();
    },

    initializeStudentPages() {
        if (document.body.dataset.portal !== "student") return;
        const page = document.body.dataset.page;
        const session = this.getSession();
        const name = session?.name || "Student";
        document.querySelectorAll("#studentSidebarName").forEach(element => { element.textContent = name; });
        document.querySelectorAll("#studentDashboardName").forEach(element => { element.textContent = name; });
        document.querySelectorAll("#studentTopbarInitial, #studentProfileAvatar").forEach(element => {
            element.textContent = name.charAt(0).toUpperCase();
        });

        if (page === "dashboard") {
            const attendance = storage.get("attendance");
            const present = attendance.filter(item => item.status === "present").length;
            const rate = attendance.length ? Math.round(present / attendance.length * 100) : 0;
            this.setText("studentAttendanceRate", attendance.length ? `${rate}%` : "--");
            this.setText("studentAssignmentCount", storage.count("assignments"));
            this.setText("studentUpcomingExamCount", storage.count("examinations"));
            this.setText("studentCompletedTaskCount", storage.find("studyPlanner", item => item.completed).length);
        }

        if (page === "attendance") this.initializeStudentAttendance();
        if (page === "study-planner") this.initializeStudyPlanner();
        if (page === "announcements") this.initializeStudentAnnouncements();
        if (page === "timetable") this.initializeStudentTimetable();
        if (page === "assignments") this.initializeStudentAssignments();
        if (page === "results") this.initializeStudentResults();
        if (page === "profile") this.initializeStudentProfile();
    },

    initializeStudentAttendance() {
        const tbody = document.getElementById("studentAttendanceTableBody");
        const empty = document.getElementById("studentAttendanceEmptyState");
        const records = storage.get("attendance");
        if (!records.length) {
            if (empty) empty.hidden = false;
            return;
        }
        if (empty) empty.hidden = true;
        tbody.innerHTML = records.map(record => `
            <tr><td>${this.formatDate(record.date)}</td><td>${this.escapeHTML(record.className || "—")}</td><td>${this.escapeHTML(record.subjectName || "—")}</td><td><span class="status-badge status-${this.escapeHTML(record.status)}">${this.escapeHTML(record.status)}</span></td></tr>
        `).join("");
    },

    initializeStudentAnnouncements() {
        const container = document.getElementById("studentAnnouncementsContainer");
        const empty = document.getElementById("studentAnnouncementsEmptyState");
        const render = () => {
            const records = storage.get("announcements");
            if (!records.length) { if (empty) empty.hidden = false; return; }
            if (empty) empty.hidden = true;
            container.innerHTML = records.map(record => `<article class="announcement-card"><h3>${this.escapeHTML(record.title)}</h3><p>${this.escapeHTML(record.message)}</p><small>${this.formatDate(record.createdAt)}</small></article>`).join("");
        };
        document.getElementById("studentAnnouncementSearch")?.addEventListener("input", render);
        render();
    },

    initializeStudentTimetable() {
        const container = document.getElementById("studentTimetableContainer");
        if (!container) return;
        const records = storage.get("timetable");
        container.innerHTML = records.length
            ? records.map(record => `<article class="timetable-period"><strong>${this.escapeHTML(record.day)} ${this.escapeHTML(record.startTime || "")}</strong><h4>${this.escapeHTML(record.subject || "—")}</h4><p>${this.escapeHTML(record.className || "—")} · ${this.escapeHTML(record.room || "—")}</p></article>`).join("")
            : `<div class="empty-state"><h3>No timetable entries</h3></div>`;
    },

    initializeStudentAssignments() {
        const container = document.getElementById("studentAssignmentsContainer");
        const empty = document.getElementById("studentAssignmentsEmptyState");
        const records = storage.get("assignments");
        if (!records.length) { if (empty) empty.hidden = false; return; }
        if (empty) empty.hidden = true;
        container.innerHTML = records.map(record => `<article class="assignment-card"><h3>${this.escapeHTML(record.title)}</h3><p>${this.escapeHTML(record.subjectName || "—")}</p><small>Due ${this.formatDate(record.dueDate)}</small></article>`).join("");
    },

    initializeStudentResults() {
        const container = document.getElementById("studentResultsContainer");
        const empty = document.getElementById("studentResultsEmptyState");
        const records = storage.get("results");
        if (!records.length) { if (empty) empty.hidden = false; return; }
        if (empty) empty.hidden = true;
        container.innerHTML = records.map(record => `<article class="result-card"><h3>${this.escapeHTML(record.examinationName || "Examination")}</h3><strong>${this.escapeHTML(record.totalMarks ?? "—")} marks</strong><p>${this.escapeHTML(record.percentage ?? "—")}% · Grade ${this.escapeHTML(record.grade || "—")}</p></article>`).join("");
    },

    initializeStudyPlanner() {
        const addButtons = ["studentPlannerAddTaskBtn", "studentPlannerEmptyAddTaskBtn"];
        let currentMonth = new Date();

        const renderCalendar = () => {
            const calendar = document.getElementById("studentPlannerCalendar");
            const monthLabel = document.getElementById("studentPlannerMonthLabel");
            if (!calendar) return;

            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            if (monthLabel) {
                monthLabel.textContent = currentMonth.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric"
                });
            }

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const taskDates = new Set(
                storage.get("studyPlanner")
                    .map(task => task.date)
                    .filter(Boolean)
            );
            let html = "";
            for (let i = 0; i < firstDay; i++) {
                html += `<div class="planner-calendar-day is-empty"></div>`;
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                html += `<div class="planner-calendar-day ${taskDates.has(date) ? "has-task" : ""}">
                    <span>${day}</span>
                </div>`;
            }
            calendar.innerHTML = html;
        };

        document.getElementById("studentPlannerPrevMonthBtn")?.addEventListener("click", () => {
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            renderCalendar();
        });
        document.getElementById("studentPlannerNextMonthBtn")?.addEventListener("click", () => {
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            renderCalendar();
        });

        const render = () => {
            const list = document.getElementById("studentPlannerTaskList");
            const empty = document.getElementById("studentPlannerEmptyState");
            const query = document.getElementById("studentPlannerTaskSearch")?.value.trim().toLowerCase() || "";
            const tasks = storage.get("studyPlanner").filter(task =>
                !query ||
                `${task.title || ""} ${task.subject || ""}`.toLowerCase().includes(query)
            );
            if (!tasks.length) { if (empty) empty.hidden = false; if (list) list.innerHTML = ""; return; }
            if (empty) empty.hidden = true;
            list.innerHTML = tasks.map(task => `<article class="planner-task"><label><input type="checkbox" data-task="${this.escapeHTML(task.id)}" ${task.completed ? "checked" : ""}> ${this.escapeHTML(task.title)}</label><button class="btn-icon btn-danger" data-delete-task="${this.escapeHTML(task.id)}">Delete</button></article>`).join("");
        };
        document.getElementById("studentPlannerTaskSearch")?.addEventListener("input", render);
        addButtons.forEach(id => document.getElementById(id)?.addEventListener("click", () => {
            this.openModal("Add study task", [
                ["title", "Task", "text"],
                ["date", "Date", "date"],
                ["subject", "Subject", "text"]
            ], data => {
                storage.create("studyPlanner", { ...data, completed: false });
                render();
                renderCalendar();
            });
        }));
        document.getElementById("studentPlannerTaskList")?.addEventListener("change", event => {
            const checkbox = event.target.closest("[data-task]");
            if (checkbox) storage.update("studyPlanner", checkbox.dataset.task, { completed: checkbox.checked });
        });
        document.getElementById("studentPlannerTaskList")?.addEventListener("click", event => {
            const button = event.target.closest("[data-delete-task]");
            if (button && storage.delete("studyPlanner", button.dataset.deleteTask)) {
                render();
                renderCalendar();
            }
        });
        render();
        renderCalendar();
    },

    initializeStudentProfile() {
        const session = this.getSession();
        const form = document.getElementById("studentProfileForm");
        if (form) {
            document.getElementById("studentProfileFullName").value = session?.name || "";
            document.getElementById("studentProfileEmailInput").value = session?.email || "";
            form.addEventListener("submit", event => {
                event.preventDefault();
                const user = storage.get("users").find(item => item.id === session?.id);
                if (user) {
                    storage.update("users", user.id, {
                        name: document.getElementById("studentProfileFullName").value,
                        email: document.getElementById("studentProfileEmailInput").value,
                        phone: document.getElementById("studentProfilePhone").value
                    });
                    sessionStorage.setItem("nexit_session", JSON.stringify({
                        ...session,
                        name: user.name,
                        email: user.email
                    }));
                    Notifications.success("Profile updated.");
                }
            });
        }

        const passwordForm = document.getElementById("studentPasswordForm");
        passwordForm?.addEventListener("submit", event => {
            event.preventDefault();
            const current = document.getElementById("studentCurrentPassword").value;
            const next = document.getElementById("studentNewPassword").value;
            const confirmation = document.getElementById("studentConfirmPassword").value;
            const user = storage.get("users").find(item => item.id === session?.id);
            if (!user) return;
            if (user.password !== current) {
                Notifications.error("Current password is incorrect.");
                return;
            }
            if (!Validation.password(next).valid) {
                Notifications.error("New password must contain at least 8 characters.");
                return;
            }
            if (next !== confirmation) {
                Notifications.error("Passwords do not match.");
                return;
            }
            storage.update("users", user.id, { password: next });
            passwordForm.reset();
            Notifications.success("Password updated.");
        });
    },

    initializeTeacherPages() {
        if (document.body.dataset.portal !== "teacher") return;
        const page = document.body.dataset.page;
        const session = this.getSession();
        const name = session?.name || "Teacher";
        document.querySelectorAll(".sidebar-user strong").forEach(element => {
            element.textContent = name;
        });
        document.querySelectorAll(".topbar-actions span").forEach(element => {
            if (element.textContent.trim() === "Teacher") element.textContent = name;
        });
        if (page === "dashboard") this.initializeTeacherDashboard();
        if (page === "classes") this.initializeTeacherClasses();
        if (page === "students") this.initializeTeacherStudents();
        if (page === "attendance") this.initializeTeacherAttendance();
        if (page === "assignments") this.initializeTeacherAssignments();
        if (page === "timetable") this.initializeStudentTimetable();
        if (page === "profile") this.initializeTeacherProfile();
    },

    initializeTeacherDashboard() {
        this.setText("teacherClassCount", storage.count("classes"));
        this.setText("teacherStudentCount", storage.count("students"));
        this.setText("teacherAssignmentCount", storage.count("assignments"));
        this.setText("teacherAttendanceCount", storage.count("attendance"));

        const classes = document.getElementById("teacherDashboardClasses");
        if (classes) classes.innerHTML = storage.get("classes").slice(0, 5).map(item =>
            `<p><strong>${this.escapeHTML(item.name)}</strong> · ${this.escapeHTML(item.section || "All sections")}</p>`
        ).join("") || `<div class="empty-state compact"><p>No class assignments available.</p></div>`;

        const schedule = document.getElementById("teacherUpcomingSchedule");
        if (schedule) schedule.innerHTML = storage.get("timetable").slice(0, 5).map(item =>
            `<p><strong>${this.escapeHTML(item.day)}</strong> ${this.escapeHTML(item.startTime || "")} · ${this.escapeHTML(item.subject || "—")}</p>`
        ).join("") || `<div class="empty-state compact"><p>No timetable entries available.</p></div>`;

        const assignments = document.getElementById("teacherRecentAssignments");
        if (assignments) assignments.innerHTML = storage.get("assignments").slice(-5).reverse().map(item =>
            `<p><strong>${this.escapeHTML(item.title)}</strong> · ${this.escapeHTML(item.status || "active")}</p>`
        ).join("") || `<div class="empty-state compact"><p>No assignments created.</p></div>`;

        const announcements = document.getElementById("teacherAnnouncements");
        if (announcements) announcements.innerHTML = storage.get("announcements").slice(-5).reverse().map(item =>
            `<p><strong>${this.escapeHTML(item.title)}</strong></p>`
        ).join("") || `<div class="empty-state compact"><p>No announcements available.</p></div>`;
    },

    initializeTeacherClasses() {
        const container = document.getElementById("teacherClassesContainer");
        const empty = document.getElementById("teacherClassesEmptyState");
        const search = document.getElementById("teacherClassSearch");
        const render = () => {
            const query = search?.value.toLowerCase() || "";
            const classes = storage.get("classes").filter(item =>
                String(item.name || "").toLowerCase().includes(query)
            );
            if (!classes.length) { if (empty) empty.hidden = false; container.innerHTML = ""; return; }
            if (empty) empty.hidden = true;
            container.innerHTML = classes.map(item => `
                <article class="card"><h3>${this.escapeHTML(item.name)}</h3><p>Section: ${this.escapeHTML(item.section || "—")}</p><p>Teacher: ${this.escapeHTML(item.teacher || "Unassigned")}</p></article>
            `).join("");
        };
        search?.addEventListener("input", render);
        render();
    },

    initializeTeacherStudents() {
        const tbody = document.getElementById("teacherStudentsTableBody");
        const empty = document.getElementById("teacherStudentsEmptyState");
        const search = document.getElementById("teacherStudentSearch");
        const render = () => {
            const query = search?.value.toLowerCase() || "";
            const students = storage.get("students").filter(item =>
                `${item.name || ""} ${item.fullName || ""} ${item.admissionNumber || ""}`.toLowerCase().includes(query)
            );
            if (!students.length) { if (empty) empty.hidden = false; tbody.innerHTML = ""; return; }
            if (empty) empty.hidden = true;
            tbody.innerHTML = students.map(student => `
                <tr><td>${this.escapeHTML(student.name || student.fullName || "Unnamed")}</td><td>${this.escapeHTML(student.admissionNumber || "—")}</td><td>${this.escapeHTML(student.className || "—")}</td><td>${this.escapeHTML(student.section || "—")}</td><td>${this.escapeHTML(student.email || "—")}</td></tr>
            `).join("");
        };
        search?.addEventListener("input", render);
        render();
    },

    initializeTeacherAttendance() {
        const classSelect = document.getElementById("teacherAttendanceClass");
        const sectionSelect = document.getElementById("teacherAttendanceSection");
        const dateInput = document.getElementById("teacherAttendanceDate");
        const tbody = document.getElementById("teacherAttendanceTableBody");
        const empty = document.getElementById("teacherAttendanceEmptyState");
        const fill = (select, values, placeholder) => {
            if (!select) return;
            select.innerHTML = `<option value="">${placeholder}</option>`;
            values.forEach(value => {
                const option = document.createElement("option");
                option.value = value.id || value;
                option.textContent = value.name || value;
                select.appendChild(option);
            });
        };
        fill(classSelect, storage.get("classes"), "Select class");
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        let loaded = [];

        classSelect?.addEventListener("change", () => {
            const sections = [...new Set(storage.get("students")
                .filter(student => String(student.classId) === classSelect.value)
                .map(student => student.section).filter(Boolean))];
            fill(sectionSelect, sections, "Select section");
        });
        document.getElementById("teacherLoadAttendanceBtn")?.addEventListener("click", () => {
            if (!classSelect.value) { Notifications.warning("Select a class first."); return; }
            loaded = storage.get("students").filter(student =>
                String(student.classId) === classSelect.value &&
                (!sectionSelect?.value || String(student.section) === sectionSelect.value)
            );
            if (!loaded.length) { empty.hidden = false; tbody.innerHTML = ""; return; }
            empty.hidden = true;
            tbody.innerHTML = loaded.map(student => `
                <tr><td>${this.escapeHTML(student.name || student.fullName)}</td><td>${this.escapeHTML(student.admissionNumber || "—")}</td><td><select class="attendance-status" data-student-id="${this.escapeHTML(student.id)}"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="leave">Leave</option></select></td></tr>
            `).join("");
        });
        document.getElementById("teacherMarkAllPresentBtn")?.addEventListener("click", () => {
            tbody.querySelectorAll(".attendance-status").forEach(select => { select.value = "present"; });
        });
        document.getElementById("teacherSaveAttendanceBtn")?.addEventListener("click", () => {
            if (!loaded.length || !dateInput.value) { Notifications.warning("Load students and select a date first."); return; }
            tbody.querySelectorAll(".attendance-status").forEach(select => {
                const student = storage.getById("students", select.dataset.studentId);
                const existing = storage.find("attendance", record =>
                    String(record.studentId) === String(student.id) &&
                    record.date === dateInput.value
                )[0];
                const data = {
                    studentId: student.id,
                    studentName: student.name || student.fullName,
                    admissionNumber: student.admissionNumber,
                    classId: student.classId,
                    className: student.className,
                    section: student.section,
                    date: dateInput.value,
                    status: select.value
                };
                if (existing) storage.update("attendance", existing.id, data);
                else storage.create("attendance", data);
            });
            Notifications.success("Attendance saved.");
        });
    },

    initializeTeacherAssignments() {
        const tbody = document.getElementById("teacherAssignmentsTableBody");
        const empty = document.getElementById("teacherAssignmentsEmptyState");
        const search = document.getElementById("teacherAssignmentSearch");
        const render = () => {
            const query = search?.value.toLowerCase() || "";
            const records = storage.get("assignments").filter(item =>
                String(item.title || "").toLowerCase().includes(query)
            );
            if (!records.length) { if (empty) empty.hidden = false; tbody.innerHTML = ""; return; }
            if (empty) empty.hidden = true;
            tbody.innerHTML = records.map(record => `
                <tr><td>${this.escapeHTML(record.title)}</td><td>${this.escapeHTML(record.subjectName || "—")}</td><td>${this.escapeHTML(record.className || "—")}</td><td>${this.formatDate(record.dueDate)}</td><td>${this.escapeHTML(record.status || "active")}</td></tr>
            `).join("");
        };
        document.getElementById("teacherAddAssignmentBtn")?.addEventListener("click", () => {
            this.openModal("Create Assignment", [
                ["title", "Assignment title", "text"],
                ["subjectName", "Subject", "text"],
                ["className", "Class", "text"],
                ["dueDate", "Due date", "date"],
                ["status", "Status", "select:active,completed"]
            ], data => { storage.create("assignments", data); Notifications.success("Assignment added."); render(); });
        });
        document.getElementById("teacherEmptyAddAssignmentBtn")?.addEventListener("click", () => document.getElementById("teacherAddAssignmentBtn")?.click());
        search?.addEventListener("input", render);
        render();
    },

    initializeTeacherProfile() {
        const session = this.getSession();
        const form = document.getElementById("teacherProfileForm");
        if (!form) return;
        document.getElementById("teacherProfileFullName").value = session?.name || "";
        document.getElementById("teacherProfileEmailInput").value = session?.email || "";
        const profileName = document.getElementById("teacherProfileName");
        const profileEmail = document.getElementById("teacherProfileEmail");
        if (profileName) profileName.textContent = session?.name || "Teacher";
        if (profileEmail) profileEmail.textContent = session?.email || "No email added";
        form.addEventListener("submit", event => {
            event.preventDefault();
            const user = storage.get("users").find(item => item.id === session?.id);
            if (!user) return;
            storage.update("users", user.id, {
                name: document.getElementById("teacherProfileFullName").value,
                email: document.getElementById("teacherProfileEmailInput").value,
                phone: document.getElementById("teacherProfilePhone").value,
                employeeId: document.getElementById("teacherProfileEmployeeId").value,
                department: document.getElementById("teacherProfileDepartment").value,
                qualification: document.getElementById("teacherProfileQualification").value,
                address: document.getElementById("teacherProfileAddress").value
            });
            sessionStorage.setItem("nexit_session", JSON.stringify({
                ...session,
                name: document.getElementById("teacherProfileFullName").value,
                email: document.getElementById("teacherProfileEmailInput").value
            }));
            if (profileName) profileName.textContent = document.getElementById("teacherProfileFullName").value;
            if (profileEmail) profileEmail.textContent = document.getElementById("teacherProfileEmailInput").value;
            Notifications.success("Profile updated.");
        });

        const passwordForm = document.getElementById("teacherPasswordForm");
        passwordForm?.addEventListener("submit", event => {
            event.preventDefault();
            const current = document.getElementById("teacherCurrentPassword").value;
            const next = document.getElementById("teacherNewPassword").value;
            const confirmation = document.getElementById("teacherConfirmPassword").value;
            const user = storage.get("users").find(item => item.id === session?.id);
            if (!user) return;
            if (user.password !== current) {
                Notifications.error("Current password is incorrect.");
                return;
            }
            if (!Validation.password(next).valid) {
                Notifications.error("New password must contain at least 8 characters.");
                return;
            }
            if (next !== confirmation) {
                Notifications.error("Passwords do not match.");
                return;
            }
            storage.update("users", user.id, { password: next });
            passwordForm.reset();
            Notifications.success("Password updated.");
        });
    },

    getSession() {
        try {
            return JSON.parse(sessionStorage.getItem("nexit_session")) || null;
        } catch {
            return null;
        }
    },

    getRootPath() {
        return "../";
    },

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    },

    escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    applyTheme() {
        const settings = storage.getSettings();

        const theme = settings.preferences.theme || "light";

        document.documentElement.setAttribute("data-theme", theme);
    },

    formatDate(date) {
        if (!date) return "—";

        return new Date(date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    },

    formatTime(time) {
        if (!time) return "—";

        const [hours, minutes] = time.split(":");

        const date = new Date();
        date.setHours(Number(hours), Number(minutes), 0, 0);

        return date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit"
        });
    },

    formatCurrency(amount, currency = "INR") {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency
        }).format(Number(amount) || 0);
    },

    capitalize(value) {
        if (!value) return "";

        return String(value)
            .charAt(0)
            .toUpperCase() +
            String(value).slice(1);
    },

    createElement(tag, className = "", text = "") {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text) {
            element.textContent = text;
        }

        return element;
    },

    getPageName() {
        return window.location.pathname
            .split("/")
            .pop()
            .replace(".html", "");
    }
};

NEXIT.init();

export default NEXIT;
