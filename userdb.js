const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3'); // Remove .verbose() - less overhead. We don't need it here.

// Database connection
let db; // Declare db outside the functions
let dbFile; // Declare dbFile globally

const connectDB = () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbFile, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to the database.');
                resolve();
            }
        });
    });
};

const closeDB = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
                reject(err);
            } else {
                console.log('Database connection closed.');
                resolve();
            }
        });
    });
};


// Helper function to run database queries with Promises
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) { // Use function instead of arrow to access 'this'
            if (err) {
                console.error(`Error running SQL: ${sql}`, err.message);
                reject(err);
                return; // Add return here to prevent further execution
            }
            resolve({ lastID: this.lastID, changes: this.changes }); // Resolve with lastID and changes
        });
    });
};

// Helper function to get a single row
const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error(`Error getting row with SQL: ${sql}`, err.message);
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

// Helper function to get all rows
const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error(`Error getting all rows with SQL: ${sql}`, err.message);
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};

// Function to add a user to the database
const addUser = async (username, password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbRun('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        console.log('User added successfully!');
    } catch (err) {
        console.error('Error adding user:', err);
    }
};

const removeUser = async (username) => {
    try {
        await dbRun('DELETE FROM users WHERE username = ?', [username]);
        console.log('User deleted successfully!');
    } catch (err) {
        console.error('Error deleting user:', err);
    }
};

const listUsers = async () => {
    try {
        const rows = await dbAll('SELECT username FROM users');
        console.log('Users:');
        rows.forEach((row) => {
            console.log(row.username);
        });
    } catch (err) {
        console.error('Error listing users:', err);
    }
};

const updateUser = async (username, newPassword) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await dbRun('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);
        console.log('User updated successfully!');
    } catch (err) {
        console.error('Error updating user:', err);
    }
};

const getUser = async (username) => {
    try {
        const row = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
        console.log('User:', row);
    } catch (err) {
        console.error('Error getting user:', err);
    }
};

const getAllUsers = async () => {
    try {
        const rows = await dbAll('SELECT * FROM users');
        console.log('All Users:', rows);
    } catch (err) {
        console.error('Error getting all users:', err);
    }
};

const checkUser = async (username, password) => {
    try {
        const row = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

        if (row) {
            const result = await bcrypt.compare(password, row.password);
            if (result) {
                console.log('Passwords match!');
            } else {
                console.log('Passwords do not match.');
            }
        } else {
            console.log('User not found.');
        }
    } catch (err) {
        console.error('Error checking user:', err);
    }
};

const showHelp = () => {
    console.log('Usage: node userdb.js <dbfile> <command> [args]');
    console.log('Commands:');
    console.log('  add <username> <password>');
    console.log('  remove <username>');
    console.log('  list');
    console.log('  update <username> <newPassword>');
    console.log('  get <username>');
    console.log('  getAll');
    console.log('  check <username> <password>');
    console.log('  help');
};

// parse the command line arguments
const args = process.argv.slice(2);

// check the command line arguments
if (args.length < 2) {
    showHelp();
    process.exit(1);
}

dbFile = args[0]; // Assign dbFile here

if (!fs.existsSync(dbFile)) {
    console.error(`Database file ${dbFile} does not exist.`);
    process.exit(1);
}

const command = args[1];

const executeCommand = async () => {
    try {
        await connectDB(); // Connect to the database at the start

        if (command === 'help') {
            showHelp();
        } else if (command === 'add') {
            if (args.length < 4) {
                showHelp();
                process.exit(1);
            }
            const username = args[2];
            const password = args[3];
            await addUser(username, password);
        } else if (command === 'remove') {
            if (args.length < 3) {
                showHelp();
                process.exit(1);
            }
            const username = args[2];
            await removeUser(username);
        } else if (command === 'list') {
            await listUsers();
        } else if (command === 'update') {
            if (args.length < 4) {
                showHelp();
                process.exit(1);
            }
            const username = args[2];
            const newPassword = args[3];
            await updateUser(username, newPassword);
        } else if (command === 'get') {
            if (args.length < 3) {
                showHelp();
                process.exit(1);
            }
            const username = args[2];
            await getUser(username);
        } else if (command === 'getAll') {
            await getAllUsers();
        } else if (command === 'check') {
            if (args.length < 4) {
                showHelp();
                process.exit(1);
            }
            const username = args[2];
            const password = args[3];
            await checkUser(username, password);
        } else {
            console.error(`Unknown command ${command}`);
            showHelp();
            process.exit(1);
        }
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    } finally {
        if (db) {
            await closeDB(); // Close the database connection at the end
        }
    }
};

executeCommand();
