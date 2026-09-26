const express = require("express");
const cors = require("cors");

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


// ================= HOME =================

app.get("/", (req, res) => {

    res.send("CLMSG Backend is Running");

});


// ================= TEST MYSQL =================

app.get("/api/test", async (req, res) => {

    try {

        const [rows] =
            await pool.query(
                "SELECT DATABASE() AS db"
            );

        res.json({

            message: "MySQL connected successfully",

            database: rows[0].db

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "MySQL connection failed",

            error: error.message

        });

    }

});


// ================= GET ALL STUDENTS =================

app.get("/api/students", async (req, res) => {

    try {

        const [students] =
            await pool.query(
                "SELECT * FROM students WHERE is_active = TRUE"
            );

        res.json(students);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: "Failed to fetch students"

        });

    }

});


// ================= GET STUDENT BY ROLL =================

app.get("/api/students/:roll", async (req, res) => {

    try {

        const roll = req.params.roll;

        const [students] =
            await pool.query(
                "SELECT * FROM students WHERE roll = ? AND is_active = TRUE",
                [roll]
            );

        if (students.length === 0) {

            return res.status(404).json({

                error: "Student not found"

            });

        }

        res.json(students[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: "Failed to fetch student"

        });

    }

});


// ================= ADD STUDENT =================

app.post("/api/students", async (req, res) => {

    try {

        const {
            name,
            roll,
            phone,
            branch,
            photo
        } = req.body;


        if (!name || !roll || !branch) {

            return res.status(400).json({

                error: "Name, roll and branch are required"

            });

        }


        const [result] =
            await pool.query(

                `INSERT INTO students
                (name, roll, phone, branch, photo)
                VALUES (?, ?, ?, ?, ?)`,

                [
                    name,
                    roll,
                    phone || null,
                    branch,
                    photo || null
                ]

            );


        res.status(201).json({

            message: "Student added successfully",

            studentId: result.insertId

        });

    } catch (error) {

        console.error(error);


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                error: "Roll number already exists"

            });

        }


        res.status(500).json({

            error: "Failed to add student"

        });

    }

});


// ================= GET ALL BOOKS =================

app.get("/api/books", async (req, res) => {

    try {

        const [books] = await pool.query(
            "SELECT * FROM books ORDER BY id DESC"
        );

        res.json(books);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch books"
        });

    }

});


// ================= GET BOOK BY SERIAL =================

app.get("/api/books/:serial", async (req, res) => {

    try {

        const serial = req.params.serial;

        const [books] = await pool.query(
            "SELECT * FROM books WHERE serial = ?",
            [serial]
        );

        if (books.length === 0) {

            return res.status(404).json({
                error: "Book not found"
            });

        }

        res.json(books[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch book"
        });

    }

});


// ================= ADD BOOK =================

app.post("/api/books", async (req, res) => {

    try {

        const {
            serial,
            name,
            author,
            totalCopies
        } = req.body;


        if (!serial || !name || !totalCopies) {

            return res.status(400).json({
                error: "Serial, name and total copies are required"
            });

        }


        const [result] = await pool.query(

            `INSERT INTO books
            (serial, name, author, total_copies, available_copies)
            VALUES (?, ?, ?, ?, ?)`,

            [
                serial,
                name,
                author || null,
                totalCopies,
                totalCopies
            ]

        );


        res.status(201).json({

            message: "Book added successfully",

            bookId: result.insertId

        });

    } catch (error) {

        console.error(error);


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                error: "Book serial already exists"

            });

        }


        res.status(500).json({

            error: "Failed to add book"

        });

    }

});


// ================= DELETE BOOK =================

app.delete("/api/books/:serial", async (req, res) => {

    try {

        const serial = req.params.serial;


        const [books] = await pool.query(

            "SELECT id, available_copies FROM books WHERE serial = ?",

            [serial]

        );


        if (books.length === 0) {

            return res.status(404).json({

                error: "Book not found"

            });

        }


        if (books[0].available_copies === 0) {

            return res.status(400).json({

                error: "Cannot delete a book with all copies issued"

            });

        }


        await pool.query(

            "DELETE FROM books WHERE serial = ?",

            [serial]

        );


        res.json({

            message: "Book deleted successfully"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: "Failed to delete book"

        });

    }

});








// ================= ISSUE BOOK =================

