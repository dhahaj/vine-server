const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

// Function to add a user to the database
const addUser = async (username, password) => {
    const db = new sqlite3.Database(dbFile);

    // Hash the password
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Insert the user into the database
        db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            (err) => {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    return;
                }
                console.log('User added successfully!');
            }
        );
    } catch (err) {
        console.error('Error hashing password:', err);
    } finally {
        db.close();
    }
};

const removeUser = (username) => {
    const db = new sqlite3.Database(dbFile);

    db.run('DELETE FROM users WHERE username = ?', [username], (err) => {
        if (err) {
            console.error('Error deleting user:', err.message);
            return;
        }
        console.log('User deleted successfully!');
    });

    db.close();
};

const listUsers = () => {
    const db = new sqlite3.Database(dbFile);

    db.all('SELECT username FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error listing users:', err.message);
            return;
        }
        console.log('Users:');
        rows.forEach((row) => {
            console.log(row.username);
        });
    });

    db.close();
};

const updateUser = async (username, newPassword) => {
    const db = new sqlite3.Database(dbFile);

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the salt rounds

        db.run(
            'UPDATE users SET password = ? WHERE username = ?',
            [hashedPassword, username],
            (err) => {
                if (err) {
                    console.error('Error updating user:', err.message);
                    return;
                }
                console.log('User updated successfully!');
            }
        );
    } catch (err) {
        console.error('Error hashing password:', err);
    } finally {
        db.close();
    }
};

const getUser = (username) => {
    const db = new sqlite3.Database(dbFile);

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Error getting user:', err.message);
            return;
        }
        console.log('User:', row);
    });

    db.close();
};

const getAllUsers = () => {
    const db = new sqlite3.Database(dbFile);

    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error getting all users:', err.message);
            return;
        }
        console.log('All Users:', rows);
    });

    db.close();
};

const checkUser = (username, password) => {
    const db = new sqlite3.Database(dbFile);

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Error getting user:', err.message);
            return;
        }
        if (row) {
            bcrypt.compare(password, row.password, (err, result) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return;
                }
                if (result) {
                    console.log('Passwords match!');
                } else {
                    console.log('Passwords do not match.');
                }
            });
        } else {
            console.log('User not found.');
        }
    });

    db.close();
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

const dbFile = args[0];

if (!fs.existsSync(dbFile)) {
    console.error(`Database file ${dbFile} does not exist.`);
    process.exit(1);
}

const command = args[1];

if (command === 'help') {
    showHelp();
    process.exit(0);
} else if (command === 'add') {
    if (args.length < 4) {
        showHelp();
        process.exit(1);
    }
    const username = args[2];
    const password = args[3];
    addUser(username, password);
} else if (command === 'remove') {
    if (args.length < 3) {
        showHelp();
        process.exit(1);
    }
    const username = args[2];
    removeUser(username);
} else if (command === 'list') {
    listUsers();
} else if (command === 'update') {
    if (args.length < 4) {
        showHelp();
        process.exit(1);
    }
    const username = args[2];
    const newPassword = args[3];
    updateUser(username, newPassword);
} else if (command === 'get') {
    if (args.length < 3) {
        showHelp();
        process.exit(1);
    }

    const username = args[2];

    getUser(username);
} else if (command === 'getAll') {
    getAllUsers();
} else if (command === 'check') {
    if (args.length < 4) {
        showHelp();
        process.exit(1);
    }

    const username = args[2];
    const password = args[3];

    checkUser(username, password);
} else {
    console.error(`Unknown command ${command}`);
    showHelp();
    process.exit(1);
}
