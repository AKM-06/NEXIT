
const STORAGE_KEY = "nexit_database_v1";

const DEFAULT_DATABASE = {
    users: [],
    students: [],
    teachers: [],
    classes: [],
    subjects: [],
    attendance: [],
    timetable: [],
    assignments: [],
    examinations: [],
    results: [],
    announcements: [],
    studyPlanner: [],
    settings: {
        institution: {
            name: "",
            email: "",
            phone: "",
            address: ""
        },
        preferences: {
            theme: "light",
            academicYear: "",
            defaultAttendanceStatus: "present"
        }
    }
};

class NexitStorage {
    constructor() {
        this.database = this.load();
    }

    load() {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);

            if (!storedData) {
                return structuredClone(DEFAULT_DATABASE);
            }

            const parsedData = JSON.parse(storedData);

            return {
                ...structuredClone(DEFAULT_DATABASE),
                ...parsedData,
                settings: {
                    ...DEFAULT_DATABASE.settings,
                    ...(parsedData.settings || {}),
                    institution: {
                        ...DEFAULT_DATABASE.settings.institution,
                        ...(parsedData.settings?.institution || {})
                    },
                    preferences: {
                        ...DEFAULT_DATABASE.settings.preferences,
                        ...(parsedData.settings?.preferences || {})
                    }
                }
            };
        } catch (error) {
            console.error("NEXIT storage loading error:", error);
            return structuredClone(DEFAULT_DATABASE);
        }
    }

    save() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(this.database)
            );

            return true;
        } catch (error) {
            console.error("NEXIT storage saving error:", error);
            return false;
        }
    }

    get(collection) {
        if (!Array.isArray(this.database[collection])) {
            return [];
        }

        return [...this.database[collection]];
    }

    getById(collection, id) {
        return this.get(collection).find(
            item => String(item.id) === String(id)
        ) || null;
    }

    create(collection, data) {
        if (!Array.isArray(this.database[collection])) {
            throw new Error(`Invalid collection: ${collection}`);
        }

        const record = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data
        };

        this.database[collection].push(record);

        if (!this.save()) {
            this.database[collection].pop();
            throw new Error("Unable to save data.");
        }

        return record;
    }

    update(collection, id, updates) {
        if (!Array.isArray(this.database[collection])) {
            throw new Error(`Invalid collection: ${collection}`);
        }

        const index = this.database[collection].findIndex(
            item => String(item.id) === String(id)
        );

        if (index === -1) {
            return null;
        }

        const previousRecord = { ...this.database[collection][index] };

        this.database[collection][index] = {
            ...previousRecord,
            ...updates,
            id: previousRecord.id,
            updatedAt: new Date().toISOString()
        };

        if (!this.save()) {
            this.database[collection][index] = previousRecord;
            throw new Error("Unable to save changes.");
        }

        return this.database[collection][index];
    }

    delete(collection, id) {
        if (!Array.isArray(this.database[collection])) {
            throw new Error(`Invalid collection: ${collection}`);
        }

        const index = this.database[collection].findIndex(
            item => String(item.id) === String(id)
        );

        if (index === -1) {
            return false;
        }

        const deletedRecord = this.database[collection][index];

        this.database[collection].splice(index, 1);

        if (!this.save()) {
            this.database[collection].splice(index, 0, deletedRecord);
            throw new Error("Unable to delete record.");
        }

        return true;
    }

    find(collection, callback) {
        return this.get(collection).filter(callback);
    }

    count(collection) {
        return this.get(collection).length;
    }

    clearCollection(collection) {
        if (!Array.isArray(this.database[collection])) {
            throw new Error(`Invalid collection: ${collection}`);
        }

        const previous = [...this.database[collection]];
        this.database[collection] = [];

        if (!this.save()) {
            this.database[collection] = previous;
            return false;
        }

        return true;
    }

    generateId() {
        if (typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    getSettings() {
        return structuredClone(this.database.settings);
    }

    updateSettings(updates) {
        this.database.settings = {
            ...this.database.settings,
            ...updates,
            institution: {
                ...this.database.settings.institution,
                ...(updates.institution || {})
            },
            preferences: {
                ...this.database.settings.preferences,
                ...(updates.preferences || {})
            }
        };

        return this.save();
    }

    exportData() {
        return JSON.stringify(this.database, null, 2);
    }

    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);

            const collections = [
                "students",
                "teachers",
                "classes",
                "subjects",
                "attendance",
                "timetable",
                "assignments",
                "examinations",
                "results",
                "announcements",
                "studyPlanner"
            ];

            for (const collection of collections) {
                if (!Array.isArray(imported[collection])) {
                    throw new Error(`Invalid data: ${collection}`);
                }
            }

            if (!imported.settings || typeof imported.settings !== "object") {
                throw new Error("Invalid settings data.");
            }

            const previousDatabase = this.database;

            this.database = {
                ...structuredClone(DEFAULT_DATABASE),
                ...imported,
                settings: {
                    ...DEFAULT_DATABASE.settings,
                    ...imported.settings,
                    institution: {
                        ...DEFAULT_DATABASE.settings.institution,
                        ...imported.settings.institution
                    },
                    preferences: {
                        ...DEFAULT_DATABASE.settings.preferences,
                        ...imported.settings.preferences
                    }
                }
            };

            if (!this.save()) {
                this.database = previousDatabase;
                return false;
            }

            return true;
        } catch (error) {
            console.error("NEXIT import error:", error);
            return false;
        }
    }

    clearAll() {
        const previousDatabase = this.database;

        this.database = structuredClone(DEFAULT_DATABASE);

        if (!this.save()) {
            this.database = previousDatabase;
            return false;
        }

        return true;
    }
}

const storage = new NexitStorage();

export default storage;