app.post("/api/transactions/issue", async (req, res) => {

    const { roll, serial, issueDate, dueDate } = req.body;

    if (!roll || !serial || !issueDate || !dueDate) {
        return res.status(400).json({
            error: "Roll, book serial, issue date and due date are required"
        });
    }

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        // Find student
        const [students] = await connection.query(
            "SELECT id, name FROM students WHERE roll = ? AND is_active = TRUE",
            [roll]
        );

        if (students.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: "Student not found"
            });
        }

        const student = students[0];

        // Lock the book row
        const [books] = await connection.query(
            `SELECT id, name, author, available_copies
             FROM books
             WHERE serial = ?
             FOR UPDATE`,
            [serial]
        );

        if (books.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: "Book not found"
            });
        }

        const book = books[0];

        // Check availability
        if (book.available_copies <= 0) {
            await connection.rollback();

            return res.status(400).json({
                error: "Book is not available"
            });
        }

        // Check whether this student already has this book
        const [activeIssue] = await connection.query(
            `SELECT id
             FROM book_transactions
             WHERE student_id = ?
             AND book_id = ?
             AND status = 'Issued'`,
            [student.id, book.id]
        );

        if (activeIssue.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                error: "This student already has this book"
            });
        }

        // Create transaction
        const [result] = await connection.query(
            `INSERT INTO book_transactions
            (student_id, book_id, issue_date, due_date, status)
            VALUES (?, ?, ?, ?, 'Issued')`,
            [
                student.id,
                book.id,
                issueDate,
                dueDate
            ]
        );

        // Decrease available copies
        await connection.query(
            `UPDATE books
             SET available_copies = available_copies - 1
             WHERE id = ?`,
            [book.id]
        );

        // Add library log
        await connection.query(
            `INSERT INTO library_logs
            (student_id, book_id, operation)
            VALUES (?, ?, 'Issued')`,
            [student.id, book.id]
        );

        await connection.commit();

        res.status(201).json({
            message: "Book issued successfully",
            transactionId: result.insertId,
            student: student.name,
            roll: roll,
            book: book.name,
            serial: serial,
            issueDate: issueDate,
            dueDate: dueDate
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error: "Failed to issue book"
        });

    } finally {

        connection.release();

    }

});









// ================= RETURN BOOK =================

app.post("/api/transactions/return", async (req, res) => {

    const { transactionId, returnDate } = req.body;

    if (!transactionId || !returnDate) {
        return res.status(400).json({
            error: "Transaction ID and return date are required"
        });
    }

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        // Find and lock the transaction
        const [transactions] = await connection.query(
            `SELECT bt.id, bt.student_id, bt.book_id,
                    bt.issue_date, bt.due_date,
                    s.name AS student_name,
                    s.roll,
                    b.name AS book_name,
                    b.serial
             FROM book_transactions bt
             JOIN students s ON bt.student_id = s.id
             JOIN books b ON bt.book_id = b.id
             WHERE bt.id = ?
             AND bt.status = 'Issued'
             FOR UPDATE`,
            [transactionId]
        );

        if (transactions.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                error: "Active book transaction not found"
            });

        }

        const transaction = transactions[0];

        // Update transaction
        await connection.query(
            `UPDATE book_transactions
             SET return_date = ?,
                 status = 'Returned'
             WHERE id = ?`,
            [returnDate, transactionId]
        );

        // Increase available copies
        await connection.query(
            `UPDATE books
             SET available_copies = available_copies + 1
             WHERE id = ?`,
            [transaction.book_id]
        );

        // Add library log
        await connection.query(
            `INSERT INTO library_logs
             (student_id, book_id, operation)
             VALUES (?, ?, 'Returned')`,
            [
                transaction.student_id,
                transaction.book_id
            ]
        );

        await connection.commit();

        res.json({
            message: "Book returned successfully",
            transactionId: transaction.id,
            student: transaction.student_name,
            roll: transaction.roll,
            book: transaction.book_name,
            serial: transaction.serial,
            issueDate: transaction.issue_date,
            dueDate: transaction.due_date,
            returnDate: returnDate,
            status: "Returned"
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error: "Failed to return book"
        });

    } finally {

        connection.release();

    }

});









// ================= STUDENT HISTORY =================

app.get("/api/students/:roll/history", async (req, res) => {
    try {

        const roll = req.params.roll;

        const [rows] = await pool.query(
            `SELECT
                bt.id AS transaction_id,
                s.name AS student_name,
                s.roll,
                s.branch,
                b.serial,
                b.name AS book_name,
                b.author,
                bt.issue_date,
                bt.due_date,
                bt.return_date,
                bt.status
            FROM book_transactions bt
            JOIN students s
                ON bt.student_id = s.id
            JOIN books b
                ON bt.book_id = b.id
            WHERE s.roll = ?
            ORDER BY bt.id DESC`,
            [roll]
        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch student history"
        });

    }
});









// ================= BOOK HISTORY =================

app.get("/api/books/:serial/history", async (req, res) => {
    try {

        const serial = req.params.serial;

        const [rows] = await pool.query(
            `SELECT
                bt.id AS transaction_id,
                s.name AS student_name,
                s.roll,
                s.branch,
                b.serial,
                b.name AS book_name,
                bt.issue_date,
                bt.due_date,
                bt.return_date,
                bt.status
            FROM book_transactions bt
            JOIN students s
                ON bt.student_id = s.id
            JOIN books b
                ON bt.book_id = b.id
            WHERE b.serial = ?
            ORDER BY bt.id DESC`,
            [serial]
        );

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch book history"
        });

    }
});










// ================= IMPORT / UPDATE STUDENT =================

app.post("/api/students/import", async (req, res) => {
    try {

        const {
            name,
            roll,
            phone,
            branch,
            photo
        } = req.body;

        if (!name || !roll || !branch) {
            return res.status(400).json({
                error: "Name, roll and branch are required"
            });
        }

        const [existing] = await pool.query(
            "SELECT id FROM students WHERE roll = ?",
            [roll]
        );

        if (existing.length > 0) {

            await pool.query(
                `UPDATE students
                 SET name = ?,
                     phone = ?,
                     branch = ?,
                     photo = ?,
                     is_active = TRUE
                 WHERE roll = ?`,
                [
                    name,
                    phone || null,
                    branch,
                    photo || null,
                    roll
                ]
            );

            return res.json({
                message: "Student updated successfully",
                action: "updated"
            });
        }

        await pool.query(
            `INSERT INTO students
             (name, roll, phone, branch, photo)
             VALUES (?, ?, ?, ?, ?)`,
            [
                name,
                roll,
                phone || null,
                branch,
                photo || null
            ]
        );

        res.status(201).json({
            message: "Student imported successfully",
            action: "created"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to import student"
        });
    }
});








// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `CLMSG Backend running at http://localhost:${PORT}`
    );

});




// ISSUE BOOK
app.post("/api/issue", async (req, res) => {
    const { roll, serial, issueDate, dueDate } = req.body;

    if (!roll || !serial || !issueDate) {
        return res.status(400).json({
            error: "Roll, book serial and issue date are required"
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Find student
        const [students] = await connection.query(
            "SELECT id FROM students WHERE roll = ? AND is_active = TRUE",
            [roll]
        );

        if (students.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                error: "Student not found"
            });
        }

        // Lock the book row
        const [books] = await connection.query(
            "SELECT id, available_copies FROM books WHERE serial = ? FOR UPDATE",
            [serial]
        );

        if (books.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                error: "Book not found"
            });
        }

        if (books[0].available_copies <= 0) {
            await connection.rollback();
            return res.status(400).json({
                error: "Book is not available"
            });
        }

        // Check if student already has this book
        const [existing] = await connection.query(
            `SELECT id FROM book_transactions
             WHERE student_id = ?
             AND book_id = ?
             AND status = 'Issued'`,
            [students[0].id, books[0].id]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                error: "Student already has this book"
            });
        }

        // Create transaction
        const [result] = await connection.query(
            `INSERT INTO book_transactions
             (student_id, book_id, issue_date, due_date, status)
             VALUES (?, ?, ?, ?, 'Issued')`,
            [
                students[0].id,
                books[0].id,
                issueDate,
                dueDate || null
            ]
        );

        // Reduce available copies
        await connection.query(
            `UPDATE books
             SET available_copies = available_copies - 1
             WHERE id = ?`,
            [books[0].id]
        );

        // Add library log
        await connection.query(
            `INSERT INTO library_logs
             (student_id, book_id, operation)
             VALUES (?, ?, 'Issued')`,
            [students[0].id, books[0].id]
        );

        await connection.commit();

        res.status(201).json({
            message: "Book issued successfully",
            transactionId: result.insertId
        });

    } catch (error) {
        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error: "Failed to issue book"
        });

    } finally {
        connection.release();
    }
});





// RETURN BOOK
app.post("/api/return", async (req, res) => {
    const { transactionId, returnDate } = req.body;

    if (!transactionId || !returnDate) {
        return res.status(400).json({
            error: "Transaction ID and return date are required"
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Find active transaction
        const [transactions] = await connection.query(
            `SELECT student_id, book_id
             FROM book_transactions
             WHERE id = ?
             AND status = 'Issued'
             FOR UPDATE`,
            [transactionId]
        );

        if (transactions.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                error: "Active transaction not found"
            });
        }

        const studentId = transactions[0].student_id;
        const bookId = transactions[0].book_id;

        // Mark as returned
        await connection.query(
            `UPDATE book_transactions
             SET return_date = ?, status = 'Returned'
             WHERE id = ?`,
            [returnDate, transactionId]
        );

        // Restore available copy
        await connection.query(
            `UPDATE books
             SET available_copies = available_copies + 1
             WHERE id = ?`,
            [bookId]
        );

        // Add library log
        await connection.query(
            `INSERT INTO library_logs
             (student_id, book_id, operation)
             VALUES (?, ?, 'Returned')`,
            [studentId, bookId]
        );

        await connection.commit();

        res.json({
            message: "Book returned successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error: "Failed to return book"
        });

    } finally {
        connection.release();
    }
});




// STUDENT BOOK HISTORY
app.get("/api/students/:roll/history", async (req, res) => {
    try {
        const roll = req.params.roll;

        const [students] = await pool.query(
            `SELECT id, name, roll, branch
             FROM students
             WHERE roll = ? AND is_active = TRUE`,
            [roll]
        );

        if (students.length === 0) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        const [history] = await pool.query(
            `SELECT
                bt.id AS transaction_id,
                b.serial,
                b.name AS book_name,
                b.author,
                bt.issue_date,
                bt.due_date,
                bt.return_date,
                bt.status
             FROM book_transactions bt
             JOIN books b ON bt.book_id = b.id
             WHERE bt.student_id = ?
             ORDER BY bt.issue_date DESC`,
            [students[0].id]
        );

        res.json({
            student: students[0],
            history: history
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to fetch student history"
        });
    }
});






// BOOK HISTORY
app.get("/api/books/:serial/history", async (req, res) => {
    try {
        const serial = req.params.serial;

        const [books] = await pool.query(
            `SELECT id, serial, name, author
             FROM books
             WHERE serial = ?`,
            [serial]
        );

        if (books.length === 0) {
            return res.status(404).json({
                error: "Book not found"
            });
        }

        const [history] = await pool.query(
            `SELECT
                bt.id AS transaction_id,
                s.name AS student_name,
                s.roll,
                s.branch,
                bt.issue_date,
                bt.due_date,
                bt.return_date,
                bt.status
             FROM book_transactions bt
             JOIN students s ON bt.student_id = s.id
             WHERE bt.book_id = ?
             ORDER BY bt.issue_date DESC`,
            [books[0].id]
        );

        res.json({
            book: books[0],
            history: history
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to fetch book history"
        });
    }
});










// LIBRARY REPORT
app.get("/api/reports/library", async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                error: "From and to dates are required"
            });
        }

        const [logs] = await pool.query(
            `SELECT
                ll.id,
                DATE(ll.operation_date) AS date,
                ll.operation,
                s.name AS student_name,
                s.roll,
                s.branch,
                b.serial,
                b.name AS book_name,
                b.author
             FROM library_logs ll
             LEFT JOIN students s
                ON ll.student_id = s.id
             LEFT JOIN books b
                ON ll.book_id = b.id
             WHERE DATE(ll.operation_date)
                BETWEEN ? AND ?
             ORDER BY ll.operation_date DESC`,
            [from, to]
        );

        res.json({
            from: from,
            to: to,
            total: logs.length,
            logs: logs
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to generate report"
        });
    }
});












// DELETE STUDENT

app.delete("/api/students/:id", async (req, res) => {

    const { id } = req.params;

    try {

        const [result] = await pool.query(
            "DELETE FROM students WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                error: "Student not found"
            });
        }

        res.json({
            message: "Student deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to delete student"
        });
    }
});